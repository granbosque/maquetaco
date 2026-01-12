<script>
    import {
        BookOpen,
        ChevronLeft,
        ChevronRight,
        List,
        X,
    } from "lucide-svelte";
    import { fade, slide } from "svelte/transition";
    import ePub from "epubjs";
    import { createEpubBlob } from "$lib/converters/md-to-epub.js";

    let {
        documentHtml = "",
        css = "",
        metadata = {},
        isLoading = $bindable(false),
    } = $props();

    let previewContainer = $state(null);
    let book = $state(null);
    let rendition = $state(null);

    // Estado de navegación y UI
    let toc = $state([]);
    let showToc = $state(false);
    let currentChapterLabel = $state("");
    let progress = $state(0);
    let hasNext = $state(false);
    let hasPrev = $state(false);

    $effect(() => {
        const _deps = [documentHtml, css, metadata];
        loadEpubPreview();
    });

    async function loadEpubPreview() {
        if (!previewContainer || !documentHtml) return;

        try {
            isLoading = true;
            // Reset states
            toc = [];
            currentChapterLabel = "";
            progress = 0;

            const blob = await createEpubBlob(
                metadata,
                documentHtml,
                metadata["cover-image"],
                css,
            );

            if (book) book.destroy();
            previewContainer.innerHTML = "";

            const arrayBuffer = await blob.arrayBuffer();
            book = ePub(arrayBuffer);

            rendition = book.renderTo(previewContainer, {
                width: "100%",
                height: "100%",
                flow: "paginated",
                manager: "default",
                allowScriptedContent: true,
            });

            await rendition.display();

            // Cargar TOC
            const navigation = await book.loaded.navigation;
            toc = navigation.toc;

            // Generar localizaciones para barra de progreso (async)
            // Dividimos por 1000 chars para no bloquear
            book.ready.then(() => book.locations.generate(1000));

            rendition.on("relocated", (location) => {
                hasNext = !location.atEnd;
                hasPrev = !location.atStart;

                // Calcular progreso
                if (book.locations.length() > 0) {
                    // location.start.cfi es el identificador de posición
                    const percentage = book.locations.percentageFromCfi(
                        location.start.cfi,
                    );
                    progress = Math.round(percentage * 100);
                }

                // Obtener nombre del capítulo actual
                const chapter = toc.find((item) =>
                    location.start.href.includes(item.href),
                );
                if (chapter) {
                    currentChapterLabel = chapter.label.trim();
                } else if (location.atStart) {
                    currentChapterLabel = "Portada";
                }
            });

            const keyListener = (e) => {
                if (e.key === "ArrowLeft") prevPage();
                if (e.key === "ArrowRight") nextPage();
            };
            rendition.on("keyup", keyListener);
        } catch (err) {
            console.error("Error previewing EPUB:", err);
        } finally {
            isLoading = false;
        }
    }

    function prevPage() {
        if (rendition) rendition.prev();
    }

    function nextPage() {
        if (rendition) rendition.next();
    }

    function goToChapter(href) {
        if (rendition) {
            rendition.display(href);
            showToc = false;
        }
    }

    $effect(() => {
        return () => {
            if (book) book.destroy();
        };
    });
</script>

