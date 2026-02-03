/**
 * Utilidades para guardar documentos markdown con frontmatter YAML
 */

import { generateFrontmatter, combineWithFrontmatter } from './frontmatter.js';

/**
 * Prepara metadatos para el frontmatter combinando rawMetadata con campos conocidos
 * Los campos conocidos tienen prioridad sobre rawMetadata
 * @param {Object} config - Configuración con los metadatos
 * @returns {Object} - Objeto de metadatos para frontmatter
 */
function prepareMetadata(config) {
    // Empezar con rawMetadata (preserva campos personalizados)
    const metadata = { ...config.rawMetadata };

    // Sobrescribir con campos conocidos (tienen prioridad)
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
    if (config.toc !== undefined) metadata.toc = config.toc;
    if (config.tocDepth !== undefined && config.tocDepth !== 1) metadata.tocDepth = config.tocDepth;

    return metadata;
}

/**
 * Genera un nombre de archivo sanitizado a partir del título o nombre original
 * @param {Object} config - Configuración con title y fileName
 * @returns {string} - Nombre de archivo con extensión .md
 */
export function generateFileName(config) {
    const title = config.title?.trim();
    if (title && title !== 'Introducción a Maquetaco') {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúüñ\s]/gi, '')
            .replace(/\s+/g, '-')
            .substring(0, 50) + '.md';
    }

    if (config.fileName && config.fileName !== 'Ningún archivo cargado') {
        // Si ya tiene un nombre de archivo (porque se abrió uno), lo usamos convirtiendo la extensión
        return config.fileName.replace(/\.(docx|txt)$/i, '.md');
    }

    // Fallback al título por defecto si no hay otro nombre
    if (title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9áéíóúüñ\s]/gi, '')
            .replace(/\s+/g, '-')
            .substring(0, 50) + '.md';
    }

    return 'documento.md';
}

/**
 * Descarga el documento markdown con frontmatter YAML
 * @param {Object} config - Configuración completa del documento
 */
/**
 * Descarga el documento markdown con frontmatter YAML
 * @param {Object} config - Configuración completa del documento
 */
export async function saveDocument(config) {
    let content = config.content || '';

    // Reintegrar imágenes (blob -> base64) para que el archivo sea portable
    content = await inlineBlobImages(content);

    // Preparar metadatos combinando rawMetadata con campos conocidos
    const metadata = prepareMetadata(config);
    
    // Generar documento completo con frontmatter
    const fullDocument = combineWithFrontmatter(metadata, content);
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

/**
 * Busca imágenes con URLs tipo blob:... y las convierte a base64
 * para que el archivo guardado sea autónomo.
 * 
 * @param {string} markdown 
 * @returns {Promise<string>}
 */
async function inlineBlobImages(markdown) {
    // Regex para imágenes Markdown: ![alt](blob:url)
    const regex = /!\[(.*?)\]\((blob:[^)]+)\)/g;
    const matches = [...markdown.matchAll(regex)];

    // Si no hay imágenes blob, devolver tal cual
    if (matches.length === 0) return markdown;

    // Procesar cada coincidencia (descargar blob y convertir a base64)
    // Usamos un mapa para sustituciones para evitar descargas duplicadas
    const replacements = new Map();

    // Notificar al usuario si son muchas imágenes podría ser buena UX, 
    // pero aquí lo hacemos silencioso excepto logs.

    await Promise.all(matches.map(async (match) => {
        const [fullMatch, alt, blobUrl] = match;
        if (!replacements.has(blobUrl)) {
            try {
                const response = await fetch(blobUrl);
                const blob = await response.blob();
                const base64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
                replacements.set(blobUrl, base64);
            } catch (e) {
                console.warn(`No se pudo reintegrar la imagen ${blobUrl}:`, e);
                // Si falla, dejamos la URL original
                replacements.set(blobUrl, blobUrl);
            }
        }
    }));

    // Reemplazar en el texto
    return markdown.replace(regex, (match, alt, blobUrl) => {
        // Usamos el base64 si lo tenemos, o el original si falló
        const replacement = replacements.get(blobUrl) || blobUrl;
        return `![${alt}](${replacement})`;
    });
}
