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
    import { resizeImage } from "$lib/utils/image-processing.js";
    import { docxToMarkdown } from "$lib/converters/docx-to-md.js";
    import { parseFrontmatter } from "$lib/utils/frontmatter.js";
    import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";
    import WelcomeModal from "$lib/components/WelcomeModal.svelte";
    import { onMount } from "svelte";

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
        appState.config.content = "";
        appState.config.fileName = "Ningún archivo cargado";
        // Restablecer metadatos si es necesario
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
        appState.config.enableTOC = h1Count > 2;
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

                // Log warnings to console only (not embedded in document)
                if (warnings && warnings.length > 0) {
                    console.log("⚠️ Importación DOCX:", warnings);
                }

                appState.config.content = content;
                appState.config.fileName = file.name;

                // Actualizar TOC automáticamente según número de capítulos
                updateTOCFromContent(content);
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

                // Poblar metadatos en appState.config
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

                // Guardar solo el contenido (sin frontmatter)
                appState.config.content = content;
                appState.config.fileName = file.name;

                // Actualizar TOC automáticamente según número de capítulos
                updateTOCFromContent(content);
            };
            reader.readAsText(file);
        } else {
            console.log("Tipo de archivo no soportado:", file.type);
        }
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
            onImport={handleImport}
            onClear={handleClear}
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
                    <EditorView />
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
    .app {
        min-width: 600px;
        overflow-x: auto;
    }
</style>
