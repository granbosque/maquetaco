/**
 * Configuración de formatos de exportación de documentos
 * Define los formatos disponibles para generar PDFs y eBooks.
 */

// Importar plantillas y estilos raw
// Importar plantillas y estilos raw
import pdfPrintTemplate from '$lib/export-themes/print/template.html?raw';
import printCss from '$lib/export-themes/print/theme.css?raw';
import pdfScreenTemplate from '$lib/export-themes/screen/template.html?raw';
import screenCss from '$lib/export-themes/screen/theme.css?raw';
import mobileCss from '$lib/export-themes/screen/mobile.css?raw';

export const exportFormats = [
    {
        id: 'default',
        type: 'pdf',
        name: 'PDF Impresión',
        description: 'Listo para imprimir o subir a KDP. Página en blanco al inicio, márgenes simétricos, encabezados y pies, capítulos comienzan en página derecha.',
        icon: 'Printer',
        buttonText: 'Imprimir / PDF',
        template: pdfPrintTemplate,
        css: printCss,
        nota: 'Al pulsar el botón Generar PDF se abrirá la ventana de impresión. Asegúrate de elegir "Guardar como PDF".'
    },
    {
        id: 'screen',
        type: 'pdf',
        name: 'PDF Pantalla',
        description: 'Para leer en pantalla. Incluye portada como primera página, márgenes simétricos, sin encabezado.',
        icon: 'Monitor',
        buttonText: 'Guardar PDF',
        template: pdfScreenTemplate,
        css: screenCss,
        nota: 'Al pulsar el botón Generar PDF se abrirá la ventana de impresión. Asegúrate de elegir "Guardar como PDF".'
    },
    {
        id: 'mobile',
        type: 'pdf',
        name: 'PDF Móvil',
        description: 'Optimizado para lectura en smartphones. Formato vertical, tipografía optimizada, márgenes reducidos.',
        icon: 'Smartphone',
        buttonText: 'Guardar PDF',
        template: pdfScreenTemplate,
        css: mobileCss,
        nota: 'Al pulsar el botón Generar PDF se abrirá la ventana de impresión. Asegúrate de elegir "Guardar como PDF".'
    },
    {
        id: 'epub',
        type: 'epub',
        name: 'EPUB',
        description: 'Formato estándar de eBook compatible con la mayoría de lectores electrónicos (Kindle, Kobo, Apple Books, etc.).',
        icon: 'BookOpen',
        buttonText: 'Guardar EPUB',
        template: null, // TODO: Implementar plantilla EPUB
        css: null,
        nota: 'Funcionalidad en desarrollo. Próximamente podrás exportar directamente a formato EPUB.'
    }
];
