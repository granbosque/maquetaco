<script>
    import { createEpubBlob } from "$lib/converters/md-to-epub.js";
    import EpubViewer from "./EpubViewer.svelte";
    import { Book } from "lucide-svelte";

    let {
        documentHtml = "",
        css = "",
        bodyClass = "",
        metadata = {},
        isLoading = $bindable(false),
    } = $props();

    let epubUrl = $state(null);
    let lastEpubHash = $state('');

    $effect(() => {
        // Crear hash de todas las dependencias para detectar cambios relevantes
        const hash = JSON.stringify({
            html: documentHtml?.substring(0, 100),
            css: css?.substring(0, 100),
            bodyClass,
            title: metadata?.title,
            author: metadata?.author
        });

        // Solo regenerar si realmente cambió algo
        if (hash !== lastEpubHash && documentHtml) {
            lastEpubHash = hash;
            generateEpub();
        }
    });

    async function generateEpub() {
        if (!documentHtml) return;

        try {
            isLoading = true;

            // Generar el blob EPUB
            const blob = await createEpubBlob(
                metadata,
                documentHtml,
                metadata["cover-image"],
                css,
                bodyClass,
            );

            // Revocar URL anterior para limpiar memoria
            if (epubUrl) {
                URL.revokeObjectURL(epubUrl);
            }

            // Crear nueva URL para el visor
            epubUrl = URL.createObjectURL(blob);

        } catch (err) {
            console.error("Error generating EPUB preview:", err);
        } finally {
            isLoading = false;
        }
    }
    
    // Cleanup de la URL al desmontar
    $effect(() => {
        return () => {
             if (epubUrl) URL.revokeObjectURL(epubUrl);
        };
    });
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