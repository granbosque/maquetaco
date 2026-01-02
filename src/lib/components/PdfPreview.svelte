<script>
    import {
        generateFullDocument,
        renderInIframe,
    } from "$lib/converters/paged-renderer.js";
    import { onMount } from "svelte";

    let {
        documentHtml = "",
        css = "",
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

            // Restaurar posición de scroll después de renderizar
            // Usar requestAnimationFrame para asegurar que el contenido se haya renderizado
            requestAnimationFrame(() => {
                if (iframeContainer) {
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

<div class="preview-container" bind:this={iframeContainer}></div>

<style>
    .preview-container {
        flex: 1;
        position: relative;
        background: var(--bg-app);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: auto;
    }
</style>
