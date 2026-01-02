/**
 * CodeMirror 6 extension for clickable Markdown links
 * Shows a popup with "Open" button on hover
 */

import { EditorView, Decoration, ViewPlugin, hoverTooltip } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

// Regex patterns for detecting links
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;
const RAW_URL_REGEX = /(?<!\]\()https?:\/\/[^\s<>)\]]+/g;

// Mark decoration for URLs (underline + pointer cursor)
const linkMark = Decoration.mark({
    class: "cm-link-clickable"
});

/**
 * Build decorations for all links in the document
 */
function buildLinkDecorations(view) {
    const builder = new RangeSetBuilder();
    const decorations = [];

    for (const { from, to } of view.visibleRanges) {
        const text = view.state.doc.sliceString(from, to);

        // Find Markdown links [text](url)
        let match;
        MARKDOWN_LINK_REGEX.lastIndex = 0;
        while ((match = MARKDOWN_LINK_REGEX.exec(text)) !== null) {
            const linkStart = from + match.index;
            const linkEnd = linkStart + match[0].length;

            // Only decorate the URL part (inside parentheses)
            const urlStart = linkStart + match[1].length + 3; // "[text](" length
            const urlEnd = linkEnd - 1; // before ")"

            decorations.push({
                from: urlStart,
                to: urlEnd,
                decoration: linkMark
            });
        }

        // Find raw URLs
        RAW_URL_REGEX.lastIndex = 0;
        while ((match = RAW_URL_REGEX.exec(text)) !== null) {
            const linkStart = from + match.index;
            const linkEnd = linkStart + match[0].length;

            decorations.push({
                from: linkStart,
                to: linkEnd,
                decoration: linkMark
            });
        }
    }

    // Sort decorations by position (required by RangeSetBuilder)
    decorations.sort((a, b) => a.from - b.from);

    for (const { from, to, decoration } of decorations) {
        builder.add(from, to, decoration);
    }

    return builder.finish();
}

/**
 * Extract URL info from position in document
 * Returns { url, from, to } or null
 */
function getLinkAtPos(view, pos) {
    const line = view.state.doc.lineAt(pos);
    const lineText = line.text;
    const posInLine = pos - line.from;

    // Check for Markdown links
    MARKDOWN_LINK_REGEX.lastIndex = 0;
    let match;
    while ((match = MARKDOWN_LINK_REGEX.exec(lineText)) !== null) {
        const urlStart = match.index + match[1].length + 3;
        const urlEnd = match.index + match[0].length - 1;

        if (posInLine >= urlStart && posInLine <= urlEnd) {
            return {
                url: match[2],
                from: line.from + urlStart,
                to: line.from + urlEnd
            };
        }
    }

    // Check for raw URLs
    RAW_URL_REGEX.lastIndex = 0;
    while ((match = RAW_URL_REGEX.exec(lineText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        if (posInLine >= start && posInLine <= end) {
            return {
                url: match[0],
                from: line.from + start,
                to: line.from + end
            };
        }
    }

    return null;
}

/**
 * Hover tooltip that shows a popup with "Open" button
 */
const linkHoverTooltip = hoverTooltip((view, pos) => {
    const link = getLinkAtPos(view, pos);
    if (!link) return null;

    return {
        pos: link.from,
        end: link.to,
        above: true,
        create() {
            const container = document.createElement("div");
            container.className = "cm-link-tooltip";

            // Truncate long URLs for display
            const displayUrl = link.url.length > 40
                ? link.url.substring(0, 37) + "..."
                : link.url;

            const urlSpan = document.createElement("span");
            urlSpan.className = "cm-link-tooltip-url";
            urlSpan.textContent = displayUrl;
            urlSpan.title = link.url;

            const openBtn = document.createElement("button");
            openBtn.className = "cm-link-tooltip-btn";
            openBtn.textContent = "Abrir ↗";
            openBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(link.url, '_blank', 'noopener,noreferrer');
            };

            container.appendChild(urlSpan);
            container.appendChild(openBtn);

            return { dom: container };
        }
    };
}, { hoverTime: 300 });

/**
 * ViewPlugin that handles link decorations
 */
const linkDecorations = ViewPlugin.fromClass(class {
    decorations;

    constructor(view) {
        this.decorations = buildLinkDecorations(view);
    }

    update(update) {
        if (update.docChanged || update.viewportChanged) {
            this.decorations = buildLinkDecorations(update.view);
        }
    }
}, {
    decorations: v => v.decorations
});

/**
 * Theme styles for clickable links and tooltip
 * Uses app design tokens for consistency
 */
export const clickableLinksTheme = EditorView.theme({
    ".cm-link-clickable": {
        textDecoration: "underline",
        textDecorationStyle: "dotted",
        textDecorationColor: "#66bb6a", // --color-primary
        textUnderlineOffset: "2px",
        cursor: "pointer",
        "&:hover": {
            textDecorationStyle: "solid"
        }
    },
    // Override CodeMirror's tooltip container for hover tooltips only
    // (using .cm-tooltip-hover to avoid affecting autocomplete dropdown)
    ".cm-tooltip-hover": {
        border: "none",
        backgroundColor: "transparent",
        boxShadow: "none"
    },
    ".cm-link-tooltip": {
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 12px",
        backgroundColor: "#ffffff", // --bg-surface
        color: "#333", // --text
        borderRadius: "8px", // --radius
        fontSize: "14px", // --text-sm
        fontFamily: "'Work Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", // --font-main
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.05)", // --shadow
        border: "1px solid #e0e0e0" // --border
    },
    ".cm-link-tooltip-url": {
        color: "#777", // --text-muted
        maxWidth: "200px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontWeight: "300" // --weight-normal
    },
    ".cm-link-tooltip-btn": {
        padding: "4px 12px",
        backgroundColor: "#66bb6a", // --color-primary
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "13px",
        fontWeight: "500", // --weight-semibold
        transition: "0.15s ease", // --transition
        "&:hover": {
            backgroundColor: "#57a05a" // slightly darker primary
        }
    }
});

/**
 * Combined extension for clickable links
 * Import and add to your extensions array
 */
export const clickableLinksExtension = [
    linkDecorations,
    linkHoverTooltip,
    clickableLinksTheme
];
