<script>
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import Toolbar from "$lib/components/Toolbar.svelte";
    import StatusBar from "$lib/components/StatusBar.svelte";
    import EditorView from "$lib/components/EditorView.svelte";
    import PreviewView from "$lib/components/PreviewView.svelte";
    import ExportView from "$lib/components/ExportView.svelte";
    import DragOverlay from "$lib/components/DragOverlay.svelte";
    import logo from "$lib/assets/logo.svg";
    import { appState } from "$lib/stores/appState.svelte.js";
    import { extractHeadings } from "$lib/utils/markdown.js";
    import { resizeImage } from "$lib/utils/image-processing.js";
    import { docxToMarkdown } from "$lib/converters/docx-to-md.js";
    import { parseFrontmatter } from "$lib/utils/frontmatter.js";
    import { saveDocument } from "$lib/utils/save-document.js";
    import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
    import WelcomeModal from "$lib/components/WelcomeModal.svelte";
    import CompatibilityToast from "$lib/components/CompatibilityToast.svelte";
    import { onMount } from "svelte";
    import { leadingDebounce } from "$lib/utils/timing.js";

    // Trigger HMR
    // Vista activa: 'editor' | 'preview' | 'export'
    let activeView = $state("editor");

    let isDragging = $state(false);
    let dragCounter = 0;
    let fileInput;
    let isConfirmDialogOpen = $state(false);
    let isWelcomeModalOpen = $state(false);

    onMount(() => {
        const seen = localStorage.getItem("maquetaco_welcome_seen");
        if (!seen) {
            isWelcomeModalOpen = true;
        }
    });

    // Actualiza appState.toc cuando cambia el contenido (debounce 300ms con ejecución inmediata al inicio).
    // (está aquí y no en appstate.svelte.js para que esté montado siempre)
    const updateTOCOnContentChange = leadingDebounce((content) => {
        appState.toc = extractHeadings(content);
    }, 300);

    $effect(() => {
        updateTOCOnContentChange(appState.config.content);
    });

    // Recalcula isDirty cuando cambia el contenido o metadatos
    $effect(() => {
        const cfg = appState.config;
        // Accedemos explícitamente a los campos que afecta (pero creo que con svelte 5 se puede hacer de alguna manera mejor)
        void cfg.content;
        void cfg.rawMetadata;
        void cfg.title;
        void cfg.author;
        void cfg.publisher;
        void cfg.copyright;
        void cfg.dedication;
        void cfg.colophon;
        void cfg.date;
        void cfg.lang;
        void cfg.toc;
        void cfg.tocDepth;
        void cfg.imagePreview;
        appState.updateDirtyFlag();
    });

    function handleViewChange(view) {
        activeView = view;
    }

    function handleImport() {
        fileInput.click();
    }

    function handleClear() {
        isConfirmDialogOpen = true;
    }

    function executeClear() {
        // Contenido
        appState.config.content = "";
        appState.config.fileName = "Ningún archivo cargado";
        appState.config.sourcePath = null;
        appState.config.sourceType = "none";

        // Metadatos: volver a estado inicial
        appState.resetMetadataToDefaults();

        appState.markClean();
    }

    /**
     * Cuenta los encabezados h1 en el contenido markdown y activa TOC si hay más de 2
     * @param {string} content - Contenido markdown
     */
    function updateTOCFromContent(content) {
        // Contar líneas que empiezan con exactamente un # (h1)
        const h1Regex = /^# [^#]/gm;
        const matches = content.match(h1Regex);
        const h1Count = matches ? matches.length : 0;

        // Activar TOC automáticamente si hay más de 2 capítulos
        appState.config.toc = h1Count > 2;
    }

    function handleFileInput(event) {
        const file = event.target.files[0];
        if (file) {
            processFile(file);
        }
        // Limpiar el input para permitir seleccionar el mismo archivo de nuevo
        event.target.value = "";
    }

    function handleDragEnter(event) {
        event.preventDefault();
        dragCounter++;
        isDragging = true;
    }

    function handleDragLeave(event) {
        event.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            isDragging = false;
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
    }

    function handleDrop(event) {
        event.preventDefault();
        isDragging = false;
        dragCounter = 0;

        const files = event.dataTransfer?.files;
        if (files && files.length > 0) {
            const file = files[0];
            processFile(file);
        }
    }

    async function processFile(file) {
        if (file.type.startsWith("image/")) {
            try {
                appState.config.imagePreview = await resizeImage(file);
            } catch (e) {
                console.error("Error procesando imagen:", e);
            }
        } else if (file.name.endsWith(".docx")) {
            try {
                const { content, metadata, warnings } =
                    await docxToMarkdown(file);

                // Poblar metadatos en appState.config
                if (metadata.title) appState.config.title = metadata.title;
                if (metadata.author) appState.config.author = metadata.author;

                appState.config.rawMetadata = metadata;

                // Log warnings to console only (not embedded in document)
                if (warnings && warnings.length > 0) {
                    console.log("⚠️ Importación DOCX:", warnings);
                }

                appState.config.content = content;
                appState.config.fileName = file.name;

                // DOCX se trata como “origen de importación” (no se sobreescribe el binario)
                appState.config.sourceType = "docx";
                appState.config.sourcePath = null;

                // Actualizar TOC automáticamente según número de capítulos
                updateTOCFromContent(content);

                // Documento recién importado: estado limpio
                appState.markClean();
            } catch (e) {
                console.error("Error procesando DOCX:", e);
                appState.config.fileName = `Error: ${file.name}`;
            }
        } else if (
            file.type === "text/plain" ||
            file.name.endsWith(".md") ||
            file.name.endsWith(".txt")
        ) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const fullText = e.target?.result || "";

                // Parsear frontmatter si existe
                const { metadata, content } = parseFrontmatter(fullText);

                // Guardar TODOS los metadatos (preserva campos personalizados)
                appState.config.rawMetadata = metadata;

                // Poblar campos conocidos en appState.config
                if (metadata.title) appState.config.title = metadata.title;
                if (metadata.subtitle)
                    appState.config.subtitle = metadata.subtitle;
                if (metadata.author) appState.config.author = metadata.author;
                if (metadata.publisher)
                    appState.config.publisher = metadata.publisher;
                if (metadata.isbn) appState.config.isbn = metadata.isbn;
                if (metadata.copyright)
                    appState.config.copyright = metadata.copyright;
                if (metadata.date) appState.config.date = String(metadata.date);
                if (metadata.lang) appState.config.lang = metadata.lang;
                if (metadata.dedication)
                    appState.config.dedication = metadata.dedication;
                if (metadata.colophon)
                    appState.config.colophon = metadata.colophon;
                if (metadata.toc !== undefined)
                    appState.config.toc = metadata.toc;
                if (metadata.tocDepth !== undefined)
                    appState.config.tocDepth = metadata.tocDepth;

                // Guardar solo el contenido (sin frontmatter)
                appState.config.content = content;
                appState.config.fileName = file.name;

                // Para .md / .txt guardamos el origen pensando en guardado directo futuro
                if (file.name.endsWith(".md")) {
                    appState.config.sourceType = "md";
                } else if (file.name.endsWith(".txt")) {
                    appState.config.sourceType = "txt";
                } else {
                    appState.config.sourceType = "none";
                }
                // En entorno web solo conocemos el nombre, no la ruta absoluta
                appState.config.sourcePath = file.name;
                debugger;

                // Actualizar TOC automáticamente según número de capítulos (solo si no estaba definido en frontmatter)
                if (metadata.toc === undefined) {
                    updateTOCFromContent(content);
                }

                // Documento de texto recién importado: estado limpio
                appState.markClean();
            };
            reader.readAsText(file);
        } else {
            console.log("Tipo de archivo no soportado:", file.type);
        }
    }

    async function handleSave() {
        await saveDocument(appState.config);
        appState.markClean();
    }
