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
        - currentZoom: Zoom actual de la vista previa
      
      - EFECTOS ($effect):
        - Re-renderiza automáticamente cuando cambian documentHtml, css o iframeContainer
        - Sincroniza currentZoom con scale cuando scale cambia desde props
        - Usa AbortController para cancelar renders obsoletos cuando llega uno nuevo
     */

    import {
        generateFullDocument,
        renderInIframe,
    } from "$lib/converters/paged-renderer.js";
    import { ZoomIn, ZoomOut } from "lucide-svelte";

    let {
        documentHtml = "",
        css = "",
        scale = 1,
        isLoading = $bindable(false),
        error = $bindable(null),
    } = $props();

    let iframeContainer = $state(null);
    let iframe = null;
    let scrollPosition = 0;

    // Control de zoom
    let currentZoom = $state(1);
    const zoomStep = 0.1;
    const minZoom = 0.3;
    const maxZoom = 2;

    function getScrollElement() {
        const doc = iframe?.contentWindow?.document;
        return doc?.scrollingElement || doc?.documentElement || doc?.body || null;
    }

    function saveScrollPosition() {
        const el = getScrollElement();
        scrollPosition = el ? el.scrollTop : 0;
    }

    function restoreScrollPosition() {
        const el = getScrollElement();
        if (el) el.scrollTop = scrollPosition;
    }

    async function updatePreview(signal) {
        if (!iframeContainer) return;

        saveScrollPosition();

        isLoading = true;
        error = null;

        try {
            const fullHtml = generateFullDocument(documentHtml ?? "", css ?? "");
            const newIframe = await renderInIframe(fullHtml, iframeContainer);

            if (signal.aborted) return;

            iframe = newIframe;
            isLoading = false;

            if (scrollPosition > 0) {
                requestAnimationFrame(() => {
                    if (!signal.aborted) restoreScrollPosition();
                });
            }
        } catch (e) {
            if (signal.aborted) return;
            error = e?.message ?? String(e);
            isLoading = false;
        }
    }

    // Re-renderizar automáticamente cuando cambien las dependencias
    $effect(() => {
        if (!iframeContainer) return;
        if (documentHtml === null && !css) return;

        const controller = new AbortController();
        updatePreview(controller.signal);

        return () => controller.abort();
    });

    // Sincronizar zoom con scale externo (al cambiar formato)
    $effect(() => {
        currentZoom = scale;
    });

    function zoomIn() {
        currentZoom = Math.min(maxZoom, currentZoom + zoomStep);
    }

    function zoomOut() {
        currentZoom = Math.max(minZoom, currentZoom - zoomStep);
    }

    function resetZoom() {
        currentZoom = scale;
    }

    export async function print() {
        if (!iframe?.contentWindow) return;

        const { printIframe } = await import("$lib/converters/paged-renderer.js");
        iframe.contentWindow.focus();
        printIframe(iframe);
    }
</script>

<div class="preview-wrapper">
    <div class="preview-container" bind:this={iframeContainer} style="--preview-scale: {currentZoom}"></div>
    
    <div class="zoom-controls">
        <button class="zoom-btn" onclick={zoomOut} title="Reducir zoom" disabled={currentZoom <= minZoom}>
            <ZoomOut size={14} />
        </button>
        <button class="zoom-btn zoom-reset" onclick={resetZoom} title="Restablecer zoom">
            {Math.round(currentZoom * 100)}%
        </button>
        <button class="zoom-btn" onclick={zoomIn} title="Aumentar zoom" disabled={currentZoom >= maxZoom}>
            <ZoomIn size={14} />
        </button>
    </div>
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
        padding-left: 300px; /* ~280px panel + margins */
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

    .zoom-controls {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        display: flex;
        gap: 2px;
        background: var(--bg-surface);
        border: 1px solid var(--border-muted);
        border-radius: var(--radius);
        padding: 3px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }

    .zoom-controls:hover {
        opacity: 1;
    }

    .zoom-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 24px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: background 0.15s ease, color 0.15s ease;
    }

    .zoom-btn:hover:not(:disabled) {
        background: var(--bg-muted);
        color: var(--text);
    }

    .zoom-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .zoom-reset {
        width: auto;
        padding: 0 6px;
        font-size: 0.6875rem;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
    }
</style>
