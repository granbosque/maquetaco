<script>
    import { Copyright, MessageSquare, Github } from "lucide-svelte";
    import { appState } from "$lib/stores/appState.svelte.js";
    import FeedbackModal from "./FeedbackModal.svelte";

    let showFeedback = $state(false);
</script>

<footer class="statusbar">
    <span class="status-text">
        {appState.config.fileName}
        {#if appState.config.isDirty}
            - Modificado
        {/if}
    </span>
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
    /* icon-btn styles are now in components-minimal.css */
</style>
