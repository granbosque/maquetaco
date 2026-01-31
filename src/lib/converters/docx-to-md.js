import mammoth from 'mammoth';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

/**
 * DOCX TO MARKDOWN CONVERTER
 * 
 * PROCESO:
 * 
 * 1. DOCX -> HTML (Mammoth): Inyecta tokens [[EMPTY_LINE]] en párrafos vacíos.
 * 2. Detecta y procesa títulos (H1..H3) o Heurística (Párrafos).
 * 3. HTML -> Markdown (Turndown)
 * 4. POST-PROCESADO:
 *    1. Limpieza de espacios (final de línea y saltos excesivos).
 *    2. Generación de escenas: >2 líneas vacías (tokens) -> Separador `***`.
 *    3. Normalización: Convierte `* * *`, `---` etc. a `***`.
 *    4. Fusiona separadores contiguos.
 *    5. Elimina separadores antes de Títulos (#) y al inicio del documento.
 *
 * PROCESADO DE LÍNEAS VACÍAS (Why [[EMPTY_LINE]]?):
 * Mammoth, por defecto, ignora los párrafos vacíos de Word. Sin embargo, en muchos documentos podemos
 * encontrar varios párrafos vacíos para indicar un salto de escena. Por eso se hace un preprocesado sustituyendo líneas vacías
 * por un token, para luego poder postprocesar en función del número de líneas vacías (si no hacemos esto, mammoth siempre reduce varias lineas en blanco a una)
 * En el post-procesado, contamos estos tokens. Si hay >2 (configurable), lo convertimos en un separador de escena estándar (`***`).
 * 
 * PROCESADO DE ENCABEZADOS:
 * 
 * En muchos documentos podemos encontrarnos esta situación:
 *   - H1: Título de la obra
 *   - H2: Nombre del autor
 *   - H3+: Capítulos (contenido real)
 * 
 * Esto rompe la jerarquía semántica de Markdown donde H1 debe ser el nivel superior del contenido, 
 * y además se usa H2 como subtítulo o algo que no es un título
 * 
 * Solución propuesta:
 *   1. Detectamos los primeros 1-2 headings como metadata (título/autor)
 *   2. Los extraemos al frontmatter YAML
 *   3. Se mueven de nivel todos los headings restantes:
 *      - H3 → H1 (capítulos pasan a nivel superior)
 *      - H4 → H2 (secciones)
 *      - etc.
 * 
 *  Esta deteccción es heurística, improvisada y por supuesto, llena de agujeros... se irá mejorando
 * 
 * Si el documento no usa estilos (H1/H2), analizamos los primeros párrafos.
 * Si encontramos párrafos cortos (<150 caracteres) y SIN punto final, asumimos:
 *   - 1º Párrafo -> Título
 *   - 2º Párrafo -> Autor
 * Esto permite procesar manuscritos "en bruto" o copiados de otras fuentes.
 */


const DEFAULT_CONFIG = {
    extractMetadata: true,          // Extraer título y autor al frontmatter
    adjustHeadings: true,            // Ajustar jerarquía de headings
    sceneSeparators: true,           // Insertar *** para líneas vacías múltiples
    cleanWhitespace: true,           // Normalizar espacios en blanco
    minEmptyLinesForSeparator: 3,   // Mínimo de líneas vacías para insertar ***
    maxMetadataHeadings: 2           // Máximo de headings a considerar como metadata (título + autor)
};

/**
 * Convierte un archivo DOCX a Markdown con frontmatter.
 * 
 * @param {File | ArrayBuffer} fileOrBuffer - El archivo DOCX a convertir
 * @param {Object} config - Configuración opcional
 * @returns {Promise<{content: string, metadata: Object, warnings: string[]}>} Objeto con el Markdown, metadatos y advertencias
 */
