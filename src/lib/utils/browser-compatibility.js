/**
 * Utilidades para detectar compatibilidad del navegador
 * 
 * 
 * Para generar el PDF se usa paged.js, que es un polyfill de CSS Paged Media
 * y asegura que funcionen características como la paginación, cabeceras, pies, tamaño de página,
 * contadores y numeración, estilos de página, etc.
 * Pero la división silábica es problemática y depende del navegador, no la gestiona paged.js
 * (ese es el motivo por el que no funciona tampoco con chrome headless, en algún otro punto de la documentación hay más detalles sobre esto)
 * 
 * Otra cosa posiblemente problemática sería detectar que haya disponible una impresora PDF 
 * que no haga nada raro como añadir cabeceras propias, etc.
 */

/**
 * Detecta si el navegador soporta división silábica (hyphenation)
 * Esta detección es un parche cutre pero no he encontrado otra forma
 * @returns {boolean} true si el navegador soporta hyphenation
 */
export function detectHyphenationSupport() {
    // Verificar user agent para detectar navegadores conocidos por no soportarlo
    const userAgent = navigator.userAgent.toLowerCase();
    const isElectron = userAgent.includes('electron');
    
    // Crear elemento de prueba
    const testElement = document.createElement('div');
    testElement.style.cssText = 'hyphens: auto; position: absolute; visibility: hidden; width: 100px;';
    testElement.setAttribute('lang', 'es');
    testElement.textContent = 'supercalifragilisticoespialidoso'; // Palabra larga que debería separarse
    
    document.body.appendChild(testElement);
    
    try {
        const computedStyle = window.getComputedStyle(testElement);
        const hyphensValue = computedStyle.hyphens || 
                            computedStyle.webkitHyphens || 
                            computedStyle.mozHyphens || 
                            computedStyle.msHyphens;
        // si la propiedad tiene valor entendemos que está soportada
        const isSupported = hyphensValue === 'auto' && !isElectron;
        document.body.removeChild(testElement);
        return isSupported;
    } catch (e) {
        // Si hay error, suponemos que no está soportado
        if (testElement.parentNode) {
            document.body.removeChild(testElement);
        }
        return false;
    }
}

/**
 * Verifica la compatibilidad del navegador
 * Debe llamarse al iniciar la aplicación
 * @returns {{hasIssues: boolean, issues: string[], compatibility: Object}} Información de compatibilidad
 */
export function checkBrowserCompatibility() {
    const hyphenationSupported = detectHyphenationSupport();
    const issues = [];
    
    if (!hyphenationSupported) {
        issues.push(
            'División silábica'
        );        
    }
    
    // Retornar información de compatibilidad
    return {
        hasIssues: issues.length > 0,
        issues,
        compatibility: {
            hyphenation: hyphenationSupported
        }
    };
}
