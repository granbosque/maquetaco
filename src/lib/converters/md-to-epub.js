/**
 * Conversor de Markdown a EPUB
 * 
 * Conecta el contenido de appState con EpubBook para generar EPUBs.
 * Usa md-to-html.js para la conversión de Markdown y EpubBook para la generación del EPUB.
 */

import { EpubBook } from './EpubBook.js';
import { markdownToHtml, markdownToHtmlInline, separateFrontmatter } from './md-to-html.js';
import defaultEpubCss from '$lib/export-themes/epub/style.css?raw';

// Re-exportar EpubBook para uso directo si se necesita
export { EpubBook };

// Dimensiones recomendadas para portada de EPUB (ratio 2:3)
const COVER_WIDTH = 1600;
const COVER_HEIGHT = 2400;

/**
 * Genera un EPUB a partir de la configuración de la app
 * @param {Object} config - appState.config
 * @param {Object} [options] - Opciones adicionales
 * @param {string} [options.css] - CSS personalizado (usa el por defecto si no se proporciona)
 * @returns {Promise<Blob>} Blob del archivo EPUB
 */
export async function exportToEpub(config, options = {}) {
    const epub = new EpubBook();

    // 1. Metadatos
    epub.setMetadata({
        title: config.title || 'Sin título',
        author: config.author || '',
        publisher: config.publisher || '',
        language: config.lang || 'es',
        rights: config.copyright || '',
        date: config.date || new Date().getFullYear().toString()
    });

    // 2. Portada (si existe) - convertir SVG a PNG si es necesario
    const coverImage = await prepareCoverImage(config.imagePreview);
    if (coverImage) {
        epub.setCover(coverImage);
    }

    // 3. Stylesheet
    const css = options.css || defaultEpubCss;
    epub.setStylesheet(css);

    // 4. Convertir MD → HTML
    const { body: markdownBody } = separateFrontmatter(config.content || '');
    const html = markdownToHtml(markdownBody, config.lang);

    // 5. Extraer secciones del HTML
    const sections = extractSections(html);

    // 6. Dedicatoria (si existe en metadatos)
    if (config.dedication?.trim()) {
        epub.addChapter({
            id: 'dedication',
            title: 'Dedicatoria',
            content: `<div class="dedication">${markdownToHtmlInline(config.dedication, config.lang)}</div>`,
            role: 'dedication',
            showInToc: false
        });
    }

    // 7. Capítulos (cada <section>)
    if (sections.length > 0) {
        sections.forEach((section, i) => {
            epub.addChapter({
                id: `chapter-${String(i + 1).padStart(3, '0')}`,
                title: section.title || `Capítulo ${i + 1}`,
                content: section.html
            });
        });
    } else {
        // Si no hay secciones, añadir todo el contenido como un único capítulo
        epub.addChapter({
            id: 'content',
            title: config.title || 'Contenido',
            content: html
        });
    }

    // 8. Colofón (si existe)
    if (config.colophon?.trim()) {
        epub.addChapter({
            id: 'colophon',
            title: 'Colofón',
            content: `<div class="colophon">${markdownToHtmlInline(config.colophon, config.lang)}</div>`,
            role: 'colophon',
            showInToc: false
        });
    }

    // 9. Branding (si está habilitado)
    if (config.includeBranding !== false) {
        epub.addChapter({
            id: 'made-with',
            title: 'Maquetado con Maquetaco',
            content: createBrandingHtml(),
            role: 'colophon',
            showInToc: false
        });
    }

    return epub.generateBlob();
}

/**
 * Extrae las secciones del HTML generado por md-to-html
 * Cada <section> corresponde a un H1 en el markdown original
 * @param {string} html - HTML con <section>s
 * @returns {Array<{title: string, html: string}>}
 */
function extractSections(html) {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const sections = doc.querySelectorAll('section');

    if (sections.length === 0) {
        return [];
    }

    return Array.from(sections).map(section => {
        // Buscar el H1 dentro de la sección para obtener el título
        const h1 = section.querySelector('h1');
        const title = h1 ? h1.textContent.trim() : '';

        return {
            title,
            html: section.innerHTML
        };
    });
}


