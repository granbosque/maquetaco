<script>
    /* 
        Vista previa del documento, con una plantilla para vista previa que 
        simula el aspecto general del documento final (fuentes, sangrías, espacios, títulos)
        pero no la distribución en páginas definitiva, ya que depende del formato al que se exporte.

        Lee el contenido de appState, conviete a html y monta el html final.
        Además añade un botón (pendiente de terminar) para cada sección.

    */
    import { appState } from "$lib/stores/appState.svelte.js";
    import { styleSettings } from "$lib/stores/styleSettings.svelte.js";
    import { convertDocument } from "$lib/converters/md-to-html.js";
    import { renderTemplate } from "$lib/converters/template-engine.js";
    import { Glasses } from "lucide-svelte";
    import StyleSelectors from "$lib/components/StyleSelectors.svelte";
    import "$lib/styles/preview.css";

    function addSectionConfigButtons(html) {
        if (!html) return html;
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        const sections = doc.querySelectorAll("section");
        sections.forEach((section) => {
            const h1 = section.querySelector("h1");
            if (!h1) return;
            const index = h1.getAttribute("data-index");
            if (index == null) return;
            const btn = doc.createElement("button");
            btn.setAttribute("type", "button");
            btn.setAttribute("class", "section-config-btn");
            btn.setAttribute("data-section-index", index);

            // si la sección en appstate.toc tiene clases, se añaden como texto (pendiente sustituir por iconos)
            // en otro caso, el índice
            const classes = appState.toc[parseInt(index)]?.classes;
            if (classes && classes.length) {
                btn.textContent = classes.join(", ");
            } else {
                btn.textContent = `Sección ${parseInt(index)+1}`;
            }
            section.insertBefore(btn, h1);
        });
        return doc.body.innerHTML;
    }

    // Convertir el markdown a HTML con una plantilla css
    // - el html se calcula usando reactividad, depende de appSate
    // - el archivo css que se usa aquí es una versión simplificada de los css finales, con lo que tienen en común todos los formatos de exportación
    // La conversión se hace en dos pasos:
    // 1. Convierte el markdown a html, solo el cuerpo del documento, excluyendo el frontmatter
    // 2. Monta el html completo usando una plantilla (mustache) que incluye la portada, toc, dedicatoria, colofón, etc.
    //    el html de paso 1 se pasa como body a la plantilla.
    let previewHtml = $derived.by(() => {
        const lang = appState.config.lang || "es";

        const { html: bodyHtml } = convertDocument(appState.config.content, lang);

        // a renderTemplate hay que pasar el objeto con los metadata, 
        // porque genera automáticamente una página de portada, toc, páginas especiales, etc
        // (pendiente: centralizar la construcción de este objeto, porque en exportView está repetido)
        const metadata = {
            title: appState.config.title || "",
            author: appState.config.author || "",
            copyright: appState.config.copyright || "",
            date: appState.config.date || "",
            lang: appState.config.lang || "es",
            dedication: appState.config.dedication || "",
            colophon: appState.config.colophon || "",
        };

        // activación semiautomática del toc (pendiente mejorar y unificar)
        const h1Count = (bodyHtml.match(/<h1/g) || []).length;
        if (appState.config.enableTOC === undefined) {
            metadata.toc = h1Count > 2;
        } else {
            metadata.toc = appState.config.enableTOC;
        }
        metadata.tocDepth = appState.config.tocDepth || 1;

        const bodyWithSectionButtons = addSectionConfigButtons(bodyHtml);
        return renderTemplate("preview", metadata, bodyWithSectionButtons);
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
        text-indent: 1.5em;
    }

    /* Estilo alternativo: párrafos separados */
    .preview-content.paragraph-spaced :global(p) {
        margin-bottom: 1em;
        text-indent: 0;
    }

    .preview-content.paragraph-spaced :global(p + p) {
        text-indent: 0;
    }

    /* los estilos para los botones de configuración de sección tienen que estar
       como global para que se apliquen al html generado en runtime */
    :global(section) {
        position: relative;
    }
    :global(.section-config-btn) {
        position: absolute;
        right: 1em;
        top: -0.5rem;
        padding: var(--space-xs) var(--space-sm);
        border-radius: var(--radius);
        background-color: #f4f0e3;
        font-size: var(--text-xs);
        font-family: var(--font-main);
    }
</style>

