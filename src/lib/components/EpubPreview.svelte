<script>
    import { onMount } from "svelte";
    import { createEpubBlob } from "$lib/converters/md-to-epub.js";
    import { ChevronLeft, ChevronRight, Book, List } from "lucide-svelte";

    let {
        documentHtml = "",
        css = "",
        bodyClass = "",
        metadata = {},
        isLoading = $bindable(false),
    } = $props();

    let container = $state(null);
    let view = $state(null);
    let progress = $state(0);
    let canGoPrev = $state(false);
    let canGoNext = $state(true);
    let currentSection = $state(0);
    let totalSections = $state(0);
    let sectionTitle = $state("");
    let toc = $state([]);
    let showToc = $state(false);

    onMount(async () => {
        // Registrar el custom element de foliate-js
        await import("foliate-js/view.js");
        
        // Atajos de teclado
        window.addEventListener("keydown", handleKeydown);
        return () => {
            window.removeEventListener("keydown", handleKeydown);
            if (view) {
                view.close?.();
            }
        };
    });

    $effect(() => {
        const _deps = [documentHtml, css, bodyClass, metadata];
        loadEpub();
    });

    async function loadEpub() {
        if (!container || !documentHtml) return;

        try {
            isLoading = true;

            // Generar el blob EPUB
            const blob = await createEpubBlob(
                metadata,
                documentHtml,
                metadata["cover-image"],
                css,
                bodyClass,
            );

            // Limpiar vista anterior si existe
            if (view) {
                view.removeEventListener("relocate", handleRelocate);
                view.removeEventListener("load", handleLoad);
                view.close?.();
                view.remove();
            }
            container.innerHTML = "";

            // Crear un File con extensión .epub
            const file = new File([blob], "preview.epub", {
                type: "application/epub+zip",
            });

            // Crear y montar el visor foliate
            view = document.createElement("foliate-view");
            view.style.width = "100%";
            view.style.height = "100%";
            container.appendChild(view);

            // Escuchar eventos de navegación
            view.addEventListener("relocate", handleRelocate);
            view.addEventListener("load", handleLoad);

            // Abrir el EPUB
            await view.open(file);
            
            // Obtener información del libro
            if (view.book) {
                totalSections = view.book.sections?.length ?? 0;
                toc = view.book.toc ?? [];
            }
            
            // Inicializar el visor
            await view.init({
                defaultStyles: true
            });

            // Inicializar sección actual
            currentSection = 0;

            // Actualizar estado inicial
            updateNavigationState();

        } catch (err) {
            console.error("Error previewing EPUB:", err);
        } finally {
            isLoading = false;
        }
    }

    function handleRelocate(e) {
        const { fraction, index } = e.detail;

        // Actualizar progreso
        if (fraction !== undefined && fraction !== null) {
            progress = Math.round(fraction * 100);
        }

        // Actualizar sección actual
        if (typeof index === 'number') {
            currentSection = index;

            // Obtener título de la sección desde el libro
            if (view?.book?.sections?.[index]) {
                const section = view.book.sections[index];
                sectionTitle = section.label || `Capítulo ${index + 1}`;
            }
        }

        // Actualizar estado de navegación
        updateNavigationState();
    }

    function handleLoad(e) {
        const { index } = e.detail;

        // Actualizar sección actual cuando se carga una nueva sección
        if (typeof index === 'number') {
            currentSection = index;

            // Obtener título de la sección desde el libro
            if (view?.book?.sections?.[index]) {
                const section = view.book.sections[index];
                sectionTitle = section.label || `Capítulo ${index + 1}`;
            }
        }

        // Actualizar estado de navegación
        updateNavigationState();
    }

    function updateNavigationState() {
        if (!view) {
            canGoPrev = false;
            canGoNext = false;
            return;
        }

        // Determinar si podemos navegar
        // No podemos retroceder si estamos al inicio
        canGoPrev = !(currentSection === 0 && progress <= 5);
        
        // No podemos avanzar si estamos al final
        canGoNext = !(currentSection >= totalSections - 1 && progress >= 95);
    }

    async function prevPage() {
        if (!view || !canGoPrev) return;

        try {
            // Si estamos cerca del inicio de la sección actual y hay una anterior, ir a la sección anterior
            if (progress <= 5 && currentSection > 0) {
                await view.goTo(currentSection - 1);
            } else {
                // Navegar dentro de la sección actual
                await view.prev();
            }
        } catch (err) {
            console.error("Error navegando hacia atrás:", err);
        }
    }

    async function nextPage() {
        if (!view || !canGoNext) return;

        try {
            // Si estamos cerca del final de la sección actual y hay una siguiente, ir a la siguiente sección
            if (progress >= 95 && currentSection < totalSections - 1) {
                await view.goTo(currentSection + 1);
            } else {
                // Navegar dentro de la sección actual
                await view.next();
            }
        } catch (err) {
            console.error("Error navegando hacia adelante:", err);
        }
    }

    async function goToStart() {
        if (!view) return;
        try {
            // Ir a la primera sección
            await view.goTo({ index: 0 });
        } catch (err) {
            console.error("Error yendo al inicio:", err);
        }
    }

    async function goToEnd() {
        if (!view || totalSections === 0) return;
        try {
            await view.goTo({ index: totalSections - 1 });
        } catch (err) {
            console.error("Error yendo al final:", err);
        }
    }

    async function goToTocItem(href) {
        if (!view || !href) return;
        try {
            await view.goTo(href);
            showToc = false;
        } catch (err) {
            console.error("Error navegando al TOC:", err);
        }
    }

    function toggleToc() {
        showToc = !showToc;
    }

    // Atajos de teclado
    function handleKeydown(e) {
        if (!view || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
            return;
        }
        
        switch(e.key) {
            case "ArrowLeft":
            case "PageUp":
                e.preventDefault();
                prevPage();
                break;
            case "ArrowRight":
            case "PageDown":
            case " ": // Espacio
                e.preventDefault();
                nextPage();
                break;
            case "Home":
                e.preventDefault();
                goToStart();
                break;
            case "End":
                e.preventDefault();
                goToEnd();
                break;
        }
    }