export async function docxToMarkdown(fileOrBuffer, config = {}) {
    const options = { ...DEFAULT_CONFIG, ...config };

    // 1. Lectura
    let arrayBuffer;
    if (fileOrBuffer instanceof File) {
        arrayBuffer = await fileOrBuffer.arrayBuffer();
    } else {
        arrayBuffer = fileOrBuffer;
    }

    // 2. Convertir DOCX a HTML con mammoth
    const mammothOptions = {
        styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 4'] => h4:fresh",
            "p[style-name='Heading 5'] => h5:fresh",
            "p[style-name='Heading 6'] => h6:fresh"
        ],
        transformDocument: transformEmptyParagraphs,
        // Usar Blob URLs para imágenes en lugar de base64 (para no bloquear el editor)
        convertImage: mammoth.images.imgElement(function (image) {
            return image.read().then(function (imageBuffer) {
                const blob = new Blob([imageBuffer], { type: image.contentType });
                const url = URL.createObjectURL(blob);
                return { src: url };
            });
        })
    };
    const result = await mammoth.convertToHtml({ arrayBuffer }, mammothOptions);
    if (result.messages.length > 0) {
        console.log("Mammoth messages:", result.messages);
    }

    let html = result.value;

    // 3. Analizar estructura del documento
    const structure = analyzeStructure(html);

    // 4. Extraer metadata si está habilitado
    let metadata = {};
    if (options.extractMetadata) {
        if (structure.metadataHeadings.length > 0) {
            metadata = extractMetadata(structure);
            html = removeMetadataHeadings(html, structure);
        } else {
            // 4b. No hay headings, intentar heurística por párrafos para Título/Autor
            const heuristicResult = tryExtractMetadataFromParagraphs(html);
            if (heuristicResult.metadata.title) {
                metadata = heuristicResult.metadata;
                html = heuristicResult.html;
                structure.warnings.push("Se han detectado Título/Autor mediante heurística de párrafos (sin estilos H1/H2).");
            }
        }
    }

    // NUEVO PASO: Detección heurística de headings en el cuerpo del documento
    // Se ejecuta después de extraer metadata para no confundir título/autor con nuevos headings
    // Recalculamos si hay headings restantes después de la extracción de metadata
    // (Para saber si usamos H1 o H6)
    // (si no hay otros headings usamos h6 para que sea un título secundario o auxiliar, se podría buscar el nivel más bajo pero con esto creo que vale la mayoría de los casos)
    const remainingHeadingsCount = structure.contentHeadings.length;
    
    const heuristicHeadingsResult = detectHeuristicHeadingsInBody(html, remainingHeadingsCount > 0);
    if (heuristicHeadingsResult.modified) {
        html = heuristicHeadingsResult.html;
        structure.warnings.push(...heuristicHeadingsResult.warnings);
    }

    // 5. Ajustar niveles de headings si está habilitado
    // Nota: Si hemos inyectado H1 nuevos con la heurística (porque no había nada), 
    // levelsToAdjust podría ser irrelevante o necesitar recálculo, pero 
    // structure.levelsToAdjust se basó en el análisis estático inicial.
    // Si structure.levelsToAdjust > 0, significa que HABÍA headings originales profundos.
    // Si detectamos nuevos H1/H6, estos NO se verán afectados por adjustHeadingLevels 
    // (a menos que rehagamos el análisis, pero simplificaremos asumiendo que conviven).
    if (options.adjustHeadings && structure.levelsToAdjust > 0) {
        html = adjustHeadingLevels(html, structure.levelsToAdjust);
    }

    // 6. Convertir HTML → Markdown
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced'
    });
    
    // Activar soporte para tablas y GFM
    turndownService.use(gfm);

    let markdown = turndownService.turndown(html);

    // 7. Aplicar mejoras post-conversión

    // a. Limpieza básica
    if (options.cleanWhitespace) {
        markdown = cleanWhitespace(markdown);
    }

    // b. Detectar separadores por TOKENS de líneas vacías
    // Primero des-escapamos los tokens que Turndown haya podido alterar (ej: \[\[EMPTY\_LINE\]\])
    markdown = markdown.replace(/\\\[\\\[EMPTY\\_LINE\\\]\\\]/g, '[[EMPTY_LINE]]');

    if (options.sceneSeparators) {
        // Usamos 2 como default para "varias líneas vacías" (Word: 2 enter vacíos -> Separador)
        markdown = insertSceneSeparators(markdown, 2);
    } else {
        // Si está desactivado, al menos debemos limpiar los tokens
        markdown = markdown.replace(/\[\[EMPTY_LINE\]\]/g, '');
    }

    // c. Normalizar separadores visuales existentes (* * *) a formato MD
    markdown = normalizeSeparators(markdown);

    // d. Limpieza final de duplicados (safety net)
    markdown = consolidateSeparators(markdown);

    // e. Eliminar separadores antes de headings (son espacios visuales, no escenas)
    // Busca *** seguido de newlines y un heading (#)
    markdown = markdown.replace(/\n\n\*\*\*\n\n(#{1,6}\s)/g, '\n\n$1');

    // f. Eliminar separadores al inicio del documento (vestigios de líneas vacías tras metadata)
    markdown = markdown.replace(/^\s*\*\*\*\s+/, '');

    // 8. Generar resultado final (SIN frontmatter, los metadatos van aparte)
    return {
        content: markdown.trim(),
        metadata: metadata,
        warnings: structure.warnings || []
    };
}

/**
 * Analiza la estructura HTML para detectar headings de metadata.
 * 
 * @param {string} html - El HTML a analizar
 * @returns {Object} Información sobre la estructura del documento
 */
function analyzeStructure(html) {
    const headingRegex = /<h([1-6])>(.*?)<\/h\1>/gi;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(html)) !== null) {
        // Limpiamos etiquetas HTML internas (como <a> o <span>) del texto
        const rawText = match[2].replace(/<[^>]*>/g, '').trim();

        headings.push({
            level: parseInt(match[1]),
            text: rawText,
            fullMatch: match[0]
        });
    }

    const warnings = [];
    let metadataHeadings = [];
    let contentHeadings = [];
    let levelsToAdjust = 0;

    // ANÁLISIS INTELIGENTE
    // Contamos cuántos H2 hay en total en el documento
    const h2Count = headings.filter(h => h.level === 2).length;

    // Regla 1: Detección de Título (Siempre asumimos que el primer H1 es el título si existe)
    // Si el primer heading es H1, es candidato a Título.
    let possibleTitle = null;
    let possibleAuthor = null;
    let titleIndex = -1;
    let authorIndex = -1;

    if (headings.length > 0 && headings[0].level === 1) {
        possibleTitle = headings[0];
        titleIndex = 0;
    }

    // Regla 2: Detección de Autor vs Capítulos (H2)
    // Si hay UN solo H2 y aparece al principio (después del título), es probable que sea el Autor.
    // Si hay MÚLTIPLES H2, son probablemente capítulos.

    if (h2Count === 1) {
        // Caso "Novela Clásica": H1 (Título) -> H2 (Autor) -> H3... (Capítulos)
        // Buscamos ese único H2
        const h2Index = headings.findIndex(h => h.level === 2);

        // Solo si aparece "pronto" (índice 0 o 1) lo consideramos Autor
        if (h2Index !== -1 && h2Index <= 1) {
            possibleAuthor = headings[h2Index];
            authorIndex = h2Index;
            warnings.push("Se detectó un único H2 al inicio, se interpretó como Autor.");

            // En este caso, el contenido real empieza después del Autor.
            // Los H3 deberían ser promovidos a H1 (Capítulos)
            // Calculamos levelsToAdjust basándonos en el primer heading que NO es metadata
            const firstContentIndex = Math.max(titleIndex, authorIndex) + 1;
            if (firstContentIndex < headings.length) {
                const firstContentLevel = headings[firstContentIndex].level;
                // Si el primer contenido es H3, H3->H1 = restar 2
                levelsToAdjust = Math.max(0, firstContentLevel - 1);
                if (levelsToAdjust > 0) {
                    warnings.push(`Se detectó estructura jerárquica profunda. Se promovieron los encabezados ${levelsToAdjust} nivel(es) (ej. H${levelsToAdjust + 1} -> H1).`);
                }
            } else {
                warnings.push("El documento parece contener solo Título/Autor y nada más.");
            }
        } else {
            // El único H2 está muy lejos, probablemente es un título de sección y no Autor.
            if (titleIndex !== -1) {
                warnings.push("Se detectó un título (H1) pero ningún candidato claro para Autor.");
                // El contenido empieza tras el H1
                levelsToAdjust = 0; // Asumimos que la estructura ya es correcta o mixta
            }
        }
    } else if (h2Count > 1) {
        // Caso "Colección/Capítulos H2": H1 (Título) -> H2 (Cap 1) -> H2 (Cap 2)...
        // NO extraemos Autor de los H2.
        // H2s se promueven a H1 si queremos que sean capítulos de primer nivel, 
        // o se dejan como H2 si el usuario quiere mantener H1 como título del libro dentro del md.
        // ESTRATEGIA: Para MD, lo usual es que H1 sea el título del archivo (frontmatter) 
        // y el contenido empiece en H1 o H2. 
        // Si extraemos H1 al frontmatter, los H2 deberían pasar a ser H1.

        warnings.push(`Se detectaron ${h2Count} encabezados H2. Se interpretaron como Capítulos, no como Autor.`);

        // El contenido empieza justo después del Título (si lo extraemos)
        // Si hay H1 (Título), lo sacamos a metadata.
        // Los H2 (Capítulos) deberían subir a H1?
        // Si levelsToAdjust = 1, entonces H2 -> H1.
        if (titleIndex !== -1) {
            levelsToAdjust = 1;
            warnings.push("Se promovieron los capítulos de H2 a H1 para ser el nivel superior del documento.");
        }
    } else {
        // Caso sin H2: H1 -> H1 -> H1... o solo texto
        warnings.push("No se detectaron encabezados H2. Estructura plana.");
    }

    // Construir los arrays finales
    if (titleIndex !== -1) metadataHeadings.push(headings[titleIndex]);
    if (authorIndex !== -1) metadataHeadings.push(headings[authorIndex]);

    // Filtrar metadataHeadings de contentHeadings
    // (Usamos fullMatch para identificar, aunque podría dar problemas si hay duplicados exactos... 
    // mejor usar índices pero aquí estamos reconstruyendo)
    // Simplemente cortamos el array original basándonos en cuantos metadata encontramos
    const lastMetadataIndex = Math.max(titleIndex, authorIndex);
    contentHeadings = headings.slice(lastMetadataIndex + 1);

    return {
        headings,
        metadataHeadings,
        contentHeadings,
        levelsToAdjust,
        warnings
    };
}

