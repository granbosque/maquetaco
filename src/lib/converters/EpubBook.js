/**
 * EpubBook - Generador de EPUB 3.0
 * 
 * Librería genérica para crear archivos EPUB válidos,
 * solo depende de JSZip y se puede usar desde el navegador
 * 
 * @example
 * const epub = new EpubBook();
 * epub.setMetadata({ title: 'Mi Libro', author: 'Autor' });
 * epub.setCover(imageDataUrl);
 * epub.setStylesheet(cssContent);
 * epub.addChapter({ id: 'ch1', title: 'Capítulo 1', content: '<p>Contenido...</p>' });
 * const blob = await epub.generateBlob();
 * 
 * 
 * Notas:
 * setCover procesa la portada para que sea un formato y tamaño válido
 * addChapter acepta fragmentos html (no html completo)
 * pendiente: (por ahora no se hace nada con las imágenges) addChapter busca imágenes en el texto y las procesa para que tengan un tamaño y formato adecuado.
 * 
 * 
 * 
 */

import JSZip from 'jszip';

/**
 * @typedef {Object} EpubMetadata
 * @property {string} title - Título del libro
 * @property {string} [author] - Autor del libro
 * @property {string} [language='es'] - Código de idioma (ej: 'es', 'en')
 * @property {string} [publisher] - Editorial
 * @property {string} [date] - Fecha de publicación (YYYY-MM-DD)
 * @property {string} [description] - Descripción o sinopsis
 * @property {string} [subject] - Tema o categoría
 * @property {string} [rights] - Derechos de autor
 * @property {string} [identifier] - Identificador único (ISBN, UUID, etc.)
 */

/**
 * @typedef {Object} EpubChapter
 * @property {string} id - Identificador único del capítulo
 * @property {string} title - Título del capítulo
 * @property {string} content - Contenido HTML (fragmento, no documento completo)
 * @property {string} [role] - Rol semántico: 'dedication', 'preface', 'chapter', 'colophon', etc.
 * @property {boolean} [showInToc=true] - Si debe aparecer en la tabla de contenidos
 */

