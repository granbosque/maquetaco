<script>
    import { Label, AspectRatio, Tooltip } from "bits-ui";
    import { Info, X } from "lucide-svelte";
    import { appState } from "$lib/stores/appState.svelte.js";
    import { resizeImage } from "$lib/utils/image-processing.js";

    // Props
    let { open = true, onClose = () => {} } = $props();

    let fileInput;
    let isDragging = $state(false); // Estado local, solo afecta a este panel

    function handleImageChange(event) {
        const file = event.target.files?.[0];
        if (file) {
            loadImage(file);
        }
    }

    async function loadImage(file) {
        try {
            appState.config.imagePreview = await resizeImage(file);
        } catch (e) {
            console.error("Error procesando imagen:", e);
        }
    }

    function handleDragOver(event) {
        event.preventDefault();
        isDragging = true;
    }

    function handleDragLeave(event) {
        event.preventDefault();
        isDragging = false;
    }

    function handleDrop(event) {
        event.preventDefault();
        event.stopPropagation(); // Evitar que el drop global también se dispare
        isDragging = false;

        const file = event.dataTransfer?.files?.[0];
        if (file && file.type.startsWith("image/")) {
            loadImage(file);
        }
    }

    function openFileDialog() {
        fileInput?.click();
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openFileDialog();
        }
    }
</script>

<section class="panel secondary side-panel right" class:collapsed={!open}>
    <div class="panel-header">
        <h2>Configuración</h2>
        <div class="actions">
            <button class="close-btn" onclick={onClose} title="Cerrar panel">
                <X size="16" />
            </button>
        </div>
    </div>
    <Tooltip.Provider>
        <div class="content">
            <!-- Portada -->
            <Label.Root>
                Imagen de portada
                <input
                    bind:this={fileInput}
                    type="file"
                    accept="image/*"
                    onchange={handleImageChange}
                    style="display: none;"
                />
            </Label.Root>

            <div
                style="height: 7em; aspect-ratio: 3 / 4; width: auto; margin: 0 auto;"
                class="dropzone"
                class:dragging={isDragging}
                ondragover={handleDragOver}
                ondragleave={handleDragLeave}
                ondrop={handleDrop}
                onclick={openFileDialog}
                onkeydown={handleKeyDown}
                role="button"
                tabindex="0"
            >
                {#if appState.config.imagePreview}
                    <img
                        src={appState.config.imagePreview}
                        alt="Vista previa"
                    />
                {:else}
                    <p style="font-size: 0.6rem;">
                        Arrastra una imagen o pulsa para abrir
                    </p>
                {/if}
            </div>

            <!-- Información básica -->
            <Label.Root for="title">
                Título
                <input
                    id="title"
                    type="text"
                    bind:value={appState.config.title}
                    placeholder="Título del documento"
                />
            </Label.Root>

            <Label.Root for="author">
                Autor
                <input
                    id="author"
                    type="text"
                    bind:value={appState.config.author}
                    placeholder="Nombre del autor"
                />
            </Label.Root>

            <Label.Root for="publisher">
                Editorial (Opcional)
                <input
                    id="publisher"
                    type="text"
                    bind:value={appState.config.publisher}
                    placeholder="Nombre de la editorial"
                />
            </Label.Root>

            <Label.Root for="copyright">
                <span class="label-with-hint">
                    Créditos y derechos
                    <Tooltip.Root openDelay={300}>
                        <Tooltip.Trigger class="hint-icon">
                            <Info size={14} />
                        </Tooltip.Trigger>
                        <Tooltip.Content class="tooltip">
                            Copyright, ISBN, editorial, créditos de portada,
                            corrección, etc. Estos datos se mostrarán en la
                            primera página del documento.
                        </Tooltip.Content>
                    </Tooltip.Root>
                </span>
                <textarea
                    id="copyright"
                    rows="1"
                    class="expandable"
                    bind:value={appState.config.copyright}
                    placeholder="© 2025 · ISBN: 978... · Editorial XYZ · Portada: ..."
                ></textarea>
            </Label.Root>

            <label for="toc" class="checkbox-inline">
                <input
                    id="toc"
                    type="checkbox"
                    bind:checked={appState.config.toc}
                />
                <span>Generar índice</span>
            </label>

            <!-- Metadatos de contenido -->
            <Label.Root for="dedication">
                <span class="label-with-hint">
                    Dedicatoria / Epígrafe
                    <Tooltip.Root openDelay={300}>
                        <Tooltip.Trigger class="hint-icon">
                            <Info size={14} />
                        </Tooltip.Trigger>
                        <Tooltip.Content class="tooltip">
                            Texto breve que aparecerá en su propia página al
                            inicio (dedicatoria) o antes del contenido
                            (epígrafe).
                        </Tooltip.Content>
                    </Tooltip.Root>
                </span>
                <textarea
                    id="dedication"
                    rows="3"
                    class="expandable"
                    bind:value={appState.config.dedication}
                    placeholder="Para..."
                ></textarea>
            </Label.Root>

            <!-- Metadatos técnicos -->
            <Label.Root for="colophon">
                <span class="label-with-hint">
                    Colofón
                    <Tooltip.Root openDelay={300}>
                        <Tooltip.Trigger class="hint-icon">
                            <Info size={14} />
                        </Tooltip.Trigger>
                        <Tooltip.Content class="tooltip">
                            Texto final del libro (imprenta, tipografía,
                            agradecimientos finales, etc.).
                        </Tooltip.Content>
                    </Tooltip.Root>
                </span>
                <textarea
                    id="colophon"
                    rows="3"
                    class="expandable"
                    bind:value={appState.config.colophon}
                    placeholder="Impreso en..."
                ></textarea>
            </Label.Root>

            <Label.Root for="date">
                <span class="label-with-hint">
                    Fecha
                    <Tooltip.Root openDelay={300}>
                        <Tooltip.Trigger class="hint-icon">
                            <Info size={14} />
                        </Tooltip.Trigger>
                        <Tooltip.Content class="tooltip">
                            Solo visible en metadatos (EPUB, PDF).
                        </Tooltip.Content>
                    </Tooltip.Root>
                </span>
                <input
                    id="date"
                    type="number"
                    min="1900"
                    max="2100"
                    bind:value={appState.config.date}
                    placeholder="2025"
                />
            </Label.Root>

            <Label.Root for="lang">
                <span class="label-with-hint">
                    Idioma
                    <Tooltip.Root openDelay={300}>
                        <Tooltip.Trigger class="hint-icon">
                            <Info size={14} />
                        </Tooltip.Trigger>
                        <Tooltip.Content class="tooltip">
                            Código de idioma. Afecta a la división silábica y
                            accesibilidad.
                        </Tooltip.Content>
                    </Tooltip.Root>
                </span>
                <select id="lang" bind:value={appState.config.lang}>
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="it">Italiano</option>
                    <option value="pt">Português</option>
                    <option value="ca">Català</option>
                    <option value="gl">Galego</option>
                    <option value="eu">Euskara</option>
                </select>
            </Label.Root>

            <!-- Branding checkbox -->
            <label for="includeBranding" class="checkbox-inline">
                <input
                    id="includeBranding"
                    type="checkbox"
                    bind:checked={appState.config.includeBranding}
                />
                <span>Incluir "Maquetado con Maquetaco"</span>
            </label>
        </div>
    </Tooltip.Provider>
</section>