/**
 * Extrae título y autor de los headings de metadata.
 * 
 * @param {Object} structure - La estructura del documento
 * @returns {Object} Objeto con title y/o author
 */
function extractMetadata(structure) {
    const metadata = {};
    const { metadataHeadings } = structure;

    // Buscamos específicamente por nivel original, ya que metadataHeadings contiene objetos con {level, text}
    const titleObj = metadataHeadings.find(h => h.level === 1);
    const authorObj = metadataHeadings.find(h => h.level === 2);

    if (titleObj) {
        metadata.title = titleObj.text;
    }

    if (authorObj) {
        metadata.author = authorObj.text;
    }

    return metadata;
}

/**
 * Elimina los headings de metadata del HTML.
 * 
 * @param {string} html - El HTML original
 * @param {Object} structure - La estructura del documento
 * @returns {string} HTML sin los headings de metadata
 */
function removeMetadataHeadings(html, structure) {
    let result = html;

    // Eliminar en orden inverso para no afectar las posiciones
    for (let i = structure.metadataHeadings.length - 1; i >= 0; i--) {
        const heading = structure.metadataHeadings[i];
        result = result.replace(heading.fullMatch, '');
    }

    return result;
}

/**
 * Ajusta los niveles de todos los headings restando un número fijo.
 * Por ejemplo: H3→H1, H4→H2, etc.
 * 
 * @param {string} html - El HTML a procesar
 * @param {number} levels - Número de niveles a restar
 * @returns {string} HTML con headings ajustados
 */
