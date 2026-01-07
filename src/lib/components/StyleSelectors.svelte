<script>
    import { exportFonts } from "$lib/config/export-fonts.js";
    import { paragraphStyles } from "$lib/config/export-paragraph-styles.js";
    import { styleSettings } from "$lib/stores/styleSettings.svelte.js";
    import { appState } from "$lib/stores/appState.svelte.js";
    import ParagraphIndent from "$lib/icons/ParagraphIndent.svelte";
    import ParagraphSpaced from "$lib/icons/ParagraphSpaced.svelte";

    // Mapeo de iconos
    const icons = {
        ParagraphIndent,
        ParagraphSpaced
    };
</script>

<div class="style-selectors">
    <!-- Font Selector -->
    <div class="style-selector">
        <label for="font-select">Tipografía</label>
        <select id="font-select" bind:value={styleSettings.fontId}>
            {#each exportFonts as font}
                <option value={font.id} style="font-family: {font.family}">
                    {font.name}
                </option>
            {/each}
        </select>
    </div>

    <!-- Paragraph Style Toggle -->
    <div class="style-selector">
        <label id="paragraph-style-label">Estilo de párrafo</label>
        <div class="style-toggle" role="radiogroup" aria-labelledby="paragraph-style-label">
            {#each paragraphStyles as style}
                <button
                    class="toggle-btn"
                    class:active={styleSettings.paragraphStyleId === style.id}
                    onclick={() => styleSettings.paragraphStyleId = style.id}
                    title={style.description}
                    aria-pressed={styleSettings.paragraphStyleId === style.id}
                >
                    <svelte:component this={icons[style.icon]} size={20} />
                    <span class="toggle-label">{style.name}</span>
                </button>
            {/each}
        </div>
    </div>

    <!-- Options -->
    <div class="style-selector options-section">
        <div class="toc-option">
            <label class="checkbox-inline">
                <input type="checkbox" bind:checked={appState.config.enableTOC} />
                <span>Índice</span>
            </label>
            {#if appState.config.enableTOC}
                <select 
                    bind:value={appState.config.tocDepth} 
                    class="toc-depth-select"
                    title="Profundidad del índice: cuántos niveles de títulos incluir"
                >
                    <option value={1}>1 nivel</option>
                    <option value={2}>2 niveles</option>
                    <option value={3}>3 niveles</option>
                </select>
            {/if}
        </div>

        <label class="checkbox-inline">
            <input type="checkbox" bind:checked={appState.config.includeBranding} />
            <span>Incluir "Maquetado con Maquetaco"</span>
        </label>
    </div>
</div>

<style>
    .style-selectors {
        display: flex;
        flex-direction: column;
    }

    .style-selector {
        padding: 0.5rem 0.75rem;
    }

    /* Options section */
    .options-section {
        display: flex;
        flex-direction: column;
        gap: 0.375rem;
    }

    /* Override global checkbox-inline margin for compact layout */
    .options-section .checkbox-inline {
        margin-top: 0;
    }

    /* TOC option - inline checkbox + dropdown */
    .toc-option {
        display: flex;
        align-items: center;
        gap: 0.375rem;
    }

    .toc-option .checkbox-inline {
        flex-shrink: 0;
    }

    .toc-depth-select {
        padding: 0.1875rem 0.5rem;
        font-size: 0.6875rem;
        border-radius: var(--radius);
        border: 1px solid var(--border-muted);
        background: var(--bg-surface);
        color: var(--text-muted);
        cursor: pointer;
        min-width: 5.5rem;
    }

    .toc-depth-select:hover {
        border-color: var(--border);
        color: var(--text);
    }

    .toc-depth-select:focus {
        outline: none;
        border-color: var(--accent);
    }

    @media (max-width: 300px) {
        .toggle-label {
            display: none;
        }
    }
</style>
