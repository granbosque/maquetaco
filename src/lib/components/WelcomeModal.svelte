<script>
    import { AlertDialog } from "bits-ui";
    import {
        FileText,
        PencilRuler,
        BookText,
        ChevronRight,
        Code2,
        Laptop,
        ShieldCheck,
        Github,
        BookOpen,
        MessageSquare,
    } from "lucide-svelte";
    import logo from "$lib/assets/logo.svg";
    import FeedbackModal from "./FeedbackModal.svelte";

    let { open = $bindable(false) } = $props();
    let dontShowAgain = $state(true);
    let showFeedback = $state(false);

    function handleStart() {
        if (dontShowAgain) {
            try {
                localStorage.setItem("maquetaco_welcome_seen", "true");
            } catch (e) {
                console.error("Local storage error:", e);
            }
        }
        open = false;
    }
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Portal>
        <AlertDialog.Overlay class="overlay" />
        <AlertDialog.Content class="modal">
            <!-- Header -->
            <header class="header">
                <img src={logo} alt="Maquetaco" class="logo" />
                <AlertDialog.Title class="title">
                    <span class="highlight">Maquetaco</span>
                </AlertDialog.Title>
                <AlertDialog.Description class="subtitle">
                    Un documento, múltiples formatos: EPUB, PDF digital o PDF
                    para imprenta. Todo desde tu navegador.
                </AlertDialog.Description>
                <div class="trust-badges">
                    <span class="badge"><Code2 size={12} /> Código abierto</span
                    >
                    <span class="badge"><Laptop size={12} /> 100% local</span>
                    <span class="badge"><ShieldCheck size={12} /> Privado</span>
                </div>
            </header>

            <!-- Steps -->
            <div class="steps">
                <div class="step">
                    <div class="step-icon import">
                        <FileText size={32} strokeWidth={2.5} />
                    </div>
                    <strong>Importar</strong>
                    <span>Word o Markdown</span>
                </div>
                <ChevronRight size={20} class="arrow" />
                <div class="step">
                    <div class="step-icon edit">
                        <PencilRuler size={32} strokeWidth={2.5} />
                    </div>
                    <strong>Maquetar</strong>
                    <span>Ajustar estilos</span>
                </div>
                <ChevronRight size={20} class="arrow" />
                <div class="step">
                    <div class="step-icon export">
                        <BookText size={32} strokeWidth={2.5} />
                    </div>
                    <strong>Exportar</strong>
                    <span>PDF o EPUB</span>
                </div>
            </div>

            <!-- CTA -->
            <div class="cta-container">
                <AlertDialog.Action onclick={handleStart} class="cta">
                    Comenzar
                    <ChevronRight size={18} />
                </AlertDialog.Action>
                <p class="cta-hint">
                    Al comenzar se cargará una guía de inicio
                </p>
            </div>

            <!-- Footer -->
            <footer class="footer">
                <label class="checkbox">
                    <input type="checkbox" bind:checked={dontShowAgain} />
                    <span class="check"></span>
                    <span class="label">No volver a mostrar</span>
                </label>

                <div class="footer-links">
                    <a
                        href="https://www.markdownguide.org/basic-syntax/"
                        target="_blank"
                        rel="noopener"
                        class="footer-link"
                        title="Guía Markdown"
                    >
                        <BookOpen size={16} />
                    </a>
                    <a
                        href="https://github.com/granbosque/maquetaco"
                        target="_blank"
                        rel="noopener"
                        class="footer-link"
                        title="Ver en GitHub"
                    >
                        <Github size={16} />
                    </a>
                    <button
                        onclick={() => (showFeedback = true)}
                        class="footer-link"
                        title="Enviar sugerencia"
                    >
                        <MessageSquare size={16} />
                    </button>
                </div>
            </footer>
        </AlertDialog.Content>
    </AlertDialog.Portal>
</AlertDialog.Root>

<FeedbackModal bind:open={showFeedback} />