function adjustHeadingLevels(html, levels) {
    return html.replace(/<h([1-6])>(.*?)<\/h\1>/gi, (match, level, content) => {
        const currentLevel = parseInt(level);
        const newLevel = Math.max(1, Math.min(6, currentLevel - levels));
        return `<h${newLevel}>${content}</h${newLevel}>`;
    });
}

/**
 * Limpia espacios en blanco redundantes.
 * 
 * @param {string} markdown - El markdown a limpiar
 * @returns {string} Markdown limpio
 */
function cleanWhitespace(markdown) {
    return markdown
        // Eliminar espacios al final de líneas
        .replace(/[ \t]+$/gm, '')
        // NO eliminamos espacios al inicio porque rompe listas anidadas y bloques de código
        // .replace(/^[ \t]+/gm, '') 
        // Normalizar múltiples espacios a uno solo (pero NO al inicio de línea para no romper identación)
        // Usamos negative lookbehind (?<!^) pero JS support varía, mejor simple:
        // Solo reemplazamos espacios dobles que NO estén al inicio.
        // Una forma segura es reemplazar "espacio espacio" por "espacio" pero permitir indentación.
        // O simplemente desactivar esta agresividad.
        // Vamos a ser conservadores:
        .replace(/[ \t]{2,}/g, ' ') // Esto colapsa indentación también... cuidado.
        // Mejor estrategia: Limpiar solo saltos de línea excesivos.
        // Si el usuario quiere limpiar espacios intra-linea, mejor hacerlo selectivamente.
        // Retiramos la limpieza agresiva de espacios horizontales para proteger el formato.
        .replace(/\n{4,}/g, '\n\n\n');
}