</script>

<svelte:window
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondragover={handleDragOver}
    ondrop={handleDrop}
/>

<div class="app">
    <input
        bind:this={fileInput}
        type="file"
        accept=".md,.txt,.docx,image/*"
        style="display: none;"
        onchange={handleFileInput}
    />
    <header>
        <Toolbar
            {activeView}
            onViewChange={handleViewChange}
            onInfo={() => (isWelcomeModalOpen = true)}
        />
    </header>

    <main class="main-content">
        {#key activeView}
            <div
                class="view-container"
                in:fly={{
                    y: 10,
                    duration: 300,
                    easing: cubicOut,
                    opacity: 0,
                }}
                out:fly={{
                    y: -10,
                    duration: 200,
                    easing: cubicOut,
                    opacity: 0,
                }}
            >
                {#if activeView === "editor"}
                    <EditorView
                        onImport={handleImport}
                        onSave={handleSave}
                        onClear={handleClear}
                    />
                {:else if activeView === "preview"}
                    <PreviewView />
                {:else if activeView === "export"}
                    <ExportView />
                {/if}
            </div>
        {/key}
    </main>

    <StatusBar />

    {#if isDragging}
        <DragOverlay />
    {/if}

    <ConfirmDialog
        bind:open={isConfirmDialogOpen}
        title="¿Borrar todo?"
        description="Esta acción eliminará todo el contenido actual del editor. Esta acción no se puede deshacer."
        confirmText="Borrar todo"
        onConfirm={executeClear}
    />

    <WelcomeModal bind:open={isWelcomeModalOpen} />

    <CompatibilityToast />
</div>

<style>
    .app {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
        position: relative;
    }

    header {
        flex-shrink: 0;
    }

    .main-content {
        flex: 1;
        position: relative;
    }

    .view-container {
        position: absolute;
        inset: 0;
        display: flex;
    }

    /* PENDIENTE IMPORTANTE RESPONSIVE */
    /* PENDIENTE IMPORTANTE RESPONSIVE */
    .app {
        width: 100%;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }
</style>
