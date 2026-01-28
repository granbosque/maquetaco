<script>
    /** Componente que muestra iconos para las clases de una sección.
     *  Está como componente porque se reutiliza en StructurePanel.svelte y en PreviewTemplate.svelte (ojo que se mete en el template)
     *  
     * Muestra solo icono para clases que están en MANAGED, el resto se ignoran.
     *  Si no hay ninguna clase manejada en el encabezado y showEllipsis es true, se muestra el icono de puntos suspensivos
     * 
     * pendiente enlazar el botón con un panel de configuración de la sección.
     */
    import { EyeOff, BookmarkX, EllipsisVertical } from "lucide-svelte";

    const MANAGED = [
        { class: "unlisted", Icon: EyeOff },
        { class: "no-toc", Icon: BookmarkX },
    ];

    let { classes = [], showEllipsis = false } = $props();
    const matched = $derived(
        MANAGED.filter(({ class: c }) => (Array.isArray(classes) ? classes : []).includes(c))
    );
</script>


<span class="section-style-icons">
    {#if matched.length}
        {#each matched as { Icon }}
            <Icon size={16} />
        {/each}
    {/if}
    {#if showEllipsis}
        <EllipsisVertical size={16} />
    {/if}

</span>

<style>
    .section-style-icons {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
</style>