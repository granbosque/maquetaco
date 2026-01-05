<script>
    import StructurePanel from "$lib/components/StructurePanel.svelte";
    import EditorPanel from "$lib/components/EditorPanel.svelte";
    import ConfigPanel from "$lib/components/ConfigPanel.svelte";

    let {
        onImport = () => {},
        onSave = () => {},
        onClear = () => {},
    } = $props();

    // Panel visibility state
    let leftPanelOpen = $state(true);
    let rightPanelOpen = $state(true);

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
    />
    <ConfigPanel open={rightPanelOpen} onClose={toggleRightPanel} />
</main>

<style>
    .editor-view {
        flex: 1;
        display: flex;
        min-height: 0;
        gap: 0.5em;
        padding: 0.5rem 0.5em;
        position: relative;
    }
</style>
