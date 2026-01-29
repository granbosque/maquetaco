<script>
    import { fly } from "svelte/transition";
    import { ToggleGroup, Popover } from "bits-ui";
    import {X, ArrowUpToLine, ArrowDownToLine, FoldVertical, AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, ZoomOut, ZoomIn, Square, PanelLeftDashed, PanelLeftRightDashed} from "lucide-svelte";
    import ParagraphIndent from "$lib/icons/ParagraphIndent.svelte";
    import ParagraphSpaced from "$lib/icons/ParagraphSpaced.svelte";    

    let {
        onClassesChange,
        hideFromIndex = $bindable(false),
        hideTitle = $bindable(false),
        width = $bindable("full"), //  Ancho de texto: full | narrow | right-column
        verticalAlign = $bindable("top"), // Alineación vertical: top | center | bottom
        textAlign = $bindable("justify"), // Alineación de texto: justify | left | center | right
        paragraphStyle = $bindable("indent"), // Estilo de párrafos: indent | spaced
        textSize = $bindable("normal"), // Tamaño de texto: normal | small | large
    } = $props();

    function onChange() {
        onClassesChange({
            hideFromIndex,
            hideTitle,
            width,
            verticalAlign,
            textAlign,
            textSize,
            paragraphStyle,
        });
    }

    
</script>

<div class="content">
        <header class="section-form-header">
            <span class="menu-header">Estilo de esta sección</span>
            <Popover.Close class="close-btn" type="button" aria-label="Cerrar" title="Cerrar">
                <X size={14} />
            </Popover.Close>
        </header>
        <div class="options-form hue-rotation-children">
            <label for="section-hide-from-index" class="checkbox-inline">
                <input
                    id="section-hide-from-index"
                    type="checkbox"
                    bind:checked={hideFromIndex}
                    onchange={onChange}
                />
                <span>No mostrar en índice</span>
            </label>

            <div>
                <label for="section-hide-title" class="checkbox-inline">
                <input
                    id="section-hide-title"
                    type="checkbox"
                    bind:checked={hideTitle}
                    onchange={onChange}
                />
                    <span>Ocultar título</span>
                </label>
                {#if hideTitle}
                    <p class="small-text align-hint">
                        En el editor seguirás viendo el título para mantener la
                        legibilidad y organización, aunque al exportar no se mostrará.
                    </p>
                {/if}
            </div>

            <div class="form-toggle-field">
                <label class="form-group-label">Ancho</label>
                <ToggleGroup.Root
                    type="single"
                    bind:value={width}
                    class="view-toggle section-toggle"
                    aria-label="Ancho"
                    onValueChange={onChange}
                >
                    <ToggleGroup.Item value="full" class="view-toggle-item" aria-label="Completo">
                        <Square size={14} />
                        <span>Completo</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="narrow" class="view-toggle-item" aria-label="Estrecho">
                        <PanelLeftRightDashed size={14} />
                        <span>Estrecho</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="right-column" class="view-toggle-item" aria-label="Columna derecha">
                        <PanelLeftDashed size={14} />
                        <span>Col. derecha</span>
                    </ToggleGroup.Item>
                </ToggleGroup.Root>
            </div>

            <div class="form-toggle-field">
                <label class="form-group-label">Alineación vertical</label>
                <ToggleGroup.Root
                    type="single"
                    bind:value={verticalAlign}
                    class="view-toggle section-toggle"
                    aria-label="Alineación vertical"
                    onValueChange={onChange}
                >
                    <ToggleGroup.Item value="top" class="view-toggle-item" aria-label="Arriba">
                        <ArrowUpToLine size={14} />
                        <span>Arriba</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="center" class="view-toggle-item" aria-label="Centro">
                        <FoldVertical size={14} />
                        <span>Centro</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="bottom" class="view-toggle-item" aria-label="Inferior">
                        <ArrowDownToLine size={14} />
                        <span>Inferior</span>
                    </ToggleGroup.Item>
                </ToggleGroup.Root>
                {#if verticalAlign === "center" || verticalAlign === "bottom"}
                    <p class="small-text align-hint" in:fly={{ y: -4, duration: 200 }} out:fly={{ y: -4, duration: 150 }}>
                        Usar solo con textos cortos
                    </p>
                {/if}
            </div>

            <div class="form-toggle-field">
                <label class="form-group-label">Alineación de texto</label>
                <ToggleGroup.Root
                    type="single"
                    bind:value={textAlign}
                    class="view-toggle section-toggle"
                    aria-label="Alineación de texto"
                    onValueChange={onChange}
                >
                    <ToggleGroup.Item value="justify" class="view-toggle-item" aria-label="Justificado">
                        <AlignJustify size={14} />
                        <span>Justificado</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="left" class="view-toggle-item" aria-label="Izquierda">
                        <AlignLeft size={14} />
                        <span>Izquierda</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="center" class="view-toggle-item" aria-label="Centrado">
                        <AlignCenter size={14} />
                        <span>Centrado</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="right" class="view-toggle-item" aria-label="Derecha">
                        <AlignRight size={14} />
                        <span>Derecha</span>
                    </ToggleGroup.Item>
                </ToggleGroup.Root>
            </div>

            <div class="form-toggle-field">
                <label class="form-group-label">Texto</label>
                <ToggleGroup.Root
                    type="single"
                    bind:value={textSize}
                    class="view-toggle section-toggle"
                    aria-label="Tamaño de texto"
                    onValueChange={onChange}
                >
                    <ToggleGroup.Item value="normal" class="view-toggle-item" aria-label="Normal">
                        <Type size={14} />
                        <span>Normal</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="small" class="view-toggle-item" aria-label="Pequeño">
                        <ZoomOut size={14} />
                        <span>Pequeño</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="large" class="view-toggle-item" aria-label="Grande">
                        <ZoomIn size={14} />
                        <span>Grande</span>
                    </ToggleGroup.Item>
                </ToggleGroup.Root>
            </div>

            <div class="form-toggle-field">
                <label class="form-group-label">Párrafos</label>
                <ToggleGroup.Root
                    type="single"
                    bind:value={paragraphStyle}
                    class="view-toggle section-toggle"
                    aria-label="Estilo de párrafos"
                    onValueChange={onChange}
                >
                    <ToggleGroup.Item value="indent" class="view-toggle-item" aria-label="Sangría primera línea">
                        <ParagraphIndent size={14} />
                        <span>Sangría 1ª línea</span>
                    </ToggleGroup.Item>
                    <ToggleGroup.Item value="spaced" class="view-toggle-item" aria-label="Separados">
                        <ParagraphSpaced size={14} />
                        <span>Separados</span>
                    </ToggleGroup.Item>
                </ToggleGroup.Root>
            </div>
        </div>
    </div>

<style>
/* estilos personalizados para este form:
- cambiamos el color de fondo de los segmented a secondary-color
- para la opción por defecto, el color de fondo será más transparente (#7fd7bc3d) para que no destaque, así resaltamos las opciones diferntes a la por defecto
*/
:global(.form-toggle-field .view-toggle .view-toggle-item[data-state="on"]) {
 background-color: var(--color-secondary);
}
:global(.form-toggle-field .view-toggle .view-toggle-item[data-state="on"]):first-child {
 background-color: #d2f0e7c9;
}

.options-form {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    --bg-muted:#fafafa;
}
</style>