<script>
	import "$lib/styles/reset.css";
	import "$lib/styles/tokens-minimal.css";
	import "$lib/styles/layout.css";
	import "$lib/styles/components-minimal.css";

	let { children } = $props();
</script>

<svelte:head>
	<link
		href="https://api.fontshare.com/v2/css?f[]=kola@400,700&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://api.fontshare.com/v2/css?f[]=pally@400,700&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@300;400;500;600;700&display=swap"
		rel="stylesheet"
	/>
	<link
		href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@200;300;400;500&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{@render children()}
