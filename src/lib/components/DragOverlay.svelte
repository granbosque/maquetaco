<script>
    import { fade, scale } from "svelte/transition";
    import { FileText, File, Image } from "lucide-svelte";
</script>

<div class="drag-overlay" transition:fade={{ duration: 250 }}>
    <div
        class="border-container"
        transition:scale={{ start: 0.98, duration: 250 }}
    >
        <div class="content">
            <div class="icons">
                <div class="icon-item">
                    <FileText size={48} strokeWidth={1.5} />
                    <span>Word</span>
                </div>
                <div class="icon-item">
                    <File size={48} strokeWidth={1.5} />
                    <span>Markdown</span>
                </div>
                <div class="icon-item">
                    <Image size={48} strokeWidth={1.5} />
                    <span>Imágenes</span>
                </div>
            </div>
            <h2>Suelta para abrir</h2>
        </div>
    </div>
</div>

<style>
    .drag-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(4px);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        pointer-events: none;
        padding: 2rem;
        box-sizing: border-box;
    }

    :global(.dark) .drag-overlay {
        background-color: rgba(0, 0, 0, 0.9);
    }

    .border-container {
        width: 100%;
        height: 100%;
        border: 3px dashed var(--border);
        border-radius: 1rem;
        display: flex;
        justify-content: center;
        align-items: center;
        background: var(--bg-paper);
    }

    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        color: var(--text);
    }

    .icons {
        display: flex;
        gap: 3rem;
        align-items: center;
    }

    .icon-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        color: var(--text-light);
    }

    .icon-item span {
        font-size: 0.875rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 500;
        color: var(--text);
    }
</style>
