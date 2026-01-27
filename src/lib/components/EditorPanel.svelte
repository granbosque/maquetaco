<script>
    import CodeMirror from "svelte-codemirror-editor";
    import { markdown } from "@codemirror/lang-markdown";
    import { yamlFrontmatter } from "@codemirror/lang-yaml";
    import { Tooltip } from "bits-ui";
    import {
        Upload,
        Download,
        Trash2,
        Bold,
        Italic,
        Heading1,
        Heading2,
        Heading3,
        Heading4,
        Heading5,
        Heading6,
        Pilcrow,
        Quote,
        ListTree,
        Settings2,
    } from "lucide-svelte";

    import { appState } from "$lib/stores/appState.svelte.js";
    import { createCodeMirrorController } from "$lib/editor/CodeMirrorController.js";
    import {
        maquetacoTheme,
        maquetacoHighlighting,
        frontmatterDecoration,
    } from "$lib/editor/editorTheme.js";
    import { clickableLinksExtension } from "$lib/editor/clickableLinks.js";

    import { EditorView } from "@codemirror/view";

    // Props
    let {
        onImport = () => {},
        onSave = () => {},
        onClear = () => {},
        leftPanelOpen = true,
        rightPanelOpen = true,
        toggleLeftPanel = () => {},
        toggleRightPanel = () => {},
        leftInOverlay = false,
        rightInOverlay = false,
    } = $props();

    // Estado derivado para resaltar botón Abrir
    let isContentEmpty = $derived(
        !appState.config.content ||
            appState.config.content.trim().length === 0 ||
            (appState.config.content.length ===
                appState.defaultContent.length &&
                appState.config.content === appState.defaultContent),
    );

    // Create a markdown language with YAML frontmatter support
    const markdownWithFrontmatter = yamlFrontmatter({ content: markdown() });

    /* Current format state */
    let currentFormat = $state({
        blockType: "paragraph",
        bold: false,
        italic: false,
    });

    // Update listener extension to reliably catch all updates
    const updateListenerExtension = EditorView.updateListener.of((update) => {
        if (update.docChanged || update.selectionSet) {
            if (appState.editorController?.getCurrentFormat) {
                currentFormat = appState.editorController.getCurrentFormat();
            }
        }
    });

    // Custom theme extensions
    const extensions = [
        maquetacoTheme,
        maquetacoHighlighting,
        frontmatterDecoration,
        clickableLinksExtension,
        updateListenerExtension,
    ];

    /* State for handling initialization FOUC */
    let editorReady = $state(false);

    // Called when CodeMirror is ready with the EditorView instance
    function handleEditorReady(viewOrEvent) {
        const view = viewOrEvent.state
            ? viewOrEvent
            : viewOrEvent.view || viewOrEvent;
        if (view && view.state) {
            appState.editorController = createCodeMirrorController(view);
            setTimeout(() => {
                editorReady = true;
                if (appState.editorController?.getCurrentFormat) {
                    currentFormat =
                        appState.editorController.getCurrentFormat();
                }
            }, 50);
        } else {
            console.error("Editor ready but view is invalid", viewOrEvent);
        }
    }

    function setBlock(type) {
        appState.editorController?.setBlockType(type);
        setTimeout(() => {
            if (appState.editorController?.getCurrentFormat) {
                currentFormat = appState.editorController.getCurrentFormat();
            }
        }, 10);
    }

    function toggle(type) {
        if (type === "bold") appState.editorController?.toggleBold();
        if (type === "italic") appState.editorController?.toggleItalic();
        setTimeout(() => {
            if (appState.editorController?.getCurrentFormat) {
                currentFormat = appState.editorController.getCurrentFormat();
            }
        }, 10);
    }
</script>

