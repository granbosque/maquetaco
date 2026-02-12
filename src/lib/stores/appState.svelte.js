// Estado global de la aplicación usando Svelte 5 runes
import { nullController } from "$lib/editor/EditorController.js";
import { extractHeadings } from "$lib/utils/markdown.js";

// Contenido inicial cargado desde archivo md, que sirve de presentación y guía
import defaultContent from '$lib/data/initialContent.md?raw';


class AppState {
    
    config = $state({
        // METADATOS (se gestionan desde ConfigPanel, se exportan como frontmatter yaml) 
        // (Se inicializan realmente en resetMetadataToDefaults para evitar duplicación)
        title: '',
        author: '',
        publisher: '',
        copyright: '',
        dedication: '',
        colophon: '',

        // opciones de configuración, que también se guardan en el frontmatter yaml
        // ¿sería buena idea que todo esto vaya dentro de una sección 'config' en el yaml?
        date: '',
        lang: 'es',
        includeBranding: true, // Mostrar "Maquetado con Maquetaco" al final
        toc: undefined,        // undefined = automático, true/false = manual
        tocDepth: 1,           // Nivel máximo de encabezados en TOC (1=solo H1, 2=H1+H2, etc.)
        imagePreview: '',      // Portada del documento (base64)

        // contenido del documento, mantenemos en memoria el markdown completo, 
        // aunque codemirror (el componente de editor que usamos) creo que mantiene su propia copia,
        // pero por ahora no he visto problemas de rendimiento con documentos grandes y así controlamos mejor la reactividad, sin depender de codemirror
        content: defaultContent,

        // otros:
        fileName: 'Ningún archivo cargado',
        
        // Metadatos completos del frontmatter (conserva campos personalizados no manejados por esta app)
        rawMetadata: {},
        
    });

    // Controller del editor (se registra desde EditorPanel cuando esté listo)
    // Está en appState para poder acceder a el desde cualquier sitio, como structurePanel
    editorController = $state(nullController);

    /* Estructura del documento (encabezados),
       cada item de toc es un objeto con las propiedades text, level, line y classes
       - Se calcula a partir de content
       - IMPORTANTE: se actualiza en App.svelte con $effect y un debounce de 300ms,
         se podría hacer aquí con un get pero entonces es más complicado hacer el debounce
    */ 
    toc = $state(extractHeadings(defaultContent)); // inicializa con el contenido por defecto

    constructor() {
        this.resetMetadataToDefaults();
        this.defaultContent = defaultContent;
        this.config.title = 'Introduction to Maquetaco';
                
    }

    /**
     * Restablece los metadatos de configuración a su estado inicial
     * (tal y como están definidos al arrancar la aplicación).
     * No toca el contenido ni la estructura (toc).
     */
    resetMetadataToDefaults() {
        // Campos de metadatos principales
        this.config.title = 'Título de la obra';
        this.config.author = 'Tu nombre aquí';
        this.config.publisher = '';
        this.config.copyright = '';
        this.config.dedication = '';
        this.config.colophon = '';

        // Opciones de configuración asociadas a metadatos
        this.config.date = new Date().getFullYear().toString();
        this.config.lang = 'es';
        this.config.includeBranding = true;
        this.config.toc = undefined;
        this.config.tocDepth = 1;
        this.config.imagePreview = '';

        // Metadatos crudos del frontmatter (campos personalizados)
        this.config.rawMetadata = {};
    }
}


export const appState = new AppState();
