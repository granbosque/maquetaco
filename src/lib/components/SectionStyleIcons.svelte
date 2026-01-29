<script>
    /** Componente que muestra iconos para las clases de una sección.
     *  Está como componente porque se reutiliza en StructurePanel.svelte y en PreviewTemplate.svelte (ojo que se mete en el template)
     *  
     * Muestra solo icono para clases que están en MANAGED, el resto se ignoran.
     *  Si no hay ninguna clase manejada en el encabezado y showEllipsis es true, se muestra el icono de puntos suspensivos
     * 
     * pendiente enlazar el botón con un panel de configuración de la sección.
     */
    import { EyeOff, BookmarkX, EllipsisVertical, PanelLeftRightDashed, PanelLeftDashed, FoldVertical, ArrowDownToLine, AlignCenter, AlignRight, ZoomOut, ZoomIn} from "lucide-svelte";
    import ParagraphIndentIcon from "$lib/icons/ParagraphIndent.svelte";
    import ParagraphSpacedIcon from "$lib/icons/ParagraphSpaced.svelte";    
    const MANAGED = [
        { class: "no-title", Icon: EyeOff },
        { class: "no-toc", Icon: BookmarkX },
        { class: "narrow", Icon: PanelLeftRightDashed },
        { class: "right-column", Icon: PanelLeftDashed },
        { class: "vcenter", Icon: FoldVertical },
        { class: "vbottom", Icon: ArrowDownToLine },
        { class: "text-center", Icon: AlignCenter },
        { class: "text-right", Icon: AlignRight },
        { class: "text-small", Icon: ZoomOut },
        { class: "text-large", Icon: ZoomIn },
        { class: "paragraph-spaced", Icon: ParagraphSpacedIcon },
        { class: "paragraph-indent", Icon: ParagraphIndentIcon }
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