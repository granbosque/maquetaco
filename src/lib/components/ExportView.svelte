<script>
    import { appState } from "$lib/stores/appState.svelte.js";
    import { convertDocument } from "$lib/converters/md-to-html.js";
    import { renderCustomTemplate } from "$lib/converters/template-engine.js";
    import { generateEpub } from "$lib/converters/epub-generator.js";
    import { exportFormats } from "$lib/config/export-formats.js";
    import { exportFonts } from "$lib/config/export-fonts.js";
    import { generateDefaultCover } from "$lib/utils/cover-generator.js";
    import PdfPreview from "$lib/components/PdfPreview.svelte";
    import EpubPreview from "$lib/components/EpubPreview.svelte";
    import {
        Printer,
        Monitor,
        FileText,
        ChevronDown,
        Smartphone,
        BookOpen,
        Download,
        Loader2,
    } from "lucide-svelte";
    import { Accordion } from "bits-ui";

    // Mapeo de iconos
    const icons = { Monitor, FileText, Printer, Smartphone, BookOpen };

    let selectedTheme = $state(exportFormats[1]);
    let selectedThemeId = $state(exportFormats[1].id);
    let pdfPreviewRef = $state(null);
    let isLoading = $state(false);
    let error = $state(null);
    let selectedFont = $state(exportFonts[0].id);

    $effect(() => {
        const theme = exportFormats.find((t) => t.id === selectedThemeId);
        if (theme) selectedTheme = theme;
    });

    // Determinar si el formato actual es EPUB
    let isEpubFormat = $derived(selectedTheme.type === "epub");

    // Prepararar HTML y metadatos
    let contentHtml = $state("");
    let metadata = $state({});

    // Effect para generar HTML y metadatos cuando cambian dependencias
    $effect(() => {
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

        // Inyectar imagen de portada
        if (appState.config.imagePreview) {
            // Prioridad 1: Imagen cargada en UI (no regenerar)
            meta["cover-image"] = appState.config.imagePreview;
        } else {
            // Prioridad 2: Generar portada con fuente seleccionada
            const font = exportFonts.find((f) => f.id === selectedFont);
            const fontFamily = font ? font.family : "Georgia, serif";
            const fontId = font ? font.id : null;
            meta["cover-image"] = await generateDefaultCover(
                meta.title,
                meta.author,
                fontFamily,
                fontId,
            );
        }

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
        const font = exportFonts.find((f) => f.id === selectedFont);
        if (!font || font.id === "georgia") return "";
        const override = `\n:root { --body-font-family: ${font.family} !important; }\n`;
        console.log("[Font Override]", selectedFont, override);
        return override;
    }
</script>

<div class="export-view">
    <div class="export-panel panel surface">
        <div class="panel-header"><h2>Formato de salida</h2></div>

        <Accordion.Root
            type="single"
            value={selectedThemeId}
            onValueChange={(v) => v && (selectedThemeId = v)}
            class="format-list"
        >
            {#each exportFormats as theme}
                <Accordion.Item value={theme.id} class="format-item">
                    <Accordion.Trigger class="format-trigger">
                        <svelte:component this={icons[theme.icon]} size={18} />
                        <span>{theme.name}</span>
                        <ChevronDown size={14} class="chevron" />
                    </Accordion.Trigger>
                    <Accordion.Content class="format-content">
                        <p>{theme.description}</p>
                        <button
                            class="toolbar-btn primary"
                            onclick={theme.type === "epub"
                                ? handleEpubExport
                                : handlePrint}
                            disabled={theme.type !== "epub" && isLoading}
                        >
                            {#if theme.type === "epub"}
                                <Download size={14} />
                            {:else}
                                <Printer size={14} />
                            {/if}
                            {theme.buttonText}
                        </button>
                        {#if theme.type === "pdf"}
                            <p class="hint">
                                Se abrirá el diálogo de impresión. Selecciona
                                "Guardar como PDF" en el desplegable de
                                impresora.
                            </p>
                        {/if}
                    </Accordion.Content>
                </Accordion.Item>
            {/each}
        </Accordion.Root>

        <!-- Font Selector -->
        <div class="font-selector">
            <label for="font-select">Tipografía:</label>
            <select id="font-select" bind:value={selectedFont}>
                {#each exportFonts as font}
                    <option value={font.id} style="font-family: {font.family}">
                        {font.name}
                    </option>
                {/each}
            </select>
        </div>
    </div>

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
                bind:isLoading
                bind:error
            />
        {/if}
    </div>
</div>

<style>
    .export-view {
        position: relative;
        display: flex;
        height: 100%;
        width: 100%;
        background: var(--bg-app);
    }

    .export-panel {
        position: absolute;
        left: 1rem;
        top: 1rem;
        width: 16rem;
        z-index: 20;
        padding: 0;
        scrollbar-gutter: stable;
    }

    /* Accordion */
    :global(.format-list) {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
    }

    :global(.format-item) {
        border-radius: var(--radius);
        transition: background-color var(--transition);
        overflow: hidden;
    }

    :global(.format-item[data-state="open"]) {
        background-color: rgba(102, 187, 106, 0.1);
    }

    :global(.format-trigger) {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-muted);
        border-radius: var(--radius);
        transition:
            background var(--transition),
            color var(--transition);
    }

    :global(.format-trigger:hover) {
        background: var(--bg-muted);
    }

    :global(.format-item[data-state="open"] .format-trigger) {
        color: var(--color-primary);
        background: transparent;
    }

    :global(.chevron) {
        margin-left: auto;
        color: var(--text-subtle);
        transition: transform var(--transition);
    }

    :global(.format-item[data-state="open"] .chevron) {
        transform: rotate(180deg);
        color: var(--color-primary);
    }

    :global(.format-content) {
        padding: 0 0.75rem 0.75rem;
        font-size: 0.75rem;
        color: var(--text-muted);
        line-height: 1.5;
        overflow: hidden;
    }

    :global(.format-content[data-state="open"]) {
        animation: accordion-open var(--transition) forwards;
    }

    :global(.format-content[data-state="closed"]) {
        animation: accordion-close var(--transition) forwards;
    }

    :global(.format-content p) {
        margin: 0 0 0.625rem;
    }

    :global(.format-content .toolbar-btn) {
        width: 100%;
        justify-content: center;
        font-size: 0.8125rem;
        padding: 0.5rem;
    }

    :global(.format-content .hint) {
        font-size: 0.6rem;
        color: var(--text-subtle);
        margin-top: 0.5rem;
        line-height: 1.4;
    }

    .font-selector {
        padding: 0.75rem;
        border-top: 1px solid var(--border-muted);
    }

    .font-selector label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-muted);
        margin-bottom: 0.375rem;
    }

    .font-selector select {
        width: 100%;
    }

    .preview-area {
        flex: 1;
        position: relative;
        display: flex;
    }

    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-app);
        z-index: 10;
    }

    .status-msg {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-muted);
        font-size: 0.875rem;
        background: var(--bg-panel);
        padding: 0.75rem 1.25rem;
        border-radius: var(--radius);
        box-shadow: var(--shadow-sm);
    }

    :global(.spin) {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
