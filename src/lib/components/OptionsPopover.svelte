<script>
    import { Popover } from "bits-ui";
    import SectionStyleForm from "./SectionStyleForm.svelte";
    import { actualizarClasesEnLineaMarkdown } from "$lib/utils/markdown";
  import { appState } from "$lib/stores/appState.svelte";
    /**
     * Si se pasa el snippet trigger, el popover usa ese contenido como botón y triggerClass para el trigger.
     * Si no, se usa triggerLabel como texto y la clase por defecto "popover-trigger".
     */
    let { trigger, triggerClass = "", triggerLabel = "Opciones",
           tocItem = $bindable(null)
     } = $props();


     function onClassesChange(newOptions) {


        const managedClasses = ["no-toc", "no-title", "narrow", "right-column", "vcenter", "vbottom", "text-left", "text-center", "text-right", "text-small", "text-large", "paragraph-spaced"];

        const newClases = [];
        if (newOptions.hideFromIndex) newClases.push("no-toc");
        if (newOptions.hideTitle) newClases.push("no-title");
        if (newOptions.width=="narrow") newClases.push("narrow"); else if (newOptions.width=="right-column") newClases.push("right-column"); // para full no se añade clase
        if (newOptions.verticalAlign=="center") newClases.push("vcenter"); else if (newOptions.verticalAlign=="bottom") newClases.push("vbottom"); // para top no se añade clase
        if (newOptions.textAlign=="left") newClases.push("text-left"); else if (newOptions.textAlign=="center") newClases.push("text-center"); else if (newOptions.textAlign=="right") newClases.push("text-right"); // para 'justify' no se añade clase
        if (newOptions.textSize=="small") newClases.push("text-small"); else if (newOptions.textSize=="large") newClases.push("text-large"); // para normal no se añade clase
        if (newOptions.paragraphStyle=="spaced") newClases.push("paragraph-spaced"); // para indent (defecto) no se añade clase

        /* Si han cambiado los valores del formulario, hay que actualizar el markdown.
          - No modificamos tocItem.classes; se regenera automáticamente a partir del markdown.
          - appState.config.content es la "fuente de verdad"; las clases del h1 deben quedar ahí, sin borrar id ni clases no manejadas.
          - Los valores por defecto del formulario NO tienen clase correspondiente.

          Datos:
          1. appState.config.content = markdown completo; tocItem.line = número de línea del h1 (1-based).
          2. tocItem.classes = lista de clases actuales de ese encabezado (antes del cambio).
          3. En esa línea del md está el heading con atributos Pandoc: {.clase1 .clase2 #id opcional}.

          Proceso:
          1. Leer la línea tocItem.line del content y extraer: texto del título, clases actuales, id si existe.
          2. Clases finales = (clases actuales que NO estén en managedClasses) + newClases.
             - Quitar solo las manejadas que ya no estén en newClases.
             - Mantener todas las no manejadas (añadidas a mano).
             - Añadir las de newClases (los valores por defecto no aportan clase).
          3. Reconstruir la línea con el bloque {.clase1 .clase2 ...} (y #id si existía) y reemplazarla en appState.config.content.
        */

        const currentClasses = tocItem?.classes ?? [];
        const clasesParaEliminar = currentClasses.filter(
            (c) => managedClasses.includes(c) && !newClases.includes(c)
        );
        const clasesParaAñadir = newClases.filter(
            (c) => !currentClasses.includes(c)
        );

        const lineas = appState.config.content.split(/\r?\n/);
        const indice = tocItem.line - 1;
        const lineaOriginal = indice >= 0 && indice < lineas.length ? lineas[indice] : tocItem.text;
        const lineaActualizada = actualizarClasesEnLineaMarkdown(lineaOriginal, clasesParaAñadir, clasesParaEliminar);

        // reemplazamos a través del editor y eso actualiza appstate
        appState.editorController.replaceLine(tocItem.line, lineaActualizada);
        /* alternativa 
        if (indice >= 0 && indice < lineas.length) {
            lineas[indice] = lineaActualizada;
            appState.config.content = lineas.join("\n");
        }*/

        
    }
            

</script>

<Popover.Root>
    <Popover.Trigger class={trigger ? triggerClass : "popover-trigger"}>
        {#if trigger}
            {@render trigger()}
        {:else}
            {triggerLabel}
        {/if}
    </Popover.Trigger>
    <Popover.Portal>
        <Popover.Content class="popover-content" sideOffset={8} side="bottom" align="end">
            <!-- sin bind, solo pasamos los valores para los campos del formulario,
                 y además un evento para cuando se hace algún cambio.
                 No es buena idea enlazar directamente con tocItem.classes, porque también hay que modificar el markdown,
                 así que el evento modifica appstate.content y reactivamente se actualiza appstate.toc

                 Para las propieades que son mutuamente excluyentes, pasamos solamente una de ellas, y solo si es diferente del valor por defecto (el primero)
             -->
                
            <SectionStyleForm 
                onClassesChange={onClassesChange}
                hideFromIndex={tocItem?.classes?.includes("no-toc")} 
                hideTitle={tocItem?.classes?.includes("no-title")}
                width={tocItem?.classes?.includes("narrow") ? "narrow" : tocItem?.classes?.includes("right-column") ? "right-column" : 'full'} 
                verticalAlign={tocItem?.classes?.includes("vcenter") ? "center" : tocItem?.classes?.includes("vbottom") ? "bottom" : 'top'}
                textAlign={tocItem?.classes?.includes("text-center") ? "center" : tocItem?.classes?.includes("text-right") ? "right" : 'justify'}
                textSize={tocItem?.classes?.includes("text-small") ? "small" : tocItem?.classes?.includes("text-large") ? "large" : 'normal'}
                paragraphStyle={tocItem?.classes?.includes("paragraph-spaced") ? "spaced" : 'indent'}
                />
        </Popover.Content>
    </Popover.Portal>
</Popover.Root>

<style>
    
    :global(.popover-content) {
        z-index: 50;
        width: 26rem;
        padding: 0.5rem;
        padding-top: 0;
        background: var(--bg-surface);
        border: 1px solid var(--border-muted);
        border-radius: var(--radius-lg);
        box-shadow:
            0 0 0 1px rgba(0, 0, 0, 0.03),
            0 4px 12px rgba(0, 0, 0, 0.06),
            0 12px 40px -8px rgba(0, 0, 0, 0.12),
            0 24px 64px -16px rgba(0, 0, 0, 0.08);
    }


</style>
