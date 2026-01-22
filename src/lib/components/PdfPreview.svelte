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
     */

    import {
        generateFullDocument,
        renderInIframe,
        printIframe,
    } from "$lib/converters/paged-renderer.js";
    import { ZoomIn, ZoomOut } from "lucide-svelte";
    import { Toolbar } from "bits-ui";
    import baselineGridDebugCss from '$lib/export-themes/print/baseline-grid--debug.css?raw';

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

    // Control del grid de ayuda
    let showGrid = $state(false);

    // Constantes
    const PANEL_OFFSET = 300; // px para centrado visual

    // Helpers de scroll
    function getScrollElement() {
        const doc = iframe?.contentWindow?.document;
        return doc?.scrollingElement || doc?.documentElement || doc?.body || null;
    }

    function preserveScroll(callback) {
        const el = getScrollElement();
        const scrollTop = el?.scrollTop || 0;
        callback();
        requestAnimationFrame(() => {
            const newEl = getScrollElement();
            if (newEl) newEl.scrollTop = scrollTop;
        });
    }

    async function updatePreview(signal) {
        if (!iframeContainer || (!documentHtml && !css)) return;

        isLoading = true;
        error = null;

        try {
            // Siempre incluir el CSS de debug, pero condicionado a la clase show-baseline-grid
            const fullHtml = generateFullDocument(documentHtml ?? "", css ?? "", {
                baselineGridDebugCss
            });
            const newIframe = await renderInIframe(fullHtml, iframeContainer);

            if (signal.aborted) return;

            preserveScroll(() => {
                iframe = newIframe;
            });
            
            applyBaselineGrid(showGrid);
            isLoading = false;
        } catch (e) {
            if (signal.aborted) return;
            error = e?.message ?? String(e);
            isLoading = false;
        }
    }
    
    function applyBaselineGrid(enabled, maxAttempts = 10) {
        if (!iframe?.contentWindow) {
            return;
        }
        
        try {
            const doc = iframe.contentWindow.document;
            if (!doc || !doc.documentElement) {
                // Si el documento no está listo y aún tenemos intentos, reintentar
                if (maxAttempts > 0) {
                    requestAnimationFrame(() => applyBaselineGrid(enabled, maxAttempts - 1));
                }
                return;
            }
            
            const htmlElement = doc.documentElement;
            htmlElement?.classList.toggle('show-baseline-grid', enabled);
        } catch (e) {
            console.error('[applyBaselineGrid] error:', e);
        }
    }

    // Actualizar automáticamente cuando cambien las dependencias (sin incluir showGrid)
    $effect(() => {
        if (!iframeContainer) return;
        // No renderizar si no hay contenido ni CSS
        if ((!documentHtml || documentHtml === null) && !css) return;

        const controller = new AbortController();
        updatePreview(controller.signal);

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

    // Sincronizar zoom con scale externo (al cambiar formato)
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
        /* zoom funciona bien en Chrome/Edge pero no en Firefox
           Para compatibilidad cross-browser, usar zoom con fallback a transform: scale()
           Nota: Si se requiere que el zoom afecte también al área scrollable (comportamiento tipo zoom),
           mantener zoom. Si solo se necesita escala visual, usar transform: scale() con ajustes de contenedor */
        zoom: var(--preview-scale, 1);
        /* Fallback para Firefox (opcional, descomentar si se necesita soporte Firefox) */
        /* transform: scale(var(--preview-scale, 1)); */
        /* transform-origin: top center; */
    }
</style>
