<script>
    /*
      Visor de EPUB usando foliate-js

      Este componente se convertirá en un componente genérico independiente de este proyecto, que sea
      solo un interface simple para foliate-js.
      
      foliate-js muestra el epub y tiene una api de control simple,
      este componente añade:
      - barra de título y botones
      - navegación con botones y tácil
      - TOC que se muestra como popup
      - progreso de lectura y información de sección actual
      
      Reactividad:
      - Reacciona a cambios en `source` (File, Blob o URL string)
      - Usa $effect para cargar el EPUB cuando cambia el source
      - Estado local: navegación, progreso, TOC, estados de carga
     */

    import { onMount, tick } from "svelte";
    import { ChevronLeft, ChevronRight, Book, List } from "lucide-svelte";

    let {
        source, // File, Blob, or URL string
        title = "",
        initialLocation = null,
        className = ""
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
    let isLoading = $state(true);
    let isReady = $state(false);
    let currentSource = $state(null);
    let isLoadingEpub = $state(false);

    onMount(async () => {
        try {
            if (!customElements.get("foliate-view")) {
                await import("foliate-js/view.js");
            }
            isReady = true;
        } catch (e) {
            console.error("Failed to load foliate-js", e);
        }
        
        window.addEventListener("keydown", handleKeydown);
        return () => {
            window.removeEventListener("keydown", handleKeydown);
            if (view) {
                view.close?.();
            }
        };
    });

    $effect(() => {
        if (isReady && source && container && source !== currentSource && !isLoadingEpub) {
            currentSource = source;
            loadEpub(source);
        }
    });

    async function loadEpub(epubSource) {
        if (!container || !isReady || !epubSource || isLoadingEpub) {
            return;
        }

        if (!container.isConnected) {
            console.warn("Container not connected to DOM, waiting...");
            await tick();
            if (!container.isConnected) {
                console.error("Container still not connected after tick");
                return;
            }
        }

        try {
            isLoadingEpub = true;
            isLoading = true;
            await tick();

            if (!container) {
                console.error("Container is null after tick");
                return;
            }

            // Limpiar vista anterior
            if (view) {
                view.removeEventListener("relocate", handleRelocate);
                view.removeEventListener("load", handleLoad);
                try {
                    await view.close?.(); 
                } catch (e) {
                    console.warn("Error closing previous view", e);
                }
                view.remove();
                view = null;
            }
            
            if (container) {
                container.innerHTML = "";
            } else {
                console.error("Container is null before setting innerHTML");
                return;
            }

            // Crear y montar el visor foliate
            const newView = document.createElement("foliate-view");
            newView.style.width = "100%";
            newView.style.height = "100%";
            container.appendChild(newView);
            view = newView;

            view.addEventListener("relocate", handleRelocate);
            view.addEventListener("load", handleLoad);

            // Esperar a que el componente esté montado en el DOM
            await new Promise(r => setTimeout(r, 50));
            
            await view.open(epubSource);
            
            if (view.book) {
                totalSections = view.book.sections?.length ?? 0;
                toc = view.book.toc ?? [];
            }
            
            await view.init({
                defaultStyles: true
            });

            if (initialLocation) {
                 await view.goTo(initialLocation);
            } else {
                currentSection = 0;
                await view.goTo(0);
            }

            updateNavigationState();

        } catch (err) {
            console.error("Error viewing EPUB:", err);
            if (container) {
                container.innerHTML = "<div class='error-state'>Error al abrir el libro</div>";
            }
        } finally {
            isLoading = false;
            isLoadingEpub = false;
        }
    }

    function handleRelocate(e) {
        const { fraction, index } = e.detail;

        if (fraction !== undefined && fraction !== null) {
            progress = Math.round(fraction * 100);
        }

        if (typeof index === 'number') {
            currentSection = index;
            if (view?.book?.sections?.[index]) {
                const section = view.book.sections[index];
                sectionTitle = section.label || `Capítulo ${index + 1}`;
            }
        }

        updateNavigationState();
    }

    function handleLoad(e) {
        const { index } = e.detail;

        if (typeof index === 'number') {
            currentSection = index;
            if (view?.book?.sections?.[index]) {
                const section = view.book.sections[index];
                sectionTitle = section.label || `Capítulo ${index + 1}`;
            }
        }

        updateNavigationState();
    }

    function updateNavigationState() {
        if (!view) {
            canGoPrev = false;
            canGoNext = false;
            return;
        }

        canGoPrev = !(currentSection === 0 && progress <= 5);
        canGoNext = !(currentSection >= totalSections - 1 && progress >= 95);
    }

    function prevPage() {
        if (!view || !canGoPrev) return;

        try {
            if (progress <= 5 && currentSection > 0) {
                 view.goTo(currentSection - 1);
            } else {
                 view.prev();
            }
        } catch (err) {
            console.error("Error navegando hacia atrás:", err);
        }
    }

    function nextPage() {
        if (!view || !canGoNext) return;

        try {
            if (progress >= 95 && currentSection < totalSections - 1) {
                 view.goTo(currentSection + 1);
            } else {
                 view.next();
            }
        } catch (err) {
            console.error("Error navegando hacia adelante:", err);
        }
    }

     function goToStart() {
        if (!view) return;
        try {
             view.goTo({ index: 0 });
        } catch (err) {
            console.error("Error yendo al inicio:", err);
        }
    }

     function goToEnd() {
        if (!view || totalSections === 0) return;
        try {
             view.goTo({ index: totalSections - 1 });
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

<div class="epub-preview-wrapper {className}">
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
                {#if title}<span class="separator">·</span>{title}{/if}
            </span>
            
            <div class="progress-bar"><div class="fill" style="width: {progress}%"></div></div>
            <span class="progress-text">{progress}%</span>
        </div>
        
        <div class="epub-container" bind:this={container}>
            {#if isLoading}
                <div class="loading-overlay">
                    <Book size={48} class="loading-icon" />
                    <p>Cargando libro...</p>
                </div>
            {/if}
        </div>
        
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
    /* 
     * Variables CSS esperadas:
     * - --space-xs, --space-sm, --space-md, --space-lg
     * - --radius, --radius-lg
     * - --shadow
     * - --border, --border-muted
     * - --color-primary
     * - --text, --text-muted, --text-subtle
     * - --text-xs, --text-sm
     * - --weight-medium, --weight-semibold
     * - --bg-surface, --bg-muted
     * - --transition
     */

    .epub-preview-wrapper {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        /* Padding is handled by consumer or override via class */
        position: relative;
    }

    .epub-panel {
        width: 100%;
        max-width: 600px;
        height: 100%;
        max-height: 850px;
        display: flex;
        flex-direction: column;
        background: white;
        border-radius: var(--radius-lg, 12px);
        box-shadow: var(--shadow, 0 4px 6px -1px rgb(0 0 0 / 0.1));
        overflow: hidden;
        position: relative;
    }

    .top-bar {
        display: flex;
        align-items: center;
        gap: var(--space-sm, 8px);
        padding: var(--space-sm, 8px) var(--space-md, 16px);
        border-bottom: 1px solid var(--border-muted, #e5e7eb);
    }

    .toolbar-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--text, #374151);
        padding: 4px;
        border-radius: var(--radius, 4px);
    }
    .toolbar-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .toolbar-btn:hover:not(:disabled) { background: var(--bg-muted, #f3f4f6); }

    .section-info {
        flex: 1;
        font-size: var(--text-xs, 12px);
        font-weight: var(--weight-medium, 500);
        color: var(--text-muted, #6b7280);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .separator { opacity: 0.5; margin: 0 var(--space-xs, 4px); }

    .progress-bar {
        width: 50px;
        height: 3px;
        background: var(--border-muted, #e5e7eb);
        border-radius: 2px;
        overflow: hidden;
    }

    .progress-bar .fill {
        height: 100%;
        background: var(--color-primary, #3b82f6);
        transition: width var(--transition, 0.2s);
    }

    .progress-text {
        font-size: var(--text-xs, 12px);
        color: var(--text-subtle, #9ca3af);
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
        color: var(--text, #374151);
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
        gap: var(--space-lg, 24px);
        color: var(--text-muted, #6b7280);
    }

    :global(.loading-icon) { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }

    /* TOC */
    .toc-wrapper { position: relative; }
    
    .toc-popover {
        position: absolute;
        top: calc(100% + var(--space-xs, 4px));
        left: 0;
        width: 280px;
        max-height: 400px;
        overflow-y: auto;
        background: var(--bg-surface, white);
        border-radius: var(--radius, 8px);
        box-shadow: var(--shadow, 0 10px 15px -3px rgb(0 0 0 / 0.1));
        border: 1px solid var(--border, #e5e7eb);
        z-index: 100;
        animation: scale-in 0.15s ease;
    }

    .toc-header {
        padding: var(--space-sm, 8px) var(--space-md, 16px);
        font-size: var(--text-xs, 12px);
        font-weight: var(--weight-semibold, 600);
        color: var(--text-muted, #6b7280);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid var(--border-muted, #e5e7eb);
    }

    .toc-list, .toc-sublist {
        list-style: none;
        margin: 0;
        padding: var(--space-xs, 4px) 0;
    }

    .toc-sublist { padding-left: var(--space-md, 16px); }

    .toc-item {
        display: block;
        width: 100%;
        padding: var(--space-sm, 8px) var(--space-md, 16px);
        background: none;
        border: none;
        text-align: left;
        font-size: var(--text-sm, 14px);
        color: var(--text, #374151);
        cursor: pointer;
        transition: background var(--transition, 0.15s);
    }

    .toc-item:hover { background: var(--bg-muted, #f3f4f6); }
    .toc-item.sub { font-size: var(--text-xs, 12px); color: var(--text-muted, #6b7280); }

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
        .epub-panel { max-height: none; }
        .toc-popover { width: 240px; max-height: 300px; }
    }
</style>