export class EpubBook {
    /** @type {EpubMetadata} */
    #metadata = {
        title: 'Sin título',
        author: '',
        language: 'es',
        publisher: '',
        date: '',
        description: '',
        subject: '',
        rights: '',
        identifier: ''
    };

    /** @type {string|null} */
    #cover = null;

    /** @type {string} */
    #stylesheet = '';

    /** @type {string} */
    #bodyClass = '';

    /** @type {EpubChapter[]} */
    #chapters = [];

    /** @type {string} */
    #uuid = '';

    /** @type {{enabled: boolean, title: string, depth: number}} */
    #tocPage = { enabled: false, title: 'Índice', depth: 1 };

    constructor() {
        this.#uuid = this.#generateUUID();
    }

    // =========================================================================
    // MÉTODOS PÚBLICOS - METADATOS
    // =========================================================================

    /**
     * Establece los metadatos del libro
     * @param {Partial<EpubMetadata>} metadata - Metadatos a establecer
     */
    setMetadata(metadata) {
        if (typeof metadata !== 'object' || metadata === null) {
            throw new Error('setMetadata: se esperaba un objeto con los metadatos');
        }

        // Validar que title sea string si se proporciona
        if (metadata.title !== undefined && typeof metadata.title !== 'string') {
            throw new Error('setMetadata: title debe ser un string');
        }

        // Merge con los metadatos existentes
        this.#metadata = {
            ...this.#metadata,
            ...metadata
        };
    }

    /**
     * Obtiene los metadatos actuales (útil para depuración)
     * @returns {EpubMetadata}
     */
    getMetadata() {
        return { ...this.#metadata };
    }

    /**
     * Obtiene el UUID generado para este libro
     * @returns {string}
     */
    getUUID() {
        return this.#uuid;
    }

    // =========================================================================
    // MÉTODOS PÚBLICOS - CONTENIDO
    // =========================================================================

    /**
     * Establece la imagen de portada
     * @param {string} imageDataUrl - Imagen en formato data URL (data:image/...)
     */
    setCover(imageDataUrl) {
        // TODO: Implementar validación y almacenamiento
        if (imageDataUrl && typeof imageDataUrl !== 'string') {
            throw new Error('setCover: se esperaba un data URL string');
        }
        this.#cover = imageDataUrl || null;
    }

    /**
     * Obtiene la portada actual
     * @returns {string|null}
     */
    getCover() {
        return this.#cover;
    }

    /**
     * Establece la hoja de estilos CSS
     * @param {string} css - Contenido CSS
     */
    setStylesheet(css) {
        if (typeof css !== 'string') {
            throw new Error('setStylesheet: se esperaba un string con el CSS');
        }
        this.#stylesheet = css;
    }

    /**
     * Obtiene la hoja de estilos actual
     * @returns {string}
     */
    getStylesheet() {
        return this.#stylesheet;
    }

    /**
     * Establece la clase CSS para el body de los capítulos
     * @param {string} className - Clase(s) CSS a aplicar al body
     */
    setBodyClass(className) {
        if (typeof className !== 'string') {
            throw new Error('setBodyClass: se esperaba un string con la clase CSS');
        }
        this.#bodyClass = className;
    }

    /**
     * Obtiene la clase CSS del body
     * @returns {string}
     */
    getBodyClass() {
        return this.#bodyClass;
    }

    /**
     * Habilita la generación de una página de índice visible
     * @param {Object} [options] - Opciones de configuración
     * @param {string} [options.title='Índice'] - Título de la página de índice
     * @param {number} [options.depth=1] - Profundidad de encabezados a incluir (1-3)
     */
    enableTocPage(options = {}) {
        this.#tocPage = {
            enabled: true,
            title: options.title || 'Índice',
            depth: Math.min(Math.max(options.depth || 1, 1), 3)
        };
    }

    /**
     * Deshabilita la página de índice visible
     */
    disableTocPage() {
        this.#tocPage.enabled = false;
    }

    /**
     * Añade un capítulo al libro
     * @param {EpubChapter} chapter - Datos del capítulo
     * @param {string} chapter.id - Identificador único (se usa para el nombre del archivo)
     * @param {string} chapter.title - Título que aparece en la TOC
     * @param {string} chapter.content - Fragmento HTML del contenido
     * @param {string} [chapter.role='chapter'] - Rol semántico del capítulo
     * @param {boolean} [chapter.showInToc=true] - Si aparece en la tabla de contenidos
     */
    addChapter(chapter) {
        // Validaciones básicas
        if (!chapter || typeof chapter !== 'object') {
            throw new Error('addChapter: se esperaba un objeto con los datos del capítulo');
        }
        if (!chapter.id || typeof chapter.id !== 'string') {
            throw new Error('addChapter: id es requerido y debe ser un string');
        }
        if (!chapter.title || typeof chapter.title !== 'string') {
            throw new Error('addChapter: title es requerido y debe ser un string');
        }
        if (!chapter.content || typeof chapter.content !== 'string') {
            throw new Error('addChapter: content es requerido y debe ser un string');
        }

        // Verificar que no exista un capítulo con el mismo id
        if (this.#chapters.some(ch => ch.id === chapter.id)) {
            throw new Error(`addChapter: ya existe un capítulo con id "${chapter.id}"`);
        }

        this.#chapters.push({
            id: chapter.id,
            title: chapter.title,
            content: chapter.content,
            role: chapter.role || 'chapter',
            showInToc: chapter.showInToc !== false // true por defecto
        });
    }

    /**
     * Obtiene la lista de capítulos (útil para depuración)
     * @returns {EpubChapter[]}
     */
    getChapters() {
        return [...this.#chapters];
    }

    /**
     * Elimina todos los capítulos
     */
    clearChapters() {
        this.#chapters = [];
    }

    // =========================================================================
    // MÉTODO PRINCIPAL - GENERACIÓN
    // =========================================================================

    /**
     * Genera el archivo EPUB como Blob
     * @returns {Promise<Blob>}
     */
    async generateBlob() {
        if (this.#chapters.length === 0) {
            throw new Error('generateBlob: debe añadir al menos un capítulo');
        }

        const zip = new JSZip();

        // 1. mimetype (debe ser el primer archivo, sin comprimir)
        zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

        // 2. META-INF/container.xml
        zip.file('META-INF/container.xml', this.#createContainer());

        // 3. Detectar formato de portada si existe
        const coverInfo = this.#cover ? this.#parseCoverDataUrl(this.#cover) : null;

        // 4. OEBPS/content.opf (Package Document)
        zip.file('OEBPS/content.opf', this.#createPackageDocument(coverInfo));

        // 5. OEBPS/nav.xhtml (Navigation Document)
        zip.file('OEBPS/nav.xhtml', this.#createNavDocument());

        // 6. OEBPS/styles.css
        if (this.#stylesheet) {
            zip.file('OEBPS/styles.css', this.#stylesheet);
        }

        // 7. Portada (si existe): imagen + página XHTML
        if (coverInfo) {
            zip.file(`OEBPS/cover.${coverInfo.extension}`, coverInfo.data);
            zip.file('OEBPS/cover.xhtml', this.#createCoverPage(coverInfo));
        }

        // 8. Página de índice visible (si está habilitada)
        if (this.#tocPage.enabled) {
            zip.file('OEBPS/toc-page.xhtml', this.#createTocPage());
        }

        // 9. Capítulos
        for (const chapter of this.#chapters) {
            zip.file(`OEBPS/${chapter.id}.xhtml`, this.#createChapterDocument(chapter));
        }

        // Generar el ZIP
        return await zip.generateAsync({ type: 'blob' });
    }

    // =========================================================================
    // MÉTODOS PRIVADOS - GENERACIÓN DE ARCHIVOS EPUB
    // =========================================================================

    /**
     * Crea el archivo container.xml
     * @returns {string}
     */
    #createContainer() {
        return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
    }

    /**
     * Crea el Package Document (content.opf)
     * @param {Object|null} coverInfo - Información de la portada
     * @returns {string}
     */
    #createPackageDocument(coverInfo) {
        const meta = this.#metadata;
        const lang = meta.language || 'es';
        const date = meta.date || new Date().toISOString().split('T')[0];
        const identifier = meta.identifier || `urn:uuid:${this.#uuid}`;

        // Manifest items
        let manifestItems = `
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>`;
        
        if (this.#stylesheet) {
            manifestItems += `
        <item id="css" href="styles.css" media-type="text/css"/>`;
        }

        if (coverInfo) {
            manifestItems += `
        <item id="cover-image" href="cover.${coverInfo.extension}" media-type="${coverInfo.mime}" properties="cover-image"/>
        <item id="cover-page" href="cover.xhtml" media-type="application/xhtml+xml"/>`;
        }

        // Página de índice visible
        if (this.#tocPage.enabled) {
            manifestItems += `
        <item id="toc-page" href="toc-page.xhtml" media-type="application/xhtml+xml"/>`;
        }

        // Chapters en manifest y spine
        // Si hay portada, añadirla primero en el spine
        let spineItems = coverInfo 
            ? `
        <itemref idref="cover-page"/>`
            : '';
        
        // Añadir página de índice al spine (después de portada, antes de capítulos)
        if (this.#tocPage.enabled) {
            spineItems += `
        <itemref idref="toc-page"/>`;
        }

        for (const chapter of this.#chapters) {
            // Detectar si el contenido tiene SVG para añadir la propiedad
            const hasSvg = /<svg[\s>]/i.test(chapter.content);
            const props = hasSvg ? ' properties="svg"' : '';
            manifestItems += `
        <item id="${chapter.id}" href="${chapter.id}.xhtml" media-type="application/xhtml+xml"${props}/>`;
            spineItems += `
        <itemref idref="${chapter.id}"/>`;
        }

        // Metadatos opcionales
        let optionalMeta = '';
        if (meta.publisher) {
            optionalMeta += `
        <dc:publisher>${this.#escapeXml(meta.publisher)}</dc:publisher>`;
        }
        if (meta.description) {
            optionalMeta += `
        <dc:description>${this.#escapeXml(meta.description)}</dc:description>`;
        }
        if (meta.subject) {
            optionalMeta += `
        <dc:subject>${this.#escapeXml(meta.subject)}</dc:subject>`;
        }
        if (meta.rights) {
            optionalMeta += `
        <dc:rights>${this.#escapeXml(meta.rights)}</dc:rights>`;
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${lang}">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="book-id">${this.#escapeXml(identifier)}</dc:identifier>
        <dc:title>${this.#escapeXml(meta.title)}</dc:title>
        <dc:language>${lang}</dc:language>
        <dc:creator>${this.#escapeXml(meta.author || 'Autor desconocido')}</dc:creator>
        <dc:date>${date}</dc:date>
        <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}</meta>${optionalMeta}
    </metadata>
    <manifest>${manifestItems}
    </manifest>
    <spine>${spineItems}
    </spine>
</package>`;
    }

    /**
     * Crea el Navigation Document (nav.xhtml)
     * @returns {string}
     */
    #createNavDocument() {
        const lang = this.#metadata.language || 'es';
        
        // Usar la profundidad configurada (o 1 por defecto)
        const depth = this.#tocPage.enabled ? this.#tocPage.depth : 1;
        
        // Generar TOC jerárquico con profundidad (indentación para nav.xhtml: 12 espacios)
        const tocItems = this.#extractTocFromChapters(depth, '            ');

        // Generar landmarks
        const landmarks = this.#chapters
            .filter(ch => ch.role && ch.role !== 'chapter')
            .map(ch => {
                const epubType = this.#roleToEpubType(ch.role);
                return `            <li><a epub:type="${epubType}" href="${ch.id}.xhtml">${this.#escapeXml(ch.title)}</a></li>`;
            })
            .join('\n');

        // Encontrar el primer capítulo de contenido (bodymatter)
        const firstContent = this.#chapters.find(ch => ch.role === 'chapter' || !ch.role);
        const bodymatterLandmark = firstContent 
            ? `            <li><a epub:type="bodymatter" href="${firstContent.id}.xhtml">Inicio del contenido</a></li>`
            : '';

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}">
<head>
    <meta charset="UTF-8"/>
    <title>Tabla de contenidos</title>
</head>
<body>
    <nav epub:type="toc" id="toc">
        <h1>Índice</h1>
        <ol>
${tocItems}
        </ol>
    </nav>
    <nav epub:type="landmarks" hidden="">
        <h1>Landmarks</h1>
        <ol>
${bodymatterLandmark}
${landmarks}
        </ol>
    </nav>
</body>
</html>`;
    }

    /**
     * Crea la página XHTML de portada
     * @param {Object} coverInfo - Información de la portada
     * @returns {string}
     */
    #createCoverPage(coverInfo) {
        const lang = this.#metadata.language || 'es';
        const title = this.#escapeXml(this.#metadata.title || 'Portada');

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}">
<head>
    <meta charset="UTF-8"/>
    <title>${title}</title>
    <style>
        html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }
        body {
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
        }
        img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
    </style>
</head>
<body epub:type="cover">
    <img src="cover.${coverInfo.extension}" alt="${title}"/>
</body>
</html>`;
    }

    /**
     * Crea la página visible de índice/tabla de contenidos
     * @returns {string}
     */
    #createTocPage() {
        const lang = this.#metadata.language || 'es';
        const title = this.#escapeXml(this.#tocPage.title);
        const bodyClassAttr = this.#bodyClass ? ` class="${this.#bodyClass}"` : '';
        const depth = this.#tocPage.depth || 1;

        // Generar TOC jerárquico con profundidad
        const tocItems = this.#extractTocFromChapters(depth);

        const cssLink = this.#stylesheet 
            ? '<link rel="stylesheet" type="text/css" href="styles.css"/>'
            : '';

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}">
<head>
    <meta charset="UTF-8"/>
    <title>${title}</title>
    ${cssLink}
</head>
<body${bodyClassAttr} epub:type="toc">
    <section>
        <h1>${title}</h1>
        <nav>
            <ol class="toc-list">
${tocItems}
            </ol>
        </nav>
    </section>
</body>
</html>`;
    }

    /**
     * Añade IDs a los encabezados H2 y H3 en el contenido HTML para permitir enlaces de ancla
     * @param {string} html - Contenido HTML
     * @param {string} chapterId - ID del capítulo para generar IDs únicos
     * @returns {string} HTML con IDs añadidos a los encabezados
     */
    #addHeadingIds(html, chapterId) {
        if (!html) return html;

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
            const headings = doc.querySelectorAll('h2, h3');

            for (const heading of headings) {
                if (!heading.id) {
                    const headingText = heading.textContent.trim();
                    const anchorId = `${chapterId}-${headingText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
                    heading.id = anchorId;
                }
            }

            // Extraer el contenido del div wrapper
            const wrapper = doc.querySelector('div');
            return wrapper ? wrapper.innerHTML : html;
        } catch (e) {
            console.warn(`Error añadiendo IDs a encabezados:`, e);
            return html;
        }
    }

    /**
     * Crea el documento XHTML de un capítulo
     * @param {EpubChapter} chapter
     * @returns {string}
     */
    #createChapterDocument(chapter) {
        const lang = this.#metadata.language || 'es';
        const epubType = this.#roleToEpubType(chapter.role);
        const epubTypeAttr = epubType ? ` epub:type="${epubType}"` : '';
        const bodyClassAttr = this.#bodyClass ? ` class="${this.#bodyClass}"` : '';

        const cssLink = this.#stylesheet 
            ? '<link rel="stylesheet" type="text/css" href="styles.css"/>'
            : '';

        // Añadir IDs a los encabezados para permitir enlaces de ancla en el TOC
        const contentWithIds = this.#addHeadingIds(chapter.content, chapter.id);
        
        // Convertir el contenido HTML a XHTML válido
        const xhtmlContent = this.#htmlToXhtml(contentWithIds);

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${lang}">
<head>
    <meta charset="UTF-8"/>
    <title>${this.#escapeXml(chapter.title)}</title>
    ${cssLink}
</head>
<body${bodyClassAttr}>
    <section${epubTypeAttr}>
        ${xhtmlContent}
    </section>
</body>
</html>`;
    }

    // =========================================================================
    // MÉTODOS PRIVADOS - UTILIDADES
    // =========================================================================

    /**
     * Genera un UUID v4
     * @returns {string}
     */
    #generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    /**
     * Escapa caracteres especiales para XML
     * @param {string} text
     * @returns {string}
     */
    #escapeXml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Convierte HTML5 a XHTML válido
     * - Cierra etiquetas vacías (void elements): <hr> → <hr/>
     * - Asegura que los atributos booleanos tengan valor: hidden → hidden="hidden"
     * @param {string} html
     * @returns {string}
     */
    #htmlToXhtml(html) {
        if (!html) return '';

        // Lista de void elements en HTML5 que deben ser auto-cerrados en XHTML
        const voidElements = [
            'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 
            'input', 'link', 'meta', 'source', 'track', 'wbr'
        ];

        let result = html;

        // Convertir void elements sin cerrar a formato XHTML
        // Busca <tag ...> o <tag> (sin /) y lo convierte a <tag ... /> o <tag/>
        for (const tag of voidElements) {
            // Patrón para encontrar tags que no están auto-cerrados
            // Captura: <tag> o <tag atributos>
            const pattern = new RegExp(`<(${tag})(\\s[^>]*)?>(?!\\s*<\\/${tag}>)`, 'gi');
            result = result.replace(pattern, (match, tagName, attrs) => {
                // Si ya termina en />, no hacer nada
                if (match.endsWith('/>')) return match;
                // Añadir el cierre
                const attributes = attrs ? attrs.trimEnd() : '';
                return `<${tagName}${attributes}/>`;
            });
        }

        return result;
    }

    /**
     * Parsea un data URL de imagen y extrae la información
     * @param {string} dataUrl
     * @returns {{mime: string, extension: string, data: Blob}}
     */
    #parseCoverDataUrl(dataUrl) {
        const mimeMatch = dataUrl.match(/data:([^;]+);base64,/);
        if (!mimeMatch) {
            throw new Error('setCover: formato de data URL inválido');
        }

        const mime = mimeMatch[1];
        let extension = 'jpg';
        if (mime === 'image/png') extension = 'png';
        else if (mime === 'image/svg+xml') extension = 'svg';
        else if (mime === 'image/gif') extension = 'gif';
        else if (mime === 'image/webp') extension = 'webp';

        // Convertir base64 a Blob
        const base64Data = dataUrl.split(',')[1];
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return {
            mime,
            extension,
            data: new Blob([bytes], { type: mime })
        };
    }

    /**
     * Extrae los encabezados del contenido HTML y genera una estructura TOC jerárquica
     * @param {number} maxDepth - Profundidad máxima (1-3)
     * @param {string} indent - Indentación base para cada línea (por defecto 16 espacios)
     * @returns {string} HTML de la lista TOC jerárquica
     */
    #extractTocFromChapters(maxDepth = 1, indent = '                ') {
        const tocChapters = this.#chapters.filter(ch => ch.showInToc);
        const items = [];

        for (const chapter of tocChapters) {
            // Añadir el capítulo principal (siempre nivel 1)
            items.push({
                level: 1,
                title: chapter.title,
                href: `${chapter.id}.xhtml`,
                id: chapter.id
            });

            // Extraer encabezados del contenido HTML si la profundidad lo permite
            if (maxDepth > 1 && chapter.content) {
                try {
                    // Añadir IDs a los encabezados primero (misma lógica que en #addHeadingIds)
                    const contentWithIds = this.#addHeadingIds(chapter.content, chapter.id);
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(`<div>${contentWithIds}</div>`, 'text/html');
                    const headings = doc.querySelectorAll('h2, h3');
                    
                    for (const heading of headings) {
                        const level = parseInt(heading.tagName.charAt(1));
                        if (level <= maxDepth) {
                            const headingText = heading.textContent.trim();
                            // Usar el ID que ya existe o generar uno
                            const anchorId = heading.id || `${chapter.id}-${headingText.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
                            
                            items.push({
                                level,
                                title: headingText,
                                href: `${chapter.id}.xhtml#${anchorId}`,
                                id: anchorId,
                                parentId: chapter.id
                            });
                        }
                    }
                } catch (e) {
                    // Si falla el parsing, continuar sin subniveles
                    console.warn(`Error extrayendo encabezados de ${chapter.id}:`, e);
                }
            }
        }

        // Generar HTML jerárquico de forma recursiva
        const generateList = (startIndex, currentLevel) => {
            let html = '';
            let i = startIndex;

            while (i < items.length) {
                const item = items[i];
                
                // Si el nivel es menor que el actual, terminamos este nivel
                if (item.level < currentLevel) {
                    break;
                }
                
                // Si el nivel es mayor, abrimos una sublista
                if (item.level > currentLevel) {
                    html += '<ol class="toc-list">';
                    const subList = generateList(i, item.level);
                    html += subList.html;
                    html += '</ol>';
                    i = subList.nextIndex;
                    continue;
                }
                
                // Mismo nivel: añadir item
                const indentClass = item.level > 1 ? ` class="toc-level-${item.level}"` : '';
                html += `\n${indent}<li${indentClass}><a href="${this.#escapeXml(item.href)}">${this.#escapeXml(item.title)}</a></li>`;
                i++;
            }

            return { html, nextIndex: i };
        };

        const result = generateList(0, 1);
        return result.html;
    }

    /**
     * Convierte un rol de capítulo a epub:type
     * @param {string} role
     * @returns {string}
     */
    #roleToEpubType(role) {
        const mapping = {
            'cover': 'cover',
            'titlepage': 'titlepage',
            'copyright': 'copyright-page',
            'dedication': 'dedication',
            'epigraph': 'epigraph',
            'foreword': 'foreword',
            'preface': 'preface',
            'introduction': 'introduction',
            'prologue': 'prologue',
            'chapter': 'chapter',
            'part': 'part',
            'epilogue': 'epilogue',
            'afterword': 'afterword',
            'appendix': 'appendix',
            'glossary': 'glossary',
            'bibliography': 'bibliography',
            'index': 'index',
            'colophon': 'colophon',
            'acknowledgments': 'acknowledgments'
        };
        return mapping[role] || '';
    }
}

export default EpubBook;
