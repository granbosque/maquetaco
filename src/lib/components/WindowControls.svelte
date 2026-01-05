<script>
    import { onMount } from 'svelte';
    import { Minus, Square, Copy, X } from 'lucide-svelte';
    import { getCurrentWindow } from '@tauri-apps/api/window';

    let isMaximized = $state(false);
    const appWindow = getCurrentWindow();

    async function checkMaximized() {
        isMaximized = await appWindow.isMaximized();
    }

    async function minimize() {
        await appWindow.minimize();
    }

    async function toggleMaximize() {
        await appWindow.toggleMaximize();
        // El estado se actualizará vía el evento de resize o la próxima comprobación
        setTimeout(checkMaximized, 100); 
    }

    async function close() {
        await appWindow.close();
    }

    onMount(() => {
        checkMaximized();
        
        // Escuchar cambios de tamaño para actualizar el icono de maximizar/restaurar
        // Esto cubre tanto el botón como atajos de teclado (Win+Up/Down) o snapping
        const cleanup = appWindow.listen('tauri://resize', checkMaximized);

        // Fallback usando evento nativo del navegador
        window.addEventListener('resize', checkMaximized);

        return () => {
            cleanup.then(unlisten => unlisten());
            window.removeEventListener('resize', checkMaximized);
        };
    });
</script>

<div class="window-controls" data-tauri-drag-region>
    <button class="control-btn" onclick={minimize} aria-label="Minimizar">
        <Minus size={16} />
    </button>

    <button class="control-btn" onclick={toggleMaximize} aria-label={isMaximized ? "Restaurar" : "Maximizar"}>
        {#if isMaximized}
            <Copy size={14} class="restore-icon" />
        {:else}
            <Square size={14} />
        {/if}
    </button>

    <button class="control-btn close-btn" onclick={close} aria-label="Cerrar">
        <X size={16} />
    </button>
</div>

<style>
    .window-controls {
        display: flex;
        /* Compensar padding del header global para pegar al borde */
        /* Añadimos 1px extra para asegurar que no queda rendija por redondeo subpíxel */
        margin-top: calc(var(--space-sm) * -1 - 1px);
        margin-bottom: calc(var(--space-sm) * -1);
        margin-right: calc(var(--space-lg) * -1);
        height: calc(100% + var(--space-sm) * 2 + 1px); /* Altura total + compensación vertical + 1px safety */
        align-items: flex-start; /* Pegar botones arriba */
        -webkit-app-region: no-drag; 
    }

    .control-btn {
        background: transparent;
        border: none;
        color: var(--text-foreground, #333); /* Fallback color */
        width: 46px;
        height: 30px; /* Altura estándar de Windows */
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: default; /* Los botones nativos no suelen tener pointer, pero default está bien */
        transition: background-color 0.1s;
        border-radius: 0; /* Important for windows native look */
    }

    /* Hover states standard Windows 10/11 */
    .control-btn:hover {
        background-color: rgba(0, 0, 0, 0.05);
    }

    :global(.dark) .control-btn:hover {
        background-color: rgba(255, 255, 255, 0.1);
    }

    /* Close button specific styles */
    .close-btn:hover {
        background-color: #e81123 !important;
        color: white !important;
    }

    /* Icon adjustments */
    .restore-icon {
        transform: rotate(180deg); /* Copy icon usually needs rotation to look like Restore */
    }
</style>
