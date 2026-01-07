<script>
    import {
        generateFullDocument,
        renderInIframe,
    } from "$lib/converters/paged-renderer.js";
    import { onMount } from "svelte";

    let {
        documentHtml = "",
        css = "",
        scale = 1,
        preserveScroll = true,
        isLoading = $bindable(false),
        error = $bindable(null),
    } = $props();

    let iframeContainer = $state(null);
    let iframe = $state(null);

    onMount(() => renderDocument());

    $effect(() => {
        if (documentHtml && iframeContainer) renderDocument();
    });

    async function renderDocument() {
        if (!iframeContainer) return;

        // Guardar posición de scroll antes de regenerar
        const scrollPosition = iframeContainer.scrollTop;

        isLoading = true;
        error = null;
        try {
            // Simular delay de 5 segundos para probar UI
            // await new Promise((resolve) => setTimeout(resolve, 5000));

            const fullHtml = generateFullDocument(documentHtml, css);
            iframe = await renderInIframe(fullHtml, iframeContainer);
            isLoading = false;

            // Restaurar posición de scroll después de renderizar (solo si preserveScroll)
            requestAnimationFrame(() => {
                if (iframeContainer && preserveScroll) {
                    iframeContainer.scrollTop = scrollPosition;
                }
            });
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

<div class="preview-container" bind:this={iframeContainer} style="--preview-scale: {scale}"></div>

<style>
    .preview-container {
        flex: 1;
        position: relative;
        background: var(--bg-app);
        display: flex;
        align-items: flex-start;
        justify-content: center;
        overflow: auto;
        padding: 1rem;
    }

    .preview-container :global(iframe) {
        zoom: var(--preview-scale, 1);
    }
</style>
