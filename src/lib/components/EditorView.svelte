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

        function updateOverlayState() {
            const isLeftOverlay = window.innerWidth <= 1160;
            const isRightOverlay = window.innerWidth <= 880;

            // Lógica smart de paneles al cruzar breakpoints
            // Si pasamos de Desktop -> Overlay: CERRAR
            if (isLeftOverlay && !leftInOverlay) leftPanelOpen = false;
            if (isRightOverlay && !rightInOverlay) rightPanelOpen = false;

            // Si pasamos de Overlay -> Desktop: ABRIR
            if (!isLeftOverlay && leftInOverlay) leftPanelOpen = true;
            if (!isRightOverlay && rightInOverlay) rightPanelOpen = true;

            leftInOverlay = isLeftOverlay;
            rightInOverlay = isRightOverlay;
        }

        updateOverlayState();
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