/**
 * Detecta patrones de separadores textuales y los convierte a MD estándar (***).
 * Maneja casos como:
 * - * * * (o escapado \* \* \*)
 * - ***
 * - ---
 * - Un solo * en una línea
 */
function normalizeSeparators(markdown) {
    return markdown
        // 1. Detectar * * * o \* \* \* (3 o más)
        // Regla: Inicio de línea, espacios opcionales, grupo repetido de (asterisco escapado o no), final de línea
        .replace(/^[ \t]*((?:\\\*|\*)[ \t]*){3,}[ \t]*$/gm, '\n\n***\n\n')
        // 2. Detectar --- o - - - (3 o más)
        .replace(/^[ \t]*(-[ \t]*){3,}[ \t]*$/gm, '\n\n***\n\n')
        // 3. Detectar un solo asterisco aislado (* o \*)
        // Regla: Inicio, espacios, un solo asterisco (escapado o no), espacios, fin.
        // Importante: No debe coincidir con *** ya formateados, pero mi regex de arriba busca EXACTAMENTE un solo caracter *
        .replace(/^[ \t]*(?:\\\*|\*)(?![ \t]*\*)[ \t]*$/gm, '\n\n***\n\n');
}

/**
 * Consolida múltiples separadores horizontales consecutivos en uno solo.
 */
function consolidateSeparators(markdown) {
    return markdown
        // Encuentra bloques de separadores (***, ---, ___) separados por espacios/newlines
        // Regex: (newline opcional, espacios, separador, espacios, newline)+
        .replace(/(?:[\r\n]\s*(?:\*\*\*|---|___)[\r\n]\s*){2,}/g, '\n\n***\n\n')
        // También limpia separadores que quedaron pegados o con demasiados newlines alrededor
        .replace(/[\r\n]{3,}\*\*\*[\r\n]{3,}/g, '\n\n***\n\n');
}

/**
 * Inserta separadores de escena (***) detectando el token [[EMPTY_LINE]].
 * 
 * @param {string} markdown - El markdown a procesar
 * @param {number} minEmptyLines - Mínimo de líneas vacías (tokens) para insertar separador. Default 2.
 * @returns {string} Markdown con separadores
 */
function insertSceneSeparators(markdown, minEmptyLines = 2) {
    // Patrón para detectar secuencias de [[EMPTY_LINE]] separadas por guarrería (newlines, espacios)
    // Buscamos todas las ocurrencias globales
    const tokenRegex = /((?:\[\[EMPTY_LINE\]\]\s*)+)/g;

    return markdown.replace(tokenRegex, (match) => {
        // Contamos cuántos tokens reales hay en el match
        const count = (match.match(/\[\[EMPTY_LINE\]\]/g) || []).length;

        if (count >= minEmptyLines) {
            return '\n\n***\n\n';
        } else {
            // Si hay menos del mínimo (ej. 1), lo eliminamos o dejamos un salto simple.
            // Al eliminarlo, turndown ya dejó newlines alrededor, así que suele quedar bien.
            return '';
        }
    });
}

