/**
 * Store compartido para configuraciones de estilo de exportación/preview
 * Usa Svelte 5 runes para reactividad
 */
import { exportFonts } from '$lib/config/export-fonts.js';
import { paragraphStyles } from '$lib/config/export-paragraph-styles.js';
import { headerStyles } from '$lib/config/export-header-styles.js';

// Estado reactivo compartido
let selectedFontId = $state(exportFonts[0].id);
let selectedParagraphStyleId = $state(paragraphStyles[0].id);
let selectedHeaderStyleId = $state(headerStyles[0].id);

export const styleSettings = {
    // Getters
    get fontId() { return selectedFontId; },
    get paragraphStyleId() { return selectedParagraphStyleId; },
    get headerStyleId() { return selectedHeaderStyleId; },

    // Setters
    set fontId(value) { selectedFontId = value; },
    set paragraphStyleId(value) { selectedParagraphStyleId = value; },
    set headerStyleId(value) { selectedHeaderStyleId = value; },

    // Computed: objeto de fuente completo
    get font() {
        return exportFonts.find(f => f.id === selectedFontId) || exportFonts[0];
    },

    // Computed: objeto de estilo de párrafo completo
    get paragraphStyle() {
        return paragraphStyles.find(s => s.id === selectedParagraphStyleId) || paragraphStyles[0];
    },

    // Computed: clase CSS para body
    get paragraphStyleClass() {
        const style = paragraphStyles.find(s => s.id === selectedParagraphStyleId);
        return style ? style.class : '';
    },

    // Computed: CSS para cabecera/pie seleccionado
    get headerStyleCss() {
        const style = headerStyles.find(s => s.id === selectedHeaderStyleId);
        return style ? style.css : '';
    },

    // Computed: CSS override para fuente
    get fontOverrideCSS() {
        const font = exportFonts.find(f => f.id === selectedFontId);
        if (!font) return '';
        // Georgia también necesita override porque los temas usan Garamond/Noto Serif por defecto
        return `\n:root { --body-font-family: ${font.family} !important; }\n`;
    }
};
