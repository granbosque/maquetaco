/**
 * Markdown to HTML converter using Unified ecosystem
 * 
 * Pipeline: remark (Markdown) -> rehype (HTML)
 * Features:
 * - GitHub Flavored Markdown (footnotes, tables, strikethrough)
 * - Section divs (like Pandoc --section-divs)
 * - Auto-generated heading IDs (slugs)
 * - Pandoc-style attributes on headings {.class #id}
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import { plugin as rehypeSectionize } from '@rstacruz/rehype-sectionize';
import rehypeStringify from 'rehype-stringify';

/**
 * Pre-procesa el Markdown para extraer atributos Pandoc de los headings
 * Convierte: # Título {.clase #id} -> # Título {data-class="clase" data-id="id"}
 * Y luego post-procesamos el HTML para aplicar los atributos reales
 * 
 * @param {string} markdown - Markdown con posibles atributos Pandoc
 * @returns {{ markdown: string, attributes: Map<string, {classes: string[], id: string}> }}
 */
function extractPandocAttributes(markdown) {
    const attributes = new Map();

    // Regex para headings con atributos: # Título {.clase1 .clase2 #id}
    const headingRegex = /^(#{1,6})\s+(.+?)\s*\{([^}]+)\}\s*$/gm;

    const processedMarkdown = markdown.replace(headingRegex, (match, hashes, title, attrString) => {

        const classes = [];
        let id = '';

        // Extraer clases (.clase)
        const classMatches = attrString.matchAll(/\.([a-zA-Z0-9_-]+)/g);
        for (const m of classMatches) {
            classes.push(m[1]);
        }

        // Extraer ID (#id)
        const idMatch = attrString.match(/#([a-zA-Z0-9_-]+)/);
        if (idMatch) {
            id = idMatch[1];
        }

        // Guardar atributos indexados por el título limpio
        const cleanTitle = title.trim();
        attributes.set(cleanTitle, { classes, id });

        // Devolver el heading sin los atributos (se añadirán después en el HTML)
        return `${hashes} ${cleanTitle}`;
    });

    return { markdown: processedMarkdown, attributes };
}

/**
 * Post-procesa el HTML para aplicar los atributos Pandoc extraídos
 * 
 * @param {string} html - HTML generado
 * @param {Map<string, {classes: string[], id: string}>} attributes - Mapa de atributos
 * @returns {string} HTML con atributos aplicados
 */
/**
 * Idiomas que usan comillas angulares « » en lugar de curvas " "
 */
const ANGULAR_QUOTE_LANGUAGES = ['es', 'ca', 'gl', 'eu', 'fr', 'it', 'pt'];

/**
 * Convierte comillas curvas inglesas a angulares para idiomas que las usan
 * @param {string} html - HTML con comillas curvas
 * @param {string} lang - Código de idioma
 * @returns {string} HTML con comillas angulares si aplica
 */
function convertToAngularQuotes(html, lang) {
    if (!lang || !ANGULAR_QUOTE_LANGUAGES.includes(lang)) {
        return html;
    }

    // Convertir comillas dobles curvas a angulares
    // " (U+201C) → « (U+00AB)
    // " (U+201D) → » (U+00BB)
    return html
        .replace(/\u201C/g, '«')  // " → «
        .replace(/\u201D/g, '»'); // " → »
}

function applyPandocAttributes(html, attributes) {
    if (attributes.size === 0) return html;

    // Crear un parser temporal
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    for (const [title, attrs] of attributes) {
        // Buscar headings con ese texto exacto
        const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');

        for (const heading of headings) {
            if (heading.textContent.trim() === title.trim()) {
                // Añadir clases
                if (attrs.classes.length > 0) {
                    heading.classList.add(...attrs.classes);
                }

                // Añadir ID
                if (attrs.id) {
                    heading.id = attrs.id;
                }

                // Añadir clases al section padre si existe
                const section = heading.closest('section');
                if (section && attrs.classes.length > 0) {
                    section.classList.add(...attrs.classes);
                }
            }
        }
    }

    return doc.body.innerHTML;
}

// Crear el procesador Unified
const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)             // footnotes, tables, strikethrough
    .use(remarkSmartypants, { dashes: 'oldschool' }) // --- → —, -- → –, comillas tipográficas
    .use(remarkRehype, {
        allowDangerousHtml: true  // Permitir HTML en Markdown
    })
    .use(rehypeSlug)            // Genera IDs para headings
    .use(rehypeSectionize, {    // Envuelve solo h1 en <section>
        level: 'h1'             // Solo seccionar h1, dejar h2-h6 como hermanos
    })
    .use(rehypeStringify, {
        allowDangerousHtml: true,
        closeSelfClosing: true,
        suppressBooleanAttributes: false,
    });

/**
 * Separa el frontmatter YAML del contenido markdown
 * @param {string} content - Contenido completo
 * @returns {{ frontmatter: string, body: string }}
 */
export function separateFrontmatter(content) {
    if (!content || !content.startsWith('---')) {
        return { frontmatter: '', body: content || '' };
    }

    const endIndex = content.indexOf('---', 3);
    if (endIndex === -1) {
        return { frontmatter: '', body: content };
    }

    return {
        frontmatter: content.slice(4, endIndex).trim(),
        body: content.slice(endIndex + 3).trim()
    };
}

/**
 * Convierte markdown a HTML
 * @param {string} markdown - Contenido markdown (sin frontmatter)
 * @param {string} [lang] - Código de idioma para ajustar tipografía (comillas, etc.)
 * @returns {string} HTML generado
 */
export function markdownToHtml(markdown, lang) {
    if (!markdown) return '';

    // 1. Extraer atributos Pandoc
    const { markdown: cleanMarkdown, attributes } = extractPandocAttributes(markdown);

    // 2. Procesar con Unified
    const result = processor.processSync(cleanMarkdown);
    let html = String(result);

    // 3. Aplicar atributos Pandoc al HTML
    html = applyPandocAttributes(html, attributes);

    // 4. Convertir comillas a angulares si el idioma lo requiere
    html = convertToAngularQuotes(html, lang);

    // 5. Si no hay ningún <section>, envolver todo el contenido en uno
    if (html.trim() && !html.includes('<section>')) {
        html = `<section>${html}</section>`;
    }

    return html;
}

/**
 * Convierte un documento completo (con frontmatter) a HTML
 * @param {string} content - Contenido completo con frontmatter
 * @param {string} [lang] - Código de idioma para ajustar tipografía
 * @returns {{ frontmatter: string, html: string }}
 */
export function convertDocument(content, lang) {
    const { frontmatter, body } = separateFrontmatter(content);
    const html = markdownToHtml(body, lang);
    return { frontmatter, html };
}

/**
 * Genera una tabla de contenidos HTML a partir del contenido HTML
 * Busca los h1, extrae su texto y ID, y crea una lista de enlaces.
 * @param {string} html - Contenido HTML del cuerpo
 * @returns {string} HTML de la tabla de contenidos (ul.toc-list)
 */
export function generateTableOfContents(html) {
    if (!html) return '';

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1');

    if (headings.length === 0) return '';

    let tocHtml = '<ul class="toc-list">\n';

    headings.forEach(heading => {
        const text = heading.textContent;
        const id = heading.id;
        if (text && id) {
            tocHtml += `  <li><a href="#${id}"><span class="toc-text">${text}</span></a></li>\n`;
        }
    });

    tocHtml += '</ul>';

    return tocHtml;
}
