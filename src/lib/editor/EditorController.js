/**
 * EditorController interface (duck-typing)
 * 
 * @typedef {Object} EditorController
 * @property {(line: number) => void} scrollToLine - Scroll to a specific line
 * @property {() => void} focus - Focus the editor
 * @property {() => {from: number, to: number} | null} getSelection - Get current selection
 */

/**
 * Null controller (no-op) - usado cuando no hay editor registrado
 * @type {EditorController}
 */
export const nullController = {
    scrollToLine(line) {
        console.warn('EditorController: Editor no inicializado, no se puede navegar a línea', line);
    },
    focus() {
        console.warn('EditorController: Editor no inicializado');
    },
    getSelection() {
        return null;
    }
};