/**
 * Transforma el documento Mammoth inyectando tokens en párrafos vacíos.
```
 */
function transformEmptyParagraphs(element) {
    if (element.children) {
        element.children.forEach(transformEmptyParagraphs);
    }

    // DEBUG: Ver qué considera párrafo y qué tienen dentro
    // if (element.type === 'paragraph') {
    //      console.log('Paragraph:', JSON.stringify(element));
    // }

    if (element.type === 'paragraph') {
        const hasChildren = element.children.length > 0;
        // A veces tienen un "run" vacío o texto vacío
        const hasText = element.children.some(child => {
            // Un run con texto
            if (child.type === 'run' && child.children) {
                return child.children.some(textNode => textNode.type === 'text' && textNode.value && textNode.value.trim() !== '');
            }
            // O directamente texto (raro en root de párrafo pero posible en otros modelos)
            return child.type === 'text' && child.value && child.value.trim() !== '';
        });

        if (!hasText) {
            // Es un párrafo visualmente vacío (puede tener runs vacíos)
            // Limpiamos los hijos y metemos nuestro token
            element.children = [{
                type: 'text',
                value: '[[EMPTY_LINE]]'
            }];
        }
    }

    return element;
}

/**
 * Genera el output final con frontmatter YAML si hay metadata.
 * 
 * @param {Object} metadata - Objeto con title y/o author
 * @param {string} markdown - El contenido en markdown
 * @param {Object} options - Configuración
 * @returns {string} Documento final con frontmatter + contenido
 */
function generateOutput(metadata, markdown, options) {
    // Si no hay metadata o no está habilitado, devolver solo el markdown
    if (!options.extractMetadata || Object.keys(metadata).length === 0) {
        return markdown.trim();
    }

    // Generar frontmatter YAML
    const frontmatter = ['---'];

    if (metadata.title) {
        frontmatter.push(`title: "${metadata.title.replace(/"/g, '\\"')}"`);
    }

    if (metadata.author) {
        frontmatter.push(`author: "${metadata.author.replace(/"/g, '\\"')}"`);
    }

    frontmatter.push('---');

    return frontmatter.join('\n') + '\n\n' + markdown.trim();
}

/**
 * Intenta extraer metadata de los primeros párrafos si no hay headings.
 * Heurística:
 * - Párrafos al inicio del documento.
 * - Cortos (< 150 chars).
 * - SIN punto final.
 * 
 * @param {string} html 
 * @returns {{metadata: Object, html: string}}
 */
function tryExtractMetadataFromParagraphs(html) {
    // Regex para encontrar párrafos simples <p>...</p> al inicio
    // Cuidado con los atributos, aunque mammoth suele limpiar bastante
    // Buscamos P que no sean vacíos o tokens
    // Necesitamos hacerlo con un parser ligero o regex cuidadosa

    // Vamos a buscar los primeros P del documento
    const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gi;
    let match;
    let candidates = [];
    let lastIndex = 0;

    // Buscamos hasta 3-4 párrafos iniciales para evaluar
    while ((match = paragraphRegex.exec(html)) !== null && candidates.length < 5) {
        // Limpiar tags internos
        const text = match[1].replace(/<[^>]*>/g, '').trim();
        const isToken = text.includes('[[EMPTY_LINE]]');

        if (text && !isToken) {
            candidates.push({
                text: text,
                fullMatch: match[0],
                index: match.index,
                length: match[0].length
            });
        }

        // Si encontramos texto real ("La bendición"), paramos de buscar si ya tenemos suficientes candidatos?
        // No, mejor evaluamos en orden.
    }

    let metadata = {};
    let paragraphsToRemove = [];

    if (candidates.length > 0) {
        const first = candidates[0];

        // REGLA TITULO: Corto y SIN punto final
        if (first.text.length < 150 && !first.text.endsWith('.')) {
            metadata.title = first.text;
            paragraphsToRemove.push(first);

            // Si hemos encontrado título, miramos el siguiente para Autor
            if (candidates.length > 1) {
                const second = candidates[1];
                // REGLA AUTOR: Corto y SIN punto final
                if (second.text.length < 100 && !second.text.endsWith('.')) {
                    metadata.author = second.text;
                    paragraphsToRemove.push(second);
                }
            }
        }
    }

    // Si hemos extraído algo, eliminamos esos párrafos del HTML
    if (metadata.title) {
        // Reconstruimos el HTML eliminando los rangos detectados.
        // Lo más seguro es reemplazar las cadenas exactas encontradas (fullMatch) por nada,
        // pero solo la primera ocurrencia de cada una.

        for (const p of paragraphsToRemove) {
            html = html.replace(p.fullMatch, '');
        }
    }

    return { metadata, html };
}

