<script>
    import { appState } from "$lib/stores/appState.svelte.js";
    import { convertDocument } from "$lib/converters/md-to-html.js";
    import { renderTemplate } from "$lib/converters/template-engine.js";
    import { Glasses } from "lucide-svelte";
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
</script>

<div class="preview-view">
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
    <article class="preview-content">
        {@html previewHtml}
    </article>
</div>

<style>
    .preview-view {
        padding: 0.5rem;
        overflow-y: auto;
        height: 100%;
        width: 100%;
    }

    .notice {
        max-width: 700px;
        margin: 0 auto 1.5rem;
    }

    .preview-content {
        max-width: 700px;
        margin: 0 auto;
    }
</style>
