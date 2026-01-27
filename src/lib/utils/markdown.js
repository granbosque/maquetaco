/**
 * Markdown utilities for Maquetaco
 * 
 * Simple regex-based heading extraction for accurate line numbers.
 * Line numbers are critical for editor navigation (scrollToLine).
 */

/**
 * Extrae los headings de un documento Markdown
 * @param {string} content - Contenido markdown
 * @returns {Array<{level: number, text: string, line: number, classes: string[]}>}
 */
export function extractHeadings(content) {
    if (!content) return [];

    const lines = content.split(/\r?\n/);
    const headings = [];
    let inFrontmatter = false;
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();

        // Detectar frontmatter YAML (solo al inicio: --- en línea 1, cierre en el siguiente ---)
        if (trimmedLine === '---') {
            if (i === 0) {
                inFrontmatter = true;
            } else if (inFrontmatter) {
                inFrontmatter = false;
            }
            continue;
        }
        if (inFrontmatter) continue;

        // Detectar bloques de código cercados (```)
        if (trimmedLine.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            continue;
        }

        // Saltar líneas dentro de bloques de código
        if (inCodeBlock) continue;

        // Detectar headings: # Título, ## Subtítulo, o #    (sin texto)
        const match = line.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
            const level = match[1].length;
            let text = match[2].trim();
            const classes = [];

            // Parsear atributos Pandoc: {.class #id}
            const attrMatch = text.match(/\s*\{([^}]+)\}\s*$/);
            if (attrMatch) {
                text = text.substring(0, attrMatch.index).trim();

                // Extraer clases
                const attrString = attrMatch[1];
                const classRegex = /\.([a-zA-Z0-9_-]+)/g;
                let classMatch;
                while ((classMatch = classRegex.exec(attrString)) !== null) {
                    classes.push(classMatch[1]);
                }
            }

            if (!text) text = '(Sin título)';

            // Línea 1-indexed (i es 0-indexed)
            headings.push({
                level,
                text,
                line: i + 1,
                classes
            });
        }
    }

    return headings;
}

/**
 * Genera un slug a partir de un texto
 * @param {string} text - Texto a convertir en slug
 * @returns {string} Slug generado
 */
export function slugify(text) {
    if (!text) return '';
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}
