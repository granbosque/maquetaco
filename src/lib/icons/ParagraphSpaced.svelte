<script>
    /** @type {number} */
    let { size = 24 } = $props();
</script>

<svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
>
    <!-- Párrafo 1 -->
    <path d="M2 2H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M2 4.5H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M2 7H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M2 9.5H16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    
    <!-- Hueco visual (espacio entre párrafos) -->
    
    <!-- Párrafo 2 -->
    <path d="M2 14.5H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M2 17H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M2 19.5H22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M2 22H18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>
