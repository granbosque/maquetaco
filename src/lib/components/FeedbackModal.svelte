<script>
    import { AlertDialog } from "bits-ui";
    import { X, Send, CheckCircle2, AlertCircle } from "lucide-svelte";

    let { open = $bindable(false) } = $props();

    let isLoading = $state(false);
    let success = $state(false);
    let error = $state(null);

    async function handleSubmit(e) {
        e.preventDefault();
        isLoading = true;
        error = null;

        const formData = new FormData(e.target);

        try {
            const response = await fetch("https://formspree.io/f/xrebqeak", {
                method: "POST",
                body: formData,
                headers: {
                    Accept: "application/json",
                },
            });

            if (response.ok) {
                success = true;
                e.target.reset();
                setTimeout(() => {
                    open = false;
                    // Reset success state after closing so it's fresh next time
                    setTimeout(() => (success = false), 500);
                }, 2000);
            } else {
                const data = await response.json();
                if (Object.hasOwn(data, "errors")) {
                    error = data["errors"]
                        .map((error) => error["message"])
                        .join(", ");
                } else {
                    error = "Ha ocurrido un error al enviar el mensaje.";
                }
            }
        } catch (err) {
            error = "Error de conexión. Por favor inténtalo de nuevo.";
        } finally {
            isLoading = false;
        }
    }
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Portal>
        <AlertDialog.Overlay class="overlay" />
        <AlertDialog.Content class="modal">
            <header class="header">
                <AlertDialog.Title class="title">
                    Enviar feedback
                </AlertDialog.Title>
                <AlertDialog.Cancel class="close-btn" aria-label="Cerrar modal">
                    <X size={20} />
                </AlertDialog.Cancel>
            </header>

            {#if success}
                <div class="success-message">
                    <CheckCircle2 size={48} class="success-icon" />
                    <h3>¡Mensaje enviado!</h3>
                    <p>Gracias por tus comentarios.</p>
                </div>
            {:else}
                <form onsubmit={handleSubmit} class="feedback-form">
                    <div class="field">
                        <label for="email">Tu email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            placeholder="nombre@ejemplo.com"
                        />
                    </div>

                    <div class="field">
                        <label for="message">Mensaje</label>
                        <textarea
                            id="message"
                            name="message"
                            required
                            placeholder="Cuéntanos tus sugerencias o problemas..."
                            rows="4"
                        ></textarea>
                    </div>

                    {#if error}
                        <div class="error-message">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    {/if}

                    <div class="actions">
                        <button
                            type="submit"
                            class="submit-btn"
                            disabled={isLoading}
                        >
                            {#if isLoading}
                                Enviando...
                            {:else}
                                <Send size={16} />
                                Enviar
                            {/if}
                        </button>
                    </div>
                </form>
            {/if}
        </AlertDialog.Content>
    </AlertDialog.Portal>
</AlertDialog.Root>

<style>
    /* Overlay */
    :global(.overlay) {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        z-index: 60;
    }

    /* Modal */
    :global(.modal) {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: min(90vw, 400px);
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.2);
        z-index: 61;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        animation: appear 0.2s ease-out;
    }

    @keyframes appear {
        from {
            opacity: 0;
            transform: translate(-50%, -48%) scale(0.96);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    :global(.title) {
        font-family: var(--font-title, serif);
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--text, #333);
        margin: 0;
    }

    :global(.close-btn) {
        background: transparent;
        border: none;
        color: var(--text-muted, #999);
        cursor: pointer;
        padding: 0.25rem;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
    }

    :global(.close-btn:hover) {
        background: var(--bg-muted, #f5f5f5);
        color: var(--text, #333);
    }

    /* Form */
    .feedback-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }

    label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text, #333);
    }

    input,
    textarea {
        width: 100%;
        padding: 0.6rem 0.8rem;
        border: 1px solid var(--border, #ddd);
        border-radius: 8px;
        font-family: inherit;
        font-size: 0.95rem;
        background: var(--bg-surface, #fff);
        transition:
            border-color 0.2s,
            box-shadow 0.2s;
        box-sizing: border-box; /* Important! */
    }

    input:focus,
    textarea:focus {
        outline: none;
        border-color: var(--color-primary, #ffc800);
        box-shadow: 0 0 0 3px rgba(255, 200, 0, 0.15);
    }

    textarea {
        resize: vertical;
        min-height: 80px;
    }

    .error-message {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #ef4444;
        font-size: 0.875rem;
        background: #fef2f2;
        padding: 0.5rem;
        border-radius: 6px;
    }

    .actions {
        margin-top: 0.5rem;
        display: flex;
        justify-content: flex-end;
    }

    .submit-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.25rem;
        background: var(--color-primary, #ffc800);
        color: rgba(0, 0, 0, 0.8);
        font-weight: 600;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(255, 200, 0, 0.25);
    }

    .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    /* Success State */
    .success-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        padding: 2rem 0;
        gap: 0.5rem;
        color: #059669;
    }

    :global(.success-icon) {
        margin-bottom: 0.5rem;
    }

    .success-message h3 {
        margin: 0;
        font-size: 1.25rem;
    }

    .success-message p {
        margin: 0;
        color: var(--text-muted, #666);
    }
</style>