<style>
    /* Overlay */
    :global(.overlay) {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(6px);
        z-index: 1000;
    }

    /* Modal */
    :global(.modal) {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: min(90vw, 540px);
        background: linear-gradient(180deg, #fffdf5 0%, #fff 40%);
        border-radius: 24px;
        padding: 2rem;
        box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.15);
        z-index: 1001;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        animation: appear 0.3s ease-out;
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

    /* Header */
    .header {
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
    }

    .logo {
        width: 80px;
        height: 80px;
        margin-bottom: 0.25rem;
    }

    :global(.title) {
        font-family: var(--font-title);
        font-size: 2rem;
        font-weight: 700;
        color: var(--text);
        margin: 0;
    }

    .highlight {
        color: #555;
    }

    :global(.subtitle) {
        color: var(--text-muted);
        font-size: 1rem;
        line-height: 1.5;
        max-width: 420px;
        margin: 0;
    }

    .trust-badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: center;
        margin-top: 0.5rem;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem; /* Better spacing for icon */
        font-size: 0.75rem;
        color: var(--text-muted);
        background: var(--bg-muted);
        padding: 0.25rem 0.75rem;
        border-radius: 99px;
        line-height: 1; /* Help vertical alignment */
    }

    /* Steps */
    .steps {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1.5rem 1rem;
        background: transparent;
        border-radius: 16px;
    }

    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
        text-align: center;
        flex: 1;
    }

    .step-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.5rem;
        transition: transform 0.2s;
    }

    .step:hover .step-icon {
        transform: scale(1.1);
    }

    .step-icon.import {
        color: #dc8a5b;
    }

    .step-icon.edit {
        color: #5d9b93;
    }

    .step-icon.export {
        color: #6b8fc9;
    }

    .step strong {
        font-size: 0.875rem;
        color: var(--text);
    }
    .step span {
        font-size: 0.75rem;
        color: var(--text-muted);
    }

    :global(.arrow) {
        color: var(--text-subtle);
        flex-shrink: 0;
    }

    /* Footer */
    .footer {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding-top: 1rem;
    }

    .checkbox {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .checkbox input {
        display: none;
    }

    .check {
        width: 18px;
        height: 18px;
        background: white;
        border: 2px solid var(--border);
        border-radius: 4px;
        flex-shrink: 0;
    }

    .check::after {
        content: "✓";
        color: rgba(0, 0, 0, 0.7);
        font-size: 0.7rem;
        font-weight: bold;
        display: none;
    }

    .checkbox input:checked ~ .check {
        background: var(--color-primary);
        border-color: var(--color-primary);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .checkbox input:checked ~ .check::after {
        display: block;
    }

    .checkbox .label {
        font-size: 0.8125rem;
        color: var(--text-muted);
    }

    .footer-links {
        display: flex;
        gap: 0.75rem;
    }

    .footer-link {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        color: var(--text-muted);
        text-decoration: none;
        background: transparent;
        transition: all 0.2s;
        border: none;
        padding: 0;
        cursor: pointer;
    }

    .footer-link:hover {
        background: var(--bg-muted);
        color: var(--text);
        transform: translateY(-1px);
    }

    /* CTA */
    .cta-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }

    .cta-hint {
        font-size: 0.75rem;
        color: var(--text-muted);
        margin: 0;
    }

    :global(.cta) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        height: 3rem;
        padding: 0 2rem;
        background: var(--color-primary);
        color: rgba(0, 0, 0, 0.8);
        font-size: 1rem;
        font-weight: 700;
        border: none;
        border-radius: 99px;
        cursor: pointer;
        transition:
            transform 0.15s,
            box-shadow 0.15s;
    }

    :global(.cta:hover) {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(255, 200, 0, 0.4);
    }

    /* Responsive */
    @media (max-width: 540px) {
        .steps {
            flex-direction: column;
            gap: 1rem;
        }
        :global(.arrow) {
            transform: rotate(90deg);
        }
        .footer {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }
    }
</style>