<section class="panel surface">
    <!-- Toolbar integrada en el panel -->
    <div class="editor-toolbar">
        <Tooltip.Provider delayDuration={300}>
            <!-- Toggle panel izquierdo (visible cuando cerrado O en overlay mode) -->
            {#if !leftPanelOpen || leftInOverlay}
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn toggle-btn {!leftPanelOpen
                            ? 'active'
                            : ''}"
                        onclick={toggleLeftPanel}
                    >
                        <ListTree size="16" />
                        <span class="btn-label">Estructura</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        {leftPanelOpen
                            ? "Ocultar estructura"
                            : "Mostrar estructura"}
                    </Tooltip.Content>
                </Tooltip.Root>
                <div class="toolbar-separator"></div>
            {/if}

            <!-- Grupo: Acciones de archivo -->
            <div class="toolbar-group">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {isContentEmpty ? 'highlight' : ''}"
                        onclick={onImport}
                    >
                        <Upload size="16" />
                        {#if isContentEmpty}
                            <span class="btn-label">Abrir</span>
                        {/if}
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Importar archivo
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger class="toolbar-btn" onclick={onSave}>
                        <Download size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Guardar como Markdown
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger class="toolbar-btn" onclick={onClear}>
                        <Trash2 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Borrar todo
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>

            <div class="toolbar-separator"></div>

            <!-- Grupo: Encabezados -->
            <div class="toolbar-group">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h1'
                            ? 'active'
                            : ''}"
                        onclick={() => setBlock("h1")}
                    >
                        <Heading1 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Encabezado 1
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h2'
                            ? 'active'
                            : ''}"
                        onclick={() => setBlock("h2")}
                    >
                        <Heading2 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Encabezado 2
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h3'
                            ? 'active'
                            : ''}"
                        onclick={() => setBlock("h3")}
                    >
                        <Heading3 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Encabezado 3
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h4'
                            ? 'active'
                            : ''}"
                        onclick={() => setBlock("h4")}
                    >
                        <Heading4 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Encabezado 4
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h5'
                            ? 'active'
                            : ''}"
                        onclick={() => setBlock("h5")}
                    >
                        <Heading5 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Encabezado 5
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h6'
                            ? 'active'
                            : ''}"
                        onclick={() => setBlock("h6")}
                    >
                        <Heading6 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Encabezado 6
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>

            <!-- Grupo: Párrafo y Cita -->
            <div class="toolbar-group">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn"
                        onclick={() => setBlock("paragraph")}
                    >
                        <Pilcrow size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Párrafo Normal
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'quote'
                            ? 'active'
                            : ''}"
                        onclick={() => setBlock("quote")}
                    >
                        <Quote size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Cita
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>

            <div class="toolbar-separator"></div>

            <!-- Grupo: Formato inline -->
            <div class="toolbar-group">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.bold ? 'active' : ''}"
                        onclick={() => toggle("bold")}
                    >
                        <Bold size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Negrita
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.italic
                            ? 'active'
                            : ''}"
                        onclick={() => toggle("italic")}
                    >
                        <Italic size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Cursiva
                    </Tooltip.Content>
                </Tooltip.Root>
            </div>

            <div class="toolbar-spacer"></div>

            <!-- Toggle panel derecho (visible cuando cerrado O en overlay mode) -->
            {#if !rightPanelOpen || rightInOverlay}
                <div class="toolbar-separator"></div>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn toggle-btn {!rightPanelOpen
                            ? 'active'
                            : ''}"
                        onclick={toggleRightPanel}
                    >
                        <Settings2 size="16" />
                        <span class="btn-label">Configuración</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        {rightPanelOpen
                            ? "Ocultar configuración"
                            : "Mostrar configuración"}
                    </Tooltip.Content>
                </Tooltip.Root>
            {/if}
        </Tooltip.Provider>
    </div>

    <!-- Contenido del editor -->
    <div class="content" class:ready={editorReady}>
        <CodeMirror
            bind:value={appState.config.content}
            lang={markdownWithFrontmatter}
            placeholder="Escribe algo..."
            lineWrapping
            onready={handleEditorReady}
            {extensions}
        />
    </div>
</section>

<style>
    .panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
    }

    .content {
        flex: 1;
        opacity: 0;
        transition: opacity 0.4s ease-out;
        min-height: 0;
        position: relative;
        overflow: auto;
    }

    .content.ready {
        opacity: 1;
    }
</style>
