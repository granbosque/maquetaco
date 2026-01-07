<script>
    import { appState } from "$lib/stores/appState.svelte.js";
    import { styleSettings } from "$lib/stores/styleSettings.svelte.js";
    import { convertDocument } from "$lib/converters/md-to-html.js";
    import { renderTemplate } from "$lib/converters/template-engine.js";
    import { Glasses } from "lucide-svelte";
    import StyleSelectors from "$lib/components/StyleSelectors.svelte";
    import "$lib/styles/preview.css";

    // Convertir el markdown a HTML y aplicar plantilla reactivamente
    let previewHtml = $derived.by(() => {
        const lang = appState.config.lang || "es";
        const { html } = convertDocument(appState.config.content, lang);

        // Construir metadatos desde appState.config
        const metadata = {
            title: appState.config.title || "",
            author: appState.config.author || "",
            copyright: appState.config.copyright || "",
            date: appState.config.date || "",
            lang: appState.config.lang || "es",
        };

        // Lógica de TOC (igual que en ExportView)
        const h1Count = (html.match(/<h1/g) || []).length;
        if (appState.config.enableTOC === undefined) {
            metadata.toc = h1Count > 2;
        } else {
            metadata.toc = appState.config.enableTOC;
        }

        return renderTemplate("preview", metadata, html);
    });

    // Clase de estilo de párrafo
    let paragraphClass = $derived(styleSettings.paragraphStyleClass);

    // Estilo inline para la fuente
    let fontStyle = $derived.by(() => {
        const font = styleSettings.font;
        return font ? `font-family: ${font.family};` : '';
    });
</script>

<div class="preview-view">
    <aside class="preview-sidebar panel surface floating">
        <div class="panel-header"><h2>Opciones de estilo</h2></div>
        <StyleSelectors />
    </aside>

    <div class="preview-main">
        <aside class="callout notice">
            <Glasses size={32} />
            <div>
                Esta vista muestra el aspecto general del documento (fuentes,
                sangrías, espacios, títulos). No representa la distribución en
                páginas definitiva, ya que depende del formato al que se exporte.
                Para la versión ebook, la fuente puede depender del lector que se
                use.
                <br />
                Revisa que los títulos, párrafos y separaciones entre escenas sean correctas.
            </div>
        </aside>
        <article class="preview-content {paragraphClass}" style={fontStyle}>
            {@html previewHtml}
        </article>
    </div>
</div>

<style>
    .preview-view {
        display: flex;
        height: 100%;
        width: 100%;
        position: relative;
    }

    .preview-sidebar {
        position: absolute;
        left: 1rem;
        top: 1rem;
        width: 14rem;
        z-index: 20;
        padding: 0;
    }

    .preview-sidebar .panel-header h2 {
        font-size: 0.875rem;
        font-weight: 600;
        margin: 0;
        padding: 0.75rem;
    }

    .preview-main {
        flex: 1;
        padding: 0.5rem;
        overflow-y: auto;
        margin-left: 15rem;
    }

    .notice {
        max-width: 700px;
        margin: 0 auto 1.5rem;
    }

    .preview-content {
        max-width: 700px;
        margin: 0 auto;
    }

    /* Estilos de párrafo para la preview */
    .preview-content :global(p) {
        margin: 0;
        text-indent: 0;
    }

    .preview-content :global(p + p) {
        text-indent: 2em;
    }

    /* Estilo alternativo: párrafos separados */
    .preview-content.paragraph-spaced :global(p) {
        margin-bottom: 1em;
        text-indent: 0;
    }

    .preview-content.paragraph-spaced :global(p + p) {
        text-indent: 0;
    }
</style>

