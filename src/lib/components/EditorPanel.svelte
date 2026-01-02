<script>
    import CodeMirror from "svelte-codemirror-editor";
    import { markdown } from "@codemirror/lang-markdown";
    import { yamlFrontmatter } from "@codemirror/lang-yaml";
    import { Tooltip } from "bits-ui";
    import {
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
    } from "lucide-svelte";
    import { browser } from "$app/environment";

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

    // Create a markdown language with YAML frontmatter support
    const markdownWithFrontmatter = yamlFrontmatter({ content: markdown() });

    // Update listener extension to reliably catch all updates
    const updateListenerExtension = EditorView.updateListener.of((update) => {
        if (update.docChanged || update.selectionSet) {
            if (appState.editorController?.getCurrentFormat) {
                const fmt = appState.editorController.getCurrentFormat();
                currentFormat = fmt;
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

    /* Current format state */
    let currentFormat = $state({
        blockType: "paragraph",
        bold: false,
        italic: false,
    });

    // Called when CodeMirror is ready with the EditorView instance
    function handleEditorReady(viewOrEvent) {
        // svelte-codemirror-editor may pass the EditorView directly or wrapped
        const view = viewOrEvent.state
            ? viewOrEvent
            : viewOrEvent.view || viewOrEvent;
        if (view && view.state) {
            appState.editorController = createCodeMirrorController(view);
            // Small delay to ensure theme is fully applied essentially
            setTimeout(() => {
                editorReady = true;
                // Initial check
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
        // Force update state after action
        setTimeout(() => {
            if (appState.editorController?.getCurrentFormat) {
                currentFormat = appState.editorController.getCurrentFormat();
            }
        }, 10);
    }

    function toggle(type) {
        if (type === "bold") appState.editorController?.toggleBold();
        if (type === "italic") appState.editorController?.toggleItalic();
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
    <div class="toolbar floating">
        <Tooltip.Provider>
            <div class="toolbar-group">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h1'
                            ? 'active secondary'
                            : ''}"
                        onclick={() => setBlock("h1")}
                    >
                        <Heading1 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}
                        >Encabezado 1</Tooltip.Content
                    >
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h2'
                            ? 'active secondary'
                            : ''}"
                        onclick={() => setBlock("h2")}
                    >
                        <Heading2 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}
                        >Encabezado 2</Tooltip.Content
                    >
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'h3'
                            ? 'active secondary'
                            : ''}"
                        onclick={() => setBlock("h3")}
                    >
                        <Heading3 size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}
                        >Encabezado 3</Tooltip.Content
                    >
                </Tooltip.Root>
            </div>

            <div class="toolbar-group">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn paragraph-btn"
                        onclick={() => setBlock("paragraph")}
                    >
                        <Pilcrow size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}
                        >Párrafo Normal</Tooltip.Content
                    >
                </Tooltip.Root>

                <div class="toolbar-separator"></div>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.blockType === 'quote'
                            ? 'active secondary'
                            : ''}"
                        onclick={() => setBlock("quote")}
                    >
                        <Quote size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}
                        >Cita</Tooltip.Content
                    >
                </Tooltip.Root>
            </div>

            <div class="toolbar-separator"></div>

            <div class="toolbar-group">
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.bold
                            ? 'active secondary'
                            : ''}"
                        onclick={() => toggle("bold")}
                    >
                        <Bold size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}
                        >Negrita</Tooltip.Content
                    >
                </Tooltip.Root>
                <Tooltip.Root>
                    <Tooltip.Trigger
                        class="toolbar-btn {currentFormat.italic
                            ? 'active secondary'
                            : ''}"
                        onclick={() => toggle("italic")}
                    >
                        <Italic size="16" />
                    </Tooltip.Trigger>
                    <Tooltip.Content class="tooltip" sideOffset={8}
                        >Cursiva</Tooltip.Content
                    >
                </Tooltip.Root>
            </div>
        </Tooltip.Provider>
    </div>
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
    }

    .content {
        flex: 1;
        opacity: 0;
        transition: opacity 0.4s ease-out;
        /* Ensure it takes space even when hidden */
        min-height: 0;
        position: relative;
        padding-bottom: 3em;
    }

    .content.ready {
        opacity: 1;
    }

    .floating {
        position: absolute;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 100;
        background-color: var(--bg-surface);
        border: 1px solid var(--border-muted);
        border-radius: var(--radius-full);
        box-shadow: var(--shadow-lg);
        display: flex;
        align-items: center;
        padding: 4px; /* Space inside the pill */
        gap: 2px;
        width: max-content;
        max-width: 95%;
    }

    .toolbar-group {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .toolbar-separator {
        width: 1px;
        height: 20px;
        background-color: var(--border-muted);
        margin: 0 4px;
    }

    /* Override toolbar-btn for this floating context if needed */
    :global(.floating .toolbar-btn) {
        border-radius: var(--radius-full);
        padding: 8px;
        min-height: unset;
        height: auto;
        color: var(--text-muted);
        transition: all var(--transition);
        display: flex;
        align-items: center;
        gap: 4px;
    }

    :global(.floating .toolbar-btn .btn-label) {
        font-size: var(--text-xs);
        font-weight: var(--weight-medium);
    }

    :global(.floating .toolbar-btn:hover) {
        background-color: var(--bg-muted);
        color: var(--text);
    }

    :global(.floating .toolbar-btn.active) {
        background-color: var(--color-secondary);
        color: var(--text);
    }

    :global(.floating .toolbar-btn.paragraph-btn) {
        padding: 6px 10px;
    }
</style>
