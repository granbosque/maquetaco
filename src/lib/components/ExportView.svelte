<script>
    /*
      Componente principal de exportación que muestra una vista previa
      y permite guardar los documentos generados.

      Nota: a diferencia de PreviewView.svelte, que es una vista previa aproximada,
      aquí si vemos el documento final exacto, con la disposición de páginas, etc)
      y tal cual se va a guardar.
      (¿sería buena idea cambmiar el tab "Vista previa" por algo como a "Revisar" o "Diseño"?)
      
      Funcionalidad:
      1. Permite seleccionar el formato de exportación (PDF, EPUB, etc.) desde una lista de formatos
         preconfigurados que vienenn en exportFormats. 
      
      2. Convierte el contenido markdown del editor a HTML usando convertDocument, 
         y luego aplica la plantilla html y css (uno o varios) correspondientes según el formato seleccionado.
         Los formatos de exportación pueden ser pdf o epub, pero todos se basan en convertir antes a html.
         En el futuro quizás se añada exportación a docx u odt, que seguramente también parta del html y no del markdown.
      
      3. Si no hay portada, genera automáticamente una imagen svg básica con el mismo tipo de letra elegido.
      
      4. Muestra una vista previa del documento usando PdfPreview o EpubPreview según el formato de salida
      
      5. - Para exportar a PDF: se pasa documentHtml y previewCss a PdfPreview, que genera el HTML final 
            con paged.js y lo muestra en un iframe. Sirve tanto como vista previa como documento final a guardar.
          - Para exportar a EPUB: hay dos flujos separados:
            * Vista previa: se pasa documentHtml, css, bodyClass y metadata a EpubPreview, que genera 
              el blob EPUB internamente usando createEpubBlob() y lo muestra en un visor.
            * Descarga: al hacer clic en exportar, handleEpubExport() llama a downloadEpub() que genera 
              el blob y lo descarga directamente.
          
    Nota: este archivo está muy parcheado y el flujo es confuso, se puede mejorar mucho.
    
        - La generación de EPUB está duplicada (createEpubBlob en EpubPreview y exportToEpub en 
            downloadEpub). Sería mejor centralizar esto para que sea más legible y mantenible.
        
        - El HTML final (no el intermedio) se genera en:
            * PDF: PdfPreview.generateFullDocument() (paged-renderer.js) - crea el HTML completo 
            con DOCTYPE, head, scripts de paged.js, etc.
            * EPUB: EpubBook.createChapterDocument() (EpubBook.js) - convierte documentHtml en 
            archivos XHTML estructurados por capítulos dentro del ZIP EPUB.
            

        También pendiente unificar css.


      ---
     
      Reactividad:
      
        El componente es reactivo a cambios desde fuera: appState y styleSettings:
        Los estilos se pueden cambiar desde la página de Edición, la de vista previa y desde esta misma.
        
        Estado local: formato seleccionado, referencia al preview PDF, estados de carga/error, imagne de portada
      
      Valores derivados: se recalculan automáticamente cuando cambian sus dependencias:
        * Formato seleccionado y si es EPUB o PDF
        * HTML del contenido (markdown convertido)
        * Metadatos del documento (título, autor, TOC, etc.) y la imagen de portada
        * HTML con template aplicado (si el formato lo requiere)
        * CSS combinado del formato y configuraciones de usuario
     */

    import { appState } from "$lib/stores/appState.svelte.js";
    import { styleSettings } from "$lib/stores/styleSettings.svelte.js";
    import { convertDocument } from "$lib/converters/md-to-html.js";
    import { renderCustomTemplate } from "$lib/converters/template-engine.js";
    import { downloadEpub } from "$lib/converters/md-to-epub.js";
    import { exportFormats } from "$lib/config/export-formats.js";
    import { exportFonts } from "$lib/config/export-fonts.js";
    import { generateDefaultCover } from "$lib/utils/cover-generator.js";
    import PdfPreview from "$lib/components/PdfPreview.svelte";
    import EpubPreview from "$lib/components/EpubPreview.svelte";
    import StyleSelectors from "$lib/components/StyleSelectors.svelte";
    import {
        Printer,
        Monitor,
        FileText,
        Smartphone,
        BookOpen,
        Download,
        Loader2,
    } from "lucide-svelte";

    const icons = { Monitor, FileText, Printer, Smartphone, BookOpen };
    
    let selectedThemeId = $state(exportFormats[1].id);
    let pdfPreviewRef = $state(null);
    let isLoading = $state(false);
    let error = $state(null);
    let coverImageCache = $state(null);

    let selectedTheme = $derived(
        exportFormats.find((t) => t.id === selectedThemeId) || exportFormats[1]
    );

    let isEpubFormat = $derived(selectedTheme.type === "epub");

    let contentHtml = $derived.by(() => {
        const { html } = convertDocument(
            appState.config.content,
            appState.config.lang || "es"
        );
        return html;
    });

    let metadata = $derived.by(() => {
        const h1Count = (contentHtml.match(/<h1/g) || []).length;
        
        const toc = appState.config.enableTOC !== undefined
            ? appState.config.enableTOC
            : h1Count > 2;

        return {
            title: appState.config.title || "Sin título",
            author: appState.config.author || "",
            publisher: appState.config.publisher || "",
            copyright: appState.config.copyright || "",
            dedication: appState.config.dedication || "",
            colophon: appState.config.colophon || "",
            date: appState.config.date || "",
            lang: appState.config.lang || "es",
            includeBranding: appState.config.includeBranding !== false,
            toc,
            tocDepth: appState.config.tocDepth || 1,
            paragraphStyleClass: styleSettings.paragraphStyleClass,
            "cover-image": coverImageCache,
        };
    });

    let documentHtml = $derived.by(() => {
        if (selectedTheme.template) {
            return renderCustomTemplate(
                selectedTheme.template,
                metadata,
                contentHtml
            );
        }
        return contentHtml;
    });

    let previewCss = $derived(
        selectedTheme.css +
        (selectedTheme.headerPresets ? styleSettings.headerStyleCss : "") +
        styleSettings.fontOverrideCSS
    );

    $effect(() => {
        const _title = appState.config.title;
        const _author = appState.config.author;
        const _imagePreview = appState.config.imagePreview;
        const _fontId = styleSettings.fontId;
        const _font = styleSettings.font;

        let cancelled = false;

        (async () => {
            if (_imagePreview) {
                if (!cancelled) coverImageCache = _imagePreview;
            } else {
                const fontFamily = _font ? _font.family : exportFonts[0].family;
                const cover = await generateDefaultCover(
                    _title || "Sin título",
                    _author || "",
                    fontFamily,
                    _fontId
                );
                if (!cancelled) coverImageCache = cover;
            }
        })();

        return () => {
            cancelled = true;
        };
    });

    function handlePrint() {
        pdfPreviewRef?.print();
    }

    async function handleEpubExport() {
        try {
            isLoading = true;
            error = null;
            
            await downloadEpub(
                {
                    ...appState.config,
                    imagePreview: appState.config.imagePreview || coverImageCache
                },
                {
                    css: selectedTheme.css,
                    bodyClass: styleSettings.paragraphStyleClass,
                }
            );
        } catch (e) {
            error = e.message;
            console.error("Error generando EPUB:", e);
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="export-view">
    <!-- Side Panel -->
    <aside class="export-sidebar panel">
        <!-- Scrollable content area -->
        <div class="sidebar-content">
            <!-- Format Selector -->
            <section>
                <div class="panel-header"><h2>Formato de salida</h2></div>
                <div class="format-list">
                    {#each exportFormats as theme}
                        <button
                            class="format-item"
                            class:selected={selectedThemeId === theme.id}
                            onclick={() => selectedThemeId = theme.id}
                        >
                            <svelte:component this={icons[theme.icon]} size={18} />
                            <span>{theme.name}</span>
                        </button>
                    {/each}
                </div>
            </section>

            <!-- Style Options -->
            <section>
                <div class="panel-header"><h2>Opciones de estilo</h2></div>
                <StyleSelectors availableHeaderPresets={selectedTheme.headerPresets} />
            </section>
        </div>

        <!-- Fixed footer with description and button -->
        <div class="sidebar-footer">
            <p class="format-description">{selectedTheme.description}</p>
            {#if selectedTheme.type === "pdf"}
                <p class="format-hint">
                    Se abrirá el diálogo de impresión. Selecciona "Guardar como PDF".
                </p>
            {/if}
            <button
                class="toolbar-btn primary export-btn"
                onclick={selectedTheme.type === "epub"
                    ? handleEpubExport
                    : handlePrint}
                disabled={isLoading}
            >
                {#if isLoading}
                    <Loader2 size={16} class="spin" />
                {:else if selectedTheme.type === "epub"}
                    <Download size={16} />
                {:else}
                    <Printer size={16} />
                {/if}
                {selectedTheme.buttonText}
            </button>
        </div>
    </aside>

    <!-- Preview Area -->
    <div class="preview-area">
        {#if isEpubFormat}
            <EpubPreview
                {documentHtml}
                css={selectedTheme.css}
                bodyClass={styleSettings.paragraphStyleClass}
                {metadata}
                bind:isLoading
            />
        {:else}
            <PdfPreview
                bind:this={pdfPreviewRef}
                {documentHtml}
                css={previewCss}
                scale={selectedTheme.previewScale ?? 1}
                bind:isLoading
                bind:error
            />
        {/if}
    </div>
</div>

<style>
    .export-view {
        display: flex;
        height: 100%;
        width: 100%;
        background: var(--bg-app);
    }

    .export-sidebar {
        position: absolute;
        left: 1rem;
        top: 1rem;
        bottom: 1rem;
        width: 280px;
        display: flex;
        flex-direction: column;
        background: var(--bg-surface);
        border: 1px solid var(--border-muted);
        border-radius: var(--radius-lg);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        z-index: 20;
        overflow: hidden;
    }

    .sidebar-content {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
        scrollbar-gutter: stable;
    }

    .sidebar-content section {
        border-bottom: 1px solid var(--border-muted);
    }

    .sidebar-content section:last-child {
        border-bottom: none;
    }

    .sidebar-content .panel-header {
        padding-bottom: 0;
    }

    /* Format List */
    .format-list {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
        padding: 0.375rem;
        background: #f4f4f469;
        border-radius: var(--radius);
        margin: 0.25rem 0.5rem 0.5rem;
    }

    .format-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--text-muted);
        border-radius: var(--radius);
        transition: background var(--transition), color var(--transition);
        text-align: left;
    }

    .format-item:hover {
        background: var(--bg-muted);
    }

    .format-item.selected {
        color: var(--text);
        background: rgba(102, 187, 106, 0.2);
    }

    /* Sidebar Footer */
    .sidebar-footer {
        flex-shrink: 0;
        padding: 0.75rem;
        border-top: 1px solid var(--border-muted);
        background: var(--bg-surface);
    }

    .format-description {
        margin: 0 0 0.5rem;
        font-size: 0.75rem;
        color: var(--text-muted);
        line-height: 1.5;
    }

    .format-hint {
        margin: 0 0 0.5rem;
        font-size: 0.65rem;
        color: var(--text-subtle);
        line-height: 1.4;
    }

    .export-btn {
        width: 100%;
        justify-content: center;
        font-size: 0.8125rem;
        padding: 0.625rem;
    }

    .preview-area {
        flex: 1;
        position: relative;
        display: flex;
    }

    /* loading-overlay, status-msg, and spin animation are now in components-minimal.css */
</style>
