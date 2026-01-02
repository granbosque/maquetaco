/**
 * Custom CodeMirror 6 theme for Maquetaco
 * Matches the app's warm, minimal aesthetic
 */

import { EditorView, Decoration, ViewPlugin, WidgetType } from "@codemirror/view";
import { tags } from "@lezer/highlight";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { RangeSetBuilder } from "@codemirror/state";

// === Frontmatter decoration ===
const frontmatterLineDecoration = Decoration.line({
    class: "cm-frontmatter-line"
});

const frontmatterFirstLineDecoration = Decoration.line({
    class: "cm-frontmatter-line cm-frontmatter-first"
});

const frontmatterLastLineDecoration = Decoration.line({
    class: "cm-frontmatter-line cm-frontmatter-last"
});

function findFrontmatter(doc) {
    const text = doc.toString();
    // Frontmatter must start at the beginning
    if (!text.startsWith("---")) return null;

    const endMatch = text.indexOf("\n---", 3);
    if (endMatch === -1) return null;

    // Find the end of the closing ---
    const endPos = endMatch + 4; // "\n---" length
    return { from: 0, to: endPos };
}

function buildFrontmatterDecorations(view) {
    const builder = new RangeSetBuilder();
    const fm = findFrontmatter(view.state.doc);

    if (fm) {
        const startLine = view.state.doc.lineAt(fm.from).number;
        const endLine = view.state.doc.lineAt(fm.to).number;

        for (let i = startLine; i <= endLine; i++) {
            const line = view.state.doc.line(i);
            if (i === startLine) {
                builder.add(line.from, line.from, frontmatterFirstLineDecoration);
            } else if (i === endLine) {
                builder.add(line.from, line.from, frontmatterLastLineDecoration);
            } else {
                builder.add(line.from, line.from, frontmatterLineDecoration);
            }
        }
    }

    return builder.finish();
}

export const frontmatterDecoration = ViewPlugin.fromClass(class {
    decorations;

    constructor(view) {
        this.decorations = buildFrontmatterDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = buildFrontmatterDecorations(update.view);
        }
    }
}, {
    decorations: v => v.decorations
});

// === Editor Theme (UI styles) ===
export const maquetacoTheme = EditorView.theme({
    "&": {
        fontSize: "14.5px", // Reduced size
        fontFamily: "'Inter', system-ui, sans-serif", // Clean sans-serif
        color: "#374151" // Gray 700
    },
    ".cm-content": {
        caretColor: "#4b5563",
        padding: "1.5rem 1rem"
    },
    "&.cm-focused .cm-cursor": {
        borderLeftColor: "#4b5563",
        borderLeftWidth: "2px"
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        backgroundColor: "rgba(75, 85, 99, 0.12)"
    },
    ".cm-selectionBackground": {
        backgroundColor: "rgba(75, 85, 99, 0.08)"
    },
    // Gutter
    ".cm-gutters": {
        backgroundColor: "transparent",
        color: "#cbd5e1",
        border: "none",
        paddingRight: "0.5rem",
        paddingLeft: "1rem",
        fontSize: "11px"
    },
    ".cm-gutter.cm-lineNumbers .cm-gutterElement": {
        padding: "0 0.25rem 0 0.25rem",
        minWidth: "1.5rem"
    },
    ".cm-activeLineGutter": {
        backgroundColor: "transparent",
        color: "#94a3b8"
    },
    ".cm-activeLine": {
        backgroundColor: "rgba(75, 85, 99, 0.03)"
    },
    // Brackets
    "&.cm-focused .cm-matchingBracket": {
        backgroundColor: "rgba(75, 85, 99, 0.1)",
        outline: "1px solid rgba(75, 85, 99, 0.2)"
    },
    // Frontmatter styling
    ".cm-frontmatter-line": {
        backgroundColor: "#f8fafc",
        color: "#64748b"
    },
    ".cm-frontmatter-first": {
        borderTopLeftRadius: "4px",
        borderTopRightRadius: "4px",
        marginTop: "0.5rem"
    },
    ".cm-frontmatter-last": {
        borderBottomLeftRadius: "4px",
        borderBottomRightRadius: "4px",
        marginBottom: "1rem",
        borderBottom: "1px solid #e2e8f0"
    },
    // Markdown formatting marks - darker color for better visibility
    ".cm-formatting": {
        color: "#475569" // Slate 600 - darker than default
    },
    ".cm-formatting-header": {
        color: "#334155" // Slate 700 - slightly darker for headers
    }
}, { dark: false });

// === Syntax Highlighting (Markdown) ===
export const maquetacoHighlightStyle = HighlightStyle.define([
    // Headers - Monochrome, Gradual Scale (Slate)
    { tag: tags.heading1, fontSize: "1.0em", fontWeight: "700", color: "#1e293b", lineHeight: "1.2", paddingBottom: "0.5rem" },      // Slate 800 - Smaller H1
    { tag: tags.heading2, fontSize: "1.0em", fontWeight: "600", color: "#334155", marginTop: "1.5rem" },      // Slate 700
    { tag: tags.heading3, fontSize: "1.0em", fontWeight: "500", color: "#475569" },      // Slate 600
    { tag: tags.heading4, fontSize: "1.0em", fontWeight: "400", color: "#64748b" },      // Slate 500
    { tag: tags.heading5, fontWeight: "600", color: "#94a3b8" },
    { tag: tags.heading6, fontWeight: "600", color: "#cbd5e1" },

    // Emphasis
    { tag: tags.emphasis, fontStyle: "italic", color: "#0284c7" }, // Sky 600 - Harmonizes with Teal
    { tag: tags.strong, fontWeight: "700", color: "#0d9488" }, // Teal 600
    { tag: tags.strikethrough, textDecoration: "line-through", color: "#94a3b8" },

    // Links
    { tag: tags.link, color: "#2563eb", textDecoration: "none" },
    { tag: tags.url, color: "#2563eb", textDecoration: "underline" },


    // Code - Minimalist inline
    { tag: tags.monospace, fontFamily: "'Fira Code', 'Consolas', monospace", color: "#db2777", backgroundColor: "rgba(236, 72, 153, 0.05)", borderRadius: "3px", padding: "0 3px" }, // Pink 600 accent for code

    // Quotes & lists
    { tag: tags.quote, fontStyle: "italic", color: "#64748b", borderLeft: "3px solid #cbd5e1" }, // Slate 500
    { tag: tags.list, color: "#059669" }, // Emerald 600 - A tiny touch of color for bullets

    // YAML frontmatter
    { tag: tags.meta, color: "#94a3b8" }, // Slate 400
    { tag: tags.propertyName, color: "#64748b" }, // Slate 500
    { tag: tags.string, color: "#475569" }, // Slate 600

    // Separators
    { tag: tags.processingInstruction, color: "#3f4d60ff", fontWeight: "bold" },  // --- lines
    { tag: tags.comment, color: "#616a7aff", fontStyle: "italic" }
]);

// Extensión combinada para usar en el editor
export const maquetacoHighlighting = syntaxHighlighting(maquetacoHighlightStyle);

