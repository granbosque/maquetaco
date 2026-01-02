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
            const selectedText = doc.sliceString(from, to);

            // Use helper to find enclosing StrongEmphasis node
            const { strongNode } = findFormattingNodes(from, to);

            let changes;
            let newCursorPos = null;

            if (strongNode) {
                // We are inside bold. Remove the ** markers.
                const nodeFrom = strongNode.from;
                const nodeTo = strongNode.to;
                const fullText = doc.sliceString(nodeFrom, nodeTo);
                // Remove the markers (first 2 and last 2 chars)
                const innerText = fullText.slice(2, -2);
                changes = {
                    from: nodeFrom,
                    to: nodeTo,
                    insert: innerText
                };
            } else {
                // Fallback: Check if cursor is between empty markers ****
                // (syntax tree won't recognize empty emphasis)
                const before = doc.sliceString(Math.max(0, from - 2), from);
                const after = doc.sliceString(to, Math.min(doc.length, to + 2));

                if (from === to && before === '**' && after === '**') {
                    // We're inside empty bold markers, remove them
                    changes = {
                        from: from - 2,
                        to: to + 2,
                        insert: ''
                    };
                } else {
                    // Not inside bold. Add ** around selection.
                    changes = {
                        from: from,
                        to: to,
                        insert: `**${selectedText}**`
                    };
                    // If no text selected, place cursor in the middle
                    if (from === to) {
                        newCursorPos = from + 2; // After the opening **
                    }
                }
            }

            const transaction = { changes, userEvent: "input.format.bold", scrollIntoView: true };
            if (newCursorPos !== null) {
                transaction.selection = EditorSelection.cursor(newCursorPos);
            }
            view.dispatch(transaction);
            view.focus();
        },
        toggleItalic() {
            if (!view) return;
            const { from, to } = view.state.selection.main;
            const doc = view.state.doc;
            const selectedText = doc.sliceString(from, to);

            // Use helper to find enclosing Emphasis node
            const { emphasisNode } = findFormattingNodes(from, to);

            let changes;
            let newCursorPos = null;

            if (emphasisNode) {
                // We are inside italic. Remove the * markers.
                const nodeFrom = emphasisNode.from;
                const nodeTo = emphasisNode.to;
                const fullText = doc.sliceString(nodeFrom, nodeTo);
                // Remove the markers (first 1 and last 1 char)
                const innerText = fullText.slice(1, -1);
                changes = {
                    from: nodeFrom,
                    to: nodeTo,
                    insert: innerText
                };
            } else {
                // Fallback: Check if cursor is between empty markers **
                // (syntax tree won't recognize empty emphasis)
                const before = doc.sliceString(Math.max(0, from - 1), from);
                const after = doc.sliceString(to, Math.min(doc.length, to + 1));

                // Make sure we're not inside bold markers (** before and after)
                const before2 = doc.sliceString(Math.max(0, from - 2), from);
                const after2 = doc.sliceString(to, Math.min(doc.length, to + 2));
                const isInsideBoldMarkers = before2 === '**' && after2 === '**';

                if (from === to && before === '*' && after === '*' && !isInsideBoldMarkers) {
                    // We're inside empty italic markers, remove them
                    changes = {
                        from: from - 1,
                        to: to + 1,
                        insert: ''
                    };
                } else {
                    // Not inside italic. Add * around selection.
                    changes = {
                        from: from,
                        to: to,
                        insert: `*${selectedText}*`
                    };
                    // If no text selected, place cursor in the middle
                    if (from === to) {
                        newCursorPos = from + 1; // After the opening *
                    }
                }
            }

            const transaction = { changes, userEvent: "input.format.italic", scrollIntoView: true };
            if (newCursorPos !== null) {
                transaction.selection = EditorSelection.cursor(newCursorPos);
            }
            view.dispatch(transaction);
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
