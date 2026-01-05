<script>
    // Panel de estructura/navegación del documento
    import { appState } from "../stores/appState.svelte.js";
    import { ContextMenu, DropdownMenu } from "bits-ui";
    import {
        Pencil,
        Trash2,
        MoreVertical,
        Type,
        BookOpen,
        Heart,
        Info,
        Quote,
        X,
    } from "lucide-svelte";

    // Props
    let { open = true, onClose = () => {} } = $props();

    // TODO: Implementar navegación al editor
    function scrollToLine(lineNumber) {
        appState.editorController.scrollToLine(lineNumber);
    }

    function setHeadingType(lineNumber, type) {
        console.log("[StructurePanel] setHeadingType called:", {
            lineNumber,
            type,
        });
        console.log(
            "[StructurePanel] editorController:",
            appState.editorController,
        );
        if (!appState.editorController) {
            console.warn("[StructurePanel] No editor controller available");
            return;
        }
        if (!appState.editorController.setHeadingType) {
            console.warn(
                "[StructurePanel] Controller missing setHeadingType method",
            );
            return;
        }
        appState.editorController.setHeadingType(lineNumber, type);
        console.log("[StructurePanel] setHeadingType completed");
    }
    // Tipos de encabezados disponibles
    const headingTypes = [
        {
            label: "Normal",
            value: null,
            description: "Encabezado estándar",
            icon: Type,
        },
        {
            label: "Dedicatoria",
            value: "dedication",
            description: "Se ocultará el título. Dedicatoria",
            icon: Heart,
        },
        {
            label: "Epígrafe",
            value: "epigraph",
            description:
                "Se ocultará el título. Cita o frase para abrir el libro",
            icon: Quote,
        },
        {
            label: "Colofón",
            value: "colophon",
            description:
                "Se ocultará el título. Texto breve para cerrar el libro",
            icon: Info,
        },
    ];

    function getStyleName(classes) {
        if (!classes || !classes.length) return null;
        for (const cls of classes) {
            const type = headingTypes.find((t) => t.value === cls);
            if (type) return type.label;
        }
        return null;
    }

    // Obtiene el tipo actual del heading (para marcar en el menú)
    function getCurrentType(classes) {
        if (!classes || !classes.length) return "";
        for (const cls of classes) {
            const type = headingTypes.find((t) => t.value === cls);
            if (type) return type.value || "";
        }
        return "";
    }
</script>

<section class="panel secondary side-panel left" class:collapsed={!open}>
    <div class="panel-header">
        <h2>Estructura</h2>
        <div class="actions">
            <button class="close-btn" onclick={onClose} title="Cerrar panel">
                <X size="16" />
            </button>
        </div>
    </div>
    {#if appState.config.toc && appState.config.toc.length}
        <div class="content">
            <nav class="toc">
                {#each appState.config.toc as heading}
                    {@const styleName = getStyleName(heading.classes)}
                    <div
                        class="toc-item level-{heading.level}"
                        style="padding-left: {0.5 +
                            (heading.level - 1) * 0.75}rem"
                    >
                        <button
                            type="button"
                            class="toc-item-btn"
                            onclick={() => scrollToLine(heading.line)}
                        >
                            <span class="toc-text">{heading.text}</span>
                            {#if styleName}
                                <span class="toc-badge">{styleName}</span>
                            {/if}
                        </button>

                        <!-- Menú de desborde (visible en hover) -->
                        <div class="overflow-menu" role="none">
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger class="overflow-btn">
                                    <MoreVertical />
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content
                                    class="context-menu-content"
                                    side="bottom"
                                    align="end"
                                >
                                    <div class="menu-header">
                                        Cambiar tipo de sección
                                    </div>
                                    <DropdownMenu.RadioGroup
                                        value={getCurrentType(heading.classes)}
                                    >
                                        {#each headingTypes as type}
                                            <DropdownMenu.RadioItem
                                                class="context-menu-item"
                                                value={type.value || ""}
                                                onSelect={() =>
                                                    setHeadingType(
                                                        heading.line,
                                                        type.value,
                                                    )}
                                            >
                                                {#snippet children({ checked })}
                                                    <span class="menu-check"
                                                        >{checked
                                                            ? "✓"
                                                            : ""}</span
                                                    >
                                                    <type.icon
                                                        class="menu-icon"
                                                    />
                                                    <div
                                                        class="menu-item-content"
                                                    >
                                                        <span
                                                            class="menu-item-label"
                                                            >{type.label}</span
                                                        >
                                                        {#if type.description}
                                                            <span
                                                                class="menu-item-desc"
                                                                >{type.description}</span
                                                            >
                                                        {/if}
                                                    </div>
                                                {/snippet}
                                            </DropdownMenu.RadioItem>
                                        {/each}
                                    </DropdownMenu.RadioGroup>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>
                    </div>
                {/each}
            </nav>
        </div>
    {:else}
        <div class="content empty">
            <p>No hay encabezados en el documento</p>
        </div>
    {/if}
</section>

<style>
    .toc {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
    }

    :global(.toc-item) {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0.35rem 0.5rem; /* Default padding-right is 0.5rem */
        color: var(--text);
        border-radius: 0.25rem;
        font-size: 0.85rem;
        cursor: default;
        transition:
            background-color var(--transition),
            padding-right 0.2s cubic-bezier(0.2, 0, 0, 1);
        text-align: left;
        border: none;
        background: none;
        position: relative; /* Para posicionar el menú de desborde si fuera absoluto, aunque flex lo maneja */
    }

    :global(.toc-item:hover),
    :global(.toc-item:has(.overflow-btn[data-state="open"])) {
        background-color: rgba(102, 187, 106, 0.1);
        padding-right: 2.25rem; /* Make space for the absolute button */
    }

    .toc-item-btn {
        flex: 1;
        display: flex;
        align-items: center;
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        font: inherit;
        color: inherit;
        cursor: pointer;
        text-align: left;
        min-width: 0; /* Allow text truncation */
    }

    .toc-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .toc-badge {
        font-size: 0.65rem;
        padding: 0.1rem 0.35rem;
        background-color: var(--border);
        color: var(--text-muted);
        border-radius: 4px;
        margin-left: 0.5rem;
        text-transform: uppercase;
        font-weight: 600;
        letter-spacing: 0.02em;
        white-space: nowrap;
    }

    :global(.toc-item.level-1) {
        font-weight: 400;
    }

    :global(.toc-item.level-2) {
        font-weight: 300;
    }

    :global(.toc-item.level-3),
    :global(.toc-item.level-4),
    :global(.toc-item.level-5),
    :global(.toc-item.level-6) {
        font-weight: 300;
        opacity: 0.85;
    }

    .empty p {
        color: var(--text-muted);
        font-size: 0.85rem;
        font-style: italic;
    }

    .menu-check {
        width: 1rem;
        text-align: center;
        color: var(--color-primary);
        font-weight: bold;
    }
</style>
