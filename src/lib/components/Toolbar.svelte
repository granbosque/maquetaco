<script>
    import { Toolbar, Separator, ToggleGroup } from "bits-ui";
    import {
        Upload,
        Download,
        Trash2,
        PenLine,
        Eye,
        Rocket,
        Info,
    } from "lucide-svelte";
    import logo from "$lib/assets/logo.svg";

    let {
        activeView = "editor",
        onViewChange = (view) => {},
        onImport = () => {},
        onSave = () => {},
        onClear = () => {},
        onInfo = () => {},
    } = $props();
</script>

<Toolbar.Root class="toolbar">
    <!-- IZQUIERDA: Logo -->
    <div class="logo-title">
        <img src={logo} alt="Maquetaco logo" class="logo" />
        <h1>Maquetaco</h1>
    </div>

    <!-- CENTRO: Toggle de vistas (con spacers para centrar) -->
    <div class="toolbar-center">
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

    <!-- DERECHA: Botones secundarios -->
    <div class="toolbar-right">
        {#if activeView === "editor"}
            <div class="button-group">
                <Toolbar.Button onclick={onImport} class="toolbar-btn tertiary">
                    <Upload />
                    <span>Abrir</span>
                </Toolbar.Button>
                <Toolbar.Button onclick={onSave} class="toolbar-btn tertiary">
                    <Download />
                    <span>Guardar</span>
                </Toolbar.Button>
                <Toolbar.Button onclick={onClear} class="toolbar-btn tertiary">
                    <Trash2 />
                    <span>Limpiar</span>
                </Toolbar.Button>
            </div>
        {/if}
        <div class="button-group">
            <Toolbar.Button
                class="toolbar-btn icon-only"
                aria-label="Información"
                onclick={onInfo}
            >
                <Info />
            </Toolbar.Button>
        </div>
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
        gap: var(--space-sm);
    }

    /* Grupo visual de botones (secundario) */
    .button-group {
        display: flex;
        align-items: center;
        background-color: var(--bg-muted);
        border-radius: 99px;
        animation: slideInFade 0.3s ease-out;
    }

    /* Botones dentro del grupo */
    :global(.button-group .toolbar-btn) {
        background-color: transparent;
        border-radius: 99px;
        padding: 8px 16px;
        font-size: 0.8125rem; /* 13px */
        font-weight: var(--weight-bold);
    }

    :global(.button-group .toolbar-btn:hover) {
        background-color: var(--bg-hover);
    }

    @keyframes slideInFade {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Responsive: reducir tamaño del toggle de vistas */
    @media (max-width: 768px) {
        :global(.view-toggle-item) {
            padding: var(--space-xs) var(--space-sm);
            font-size: var(--text-xs);
            gap: var(--space-xs);
        }
    }

    /* Responsive: ocultar iconos del toggle de vistas (mantener texto) */
    @media (max-width: 640px) {
        :global(.view-toggle-item svg) {
            display: none;
        }

        :global(.view-toggle-item) {
            padding: var(--space-xs) var(--space-sm);
        }
    }

    /* Responsive: ocultar etiquetas de botones secundarios */
    @media (max-width: 900px) {
        :global(.button-group .toolbar-btn.tertiary span) {
            display: none;
        }
    }

    /* Responsive: ocultar nombre del logo */
    @media (max-width: 680px) {
        .logo-title h1 {
            display: none;
        }
    }
</style>