/**
 * Genera el HTML del branding de Maquetaco
 * Con estilos para posicionarlo al final de la página
 * @returns {string}
 */
function createBrandingHtml() {
    // Usamos un wrapper con altura mínima y flexbox para empujar el contenido abajo
    // Nota: no todos los lectores EPUB soportan esto perfectamente, pero funciona en la mayoría
    return `
<style>
    .made-with-wrapper {
        min-height: 90vh;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: center;
        padding-bottom: 2em;
    }
    .made-with-content {
        text-align: center;
        opacity: 0.6;
    }
    .made-with-content p {
        margin: 0;
        font-size: 0.85em;
    }
</style>
<div class="made-with-wrapper">
    <div class="made-with-content">
        <svg width="48" height="27" viewBox="0 0 67 37" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 0 auto 0.5em auto;">
            <path d="M13.829,36.664c-7.754,0.005 -7.766,0.029 -8.885,-0.251c-0.24,-0.06 -1.958,-0.489 -2.799,-1.309c-3.533,-3.448 -1.856,-7.411 -0.896,-11.226c2.785,-11.074 15.065,-25.638 34.657,-23.704c8.995,0.888 5.624,11.681 5.951,19.899c0.125,3.156 2.38,-0.934 3.26,-1.841c2.853,-2.936 4.791,2.893 6.157,3.189c0.931,0.202 0.323,-4.347 0.478,-14.311c0.028,-1.777 1.367,-0.65 2.297,0.117c8.047,6.638 10.19,14.324 10.785,16.237c2.537,8.154 0.869,9.758 -0.231,11.158c-0.732,0.932 -3.109,2.015 -4.695,2.038c-0.283,0.004 -36.744,0.008 -46.08,0.003Zm-6.72,-1.452l42.72,0.007c11.081,-0.016 11.584,0.149 12.911,-0.818c0.404,-0.294 2.784,-2.029 1.97,-5.931c-1.739,-8.336 -4.168,-11.506 -5.118,-13.156c-0.903,-1.568 -5.701,-7.158 -6.433,-6.826c-0.582,0.264 0.406,12.221 -0.538,13.691c-1.53,2.384 -4.704,-2.656 -5.465,-3.267c-1.369,-1.1 -3.311,5.224 -5.753,3.59c-2.234,-1.495 0.98,-15.424 -1.753,-19.156c-2.43,-3.318 -12.281,-1.734 -13.089,-1.469c-1.148,0.376 -12.842,2.031 -20.547,14.416c-4.145,6.663 -4.894,14.234 -4.626,15.047c1.459,4.419 5.169,3.853 5.721,3.873Z" fill="currentColor"/>
        </svg>
        <p>Maquetado con Maquetaco</p>
    </div>
</div>`;
}

/**
 * Descarga un blob como archivo
 * @param {Blob} blob
 * @param {string} filename
 */
export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Genera y descarga el EPUB directamente
 * @param {Object} config - appState.config
 * @param {Object} [options] - Opciones adicionales
 */
export async function downloadEpub(config, options = {}) {
    const blob = await exportToEpub(config, options);
    const filename = sanitizeFilename(config.title || 'libro') + '.epub';
    downloadBlob(blob, filename);
}

/**
 * Sanitiza un nombre de archivo
 * @param {string} filename
 * @returns {string}
 */
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

/**
 * Detecta si un data URL es SVG
 * @param {string} dataUrl
 * @returns {boolean}
 */
function isSvgDataUrl(dataUrl) {
    if (!dataUrl) return false;
    return dataUrl.startsWith('data:image/svg');
}

/**
 * Convierte un SVG data URL a PNG data URL usando Canvas
 * @param {string} svgDataUrl - Data URL del SVG
 * @param {number} [width=COVER_WIDTH] - Ancho en píxeles
 * @param {number} [height=COVER_HEIGHT] - Alto en píxeles
 * @returns {Promise<string>} Data URL del PNG
 */
async function convertSvgToPng(svgDataUrl, width = COVER_WIDTH, height = COVER_HEIGHT) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            
            const ctx = canvas.getContext('2d');
            
            // Fondo blanco (por si el SVG tiene transparencia)
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);
            
            // Dibujar la imagen SVG
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a PNG
            const pngDataUrl = canvas.toDataURL('image/png');
            resolve(pngDataUrl);
        };
        
        img.onerror = () => {
            reject(new Error('Error al cargar el SVG para conversión'));
        };
        
        img.src = svgDataUrl;
    });
}

