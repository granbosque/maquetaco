<script>
    /**
     * PreviewTemplate.svelte
     * 
     * Este componente genera una vista previa en html del documento completo (incluyendo toc, secciones autogeneradas, etc)
     * Para la exportación real se usan plantillas Mustache que genera un string html monolítico (que luego se pasa a epubjs)
     * Pero aquí necesitamos algo interactivo así que simulamos una plantilla similar
     * IMPORTANTE: necesitamos las secciones separadas, no el body completo, para insertar botones para configurar cada sección
     * 
     * Por ahora no está planeado configurar elementos que no sean secciones, por eso es suficiente
     * con pasar el body dividido por <section>, pero si en el futuro se quiere, se podría posprocesar aquí el html
     */

    import SectionStyleIcons from "./SectionStyleIcons.svelte";
    import { appState } from "$lib/stores/appState.svelte.js";
    
    let { metadata, sections, toc, paragraphClass, fontStyle } = $props();

    // Obtener clases de sección desde el TOC
    function getSectionClasses(index) {
        const classes = toc[index]?.classes || [];
        return classes.join(" ");
    }

</script>

<article class="preview-content {paragraphClass}" style={fontStyle}>
    <!-- Portada -->
    {#if metadata.title}
    <div class="title-block">
        <h1 class="document-title">{metadata.title}</h1>
        {#if metadata.author}<p class="document-author">{metadata.author}</p>{/if}
        {#if metadata.copyright}<div class="metadata">{metadata.copyright}</div>{/if}
    </div>
    {/if}

    <!-- Dedicatoria -->
    {#if metadata.dedication}
    <section class="dedication">
        {@html metadata.dedicationHtml}
    </section>
    {/if}

    <!-- Tabla de contenidos -->
    {#if metadata.showToc}
    <nav class="toc-preview">
        <h2>Índice</h2>
        {@html metadata.tableOfContentsHtml}
    </nav>
    {/if}

    <!-- Secciones del cuerpo -->
    <main class="main-content">
        {#each sections as section (section.index)}
         <!-- localizar en appState.toc las propiedades de esta sección (por index)-->
         {@const tocSection = appState.toc[section.index]}
         <section id={section.id} class={[...section.classes, getSectionClasses(section.index)].filter(Boolean).join(' ')}>
            <button type="button" class="section-config-btn">
                {#if tocSection.classes?.length}
                    <SectionStyleIcons classes={tocSection.classes} />
                {:else}
                    Sección {section.index + 1}
                {/if}
            </button>
            {@html section.html}
        </section>
        {/each}
    </main>

    <!-- Colofón -->
    {#if metadata.colophon}
    <section class="colophon">
        {@html metadata.colophonHtml}
    </section>
    {/if}
</article>

<style>
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

    section {
        position: relative;
    }

    .section-config-btn {
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