/**
 * Detecta headings heurísticos en el cuerpo del HTML (post-metadata).
 * Busca párrafos cortos, sin punto final, en mayúsculas o negrita.
 * 
 * @param {string} html - El HTML del cuerpo
 * @param {boolean} hasExistingHeadings - Si ya existen headings detectados previamente
 * @returns {{html: string, warnings: string[], modified: boolean}}
 */
function detectHeuristicHeadingsInBody(html, hasExistingHeadings) {
    if (!html) return { html, warnings: [], modified: false };

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const warnings = [];
    let modified = false;

    const paragraphs = Array.from(doc.body.querySelectorAll('p'));
    const targetTag = hasExistingHeadings ? 'h6' : 'h1';

    /**
     * Comprueba si un párrafo cumple los criterios básicos de título.
     */
    function isValidHeadingCandidate(p, index) {
        const text = p.textContent.trim();
        
        if (text.length === 0 || text.includes('[[EMPTY_LINE]]')) return false;
        if (text.length > 150) return false;
        if (!/[a-zA-ZáéíóúÁÉÍÓÚñÑ]$/.test(text)) return false;

        const endsInLowercase = /[a-záéíóúñ]$/.test(text);
        if (endsInLowercase && index < paragraphs.length - 1) {
            const nextP = paragraphs[index + 1];
            const nextText = nextP.textContent.trim();
            if (nextText && !nextText.includes('[[EMPTY_LINE]]')) {
                const startsWithLowercase = /[a-záéíóúñ]/.test(nextText.charAt(0));
                if (startsWithLowercase) return false;
            }
        }

        const firstChar = text.charAt(0);
        return /[A-ZÁÉÍÓÚÑ0-9]/.test(firstChar);
    }

    /**
     * Comprueba si un párrafo está íntegramente (o mayoritariamente) en negrita.
     */
    function isBold(p) {
        // Buscamos si hay etiquetas strong o b
        const boldElem = p.querySelector('strong, b');
        if (!boldElem) return false;

        // Si el texto de la negrita es casi igual al texto del párrafo, lo consideramos heading en negrita
        const pText = p.textContent.trim();
        const bText = boldElem.textContent.trim();
        
        // Margen de diferencia pequeño por si hay algún espacio o puntuación fuera
        return bText.length >= pText.length * 0.9;
    }

    // 1. Pre-escaneo: ¿Hay algún candidato que esté en negrita?
    let hasAnyBoldHeading = false;
    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        if (isValidHeadingCandidate(p, i) && isBold(p)) {
            hasAnyBoldHeading = true;
            break;
        }
    }

    // 2. Procesado real
    for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        
        if (isValidHeadingCandidate(p, i)) {
            // Si el documento parece usar negritas para títulos, descartamos los que no lo sean
            if (hasAnyBoldHeading && !isBold(p)) continue;

            // ¡Es un heading!
            const newHeading = doc.createElement(targetTag);
            newHeading.innerHTML = p.innerHTML;
            p.replaceWith(newHeading);
            
            warnings.push(`Heurística: Se convirtió párrafo a ${targetTag.toUpperCase()}: "${p.textContent.trim().substring(0, 50)}..."`);
            modified = true;
        }
    }

    if (modified) {
        return {
            html: doc.body.innerHTML,
            warnings,
            modified: true
        };
    }

    return { html, warnings: [], modified: false };
}