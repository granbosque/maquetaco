<script>
    import { appState } from "$lib/stores/appState.svelte.js";
    import { styleSettings } from "$lib/stores/styleSettings.svelte.js";
    import { convertDocument } from "$lib/converters/md-to-html.js";
    import { renderCustomTemplate } from "$lib/converters/template-engine.js";
    import { generateEpub } from "$lib/converters/epub-generator.js";
    import { exportFormats } from "$lib/config/export-formats.js";
    import { generateDefaultCover } from "$lib/utils/cover-generator.js";
    import PdfPreview from "$lib/components/PdfPreview.svelte";
    import EpubPreview from "$lib/components/EpubPreview.svelte";
    import StyleSelectors from "$lib/components/StyleSelectors.svelte";
    import {
        Printer,
        Monitor,
        FileText,
        Smartphone,
        BookOpen,
        Download,
        Loader2,
    } from "lucide-svelte";

    // Mapeo de iconos
    const icons = { Monitor, FileText, Printer, Smartphone, BookOpen };

    let selectedTheme = $state(exportFormats[1]);
    let selectedThemeId = $state(exportFormats[1].id);
    let lastFormatId = $state(exportFormats[1].id); // Track format changes
    let preserveScroll = $state(true); // Reset scroll only on format change
    let pdfPreviewRef = $state(null);
    let isLoading = $state(false);
    let error = $state(null);

    $effect(() => {
        const theme = exportFormats.find((t) => t.id === selectedThemeId);
        if (theme) {
            // Detect if format changed (not just style)
            if (selectedThemeId !== lastFormatId) {
                preserveScroll = false;
                lastFormatId = selectedThemeId;
            } else {
                preserveScroll = true;
            }
            selectedTheme = theme;
        }
    });

    // Determinar si el formato actual es EPUB
    let isEpubFormat = $derived(selectedTheme.type === "epub");

    // Prepararar HTML y metadatos
    let contentHtml = $state("");
    let metadata = $state({});

    // Effect para generar HTML y metadatos cuando cambian dependencias
    $effect(() => {
        // Leer valores del store para que el effect sea reactivo a sus cambios
        const _paragraphStyle = styleSettings.paragraphStyleId;
        const _font = styleSettings.fontId;
        generateMetadata();
    });

    async function generateMetadata() {
        // Convertir contenido a HTML con el idioma configurado
        const lang = appState.config.lang || "es";
        const { html } = convertDocument(appState.config.content, lang);
        contentHtml = html;

        // Construir metadatos desde appState.config (la fuente de verdad)
        const meta = {
            title: appState.config.title || "Sin título",
            author: appState.config.author || "",
            publisher: appState.config.publisher || "",
            copyright: appState.config.copyright || "",
            dedication: appState.config.dedication || "",
            colophon: appState.config.colophon || "",
            date: appState.config.date || "",
            lang: appState.config.lang || "es",
            includeBranding: appState.config.includeBranding !== false,
        };

        // Lógica de Tabla de Contenidos (TOC)
        const h1Count = (contentHtml.match(/<h1/g) || []).length;
        if (appState.config.enableTOC === undefined) {
            // Automático: si hay más de 2 capítulos
            meta.toc = h1Count > 2;
        } else {
            // Manual: lo que diga el usuario
            meta.toc = appState.config.enableTOC;
        }
        meta.tocDepth = appState.config.tocDepth || 1;

        // Inyectar imagen de portada
        if (appState.config.imagePreview) {
            // Prioridad 1: Imagen cargada en UI (no regenerar)
            meta["cover-image"] = appState.config.imagePreview;
        } else {
            // Prioridad 2: Generar portada con fuente seleccionada
            const font = styleSettings.font;
            const fontFamily = font ? font.family : "Georgia, serif";
            const fontId = font ? font.id : null;
            meta["cover-image"] = await generateDefaultCover(
                meta.title,
                meta.author,
                fontFamily,
                fontId,
            );
        }

        // Añadir clase de estilo de párrafo
        meta.paragraphStyleClass = styleSettings.paragraphStyleClass;

        metadata = meta;
    }

    // HTML renderizado para preview
    let documentHtml = $derived.by(() => {
        if (selectedTheme.template) {
            return renderCustomTemplate(
                selectedTheme.template,
                metadata,
                contentHtml,
            );
        }
        return contentHtml;
    });

    function handlePrint() {
        if (pdfPreviewRef) {
            pdfPreviewRef.print();
        }
    }

    async function handleEpubExport() {
        try {
            const coverImage =
                appState.config.imagePreview || metadata["cover-image"] || null;
            await generateEpub(metadata, contentHtml, coverImage);
        } catch (e) {
            error = e.message;
            console.error("Error generando EPUB:", e);
        }
    }

    function getFontOverrideCSS() {
        return styleSettings.fontOverrideCSS;
    }
