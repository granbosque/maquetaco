<script>
    import { Copyright, MessageSquare, Github } from "lucide-svelte";
    import { appState } from "$lib/stores/appState.svelte.js";
    import FeedbackModal from "./FeedbackModal.svelte";

    let showFeedback = $state(false);
</script>

<footer class="statusbar">
    <span class="status-text">{appState.config.fileName}</span>
    <div class="status-icons">
        <a
            href="https://github.com/granbosque/maquetaco"
            target="_blank"
            aria-label="GitHub"
        >
            <Github />
        </a>
        <button
            onclick={() => (showFeedback = true)}
            class="icon-btn"
            aria-label="Enviar feedback"
        >
            <MessageSquare />
        </button>
        <span class="copyright">
            <Copyright />
            <span>2025</span>
        </span>
    </div>
</footer>

<FeedbackModal bind:open={showFeedback} />

<style>
    .icon-btn {
        background: none;
        border: none;
        padding: 0;
        margin: 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        color: inherit;
        font: inherit;
    }

    .icon-btn:hover {
        opacity: 0.8;
    }
</style>
