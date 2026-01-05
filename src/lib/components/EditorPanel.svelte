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
        Pilcrow,
        Quote,
        ListTree,
        Settings2,
    } from "lucide-svelte";

    import { appState } from "$lib/stores/appState.svelte.js";
    import { extractHeadings } from "$lib/utils/markdown.js";
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
    } = $props();

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

    // Debounced TOC extraction
    let debounceTimer;

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

    $effect(() => {
        const content = appState.config.content;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            appState.config.toc = extractHeadings(content);
        }, 300);

        return () => clearTimeout(debounceTimer);
    });
</script>

<section class="panel surface">
    <!-- Toolbar integrada en el panel -->
    <div class="editor-toolbar">
        <Tooltip.Provider>
            <!-- Toggle panel izquierdo -->
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

            <!-- Grupo: Acciones de archivo -->
            <div class="toolbar-group">
                <Tooltip.Root>
                    <Tooltip.Trigger class="toolbar-btn" onclick={onImport}>
                        <Upload size="16" />
                        <span class="btn-label">Abrir</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Importar archivo
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger class="toolbar-btn" onclick={onSave}>
                        <Download size="16" />
                        <span class="btn-label">Guardar</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}>
                        Guardar como Markdown
                    </Tooltip.Content>
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger class="toolbar-btn" onclick={onClear}>
                        <Trash2 size="16" />
                        <span class="btn-label">Limpiar</span>
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

            <div class="toolbar-separator"></div>

            <div class="toolbar-spacer"></div>

            <!-- Toggle panel derecho -->
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

    .editor-toolbar {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 10px;
        border-bottom: 1px solid var(--border-muted);
        flex-shrink: 0;
    }

    .toolbar-group {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .toolbar-separator {
        width: 1px;
        height: 18px;
        background-color: var(--border-muted);
        margin: 0 6px;
    }

    /* Botones de la toolbar */
    :global(.editor-toolbar .toolbar-btn) {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 5px 8px;
        border-radius: var(--radius-full);
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        transition: all 0.15s ease;
        font-size: var(--text-sm);
        font-weight: var(--weight-medium);
    }

    :global(.editor-toolbar .toolbar-btn:hover) {
        background-color: var(--bg-muted);
        color: var(--text);
    }

    :global(.editor-toolbar .toolbar-btn.active) {
        background-color: var(--color-secondary);
        color: var(--text);
    }

    /* Botones toggle de paneles - estilo más suave cuando activos */
    :global(.editor-toolbar .toolbar-btn.toggle-btn.active) {
        background-color: rgba(102, 187, 106, 0.12);
        color: var(--text-muted);
    }

    :global(.editor-toolbar .toolbar-btn.toggle-btn.active:hover) {
        background-color: rgba(102, 187, 106, 0.2);
        color: var(--text);
    }

    .toolbar-spacer {
        flex: 1;
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

    /* Responsive: ocultar etiquetas */
    @media (max-width: 900px) {
        :global(.editor-toolbar .btn-label) {
            display: none;
        }
    }

    @media (max-width: 640px) {
        .toolbar-separator {
            margin: 0 4px;
        }

        :global(.editor-toolbar .toolbar-btn) {
            padding: 5px 6px;
        }
    }
</style>