/**
 * Prepara la imagen de portada para EPUB
 * Si es SVG, la convierte a PNG. Si no, la devuelve tal cual.
 * @param {string|null} imageDataUrl
 * @returns {Promise<string|null>}
 */
async function prepareCoverImage(imageDataUrl) {
    if (!imageDataUrl) {
        console.log('[md-to-epub] No hay imagen de portada');
        return null;
    }
    
    // Detectar tipo de imagen
    const mimeMatch = imageDataUrl.match(/data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'desconocido';
    console.log('[md-to-epub] Portada detectada:', mimeType);
    
    if (isSvgDataUrl(imageDataUrl)) {
        try {
            console.log('[md-to-epub] Convirtiendo SVG a PNG...');
            const pngDataUrl = await convertSvgToPng(imageDataUrl);
            console.log('[md-to-epub] ✓ SVG convertido a PNG (', 
                Math.round(pngDataUrl.length / 1024), 'KB)');
            return pngDataUrl;
        } catch (e) {
            console.warn('[md-to-epub] ✗ Error convirtiendo SVG a PNG:', e);
            return null;
        }
    }
    
    console.log('[md-to-epub] Usando imagen original (no es SVG)');
    return imageDataUrl;
}

/**
 * Genera un blob EPUB directamente desde HTML (para preview)
 * Compatible con la API anterior de epub-generator.js
 * @param {Object} metadata - Metadatos del libro
 * @param {string} htmlContent - HTML del contenido (ya convertido)
 * @param {string} [coverImageDataUrl] - Imagen de portada en data URL
 * @param {string} [css] - CSS personalizado
 * @returns {Promise<Blob>}
 */
export async function createEpubBlob(metadata, htmlContent, coverImageDataUrl = null, css = '') {
    const epub = new EpubBook();

    // Metadatos
    epub.setMetadata({
        title: metadata.title || 'Sin título',
        author: metadata.author || '',
        publisher: metadata.publisher || '',
        language: metadata.lang || 'es',
        rights: metadata.copyright || '',
        date: metadata.date || new Date().getFullYear().toString()
    });

    // Portada - convertir SVG a PNG si es necesario
    const coverImage = await prepareCoverImage(coverImageDataUrl);
    if (coverImage) {
        epub.setCover(coverImage);
    }

    // Stylesheet
    epub.setStylesheet(css || defaultEpubCss);

    // Extraer secciones del HTML
    const sections = extractSections(htmlContent);

    // Dedicatoria (si existe en metadatos)
    if (metadata.dedication?.trim()) {
        epub.addChapter({
            id: 'dedication',
            title: 'Dedicatoria',
            content: `<div class="dedication">${markdownToHtmlInline(metadata.dedication, metadata.lang)}</div>`,
            role: 'dedication',
            showInToc: false
        });
    }

    // Capítulos
    if (sections.length > 0) {
        sections.forEach((section, i) => {
            epub.addChapter({
                id: `chapter-${String(i + 1).padStart(3, '0')}`,
                title: section.title || `Capítulo ${i + 1}`,
                content: section.html
            });
        });
    } else {
        // Si no hay secciones, añadir todo el contenido como un único capítulo
        epub.addChapter({
            id: 'content',
            title: metadata.title || 'Contenido',
            content: htmlContent
        });
    }

    // Colofón (si existe)
    if (metadata.colophon?.trim()) {
        epub.addChapter({
            id: 'colophon',
            title: 'Colofón',
            content: `<div class="colophon">${markdownToHtmlInline(metadata.colophon, metadata.lang)}</div>`,
            role: 'colophon',
            showInToc: false
        });
    }

    // Branding (si está habilitado)
    if (metadata.includeBranding !== false) {
        epub.addChapter({
            id: 'made-with',
            title: 'Maquetado con Maquetaco',
            content: createBrandingHtml(),
            role: 'colophon',
            showInToc: false
        });
    }

    return epub.generateBlob();
}
