/**
 * Estilos de cabecera y pie de página para la exportación PDF.
 * Cada preset importa su CSS correspondiente como string.
 */
import titleAuthorCss from '$lib/export-themes/print/header-footer--title-author.css?raw';
import titleH1Css from '$lib/export-themes/print/header-footer--title-h1.css?raw';
import h1H2Css from '$lib/export-themes/print/header-footer--h1-h2.css?raw';
import footerOnlyCss from '$lib/export-themes/print/header-footer--footer-only.css?raw';

export const headerStyles = [
    {
        id: 'title-author',
        name: 'Título y Autor',
        description: 'Cabecera con título del libro y autor. Número en esquina exterior.',
        css: titleAuthorCss
    },
    {
        id: 'title-h1',
        name: 'Título y Capítulo',
        description: 'Cabecera con título del libro y capítulo actual (H1).',
        css: titleH1Css
    },
    {
        id: 'h1-h2',
        name: 'Capítulo y Sección',
        description: 'Para manuales: capítulo (H1) y sección (H2).',
        css: h1H2Css
    },
    {
        id: 'footer-only',
        name: 'Solo Pie',
        description: 'Sin cabecera. Número en esquina inferior.',
        css: footerOnlyCss
    }
];
