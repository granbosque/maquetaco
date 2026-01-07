/**
 * CodeMirror 6 implementation of EditorController
 * 
 * El EditorView se obtiene a través del evento `onready` 
 * del componente svelte-codemirror-editor.
 */

import { EditorView } from "@codemirror/view";
import { EditorSelection } from "@codemirror/state";

import { syntaxTree } from "@codemirror/language";

/**
 * Crea un controller para una instancia de CodeMirror 6
 * @param {EditorView} view - La instancia de EditorView
 * @returns {import('./EditorController.js').EditorController}
 */
export function createCodeMirrorController(view) {

    /**
     * Helper: Find the innermost formatting node (StrongEmphasis or Emphasis) 
     * that contains the given range [from, to].
     * Returns { strongNode, emphasisNode } or nulls.
     */
    function findFormattingNodes(from, to) {
        let strongNode = null;
        let emphasisNode = null;

        try {
            const tree = syntaxTree(view.state);

            // Check at multiple positions to catch edge cases
            const positions = [from];
            if (to > from) {
                positions.push(to - 1); // Inside the selection
                positions.push(Math.floor((from + to) / 2)); // Middle
            }

            for (const pos of positions) {
                let node = tree.resolveInner(pos, 0); // 0 = no preference

                while (node) {
                    if ((node.name === 'StrongEmphasis' || node.name === 'Strong') && !strongNode) {
                        // Verify the node actually contains our range
                        if (node.from <= from && node.to >= to) {
                            strongNode = node;
                        }
                    }
                    if (node.name === 'Emphasis' && !emphasisNode) {
                        if (node.from <= from && node.to >= to) {
                            emphasisNode = node;
                        }
                    }
                    node = node.parent;
                }
            }
        } catch (e) {
            console.warn("Error finding formatting nodes:", e);
        }

        return { strongNode, emphasisNode };
    }

    return {
        /**
         * Returns the current formatting state at the cursor position
         * @returns {{ bold: boolean, italic: boolean, blockType: 'paragraph'|'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'quote' }}
         */
        getCurrentFormat() {
            if (!view) return { bold: false, italic: false, blockType: 'paragraph' };

            const { from, to } = view.state.selection.main;
            const line = view.state.doc.lineAt(from);
            const lineText = line.text;

            // Detect block type
            let blockType = 'paragraph';
            if (lineText.startsWith('# ')) blockType = 'h1';
            else if (lineText.startsWith('## ')) blockType = 'h2';
            else if (lineText.startsWith('### ')) blockType = 'h3';
            else if (lineText.startsWith('#### ')) blockType = 'h4';
            else if (lineText.startsWith('##### ')) blockType = 'h5';
            else if (lineText.startsWith('###### ')) blockType = 'h6';
            else if (lineText.startsWith('> ')) blockType = 'quote';

            // Detect inline styles using helper
            const { strongNode, emphasisNode } = findFormattingNodes(from, to);

            return {
                blockType,
                bold: strongNode !== null,
                italic: emphasisNode !== null
            };
        },
        scrollToLine(lineNumber) {
            if (!view) return;
            try {
                const line = view.state.doc.line(lineNumber);
                view.dispatch({
                    selection: EditorSelection.cursor(line.from),
                    effects: EditorView.scrollIntoView(line.from, { y: 'center' })
                });
            } catch (e) {
                console.warn('CodeMirrorController: No se pudo navegar a línea', lineNumber, e);
            }
        },
        focus() {
            view?.focus();
        },
        getSelection() {
            if (!view) return null;
            const sel = view.state.selection.main;
            return { from: sel.from, to: sel.to };
        },
        toggleBold() {
            if (!view) return;
            const { from, to } = view.state.selection.main;
            const doc = view.state.doc;
            const tree = syntaxTree(view.state);

            // Find all Strong nodes in or overlapping the range
            const nodesToUnwrap = [];
            
            // 1. Check for node strictly containing selection (using updated helper logic internally or manual check)
            // We use the existing helper logic for "inside" detection
            const { strongNode } = findFormattingNodes(from, to);
            if (strongNode) nodesToUnwrap.push(strongNode);

            // 2. Iterate to find nodes fully inside or overlapping
            tree.iterate({
                from, to,
                enter: (node) => {
                    if (node.name === 'StrongEmphasis' || node.name === 'Strong') {
                        // Avoid duplicates
                        if (!nodesToUnwrap.some(n => n.from === node.from && n.to === node.to)) {
                            nodesToUnwrap.push(node.node);
                        }
                    }
                }
            });

            if (nodesToUnwrap.length > 0) {
                // Remove formatting from all found nodes
                // We create changes in reverse order to avoid offset issues? 
                // CodeMirror handles multiple changes nicely if we pass them in one dispatch.
                const changes = nodesToUnwrap.map(node => {
                    const nodeText = doc.sliceString(node.from, node.to);
                    // Detect marker length (2 for ** or __)
                    let markerLen = 2;
                    if (nodeText.startsWith('**') || nodeText.startsWith('__')) {
                        return [
                            { from: node.from, to: node.from + markerLen, insert: '' },
                            { from: node.to - markerLen, to: node.to, insert: '' }
                        ];
                    }
                    return [];
                }).flat();

                view.dispatch({ changes, userEvent: "input.format.bold.remove", scrollIntoView: true });
            } else {
                // Apply formatting
                // Check edge case: selection around empty markers **** (not parsed as Strong)
                const expandedSel = doc.sliceString(Math.max(0, from - 2), Math.min(doc.length, to + 2));
                const surroundedByEmpty = from === to && expandedSel === '****';
                
                if (surroundedByEmpty) {
                     view.dispatch({
                        changes: { from: from - 2, to: to + 2, insert: '' },
                        userEvent: "input.format.bold.remove", 
                        scrollIntoView: true 
                    });
                } else {
                    const selectedText = doc.sliceString(from, to);
                    view.dispatch({
                        changes: { from, to, insert: `**${selectedText}**` },
                        selection: from === to ? EditorSelection.cursor(from + 2) : undefined,
                        userEvent: "input.format.bold.add",
                        scrollIntoView: true
                    });
                }
            }
            view.focus();
        },
        toggleItalic() {
            if (!view) return;
            const { from, to } = view.state.selection.main;
            const doc = view.state.doc;
            const tree = syntaxTree(view.state);

            const nodesToUnwrap = [];
            
            const { emphasisNode } = findFormattingNodes(from, to);
            if (emphasisNode) nodesToUnwrap.push(emphasisNode);

            tree.iterate({
                from, to,
                enter: (node) => {
                    if (node.name === 'Emphasis') {
                        if (!nodesToUnwrap.some(n => n.from === node.from && n.to === node.to)) {
                            nodesToUnwrap.push(node.node);
                        }
                    }
                }
            });

            if (nodesToUnwrap.length > 0) {
                const changes = nodesToUnwrap.map(node => {
                    const nodeText = doc.sliceString(node.from, node.to);
                    let markerLen = 1;
                     // Detect if it is actually bold markers being misinterpreted? 
                     // CodeMirror markdown parser distinguishes Strong (** or __) vs Emphasis (* or _).
                     // However, we should check we aren't breaking anything.
                    return [
                        { from: node.from, to: node.from + markerLen, insert: '' },
                        { from: node.to - markerLen, to: node.to, insert: '' }
                    ];
                }).flat();

                view.dispatch({ changes, userEvent: "input.format.italic.remove", scrollIntoView: true });
            } else {
                 const expandedSel = doc.sliceString(Math.max(0, from - 1), Math.min(doc.length, to + 1));
                 // Check we are not inside **** from bold
                 const expandedSel2 = doc.sliceString(Math.max(0, from - 2), Math.min(doc.length, to + 2));
                 
                 const surroundedByEmpty = from === to && expandedSel === '**' && expandedSel2 !== '****';

                 if (surroundedByEmpty) {
                     view.dispatch({
                        changes: { from: from - 1, to: to + 1, insert: '' },
                        userEvent: "input.format.italic.remove", 
                        scrollIntoView: true 
                    });
                 } else {
                    const selectedText = doc.sliceString(from, to);
                    view.dispatch({
                        changes: { from, to, insert: `*${selectedText}*` },
                        selection: from === to ? EditorSelection.cursor(from + 1) : undefined,
                        userEvent: "input.format.italic.add",
                        scrollIntoView: true
                    });
                 }
            }
            view.focus();
        },
        setBlockType(type) {
            if (!view) return;

            const { from, to } = view.state.selection.main;
            const lineObj = view.state.doc.lineAt(from);
            const lineText = lineObj.text;

            // Regex to match existing block prefixes:
            // Headers: #, ##, ...
            // Blockquote: >
            // Unordered list: - or * or + (optional, maybe not needed for this task but good to have)
            // Ordered list: 1. (optional)
            // We focus on what requested: h1-h6, p (normal), quote.

            // Matches:
            // 1. Optional whitespace
            // 2. The marker (#+, >, or nothing)
            // 3. One or more spaces
            const blockRegex = /^(\s*)(#{1,6}|>)?(\s+)?/;
            const match = lineText.match(blockRegex);

            let newText = lineText;

            // Determine the clean content (without the marker)
            let contentStart = 0;
            if (match) {
                // matched[0] is the whole prefix.
                contentStart = match[0].length;
                // Special case: if line is just "#", content might be empty
            }
            const cleanContent = lineText.slice(contentStart);

            let prefix = "";
            switch (type) {
                case 'h1': prefix = "# "; break;
                case 'h2': prefix = "## "; break;
                case 'h3': prefix = "### "; break;
                case 'h4': prefix = "#### "; break;
                case 'h5': prefix = "##### "; break;
                case 'h6': prefix = "###### "; break;
                case 'quote': prefix = "> "; break;
                case 'paragraph': prefix = ""; break;
            }

            // Replace the line
            view.dispatch({
                changes: {
                    from: lineObj.from,
                    to: lineObj.to,
                    insert: prefix + cleanContent
                },
                userEvent: "input.format.block"
            });
            view.focus();
        }
    };
}
