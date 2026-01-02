<script>
    import { AlertDialog } from "bits-ui";

    let {
        open = $bindable(false),
        onConfirm,
        title = "¿Estás seguro?",
        description = "Esta acción no se puede deshacer.",
        confirmText = "Continuar",
        cancelText = "Cancelar",
    } = $props();

    function handleConfirm() {
        onConfirm?.();
        open = false;
    }
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Portal>
        <AlertDialog.Overlay class="alert-overlay" />
        <AlertDialog.Content class="alert-content">
            <AlertDialog.Title class="alert-title">{title}</AlertDialog.Title>
            <AlertDialog.Description class="alert-description">
                {description}
            </AlertDialog.Description>
            <div class="alert-actions">
                <AlertDialog.Cancel class="alert-btn cancel">
                    {cancelText}
                </AlertDialog.Cancel>
                <AlertDialog.Action
                    onclick={handleConfirm}
                    class="alert-btn confirm"
                >
                    {confirmText}
                </AlertDialog.Action>
            </div>
        </AlertDialog.Content>
    </AlertDialog.Portal>
</AlertDialog.Root>

<style>
    :global(.alert-overlay) {
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(2px);
        z-index: 50;
        animation: fade 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :global(.alert-content) {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 90vw;
        max-width: 450px;
        background-color: var(--bg-surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-lg);
        padding: 1.5rem;
        box-shadow: var(--shadow);
        z-index: 51;
        outline: none;
        animation: scale 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :global(.alert-title) {
        font-family: var(--font-title);
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 0.5rem;
    }

    :global(.alert-description) {
        color: var(--text-muted);
        font-size: 0.875rem;
        line-height: 1.5;
        margin-bottom: 1.5rem;
    }

    .alert-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }

    :global(.alert-btn) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius);
        font-size: 0.875rem;
        font-weight: 500;
        height: 2.25rem;
        padding-left: 1rem;
        padding-right: 1rem;
        transition: all 0.2s;
        cursor: pointer;
        border: none;
        outline: none;
    }

    :global(.alert-btn.cancel) {
        background-color: transparent;
        color: var(--text);
        border: 1px solid var(--border);
    }

    :global(.alert-btn.cancel:hover) {
        background-color: var(--bg-muted);
    }

    :global(.alert-btn.confirm) {
        background-color: var(--color-primary);
        color: white;
    }

    :global(.alert-btn.confirm:hover) {
        filter: brightness(1.1);
    }

    @keyframes fade {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes scale {
        from {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.96);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
</style>
