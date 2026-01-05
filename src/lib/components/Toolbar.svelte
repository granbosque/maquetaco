<script>
    import { Toolbar, ToggleGroup } from "bits-ui";
    import { PenLine, Eye, Rocket, Info } from "lucide-svelte";
    import logo from "$lib/assets/logo.svg";

    let {
        activeView = "editor",
        onViewChange = (view) => {},
        onInfo = () => {},
    } = $props();
</script>

<Toolbar.Root class="toolbar">
    <!-- IZQUIERDA: Logo -->
    <div class="logo-title">
        <img src={logo} alt="Maquetaco logo" class="logo" />
        <h1>Maquetaco</h1>
    </div>

    <!-- CENTRO: Toggle de vistas -->
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

    /* Grupo visual de botones */
    .button-group {
        display: flex;
        align-items: center;
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