</script>

<div class="export-view">
    <!-- Side Panel -->
    <aside class="export-sidebar panel">
        <!-- Scrollable content area -->
        <div class="sidebar-content">
            <!-- Format Selector -->
            <section>
                <div class="panel-header"><h2>Formato de salida</h2></div>
                <div class="format-list">
                    {#each exportFormats as theme}
                        <button
                            class="format-item"
                            class:selected={selectedThemeId === theme.id}
                            onclick={() => selectedThemeId = theme.id}
                        >
                            <svelte:component this={icons[theme.icon]} size={18} />
                            <span>{theme.name}</span>
                        </button>
                    {/each}
                </div>
            </section>

            <!-- Style Options -->
            <section>
                <div class="panel-header"><h2>Opciones de estilo</h2></div>
                <StyleSelectors />
            </section>
        </div>

        <!-- Fixed footer with description and button -->
        <div class="sidebar-footer">
            <p class="format-description">{selectedTheme.description}</p>
            {#if selectedTheme.type === "pdf"}
                <p class="format-hint">
                    Se abrirá el diálogo de impresión. Selecciona "Guardar como PDF".
                </p>
            {/if}
            <button
                class="toolbar-btn primary export-btn"
                onclick={selectedTheme.type === "epub"
                    ? handleEpubExport
                    : handlePrint}
                disabled={selectedTheme.type !== "epub" && isLoading}
            >
                {#if selectedTheme.type === "epub"}
                    <Download size={16} />
                {:else}
                    <Printer size={16} />
                {/if}
                {selectedTheme.buttonText}
            </button>
        </div>
    </aside>

    <!-- Preview Area -->
    <div class="preview-area">
        {#if isLoading}
            <div class="loading-overlay">
                <div class="status-msg">
                    <Loader2 size={24} class="spin" /> Generando...
                </div>
            </div>
        {/if}

        {#if isEpubFormat}
            <EpubPreview
                documentHtml={contentHtml}
                css={selectedTheme.css}
                {metadata}
                bind:isLoading
            />
        {:else}
            <PdfPreview
                bind:this={pdfPreviewRef}
                {documentHtml}
                css={selectedTheme.css + getFontOverrideCSS()}
                scale={selectedTheme.previewScale ?? 1}
                {preserveScroll}
                bind:isLoading
                bind:error
            />
        {/if}
    </div>
</div>

<style>
    .export-view {
        display: flex;
        height: 100%;
        width: 100%;
        background: var(--bg-app);
    }

    .export-sidebar {
        position: absolute;
        left: 1rem;
        top: 1rem;
        bottom: 1rem;
        width: 280px;
        display: flex;
        flex-direction: column;
        background: var(--bg-surface);
        border: 1px solid var(--border-muted);
        border-radius: var(--radius-lg);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        z-index: 20;
        overflow: hidden;
    }

    .sidebar-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-gutter: stable;
    }

    .sidebar-content section {
        border-bottom: 1px solid var(--border-muted);
    }

    .sidebar-content section:last-child {
        border-bottom: none;
    }

    .sidebar-content .panel-header {
        padding-bottom: 0;
    }

    /* Format List */
    .format-list {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        padding: 0.375rem;
        background: #f4f4f469;
        border-radius: var(--radius);
        margin: 0.25rem 0.5rem 0.5rem;
    }

    .format-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-muted);
        border-radius: var(--radius);
        transition: background var(--transition), color var(--transition);
        text-align: left;
    }

    .format-item:hover {
        background: var(--bg-muted);
    }

    .format-item.selected {
        color: var(--text);
        background: rgba(102, 187, 106, 0.2);
    }

    /* Sidebar Footer */
    .sidebar-footer {
        flex-shrink: 0;
        padding: 0.75rem;
        border-top: 1px solid var(--border-muted);
        background: var(--bg-surface);
    }

    .format-description {
        margin: 0 0 0.5rem;
        font-size: 0.75rem;
        color: var(--text-muted);
        line-height: 1.5;
    }

    .format-hint {
        margin: 0 0 0.5rem;
        font-size: 0.65rem;
        color: var(--text-subtle);
        line-height: 1.4;
    }

    .export-btn {
        width: 100%;
        justify-content: center;
        font-size: 0.8125rem;
        padding: 0.625rem;
    }

    .preview-area {
        flex: 1;
        position: relative;
        display: flex;
    }

    /* loading-overlay, status-msg, and spin animation are now in components-minimal.css */
</style>
