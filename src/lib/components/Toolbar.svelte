<script>
    import { Toolbar, ToggleGroup } from "bits-ui";
    import { PenLine, Eye, Rocket, Info } from "lucide-svelte";
    import logo from "$lib/assets/logo.svg";
    import { getCurrentWindow } from "@tauri-apps/api/window";
    import WindowControls from "./WindowControls.svelte";

    let {
        activeView = "editor",
        onViewChange = (view) => {},
        onInfo = () => {},
    } = $props();

    // Detectar si estamos en Tauri
    const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

    function handleDragStart(e) {
        // Ignorar si el clic proviene de un botón o elemento interactivo
        if (e.target.closest('button, [role="button"]')) {
            return;
        }

        // Buscar el elemento draggable más cercano (para que funcione hijos como imgs o svgs)
        if (e.target.closest('[data-tauri-drag-region]')) {
            getCurrentWindow().startDragging();
        }
    }
</script>

<Toolbar.Root class="toolbar" data-tauri-drag-region onmousedown={handleDragStart}>
    <!-- IZQUIERDA: Logo -->
    <div class="logo-title" data-tauri-drag-region>
        <img src={logo} alt="Maquetaco logo" class="logo" />
        <h1>Maquetaco</h1>
    </div>

    <!-- CENTRO: Toggle de vistas -->
    <div class="toolbar-center" data-tauri-drag-region>
        <ToggleGroup.Root
            type="single"
            value={activeView}
            onValueChange={(value) => value && onViewChange(value)}
            class="view-toggle"
        >
            <ToggleGroup.Item value="editor" class="view-toggle-item">
                <PenLine size={16} />
                <span>Editar</span>
            </ToggleGroup.Item>
            <ToggleGroup.Item value="preview" class="view-toggle-item">
                <Eye size={16} />
                <span>Vista previa</span>
            </ToggleGroup.Item>
            <ToggleGroup.Item value="export" class="view-toggle-item">
                <Rocket size={16} />
                <span>Generar</span>
            </ToggleGroup.Item>
        </ToggleGroup.Root>
    </div>

    <!-- DERECHA: Botón de info -->
    <div class="toolbar-right">
        <div class="button-group">
            <Toolbar.Button
                class="toolbar-btn icon-only"
                aria-label="Información"
                onclick={onInfo}
            >
                <Info />
            </Toolbar.Button>
        </div>
        
        <!-- Botones de control de ventana (Solo en Tauri) -->
        {#if isTauri}
            <WindowControls />
        {/if}
    </div>
</Toolbar.Root>

<style>
    :global(.toolbar) {
        width: 100%;
        display: flex;
        align-items: center;
    }





    .logo-title {
        flex: 1;
        display: flex;
        justify-content: flex-start;
    }

    .toolbar-center {
        display: flex;
        justify-content: center;
    }

    .toolbar-right {
        flex: 1;
        display: flex;
        justify-content: flex-end;
        align-items: stretch; /* Estirar hijos para que WindowControls ocupe toda la altura */
        gap: var(--space-sm);
        padding-right: 0; /* Asegurar que pegue al borde derecho */
    }

    /* Grupo visual de botones */
    .button-group {
        display: flex;
        align-items: center;
        align-self: center; /* Centrarse verticalmente dentro del contenedor estirado */
        background-color: var(--bg-muted);
        border-radius: 99px;
    }

    /* Botones dentro del grupo */
    :global(.button-group .toolbar-btn) {
        background-color: transparent;
        border-radius: 99px;
        padding: 8px 16px;
        font-size: 0.8125rem;
        font-weight: var(--weight-bold);
    }

    :global(.button-group .toolbar-btn:hover) {
        background-color: var(--bg-hover);
    }

    /* Responsive: reducir tamaño del toggle de vistas */
    @media (max-width: 768px) {
        :global(.view-toggle-item) {
            padding: var(--space-xs) var(--space-sm);
            font-size: var(--text-xs);
            gap: var(--space-xs);
        }
    }

    /* Responsive: ocultar iconos del toggle de vistas */
    @media (max-width: 640px) {
        :global(.view-toggle-item svg) {
            display: none;
        }

        :global(.view-toggle-item) {
            padding: var(--space-xs) var(--space-sm);
        }
    }

    /* Responsive: ocultar nombre del logo */
    @media (max-width: 680px) {
        .logo-title h1 {
            display: none;
        }
    }
</style>
