/**
 * Mapa de fuentes a sus archivos TTF principales
 * Solo incluimos Regular weight para el SVG (para mantener tamaño razonable)
 */
export const fontFiles = {
    'eb-garamond': '/fonts/EB_Garamond/EBGaramond-VariableFont_wght.ttf',
    'literata': '/fonts/Literata/Literata-VariableFont_opsz,wght.ttf',
    'lora': '/fonts/lora/Lora-VariableFont_wght.ttf',
    'crimson-pro': '/fonts/Crimson_Pro/CrimsonPro-VariableFont_wght.ttf',
    'spectral': '/fonts/Spectral/Spectral-Regular.ttf',
    'alegreya': '/fonts/Alegreya/Alegreya-VariableFont_wght.ttf',
    'libre-baskerville': '/fonts/Libre_Baskerville/LibreBaskerville-VariableFont_wght.ttf',
    'vollkorn': '/fonts/Vollkorn/Vollkorn-VariableFont_wght.ttf',
    'cardo': '/fonts/Cardo/Cardo-Regular.ttf',
    'gentium-plus': '/fonts/Gentium_Plus/GentiumPlus-Regular.ttf',
    'bitter': '/fonts/Bitter/Bitter-VariableFont_wght.ttf',
    'bree-serif': '/fonts/Bree_Serif/BreeSerif-Regular.ttf',
    'crimson-text': '/fonts/Crimson_Text/CrimsonText-Regular.ttf',
    'libre-caslon': '/fonts/Libre_Caslon_Text/LibreCaslonText-Regular.ttf',
    'tinos': '/fonts/Tinos/Tinos-Regular.ttf',
    'lexend': '/fonts/Lexend/Lexend-VariableFont_wght.ttf',
    'quando': '/fonts/Quando/Quando-Regular.ttf',
    'scope-one': '/fonts/Scope_One/ScopeOne-Regular.ttf',
    'source-sans': '/fonts/Source_Sans_3/SourceSans3-VariableFont_wght.ttf',
    'georgia': null // Sistema, no requiere archivo
};

/**
 * Cache de fuentes en base64 para evitar recargar
 */
const fontCache = new Map();

/**
 * Convierte un archivo de fuente a base64
 * @param {string} fontPath - Ruta al archivo TTF
 * @returns {Promise<string>} Base64 string
 */
async function loadFontAsBase64(fontPath) {
    if (fontCache.has(fontPath)) {
        return fontCache.get(fontPath);
    }

    try {
        const response = await fetch(fontPath);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result.split(',')[1];
                fontCache.set(fontPath, base64);
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error('[cover-generator] Error loading font:', error);
        return null;
    }
}

/**
 * Genera el @font-face CSS embebido para el SVG
 * @param {string} fontId - ID de la fuente (ej: 'eb-garamond')
 * @param {string} fontFamily - Nombre de la familia (ej: "'EB Garamond'")
 * @returns {Promise<string>} CSS con font embebido o string vacío
 */
export async function generateEmbeddedFontCSS(fontId, fontFamily) {
    const fontPath = fontFiles[fontId];

    // Si es Georgia o no hay archivo, no embeber
    if (!fontPath) return '';

    const base64 = await loadFontAsBase64(fontPath);
    if (!base64) return '';

    // Limpiar nombre de familia (quitar comillas)
    const cleanFamily = fontFamily.replace(/['"]/g, '');

    return `
        @font-face {
            font-family: '${cleanFamily.split(',')[0].trim()}';
            src: url(data:font/ttf;base64,${base64}) format('truetype');
            font-weight: 100 900;
            font-style: normal;
        }
    `;
}
