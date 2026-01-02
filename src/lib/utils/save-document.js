/**
 * Utilidades para guardar documentos markdown con frontmatter YAML
 */

/**
 * Genera frontmatter YAML con los metadatos del documento
 * Solo incluye campos que tengan valor
 * @param {Object} config - Configuración con los metadatos
 * @returns {string} - Frontmatter YAML o string vacío
 */
export function generateFrontmatter(config) {
    const metadata = {};

    // Solo incluir campos con valor
    if (config.title) metadata.title = config.title;
    if (config.author) metadata.author = config.author;
    if (config.subtitle) metadata.subtitle = config.subtitle;
    if (config.publisher) metadata.publisher = config.publisher;
    if (config.isbn) metadata.isbn = config.isbn;
    if (config.copyright) metadata.copyright = config.copyright;
    if (config.date) metadata.date = config.date;
    if (config.lang && config.lang !== 'es') metadata.lang = config.lang;
    if (config.dedication) metadata.dedication = config.dedication;
    if (config.colophon) metadata.colophon = config.colophon;
    if (config.enableTOC) metadata.toc = true; // Guardar como 'toc' por simplicidad

    // Si no hay metadatos, no generar frontmatter
    if (Object.keys(metadata).length === 0) return '';

    // Generar YAML a mano para control total del formato
    const lines = ['---'];
    for (const [key, value] of Object.entries(metadata)) {
        // Escapar valores que contengan caracteres especiales YAML
        const stringValue = String(value);
        if (stringValue.includes(':') || stringValue.includes('#') ||
            stringValue.includes('"') || stringValue.includes("'") ||
            stringValue.includes('\n') || stringValue.startsWith(' ')) {
            // Usar comillas dobles y escapar comillas internas
            lines.push(`${key}: "${stringValue.replace(/"/g, '\\"')}"`);
        } else {
            lines.push(`${key}: ${stringValue}`);
        }
    }
    lines.push('---', '');
    return lines.join('\n');
}

/**
 * Genera un nombre de archivo sanitizado a partir del título o nombre original
 * @param {Object} config - Configuración con title y fileName
 * @returns {string} - Nombre de archivo con extensión .md
 */
export function generateFileName(config) {
    if (config.title) {
        return config.title
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúüñ\s]/gi, '')
            .replace(/\s+/g, '-')
            .substring(0, 50) + '.md';
    }

    if (config.fileName && config.fileName !== 'Ningún archivo cargado') {
        return config.fileName.replace(/\.(docx|txt)$/i, '.md');
    }

    return 'documento.md';
}

/**
 * Descarga el documento markdown con frontmatter YAML
 * @param {Object} config - Configuración completa del documento
 */
export function saveDocument(config) {
    const frontmatter = generateFrontmatter(config);
    const content = config.content || '';
    const fullDocument = frontmatter + content;
    const fileName = generateFileName(config);

    // Crear y descargar el archivo
    const blob = new Blob([fullDocument], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
