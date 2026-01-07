/**
 * Renderizador de documentos paginados con Paged.js
 * 
 * Soporta múltiples modos de renderizado:
 * - iframe: Preview dentro de la app
 * - window: Documento en nueva ventana (futuro)
 * - pdf: Generación directa de PDF (futuro, requiere backend)
 */

/**
 * Genera el HTML completo del documento para Paged.js
 * @param {string} bodyHtml - HTML del cuerpo del documento
 * @param {string} css - CSS para la maquetación (obligatorio)
 * @param {Object} options - Opciones adicionales
 * @returns {string} HTML completo con CSS y scripts
 */
/**
 * Gets the computed background color from the document body
 * Falls back to a neutral warm gray if not available
 */
function getAppBackgroundColor() {
    if (typeof document !== 'undefined') {
        const computed = getComputedStyle(document.body).getPropertyValue('--bg-app').trim();
        if (computed) return computed;
    }
    return '#f8f8f6'; // Fallback matching tokens-minimal.css
}

export function generateFullDocument(bodyHtml, css, options = {}) {
    if (!css) {
        throw new Error("CSS is required for PDF generation");
    }
    const { lang = 'es', bgApp = getAppBackgroundColor() } = options;

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="/fonts/export-fonts.css">
    <style>
/* Hide scrollbars during Paged.js rendering */
html { overflow: hidden; scrollbar-gutter: stable;}
html, body { background-color: ${bgApp} !important;}
.pagedjs_page { background-color: white !important;}
html.pagedjs-ready { overflow: auto; }
${css}
    </style>
    <script src="https://unpkg.com/pagedjs/dist/paged.polyfill.js"></script>
    <script>
/* Handle internal anchor links within the iframe */
document.addEventListener('click', function(e) {
    const link = e.target.closest('a[href^="#"]');
    if (link) {
        e.preventDefault();
        const targetId = link.getAttribute('href').slice(1);
        // Use getElementById instead of querySelector('#id') because
        // IDs starting with digits are valid HTML but invalid CSS selectors
        const target = document.getElementById(targetId);
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
});
    </script>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

/**
 * Renderiza el documento en un iframe
 * @param {string} html - HTML completo del documento
 * @param {HTMLElement} container - Contenedor donde insertar el iframe
 * @returns {Promise<HTMLIFrameElement>} El iframe creado
 */
export async function renderInIframe(html, container) {
    return new Promise((resolve, reject) => {
        // Limpiar contenedor
        container.innerHTML = '';

        // Crear iframe con transición suave
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.style.backgroundColor = '#f5f5f5';
        iframe.style.opacity = '0';
        iframe.style.transition = 'opacity 0.3s ease-out';

        container.appendChild(iframe);

        // Cargar contenido
        iframe.srcdoc = html;

        iframe.onload = () => {
            let attempts = 0;
            const maxAttempts = 50; // 5 segundos máximo

            // Esperar a que Paged.js termine
            const checkPagedJs = () => {
                attempts++;
                const win = iframe.contentWindow;

                // Verificar si Paged.js ha terminado
                // Opción 1: PagedPolyfill.ready
                // Opción 2: Presencia de .pagedjs_pages en el DOM
                const pagedReady = win?.PagedPolyfill?.ready;
                const hasPages = win?.document?.querySelector('.pagedjs_pages');

                if (pagedReady || hasPages) {
                    console.log('[paged-renderer] Paged.js ready');
                    // Reveal scrollbars now that rendering is complete
                    win?.document?.documentElement?.classList.add('pagedjs-ready');
                    // Fade in the iframe
                    iframe.style.opacity = '1';
                    resolve(iframe);
                } else if (attempts >= maxAttempts) {
                    // Timeout - resolver de todas formas para no bloquear
                    console.warn('[paged-renderer] Timeout waiting for Paged.js, resolving anyway');
                    iframe.style.opacity = '1';
                    resolve(iframe);
                } else {
                    setTimeout(checkPagedJs, 100);
                }
            };

            // Dar tiempo inicial para que cargue el script
            setTimeout(checkPagedJs, 300);
        };

        iframe.onerror = (e) => {
            console.error('[paged-renderer] iframe error:', e);
            reject(e);
        };
    });
}

/**
 * Imprime el contenido del iframe
 * @param {HTMLIFrameElement} iframe - El iframe a imprimir
 */
export function printIframe(iframe) {
    if (iframe?.contentWindow) {
        iframe.contentWindow.print();
    }
}

/**
 * Función principal de renderizado
 * @param {string} html - HTML completo del documento
 * @param {Object} options - Opciones de renderizado
 * @returns {Promise<HTMLIFrameElement|Window|Blob>} Resultado según el modo
 */
export async function render(html, options = {}) {
    const { mode = 'iframe', container } = options;

    switch (mode) {
        case 'iframe':
            if (!container) {
                throw new Error('Container required for iframe mode');
            }
            return renderInIframe(html, container);

        case 'window':
            // TODO: Implementar renderizado en nueva ventana
            throw new Error('Window mode not implemented yet');

        case 'pdf':
            // TODO: Implementar generación de PDF (requiere backend)
            throw new Error('PDF mode not implemented yet');

        default:
            throw new Error(`Unknown render mode: ${mode}`);
    }
}
