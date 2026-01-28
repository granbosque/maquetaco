<script>
    /* 
        Vista previa del documento, con una plantilla para vista previa que 
        simula el aspecto general del documento final (fuentes, sangrías, espacios, títulos)
        pero no la distribución en páginas definitiva, ya que depende del formato al que se exporte.

        Las secciones del body se renderizan individualmente para permitir
        añadir componentes Svelte (botones, menús) a cada sección.
    */
    import { appState } from "$lib/stores/appState.svelte.js";
    import { styleSettings } from "$lib/stores/styleSettings.svelte.js";
    import { convertDocument, extractSections, generateTableOfContents, markdownToHtmlInline } from "$lib/converters/md-to-html.js";
    import { Glasses } from "lucide-svelte";
    import StyleSelectors from "$lib/components/StyleSelectors.svelte";
    import PreviewTemplate from "$lib/components/PreviewTemplate.svelte";
    import "$lib/styles/preview.css";

    // Extraer metadata para portada, dedicatoria, TOC, colofón
    let metadata = $derived.by(() => {
        const lang = appState.config.lang || "es";
        const { html: bodyHtml } = convertDocument(appState.config.content, lang);
        
        const meta = {
            title: appState.config.title || "",
            author: appState.config.author || "",
            copyright: appState.config.copyright || "",
            date: appState.config.date || "",
            lang,
            dedication: appState.config.dedication || "",
            colophon: appState.config.colophon || "",
        };

        // Dedicatoria y colofón convertidos a HTML
        meta.dedicationHtml = meta.dedication ? markdownToHtmlInline(meta.dedication, lang) : "";
        meta.colophonHtml = meta.colophon ? markdownToHtmlInline(meta.colophon, lang) : "";

        // Activación semiautomática del TOC
        const h1Count = (bodyHtml.match(/<h1/g) || []).length;
        if (appState.config.enableTOC === undefined) {
            meta.showToc = h1Count > 2;
        } else {
            meta.showToc = appState.config.enableTOC;
        }
        meta.tocDepth = appState.config.tocDepth || 1;
        meta.tableOfContentsHtml = meta.showToc ? generateTableOfContents(bodyHtml, meta.tocDepth) : "";

        return meta;
    });

    // Extraer secciones del body como array de objetos
    let sections = $derived.by(() => {
        const lang = appState.config.lang || "es";
        const { html: bodyHtml } = convertDocument(appState.config.content, lang);
        return extractSections(bodyHtml);
    });

    let paragraphClass = $derived(styleSettings.paragraphStyleClass);

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
        <PreviewTemplate 
            {metadata} 
            {sections} 
            toc={appState.toc}
            {paragraphClass} 
            {fontStyle} 
        />
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
</style>

