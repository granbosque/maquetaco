<script>
	import "$lib/styles/reset.css";
	import "$lib/styles/tokens-minimal.css";
	import "$lib/styles/layout.css";
	import "$lib/styles/components-minimal.css";

	let { children } = $props();
</script>

<svelte:head>

</svelte:head>

{@render children()}
