<script>
    import StructurePanel from "$lib/components/StructurePanel.svelte";
    import EditorPanel from "$lib/components/EditorPanel.svelte";
    import ConfigPanel from "$lib/components/ConfigPanel.svelte";
    import { browser } from "$app/environment";

    let {
        onImport = () => {},
        onSave = () => {},
        onClear = () => {},
    } = $props();

    // Panel visibility state
    let leftPanelOpen = $state(true);
    let rightPanelOpen = $state(true);

    // Overlay mode detection (based on breakpoints)
    // Left panel: overlay at ≤1160px
    // Right panel: overlay at ≤880px
    let leftInOverlay = $state(false);
    let rightInOverlay = $state(false);

    // Detect screen size on mount and resize
    $effect(() => {
        if (!browser) return;

        // Estado inicial de overlay
        let wasLeftOverlay = window.innerWidth <= 1160;
        let wasRightOverlay = window.innerWidth <= 880;

        // Actualizar estado reactivo inicial
        leftInOverlay = wasLeftOverlay;
        rightInOverlay = wasRightOverlay;

        // Si iniciamos en pantalla pequeña, asegurar que empiecen cerrados
        if (wasLeftOverlay) leftPanelOpen = false;
        if (wasRightOverlay) rightPanelOpen = false;

        function updateOverlayState() {
            const isLeftOverlay = window.innerWidth <= 1160;
            const isRightOverlay = window.innerWidth <= 880;

            // Detectar cruce hacia overlay (grande -> pequeño)
            // Si pasamos de NO overlay a SÍ overlay, cerramos el panel
            if (!wasLeftOverlay && isLeftOverlay) {
                leftPanelOpen = false;
            }

            if (!wasRightOverlay && isRightOverlay) {
                rightPanelOpen = false;
            }

            // Actualizar estado reactivo
            leftInOverlay = isLeftOverlay;
            rightInOverlay = isRightOverlay;

            // Actualizar estado anterior para la próxima comparación
            wasLeftOverlay = isLeftOverlay;
            wasRightOverlay = isRightOverlay;
        }

        window.addEventListener("resize", updateOverlayState);

        return () => window.removeEventListener("resize", updateOverlayState);
    });

    // Toggle functions
    function toggleLeftPanel() {
        leftPanelOpen = !leftPanelOpen;
    }

    function toggleRightPanel() {
        rightPanelOpen = !rightPanelOpen;
    }
</script>

<main class="editor-view">
    <StructurePanel open={leftPanelOpen} onClose={toggleLeftPanel} />
    <EditorPanel
        {onImport}
        {onSave}
        {onClear}
        {leftPanelOpen}
        {rightPanelOpen}
        {toggleLeftPanel}
        {toggleRightPanel}
        {leftInOverlay}
        {rightInOverlay}
    />
    <ConfigPanel open={rightPanelOpen} onClose={toggleRightPanel} />
</main>

<style>
    .editor-view {
        flex: 1;
        display: flex;
        min-height: 0;
        gap: 0;
        padding: 0;
        position: relative;
        overflow: hidden;
    }
</style>
