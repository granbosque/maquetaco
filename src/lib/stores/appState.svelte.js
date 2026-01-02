// Estado global de la aplicación usando Svelte 5 runes
import { nullController } from "$lib/editor/EditorController.js";
import { extractHeadings } from "$lib/utils/markdown.js";

class AppState {
    // Datos persistentes del documento (lo que se guardaría en un JSON/YAML)
    config = $state({
        // === METADATOS (se gestionan desde ConfigPanel, se exportan como frontmatter) ===
        title: 'Introducción a Maquetaco',
        author: 'Tu nombre aquí',
        publisher: '',
        copyright: '',
        dedication: '',
        colophon: '',
        date: new Date().getFullYear().toString(),
        lang: 'es',
        includeBranding: true, // Mostrar "Maquetado con Maquetaco" al final
        fileName: 'Ningún archivo cargado',

        // === OTROS ===
        toc: [],
        imagePreview: '',  // Portada del documento (base64)

        content: defaultContent
    });

    // Controller del editor (se registra desde EditorPanel cuando esté listo)
    // TODO: Registrar el controller real cuando tengamos acceso al EditorView
    editorController = $state(nullController);

    constructor() {
        console.log("[AppState] Initializing...");
        console.log("[AppState] Default Content type:", typeof this.config.content);
        console.log("[AppState] Default Content length:", this.config.content?.length);

        // Inicializar TOC con el contenido por defecto
        this.config.toc = extractHeadings(this.config.content);
        console.log("[AppState] Initial TOC:", this.config.toc);
    }
}

// Contenido inicial cargado desde archivo md (gracias a Vite ?raw)
import defaultContent from '$lib/data/initialContent.md?raw';


export const appState = new AppState();
