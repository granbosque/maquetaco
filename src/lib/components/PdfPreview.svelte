<script>
    /*
      Componente de vista previa PDF con paginación usando Paged.js
      
      Para exportar a PDF:
      1. Se convierte el markdown a HTML, añadiendo el CSS correspondiente a las opciones 
         seleccionadas (tamaño de página, fuente, etc). Esa conversión se hace en ExportView.svelte
      
      2. Se genera el HTML final con Paged.js, que aplica los estilos de página (cabeceras, etc)
      
      3. Ese HTML final ya está paginado y listo para guardar como PDF.
         No hay forma de convertir directamente a PDF sin errores (Chrome headless u otras 
         herramientas tienen problemas como la división por sílabas), así que se hace 
         indirectamente a través de la ventana de impresión.
      
      El HTML final se muestra en un iframe para así usar la ventana de impresión únicamente 
      con ese iframe.
     
      ---
     
      Reactividad:
      
      - PROPS ($props):
        - documentHtml: HTML del cuerpo del documento (markdown convertido a HTML con template)
        - css: CSS completo para la maquetación
        - scale: Escala inicial del zoom según el formato
        - isLoading/error ($bindable): Estado compartido con el componente padre
      
      - ESTADO ($state):
        - iframeContainer: Referencia al contenedor DOM
        - iframe: Referencia al iframe renderizado
        - currentZoom: Zoom actual de la vista previa
        - showGrid: Estado de visibilidad de la rejilla de ayuda
      
      - EFECTOS ($effect):
        - Re-renderiza automáticamente cuando cambian documentHtml, css o iframeContainer
        - Aplica la rejilla de ayuda cuando cambia showGrid o el iframe
        - Sincroniza currentZoom con scale cuando scale cambia desde props
        - Usa AbortController para cancelar renders obsoletos cuando llega uno nuevo
        - Usa untrack para evitar bucles infinitos en el renderizado
     */

    import {
        generateFullDocument,
        renderInIframe,
        printIframe,
    } from "$lib/converters/paged-renderer.js";
    import { ZoomIn, ZoomOut } from "lucide-svelte";
    import { Toolbar } from "bits-ui";
    import baselineGridDebugCss from '$lib/export-themes/print/baseline-grid--debug.css?raw';
    import { untrack } from 'svelte';

    let {
        documentHtml = "",
        css = "",
        scale = 1,
        showGridToggle = false,
        isLoading = $bindable(false),
        error = $bindable(null),
    } = $props();

    let iframeContainer = $state(null);
    let iframe = $state(null);

    // Control de zoom
    let currentZoom = $state(1);
    const ZOOM_STEP = 0.1;
    const MIN_ZOOM = 0.3;
    const MAX_ZOOM = 2;

    // grid que indica las lineas de texto para que se pueda ver a simple vista la alineación y justificado
    let showGrid = $state(false);

    // Constantes para eliminar
    const PANEL_OFFSET = 300; // px para centrado visual

    function getScrollElement() {
        const doc = iframe?.contentWindow?.document;
        return doc?.scrollingElement || doc?.documentElement || doc?.body || null;
    }

    // Espera a que el contenido del iframe esté listo para interactuar
    async function waitForIframeReady(iframe, timeout = 1000) {
        const start = performance.now();
        
        while (performance.now() - start < timeout) {
            const doc = iframe?.contentWindow?.document;
            const scrollElement = doc?.scrollingElement || doc?.documentElement;
            
            // Verificar que el documento esté listo y tenga contenido (scrollHeight > 0)
            if (scrollElement && doc?.readyState === 'complete' && scrollElement.scrollHeight > 0) {
                return;
            }
            
            // Esperar al siguiente frame para no bloquear el hilo principal
            await new Promise(resolve => requestAnimationFrame(resolve));
        }
    }

    async function updatePreview(signal) {
        if (!iframeContainer || (!documentHtml && !css)) return;

        isLoading = true;
        error = null;

        // Guardar scroll del iframe anterior 
        const oldScrollTop = getScrollElement()?.scrollTop || 0;

        try {
            // Siempre incluye el CSS de debug, pero condicionado a la clase show-baseline-grid
            const fullHtml = generateFullDocument(documentHtml ?? "", css ?? "", {
                baselineGridDebugCss
            });
            const newIframe = await renderInIframe(fullHtml, iframeContainer);

            if (signal.aborted) return;

            // Creamos un nuevo iframe, no es que se sustituya el contenido
            iframe = newIframe;
            
            // Esperar a que el contenido esté renderizado y restaurar scroll
            await waitForIframeReady(newIframe);
            if (signal.aborted) return;
            
            const scrollElement = getScrollElement();
            if (scrollElement) {
                scrollElement.scrollTop = oldScrollTop;
            }
            
            applyBaselineGrid(showGrid);
            isLoading = false;
        } catch (e) {
            if (signal.aborted) return;
            error = e?.message ?? String(e);
            isLoading = false;
        }
    }
    
    function applyBaselineGrid(enabled) {
        const doc = iframe?.contentWindow?.document;
        const htmlElement = doc?.documentElement;
        
        if (htmlElement) {
            htmlElement.classList.toggle('show-baseline-grid', enabled);
        }
    }
    

    // Actualizar automáticamente cuando cambien las dependencias (sin incluir showGrid ni iframe)
    $effect(() => {
        // para forzar effect con estas variables
        const html = documentHtml;
        const style = css;
        const container = iframeContainer;

        if (!container) return;
        // No renderizar si no hay contenido ni CSS
        if ((!html || html === null) && !style) return;

        const controller = new AbortController();
        
        //  untrack para evitar que cambios internos reinicien el efecto 
        // pendiente simplificar esto
        untrack(() => {
            updatePreview(controller.signal);
        });

        return () => controller.abort();
    });
    
    // Actualizar la clase del iframe cuando cambie showGrid (sin re-renderizar)
    $effect(() => {
        const currentIframe = iframe;
        const currentShowGrid = showGrid;
        
        if (currentIframe) {
            requestAnimationFrame(() => {
                if (iframe === currentIframe) {
                    applyBaselineGrid(currentShowGrid);
                }
            });
        }
    });

    $effect(() => {
        currentZoom = scale;
    });

    // ocultar el grid cuando no estamos en una plantilla que permita activarlo (cuando no se muestra el botón)
    $effect(() => {
        if (!showGridToggle && showGrid) {
            showGrid = false;
        }
    });

    function zoomIn() {
        currentZoom = Math.min(MAX_ZOOM, currentZoom + ZOOM_STEP);
    }

    function zoomOut() {
        currentZoom = Math.max(MIN_ZOOM, currentZoom - ZOOM_STEP);
    }

    function resetZoom() {
        currentZoom = scale;
    }

    export function print() {
        if (!iframe?.contentWindow) return;
        iframe.contentWindow.focus();
        printIframe(iframe);
    }