</script>

<div class="epub-preview-wrapper">
    <div class="epub-panel">
        <div class="top-bar">
            <div class="toc-wrapper">
                <button class="toolbar-btn icon-only" onclick={toggleToc} title="Tabla de contenidos" disabled={toc.length === 0}>
                    <List size={16} />
                </button>
                {#if showToc && toc.length > 0}
                    <div class="toc-popover">
                        <div class="toc-header">Contenidos</div>
                        <ul class="toc-list">
                            {#each toc as item}
                                <li>
                                    <button class="toc-item" onclick={() => goToTocItem(item.href)}>
                                        {item.label}
                                    </button>
                                    {#if item.subitems?.length || item.children?.length}
                                        <ul class="toc-sublist">
                                            {#each (item.subitems || item.children) as subitem}
                                                <li>
                                                    <button class="toc-item sub" onclick={() => goToTocItem(subitem.href)}>
                                                        {subitem.label}
                                                    </button>
                                                </li>
                                            {/each}
                                        </ul>
                                    {/if}
                                </li>
                            {/each}
                        </ul>
                    </div>
                {/if}
            </div>
            
            <span class="section-info">
                {currentSection + 1}/{totalSections}
                {#if sectionTitle}<span class="separator">·</span>{sectionTitle}{/if}
            </span>
            
            <div class="progress-bar"><div class="fill" style="width: {progress}%"></div></div>
            <span class="progress-text">{progress}%</span>
        </div>
        
        <div class="epub-container" bind:this={container}>
            {#if isLoading}
                <div class="loading-overlay">
                    <Book size={48} class="loading-icon" />
                    <p>Cargando vista previa...</p>
                </div>
            {/if}
        </div>
        
        <!-- Botones flotantes de navegación -->
        <button 
            class="nav-btn nav-btn-prev" 
            onclick={prevPage} 
            disabled={!canGoPrev} 
            title="← Página anterior"
            aria-label="Página anterior"
        >
            <ChevronLeft size={20} />
        </button>
        <button 
            class="nav-btn nav-btn-next" 
            onclick={nextPage} 
            disabled={!canGoNext} 
            title="→ Página siguiente"
            aria-label="Página siguiente"
        >
            <ChevronRight size={20} />
        </button>
    </div>
    
    {#if showToc}
        <button class="toc-backdrop" onclick={() => showToc = false}></button>
    {/if}
</div>

<style>
    .epub-preview-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-lg);
        padding-left: 17rem;
    }

    .epub-panel {
        width: 100%;
        max-width: 600px;
        height: 100%;
        max-height: 850px;
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
        overflow: hidden;
        position: relative;
    }

    .top-bar {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-bottom: 1px solid var(--border-muted);
    }

    .section-info {
        flex: 1;
        font-size: var(--text-xs);
        font-weight: var(--weight-medium);
        color: var(--text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .separator { opacity: 0.5; margin: 0 var(--space-xs); }

    .progress-bar {
        width: 50px;
        height: 3px;
        background: var(--border-muted);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-bar .fill {
        height: 100%;
        background: var(--color-primary);
        transition: width var(--transition);
    }

    .progress-text {
        font-size: var(--text-xs);
        color: var(--text-subtle);
        min-width: 2rem;
        text-align: right;
    }

    .epub-container {
        flex: 1;
        overflow: hidden;
        position: relative;
    }
    
    :global(.epub-container foliate-view) {
        display: block;
        width: 100%;
        height: 100%;
    }

    /* Botones flotantes de navegación */
    .nav-btn {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        z-index: 10;
        color: var(--text);
    }

    .nav-btn:hover:not(:disabled) {
        background: white;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
        transform: translateY(-50%) scale(1.08);
    }

    .nav-btn:active:not(:disabled) {
        transform: translateY(-50%) scale(0.95);
    }

    .nav-btn:disabled {
        opacity: 0.25;
        cursor: not-allowed;
    }

    .nav-btn-prev {
        left: 12px;
    }

    .nav-btn-next {
        right: 12px;
    }

    .loading-overlay {
        position: absolute;
        inset: 0;
        background: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--space-lg);
        color: var(--text-muted);
    }

    :global(.loading-icon) { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

    /* TOC */
    .toc-wrapper { position: relative; }
    
    .toc-popover {
        position: absolute;
        top: calc(100% + var(--space-xs));
        left: 0;
        width: 280px;
        max-height: 400px;
        overflow-y: auto;
        background: var(--bg-surface);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        border: 1px solid var(--border);
        z-index: 100;
        animation: scale-in 0.15s ease;
    }

    .toc-header {
        padding: var(--space-sm) var(--space-md);
        font-size: var(--text-xs);
        font-weight: var(--weight-semibold);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-muted);
    }

    .toc-list, .toc-sublist {
        list-style: none;
        margin: 0;
        padding: var(--space-xs) 0;
    }

    .toc-sublist { padding-left: var(--space-md); }

    .toc-item {
        display: block;
        width: 100%;
        padding: var(--space-sm) var(--space-md);
        background: none;
        border: none;
        text-align: left;
        font-size: var(--text-sm);
        color: var(--text);
        cursor: pointer;
        transition: background var(--transition);
    }

    .toc-item:hover { background: var(--bg-muted); }
    .toc-item.sub { font-size: var(--text-xs); color: var(--text-muted); }

    .toc-backdrop {
        position: fixed;
        inset: 0;
        background: transparent;
        border: none;
        cursor: default;
        z-index: 50;
    }

    @keyframes scale-in {
        from { opacity: 0; transform: scale(0.95) translateY(-4px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
    }

    @media (max-width: 768px) {
        .epub-preview-wrapper { padding-left: var(--space-lg); }
        .epub-panel { max-height: none; }
        .toc-popover { width: 240px; max-height: 300px; }
    }
</style>