<div class="epub-preview-wrapper">
    <div class="epub-device">
        <!-- Header: Título y Menú -->
        <div class="device-header">
            <button
                class="icon-btn"
                onclick={() => (showToc = !showToc)}
                aria-label="Índice"
            >
                <List size={18} />
            </button>
            <span class="chapter-title"
                >{currentChapterLabel || metadata.title || "Libro"}</span
            >
            <div style="width: 24px;"></div>
            <!-- Spacer -->
        </div>

        <div class="screen-container">
            <!-- TOC Drawer -->
            {#if showToc}
                <div
                    class="toc-drawer"
                    transition:slide={{ axis: "x", duration: 200 }}
                >
                    <div class="toc-header">
                        <h3>Índice</h3>
                        <button
                            class="icon-btn"
                            onclick={() => (showToc = false)}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <ul class="toc-list">
                        {#each toc as item}
                            <li>
                                <button
                                    class="toc-item"
                                    onclick={() => goToChapter(item.href)}
                                >
                                    {item.label}
                                </button>
                            </li>
                        {/each}
                        {#if toc.length === 0}
                            <li class="empty-toc">Sin índice</li>
                        {/if}
                    </ul>
                </div>
                <!-- Overlay para cerrar al hacer click fuera -->
                <div
                    class="toc-overlay"
                    onclick={() => (showToc = false)}
                    transition:fade={{ duration: 150 }}
                    aria-hidden="true"
                ></div>
            {/if}

            <div class="screen" bind:this={previewContainer}></div>
        </div>

        <!-- Footer: Progreso -->
        <div class="device-footer">
            <span class="progress-text">{progress}% leído</span>
            <div class="progress-bar">
                <div class="progress-fill" style="width: {progress}%"></div>
            </div>
        </div>

        <!-- Controles Flotantes (ahora más sutiles) -->
        <div class="controls-overlay">
            <button
                class="nav-zone prev"
                onclick={prevPage}
                disabled={!hasPrev}
                aria-label="Anterior"
            >
                <div class="nav-indicator"><ChevronLeft size={24} /></div>
            </button>
            <button
                class="nav-zone next"
                onclick={nextPage}
                disabled={!hasNext}
                aria-label="Siguiente"
            >
                <div class="nav-indicator"><ChevronRight size={24} /></div>
            </button>
        </div>
    </div>

    <p class="preview-warning">
        Nota: Esta vista previa es aproximada. Verifica el EPUB en un lector
        real.
    </p>
</div>

<style>
    .epub-preview-wrapper {
        flex: 1;
        width: 100%;
        height: 100%;
        background: var(--bg-app);
        display: flex;
        flex-direction: column; /* Stack device and warning */
        justify-content: center;
        align-items: center;
        overflow: hidden;
        /* Padding layout:
           - left: 17rem (16rem sidebar + 1rem gap)
           - others: 1rem (reduced vertical space)
        */
        padding: 0.5rem;
        padding-left: 17rem;
        box-sizing: border-box;
    }

    .epub-device {
        position: relative;
        width: 100%;
        max-width: 600px;
        /* Increased max-height from 90% to allow more vertical space */
        max-height: 98%;
        aspect-ratio: 3/4;
        background: white;
        border-radius: var(--radius-lg, 8px);
        box-shadow: var(--shadow);
        overflow: hidden;
        margin: 0; /* Reset margins */
        display: flex;
        flex-direction: column;
    }

    /* Responsiveness for smaller screens */
    @media (max-width: 768px) {
        .epub-preview-wrapper {
            padding-left: 1rem; /* Remove sidebar clearing on small screens */
        }
    }

    /* Header */
    .device-header {
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 0.5rem;
        border-bottom: 1px solid var(--border);
        background: #f9f9f9;
        font-size: 0.75rem;
        color: var(--text-muted);
        z-index: 10;
        flex-shrink: 0;
    }

    .chapter-title {
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 60%;
    }

    .icon-btn {
        background: transparent;
        border: none;
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        color: inherit;
        display: flex;
        align-items: center;
    }

    .icon-btn:hover {
        background: rgba(0, 0, 0, 0.05);
    }

    /* Screen Area */
    .screen-container {
        flex: 1;
        position: relative;
        overflow: hidden;
    }

    .screen {
        width: 100%;
        height: 100%;
    }

    /* TOC Drawer */
    .toc-drawer {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 200px; /* Ancho fijo simple */
        background: white;
        border-right: 1px solid var(--border);
        z-index: 20;
        display: flex;
        flex-direction: column;
    }

    .toc-header {
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .toc-header h3 {
        margin: 0;
        font-size: 0.875rem;
        font-weight: 600;
    }

    .toc-list {
        list-style: none;
        padding: 0;
        margin: 0;
        overflow-y: auto;
        flex: 1;
    }

    .toc-item {
        display: block;
        width: 100%;
        text-align: left;
        padding: 0.75rem 1rem;
        border: none;
        background: transparent;
        font-size: 0.8125rem;
        color: var(--text-color);
        cursor: pointer;
        border-bottom: 1px solid var(--bg-muted);
    }

    .toc-item:hover {
        background: var(--bg-muted);
    }

    .empty-toc {
        padding: 1rem;
        color: var(--text-subtle);
        font-size: 0.8rem;
        text-align: center;
    }

    .toc-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.2);
        z-index: 15;
    }

    /* Footer */
    .device-footer {
        height: 24px;
        background: #f9f9f9;
        border-top: 1px solid var(--border);
        display: flex;
        align-items: center;
        padding: 0 1rem;
        gap: 0.5rem;
        font-size: 0.7rem;
        color: var(--text-subtle);
        flex-shrink: 0;
    }

    .progress-bar {
        flex: 1;
        height: 3px;
        background: var(--border);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-fill {
        height: 100%;
        background: var(--color-primary);
        transition: width 0.3s ease;
    }

    .progress-text {
        min-width: 3ch;
    }

    /* Controls Overlay */
    .controls-overlay {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        pointer-events: none;
    }

    .nav-zone {
        flex: 1;
        background: transparent;
        border: none;
        pointer-events: auto;
        display: flex;
        align-items: center;
        opacity: 0;
        transition: opacity 0.2s;
        cursor: pointer;
        /* No interferir con clicks en el centro */
        max-width: 15%;
    }

    /* Espacio crentral libre para tocar elementos interactivos del libro */
    .controls-overlay::before {
        content: "";
        flex: 1;
        pointer-events: none;
    }

    .nav-zone.prev {
        justify-content: flex-start;
        padding-left: 10px;
        order: -1;
    }
    .nav-zone.next {
        justify-content: flex-end;
        padding-right: 10px;
    }

    .nav-zone:hover:not(:disabled) {
        opacity: 1;
    }

    .nav-indicator {
        background: rgba(0, 0, 0, 0.5);
        color: white;
        padding: 8px;
        border-radius: 50%;
        display: flex;
    }

    .preview-warning {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin-top: 1rem;
        text-align: center;
        opacity: 0.8;
    }
</style>
