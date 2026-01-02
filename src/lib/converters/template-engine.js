/**
 * Motor de plantillas Mustache para Maquetaco
 * 
 * Este módulo proporciona funciones para renderizar plantillas HTML
 * con datos del documento (frontmatter + contenido).
 */
import Mustache from 'mustache';

// Importar plantillas como strings usando Vite ?raw
import previewTemplate from '$lib/templates/preview.html?raw';
import pdfScreenTemplate from '$lib/export-themes/screen/template.html?raw';
import pdfPrintTemplate from '$lib/export-themes/print/template.html?raw';

/**
 * Plantillas disponibles
 */
export const templates = {
    preview: previewTemplate,
    pdfScreen: pdfScreenTemplate,
    pdfPrint: pdfPrintTemplate
};

/**
 * Parsea el frontmatter YAML a un objeto JavaScript
 * @param {string} yamlString - String YAML (sin los ---)
 * @returns {Object} Objeto con los datos parseados
 */
export function parseYamlFrontmatter(yamlString) {
    if (!yamlString) return {};

    const result = {};
    const lines = yamlString.split('\n');

    for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex === -1) continue;

        const key = line.slice(0, colonIndex).trim();
        let value = line.slice(colonIndex + 1).trim();

        // Eliminar comillas si las tiene
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        // Convertir booleanos
        if (value === 'true') value = true;
        else if (value === 'false') value = false;

        if (key) {
            result[key] = value;
        }
    }

    return result;
}

/**
 * Prepara los datos para la plantilla
 * Normaliza autores como array, establece valores por defecto, etc.
 * @param {Object} frontmatter - Datos del frontmatter
 * @param {string} bodyHtml - HTML del contenido
 * @returns {Object} Datos preparados para Mustache
 */
export function prepareTemplateData(frontmatter, bodyHtml) {
    const data = {
        ...frontmatter,
        body: bodyHtml,
        lang: frontmatter.lang || 'es'
    };

    // Normalizar autor(es) como array si hay múltiples
    if (data.author) {
        if (Array.isArray(data.author)) {
            data.authorList = data.author;
        } else if (data.author.includes(',')) {
            data.authorList = data.author.split(',').map(a => a.trim());
        }
    }

    // Renombrar cover-image a coverImage (camelCase para JS)
    if (frontmatter['cover-image']) {
        data.coverImage = frontmatter['cover-image'];
    }

    // Renombrar back-page a backPage
    if (frontmatter['back-page']) {
        data.backPage = frontmatter['back-page'];
    }

    // Detectar si hay dedicatoria o epígrafe en el contenido
    const bodyHasDedication = bodyHtml.includes('class="dedication"') || bodyHtml.includes("class='dedication'");
    data.hasEpigraph = bodyHtml.includes('class="epigraph"') || bodyHtml.includes("class='epigraph'");

    // Dedicatoria desde metadatos
    if (frontmatter.dedication && frontmatter.dedication.trim()) {
        data.dedication = frontmatter.dedication.trim();
    }

    // Flag unificado: Hay dedicatoria si viene en metadatos o en el cuerpo
    data.hasDedication = !!data.dedication || bodyHasDedication;

    return data;
}

/**
 * Renderiza una plantilla con los datos proporcionados
 * @param {string} templateName - Nombre de la plantilla ('preview', 'pdfScreen', 'pdfPrint')
 * @param {Object} frontmatter - Datos del frontmatter
 * @param {string} bodyHtml - HTML del contenido
 * @returns {string} HTML renderizado
 */
export function renderTemplate(templateName, frontmatter, bodyHtml) {
    const template = templates[templateName];
    if (!template) {
        throw new Error(`Plantilla "${templateName}" no encontrada`);
    }

    const data = prepareTemplateData(frontmatter, bodyHtml);
    return Mustache.render(template, data);
}

/**
 * Renderiza una plantilla personalizada (string) con los datos
 * @param {string} templateString - String de la plantilla Mustache
 * @param {Object} frontmatter - Datos del frontmatter
 * @param {string} bodyHtml - HTML del contenido
 * @returns {string} HTML renderizado
 */
export function renderCustomTemplate(templateString, frontmatter, bodyHtml) {
    const data = prepareTemplateData(frontmatter, bodyHtml);
    return Mustache.render(templateString, data);
}
