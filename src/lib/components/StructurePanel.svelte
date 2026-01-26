<script>
    /* Este componente muestra la estructura del documento en forma de lista jerárquica.

        Lee los datos directamente de appState.config.toc,
        que es un array de objetos que contienen el texto del encabezado y varias propiedades más:
        - level: nivel del encabezado (1-6)
        - line: número de línea del encabezado
        - text: texto del encabezado
        - id: slug generado del texto (ojo que no son únicos!)
        - classes: array de clases CSS extraídas de atributos Pandoc

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
    {#if appState.config.toc?.length}
        <div class="content">
            <nav class="toc">
                {#each appState.config.toc as heading}
                    <button
                        type="button"
                        class="toc-item level-{heading.level}"
                        onclick={() => scrollToLine(heading.line)}
                    >
                        {heading.text}
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

    button.toc-item {
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
    }

    .toc-item:hover {
        background-color: rgba(102, 187, 106, 0.1);
    }

    .toc-item.level-1 {
        padding-left: 0.5rem;
        font-weight: 400;
    }

    .toc-item.level-2 {
        padding-left: 1.25rem;
        font-weight: 300;
    }

    .toc-item.level-3,
    .toc-item.level-4,
    .toc-item.level-5,
    .toc-item.level-6 {
        font-weight: 300;
        opacity: 0.85;
    }

    .toc-item.level-3 {
        padding-left: 2rem;
    }

    .toc-item.level-4 {
        padding-left: 2.75rem;
    }

    .toc-item.level-5 {
        padding-left: 3.5rem;
    }

    .toc-item.level-6 {
        padding-left: 4.25rem;
    }

    .empty p {
        color: var(--text-muted);
        font-size: 0.85rem;
        font-style: italic;
    }
</style>
