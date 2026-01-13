<script>
    import {
        generateFullDocument,
        renderInIframe,
    } from "$lib/converters/paged-renderer.js";
    import { onMount } from "svelte";
    import { ZoomIn, ZoomOut, RotateCcw } from "lucide-svelte";

    let {
        documentHtml = "",
        css = "",
        scale = 1,
        preserveScroll = true,
        isLoading = $bindable(false),
        error = $bindable(null),
    } = $props();

    let iframeContainer = $state(null);
    let iframe = null; // No reactivo - solo se usa internamente
    let currentZoom = $state(1);
    let baseScale = $derived(scale); // Scale base que viene de las props
    let renderTimeout = null;
    const zoomStep = 0.1;
    const minZoom = 0.3;
    const maxZoom = 2;

    onMount(() => renderDocument());

    $effect(() => {
        // Ejecutar cuando cambie el HTML, CSS o contenedor
        // Pequeño debounce para agrupar cambios rápidos (ej: fuente cambia CSS y regenera metadata)
        if (iframeContainer && (documentHtml || css)) {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(renderDocument, 50);
        }
    });

    // Actualizar zoom cuando cambia el scale de las props (cambio de formato)
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
        currentZoom = baseScale;
    }

    async function renderDocument() {
        if (!iframeContainer) return;

        // Guardar scroll del iframe actual antes de destruirlo
        let scrollPosition = 0;
        if (iframe?.contentWindow?.document) {
            const doc = iframe.contentWindow.document;
            scrollPosition = doc.documentElement.scrollTop || doc.body?.scrollTop || 0;
        }

        isLoading = true;
        error = null;
        try {
            const fullHtml = generateFullDocument(documentHtml, css);
            iframe = await renderInIframe(fullHtml, iframeContainer);
            isLoading = false;

            // Restaurar scroll en el nuevo iframe
            if (preserveScroll && scrollPosition > 0) {
                requestAnimationFrame(() => {
                    iframe?.contentWindow?.document?.documentElement &&
                        (iframe.contentWindow.document.documentElement.scrollTop = scrollPosition);
                });
            }
        } catch (e) {
            error = e.message;
            isLoading = false;
        }
    }

    export async function print() {
        if (iframe) {
            const { printIframe } = await import(
                "$lib/converters/paged-renderer.js"
            );
            printIframe(iframe);
        }
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
        zoom: var(--preview-scale, 1);
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
