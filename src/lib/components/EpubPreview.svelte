<script>
    import { createEpubBlob } from "$lib/converters/md-to-epub.js";
    import EpubViewer from "./EpubViewer.svelte";
    import { Book } from "lucide-svelte";

    let {
        documentHtml = "",
        css = "",
        bodyClass = "",
        metadata = {},
        isLoading = $bindable(),
    } = $props();

    let epubUrl = $state(null);

    // Effect unificado: reactividad automática + cleanup
    $effect(() => {
        // Svelte rastrea automáticamente estos valores
        const _html = documentHtml;
        const _css = css;
        const _bodyClass = bodyClass;
        const _metadata = metadata;

        // Solo generar si hay contenido
        if (documentHtml?.trim()) {
            generateEpub();
        }

        // Cleanup al desmontar
        return () => {
            if (epubUrl) {
                URL.revokeObjectURL(epubUrl);
            }
        };
    });

    async function generateEpub() {
        try {
            isLoading = true;

            // Generar nuevo EPUB primero
            const blob = await createEpubBlob(
                metadata,
                documentHtml,
                metadata["cover-image"],
                css,
                bodyClass
            );

            // Crear nueva URL
            const newUrl = URL.createObjectURL(blob);

            // Limpiar URL anterior solo después de crear la nueva
            // Esto evita que el visor se desmonte temporalmente
            if (epubUrl) {
                URL.revokeObjectURL(epubUrl);
            }

            // Actualizar con la nueva URL
            epubUrl = newUrl;

        } catch (err) {
            console.error("Error generating EPUB preview:", err);
        } finally {
            isLoading = false;
        }
    }
</script>

{#if epubUrl}
    <EpubViewer 
        source={epubUrl} 
        title={metadata?.title}
        className="preview-layout"
    />
{:else if isLoading}
    <div class="loading-state preview-layout">
        <div class="loading-content">
            <Book size={48} class="loading-icon" />
            <p>Generando vista previa...</p>
        </div>
    </div>
{/if}

<style>
    /* Estilos específicos del layout de "Maquetaco" */
    :global(.preview-layout) {
        padding: var(--space-lg);
        padding-left: 17rem;
    }

    @media (max-width: 768px) {
        :global(.preview-layout) {
             padding-left: var(--space-lg);
        }
    }

    .loading-state {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .loading-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-lg);
        color: var(--text-muted);
    }

    :global(.loading-icon) { animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
</style>