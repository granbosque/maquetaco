<script>
    /* Este componente muestra la estructura del documento en forma de lista jerárquica.

        Lee los datos directamente de appState.config.toc,
        que es un array de objetos que contienen el texto del encabezado y varias propiedades más:
        - level: nivel del encabezado (1-6)
        - line: número de línea del encabezado
        - text: texto del encabezado
        - classes: array de clases CSS extraídas (en formato de atributos Pandoc)

        Ese estado se actualiza cuando cambia el contenido del editor (con un debounce de 300ms)
        y se extrae la estructura a partir del markdown usando extractHeadings().

        Este componente es un panel y dentro muestra la lista para navegar (quizás se podría
        separar en dos componentes, el propio panel y la lista y separar la presentación de los datos),
        o mejor aún hacer un panel genérico.

        Props:
        - open: controla la visibilidad del panel mediante CSS (default: true)
        - onClose: callback que se ejecuta al cerrar el panel (default: función vacía)
    */
    import { appState } from "../stores/appState.svelte.js";
    import { X } from "lucide-svelte";
    import { EllipsisVertical } from "lucide-svelte";
    import SectionStyleIcons from "./SectionStyleIcons.svelte";
    import OptionsPopover from "./OptionsPopover.svelte";

    let { open = true, onClose = () => {} } = $props();

    function scrollToLine(lineNumber) {
        appState.editorController.scrollToLine(lineNumber);
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
    {#if appState.toc?.length}
        <div class="content">
            <nav class="toc">
                {#each appState.toc as heading}

                    <!-- botón con otro botón dentro... mejorable
                        Si se pulsa en título (o espacio blanco) va a la línea correspondiente
                        Si se pulsa en los iconos, abre el menú de opciones -->
                    <button type="button" class="toc-item level-{heading.level}"
                        onclick={() => scrollToLine(heading.line)}>
                        <div class="toc-item-text">{heading.text}</div>
                        {#if heading.level==1}
                        <OptionsPopover tocItem={heading}>
                            {#snippet trigger()}
                                <div class="toc-item-icons">
                                    <SectionStyleIcons classes={heading.classes} />
                                    <!-- Si no hay nada en SectionStyleIcons, el botón de menú se muestra siempre.
                                         Si hay algo, el botón de menú se muestra solo en hover (con efecto de colapso).
                                         align="end" en el popover ancla al borde derecho del trigger. -->
                                    <EllipsisVertical size={16} />
                                </div>
                            {/snippet}
                        </OptionsPopover>
                        {/if}
                    </button>

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

    /* Triggers del popover (renderizados por OptionsPopover) */
    .toc :global(button.toc-item) {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0.35rem 0.5rem;
        color: var(--text);
        border-radius: 0.25rem;
        cursor: pointer;
        transition: background-color var(--transition);
        text-align: left;
        border: none;
        background: none;
        font: inherit;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.85rem;
        justify-content: space-between;
    }

    .toc :global(.toc-item:hover) {
        background-color: rgba(102, 187, 106, 0.1);
    }

    .toc :global(.toc-item.level-1) {
        padding-left: 0.5rem;
        font-weight: 400;
    }

    .toc :global(.toc-item.level-2) {
        padding-left: 1.25rem;
        font-weight: 300;
    }

    .toc :global(.toc-item.level-3),
    .toc :global(.toc-item.level-4),
    .toc :global(.toc-item.level-5),
    .toc :global(.toc-item.level-6) {
        font-weight: 300;
        opacity: 0.85;
    }

    .toc :global(.toc-item.level-3) {
        padding-left: 2rem;
    }

    .toc :global(.toc-item.level-4) {
        padding-left: 2.75rem;
    }

    .toc :global(.toc-item.level-5) {
        padding-left: 3.5rem;
    }

    .toc :global(.toc-item.level-6) {
        padding-left: 4.25rem;
    }

    .empty p {
        color: var(--text-muted);
        font-size: 0.85rem;
        font-style: italic;
    }

    .toc-item {
        display: flex;
        flex-direction: row;
    }
    .toc-item-text {
        flex: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .toc-item-icons {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.25rem;
        flex-shrink: 0;
    }

    /* Si hay iconos en SectionStyleIcons, el botón de menú (último hijo) solo se muestra en hover; al ocultar, colapsa su ancho con transición */
    :global(.toc-item-icons:has(.section-style-icons:not(:empty)) > :last-child) {
        max-width: 0;
        opacity: 0;
        overflow: hidden;
        min-width: 0;
        transition: max-width var(--transition), opacity var(--transition);
    }
    .toc :global(.toc-item:hover .toc-item-icons:has(.section-style-icons:not(:empty)) > :last-child) {
        max-width: 1.5rem;
        opacity: 1;
    }

</style>
