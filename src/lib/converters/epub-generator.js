/**
 * EPUB Generator - Genera archivos EPUB 3.0 en el navegador
 * Un EPUB es básicamente un archivo ZIP con una estructura específica
 */

import JSZip from 'jszip';
import defaultCss from '$lib/export-themes/epub/style.css?raw';

/**
 * Genera el blob del archivo EPUB
 * @param {Object} metadata
 * @param {string} htmlContent
 * @param {string} coverImageDataUrl
 * @param {string} css
 * @returns {Promise<Blob>}
 */
export async function createEpubBlob(metadata, htmlContent, coverImageDataUrl = null, css = '') {
    const zip = new JSZip();

    // 1. Mimetype (debe ser el primer archivo, sin comprimir)
    zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

    // 2. META-INF/container.xml
    zip.file('META-INF/container.xml', createContainer());

    // 3. OEBPS/content.opf (Package Document)
    const hasCover = !!coverImageDataUrl;

    // Detectar tipo de imagen de portada
    let coverMime = 'image/jpeg';
    let coverExt = 'jpg';
    if (coverImageDataUrl) {
        const mimeMatch = coverImageDataUrl.match(/data:([^;]*);/);
        if (mimeMatch) {
            coverMime = mimeMatch[1];
            if (coverMime === 'image/svg+xml') coverExt = 'svg';
            else if (coverMime === 'image/png') coverExt = 'png';
        }
    }

    zip.file(`OEBPS/content.opf`, createPackageDocument(metadata, hasCover, coverMime, coverExt));

    // 4. OEBPS/nav.xhtml (Navigation Document)
    zip.file('OEBPS/nav.xhtml', createNavDocument(metadata, htmlContent));

    // 5. OEBPS/content.xhtml (Contenido principal)
    zip.file('OEBPS/content.xhtml', createContentDocument(metadata, htmlContent));

    // 6. OEBPS/styles.css
    zip.file('OEBPS/styles.css', css || getDefaultCss());

    // 7. Imagen de portada (si existe)
    if (coverImageDataUrl) {
        const imageData = dataUrlToBlob(coverImageDataUrl);
        zip.file(`OEBPS/cover.${coverExt}`, imageData);
    }

    // Generar el archivo ZIP
    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Genera un archivo EPUB y lo descarga
 * ... (sin cambios en generateEpub)
 */
export async function generateEpub(metadata, htmlContent, coverImageDataUrl = null, css = '') {
    const blob = await createEpubBlob(metadata, htmlContent, coverImageDataUrl, css);

    // Descargar el archivo
    const filename = sanitizeFilename(metadata.title || 'libro') + '.epub';
    downloadBlob(blob, filename);
}

/**
 * Crea el archivo container.xml
 * ... (sin cambios en createContainer)
 */
function createContainer() {
    return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
}

/**
 * Crea el Package Document (content.opf)
 */
function createPackageDocument(metadata, hasCover, coverMime = 'image/jpeg', coverExt = 'jpg') {
    const title = escapeXml(metadata.title || 'Sin título');
    const author = escapeXml(metadata.author || 'Autor desconocido');
    const language = metadata.language || 'es';
    const date = metadata.date || new Date().toISOString().split('T')[0];
    const uuid = generateUUID();

    const coverManifest = hasCover ? `<item id="cover-image" href="cover.${coverExt}" media-type="${coverMime}"/>` : '';
    const coverMetadata = hasCover ? '<meta name="cover" content="cover-image"/>' : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="book-id">urn:uuid:${uuid}</dc:identifier>
        <dc:title>${title}</dc:title>
        <dc:creator>${author}</dc:creator>
        <dc:language>${language}</dc:language>
        <dc:date>${date}</dc:date>
        <dc:publisher>${escapeXml(metadata.publisher || 'Autoedición')}</dc:publisher>
        <meta property="dcterms:modified">${new Date().toISOString()}</meta>
        ${coverMetadata}
    </metadata>
    <manifest>
        <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
        <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
        <item id="css" href="styles.css" media-type="text/css"/>
        ${coverManifest}
    </manifest>
    <spine>
        <itemref idref="content"/>
    </spine>
</package>`;
}

/**
 * Crea el Navigation Document (nav.xhtml)
 */
function createNavDocument(metadata, htmlContent) {
    const title = escapeXml(metadata.title || 'Sin título');

    // Extraer encabezados para la tabla de contenidos
    const toc = extractTableOfContents(htmlContent);

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <title>Tabla de contenidos</title>
    <meta charset="UTF-8"/>
</head>
<body>
    <nav epub:type="toc">
        <h1>Tabla de contenidos</h1>
        <ol>
            ${toc}
        </ol>
    </nav>
</body>
</html>`;
}

/**
 * Crea el documento de contenido principal
 */
function createContentDocument(metadata, htmlContent) {
    const title = escapeXml(metadata.title || 'Sin título');

    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${title}</title>
    <meta charset="UTF-8"/>
    <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
    ${metadata.dedication ? `<div class="dedication"><p>${escapeXml(metadata.dedication)}</p></div>` : ''}
    ${htmlContent}
    ${metadata.colophon ? `<section class="colophon"><p>${escapeXml(metadata.colophon)}</p></section>` : ''}
    ${metadata.includeBranding !== false ? `
    <section class="made-with-page">
        <svg width="48" height="27" viewBox="0 0 67 37" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.5; display: block; margin: 0 auto 0.5em auto;"><path d="M13.829,36.664c-7.754,0.005 -7.766,0.029 -8.885,-0.251c-0.24,-0.06 -1.958,-0.489 -2.799,-1.309c-3.533,-3.448 -1.856,-7.411 -0.896,-11.226c2.785,-11.074 15.065,-25.638 34.657,-23.704c8.995,0.888 5.624,11.681 5.951,19.899c0.125,3.156 2.38,-0.934 3.26,-1.841c2.853,-2.936 4.791,2.893 6.157,3.189c0.931,0.202 0.323,-4.347 0.478,-14.311c0.028,-1.777 1.367,-0.65 2.297,0.117c8.047,6.638 10.19,14.324 10.785,16.237c2.537,8.154 0.869,9.758 -0.231,11.158c-0.732,0.932 -3.109,2.015 -4.695,2.038c-0.283,0.004 -36.744,0.008 -46.08,0.003Zm-6.72,-1.452l42.72,0.007c11.081,-0.016 11.584,0.149 12.911,-0.818c0.404,-0.294 2.784,-2.029 1.97,-5.931c-1.739,-8.336 -4.168,-11.506 -5.118,-13.156c-0.903,-1.568 -5.701,-7.158 -6.433,-6.826c-0.582,0.264 0.406,12.221 -0.538,13.691c-1.53,2.384 -4.704,-2.656 -5.465,-3.267c-1.369,-1.1 -3.311,5.224 -5.753,3.59c-2.234,-1.495 0.98,-15.424 -1.753,-19.156c-2.43,-3.318 -12.281,-1.734 -13.089,-1.469c-1.148,0.376 -12.842,2.031 -20.547,14.416c-4.145,6.663 -4.894,14.234 -4.626,15.047c1.459,4.419 5.169,3.853 5.721,3.873Z" fill="#888"/></svg>
        <p class="made-with-text">Maquetado con Maquetaco</p>
    </section>
    ` : ''}
</body>
</html>`;
}

/**
 * Extrae encabezados del HTML para crear tabla de contenidos
 */
function extractTableOfContents(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings = doc.querySelectorAll('h1, h2');

    if (headings.length === 0) {
        return '<li><a href="content.xhtml">Contenido</a></li>';
    }

    let toc = '';
    headings.forEach((heading, index) => {
        const text = heading.textContent.trim();
        const id = heading.id || `heading-${index}`;

        // Asegurar que el heading tenga un id
        if (!heading.id) {
            heading.id = id;
        }

        toc += `<li><a href="content.xhtml#${id}">${escapeXml(text)}</a></li>\n`;
    });

    return toc;
}

/**
 * CSS por defecto para el EPUB
 */
/**
 * CSS por defecto para el EPUB
 */
function getDefaultCss() {
    return defaultCss;
}

/**
 * Utilidades
 */

function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '-')
        .replace(/\s+/g, '-')
        .toLowerCase();
}

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
