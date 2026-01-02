<script>
    import StructurePanel from "$lib/components/StructurePanel.svelte";
    import EditorPanel from "$lib/components/EditorPanel.svelte";
    import ConfigPanel from "$lib/components/ConfigPanel.svelte";
</script>

<main class="editor-view">
    <StructurePanel />
    <EditorPanel />
    <ConfigPanel />
</main>

<style>
    .editor-view {
        flex: 1;
        display: flex;
        min-height: 0;
        gap: 0.75em;
        padding: 0.5rem 0.75em;
    }
</style>
