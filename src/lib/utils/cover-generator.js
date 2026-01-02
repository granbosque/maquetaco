/**
 * Generador de portadas por defecto.
 * Crea una imagen simple y elegante usando Canvas cuando no hay portada definida.
 */

import { generateEmbeddedFontCSS } from './font-embed.js';

/**
 * Genera una URL de imagen (data:image/svg+xml) para la portada
 * Renderiza un SVG vectorial con diseño tipográfico clásico (Garamond)
 * Los márgenes seguros garantizan legibilidad en proporciones 9:16 y 4:3
 * @param {string} title - Título del libro
 * @param {string} author - Autor del libro
 * @param {string} fontFamily - Familia de fuente para la portada (opcional)
 * @param {string} fontId - ID de la fuente para embed (opcional)
 * @returns {Promise<string>} Data URL de la imagen generada
 */
export async function generateDefaultCover(title = "Sin Título", author = "", fontFamily = "Georgia, serif", fontId = null) {
    const width = 600;
    const height = 900;

    // Márgenes seguros: 15% lateral, 18% vertical
    // Esto garantiza que el texto sea visible tanto en 9:16 como en 4:3
    const safeMarginX = width * 0.15;  // 90px cada lado
    const safeMarginY = height * 0.18; // 162px arriba/abajo
    const safeWidth = width - (safeMarginX * 2); // 420px
    const safeHeight = height - (safeMarginY * 2); // 576px

    // Escapar caracteres XML
    const escapeXml = (str) => str.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const safeTitle = escapeXml(title);
    const safeAuthor = escapeXml(author);

    // Configuración de diseño
    const titleSize = 42; // Reducido de 64
    const authorSize = 22; // Reducido de 32

    // Lógica de wrapping para el título (ajustada al área segura)
    // ~18 caracteres por línea para tamaño 42px en 420px de ancho
    const maxChars = 18;
    const words = safeTitle.split(' ');
    let lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + 1 + words[i].length <= maxChars) {
            currentLine += " " + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    if (currentLine) lines.push(currentLine);

    // Generar tspans para el título
    const titleSpans = lines.map((line, i) =>
        `<tspan x="50%" dy="${i === 0 ? 0 : '1.2em'}">${line}</tspan>`
    ).join('');

    // Posición Y del título dentro del área segura (centro visual)
    const titleCenterY = safeMarginY + (safeHeight * 0.4);
    const titleY = lines.length > 2 ? titleCenterY - 20 : titleCenterY;

    // Posición Y del autor dentro del área segura (parte inferior)
    const authorY = height - safeMarginY - 40;

    // Generar CSS de fuente embebida
    const fontCSS = fontId ? await generateEmbeddedFontCSS(fontId, fontFamily) : '';

    // SVG Content
    const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
            ${fontCSS ? `<style>${fontCSS}</style>` : ''}
            <!-- Degradado "Forest Mist" - Tonos verdes/oliva suaves -->
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#EEE6E7;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#EBDDDA;stop-opacity:1" />
            </linearGradient>
            
        </defs>
        
        <!-- Fondo -->
        <rect width="100%" height="100%" fill="url(#grad)" />

        <!-- Título en Small Caps -->
        <text x="50%" y="${titleY}" 
              font-family="${fontFamily}" 
              font-weight="600" 
              font-size="${titleSize}" 
              fill="#604F3D" 
              text-anchor="middle" 
              dominant-baseline="middle"
              style="font-variant: small-caps; letter-spacing: 0.08em;">
              ${titleSpans}
        </text>

        <!-- Autor -->
        ${safeAuthor ? `
        <text x="50%" y="${authorY}" 
              font-family="${fontFamily}" 
              font-weight="normal" 
              font-style="italic"
              font-size="${authorSize}" 
              fill="#957D63" 
              text-anchor="middle"
              style="letter-spacing: 0.03em;">
              ${safeAuthor}
        </text>
        
        <!-- Icono Maquetaco -->
        <g transform="translate(${width / 2 - 20}, ${authorY + 20}) scale(0.6)">
            <path d="M13.829,36.664c-7.754,0.005 -7.766,0.029 -8.885,-0.251c-0.24,-0.06 -1.958,-0.489 -2.799,-1.309c-3.533,-3.448 -1.856,-7.411 -0.896,-11.226c2.785,-11.074 15.065,-25.638 34.657,-23.704c8.995,0.888 5.624,11.681 5.951,19.899c0.125,3.156 2.38,-0.934 3.26,-1.841c2.853,-2.936 4.791,2.893 6.157,3.189c0.931,0.202 0.323,-4.347 0.478,-14.311c0.028,-1.777 1.367,-0.65 2.297,0.117c8.047,6.638 10.19,14.324 10.785,16.237c2.537,8.154 0.869,9.758 -0.231,11.158c-0.732,0.932 -3.109,2.015 -4.695,2.038c-0.283,0.004 -36.744,0.008 -46.08,0.003Zm-6.72,-1.452l42.72,0.007c11.081,-0.016 11.584,0.149 12.911,-0.818c0.404,-0.294 2.784,-2.029 1.97,-5.931c-1.739,-8.336 -4.168,-11.506 -5.118,-13.156c-0.903,-1.568 -5.701,-7.158 -6.433,-6.826c-0.582,0.264 0.406,12.221 -0.538,13.691c-1.53,2.384 -4.704,-2.656 -5.465,-3.267c-1.369,-1.1 -3.311,5.224 -5.753,3.59c-2.234,-1.495 0.98,-15.424 -1.753,-19.156c-2.43,-3.318 -12.281,-1.734 -13.089,-1.469c-1.148,0.376 -12.842,2.031 -20.547,14.416c-4.145,6.663 -4.894,14.234 -4.626,15.047c1.459,4.419 5.169,3.853 5.721,3.873Z" fill="#957D63"/>
        </g>
        ` : ''}
    </svg>`;

    // Convertir a Base64
    const encodedSvg = unescape(encodeURIComponent(svg));
    return "data:image/svg+xml;base64," + btoa(encodedSvg);
}