</script>

<div class="preview-wrapper">
    <div 
        class="preview-container" 
        bind:this={iframeContainer} 
        style:--preview-scale={currentZoom}
        style:--panel-offset="{PANEL_OFFSET}px"
    ></div>
    
    <Toolbar.Root class="floating-toolbar">
        {#if showGridToggle}
            <Toolbar.Button
                class="toolbar-btn {showGrid ? 'active' : ''}"
                onclick={() => showGrid = !showGrid}
                title={showGrid 
                    ? "Ocultar rejilla de ayuda" 
                    : "Mostrar rejilla de ayuda"}
            >
                {showGrid ? "Ocultar rejilla" : "Mostrar rejilla"}
            </Toolbar.Button>
            
            <div class="toolbar-separator"></div>
        {/if}
        
        <Toolbar.Button
            class="toolbar-btn icon-only"
            onclick={zoomOut}
            title="Reducir zoom"
            disabled={currentZoom <= MIN_ZOOM}
        >
            <ZoomOut size={14} />
        </Toolbar.Button>
        
        <Toolbar.Button
            class="toolbar-btn"
            onclick={resetZoom}
            title="Restablecer zoom"
        >
            {Math.round(currentZoom * 100)}%
        </Toolbar.Button>
        
        <Toolbar.Button
            class="toolbar-btn icon-only"
            onclick={zoomIn}
            title="Aumentar zoom"
            disabled={currentZoom >= MAX_ZOOM}
        >
            <ZoomIn size={14} />
        </Toolbar.Button>
    </Toolbar.Root>
</div>

<style>
    .preview-wrapper {
        flex: 1;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .preview-container {
        flex: 1;
        position: relative;
        background: var(--bg-app);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        overflow: auto;
        /* Offset para compensar el panel flotante y centrar visualmente */
        padding-left: var(--panel-offset, 300px);
    }

    .preview-container :global(iframe) {
        /* zoom funciona bien en Chrome/Edge pero no en Firefox, pendiente buscar fallback */
        zoom: var(--preview-scale, 1);
    }
</style>
