<script>
    import { slide } from "svelte/transition";
    import { AlertTriangle, X } from "lucide-svelte";
    import { onMount } from "svelte";
    import { checkBrowserCompatibility } from "$lib/utils/browser-compatibility.js";

    let open = $state(false);
    let issues = $state([]);

    onMount(() => {
        const compatibility = checkBrowserCompatibility();
        if (compatibility.hasIssues) {
            issues = compatibility.issues;
            open = true;
        }
    });

    function handleClose() {
        open = false;
    }

    $effect(() => {
        if (open && issues.length > 0) {
            const timer = setTimeout(() => (open = false), 8000);
            return () => clearTimeout(timer);
        }
    });
</script>

{#if open && issues.length > 0}
    <div class="toast" transition:slide={{ axis: "y", duration: 300 }}>
        <AlertTriangle size={20} class="icon" />
        <div class="content">
            <div class="">Puede que este navegador tenga problemas al generar archivos PDF.</div>
            <div class="">Se han detectados las siguientes incompatibilidades:</div>
            {#each issues as issue}
                <p>- {issue}</p>
            {/each}
            <div class="small-text">Usa una navegador moderno (Firefox, Chrome, Safari, etc.) para asegurarte de que todo funcione correctamente.</div>
            
        </div>
        <button class="close" onclick={handleClose} aria-label="Cerrar">
            <X size={16} />
        </button>
    </div>
{/if}

