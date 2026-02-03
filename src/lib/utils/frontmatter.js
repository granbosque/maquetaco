import yaml from 'js-yaml';

/**
 * UTILIDADES PARA FRONTMATTER YAML
 * 
 * Estas funciones permiten:
 * - Parsear frontmatter de un texto Markdown
 * - Generar frontmatter desde un objeto de metadatos
 */

/**
 * Extrae el frontmatter YAML de un texto Markdown.
 * 
 * @param {string} text - Texto Markdown completo (puede incluir frontmatter)
 * @returns {{ metadata: Object, content: string }} Objeto con metadatos y contenido sin frontmatter
 * 
 * @example
 * const { metadata, content } = parseFrontmatter(`---
 * title: Mi Libro
 * author: Autor
 * ---
 * 
 * # Capítulo 1
 * Contenido...`);
 * 
 * // metadata = { title: "Mi Libro", author: "Autor" }
 * // content = "# Capítulo 1\nContenido..."
 */
export function parseFrontmatter(text) {
    if (!text || typeof text !== 'string') {
        return { metadata: {}, content: text || '' };
    }

    // Regex para detectar frontmatter: empieza con ---, termina con ---
    // El frontmatter debe estar al inicio del documento
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
    const match = text.match(frontmatterRegex);

    if (!match) {
        // No hay frontmatter
        return { metadata: {}, content: text };
    }

    const yamlContent = match[1];
    const restOfDocument = text.slice(match[0].length);

    try {
        const metadata = yaml.load(yamlContent) || {};
        return {
            metadata,
            content: restOfDocument.trim()
        };
    } catch (e) {
        console.warn('Error parsing YAML frontmatter:', e);
        // Si el YAML es inválido, devolvemos el documento sin cambios
        return { metadata: {}, content: text };
    }
}

/**
 * Genera un bloque frontmatter YAML desde un objeto de metadatos.
 * 
 * @param {Object} metadata - Objeto con los metadatos
 * @returns {string} Bloque YAML con delimitadores (---\n...\n---)
 * 
 * @example
 * const fm = generateFrontmatter({ title: "Mi Libro", author: "Autor" });
 * // "---\ntitle: Mi Libro\nauthor: Autor\n---"
 */
export function generateFrontmatter(metadata) {
    if (!metadata || Object.keys(metadata).length === 0) {
        return '';
    }

    // Filtrar campos vacíos o nulos
    const cleanMetadata = {};
    for (const [key, value] of Object.entries(metadata)) {
        if (value !== null && value !== undefined && value !== '') {
            // Para arrays, solo incluir si tienen elementos
            if (Array.isArray(value)) {
                if (value.length > 0) {
                    cleanMetadata[key] = value;
                }
            } else {
                cleanMetadata[key] = value;
            }
        }
    }

    if (Object.keys(cleanMetadata).length === 0) {
        return '';
    }

    try {
        const yamlStr = yaml.dump(cleanMetadata, {
            lineWidth: -1,  // No limitar ancho de línea
            quotingType: '"',
            forceQuotes: false
        });
        return `---\n${yamlStr}---\n`;
    } catch (e) {
        console.warn('Error generating YAML frontmatter:', e);
        return '';
    }
}

/**
 * Combina frontmatter y contenido en un documento Markdown completo.
 * 
 * @param {Object} metadata - Objeto con los metadatos
 * @param {string} content - Contenido Markdown (sin frontmatter)
 * @returns {string} Documento Markdown completo con frontmatter
 */
export function combineWithFrontmatter(metadata, content) {
    const frontmatter = generateFrontmatter(metadata);

    if (!frontmatter) {
        return content;
    }

    return `${frontmatter}\n\n${content}`;
}
