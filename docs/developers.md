# Documentación para desarrolladores

## Introducción

Maquetaco es una aplicación web para maquetar libros en diferentes formatos a partir de un único documento de entrada. 

En este documento voy a intentar explicar (para mi mismo y para el caso en que alguien se interese por las tripas del proyecto), cómo está implementado. Disculpas por la mezcla de  español e inglés en el código :)

El flujo de trabajo se basa en tener un documento fuente en formato markdown, qu se convierte a html con plantillas y hojas de estilo diferentes para generar los archivos de salida. También permite importación desde word. 

WORD -> MARKDOWN -> HTML + CSS -> PDF/EPUB


Para ello se usan varias herramientas (mammoth, turndown, pagedjs) y Maquetaco ofrece una interface para gestionar todo el proceso. El grueso del trabajo y lo que aporta respacto a usar las herramientas por separado es el pre/postprocesado, plantillas y algunos trucos para mejorar la estructura.

---

Markdown es adecuado para el trabajo de edición por ser simple y manejable, sin requerir un gran aprendizaje, y la suficiente flexibilidad para conseguir algo más específico si se requiere (con html en el peor caso)

HTML+CSS ofrecen una gran potencia y flexiblidad para definir un formato tan complejo como requiere un libro. Hay cosas más sencillas (tipografía, márgenes) que se pueden conseguir con reglas simples, y hay otras que requieren un conocimiento más profundo de css (formatos condicionales usando :has...) pero que también se pueden realizar sin ningún hack. El mayor problema se encuentra en que las especificaciones css para maquetación impresa (paged media) no están completamente soportadas en ninguna herramienta gratuita, y ahí entra en juego maquetaco, combinando varias técnicas y trucos para conseguir un soporte completo. Más abajo en este documento se explica en detalle.

Una versión un poco más sencilla de esto está en https://github.com/granbosque/md-to-ebook, que son varios script para hacer estas conversiones usando pandoc. Realmente maquetaco es un interface para ese mismo flujo de trabajo, sin requerir ninguna instalación.

## Importación de documentos

- Se pueden abrir directamente documentos en formato .md. Si hay un frontmatter, se leen los metadatos.

- Se pueden convertir docx. La conversión a markdown no es perfecta, depende mucho de cómo esté estructurado el documento de entrada (títulos, etc) pero se hace un postprocesado heurístico para intentar corregir posibles errores. (pendiente desarrolar pero lo básico es: detección de títulos, listas, citas, separaciones entre párrafos)


Tareas pendientes: convertir odt, pegar texto con formato.

## Exportación

Para todas las exportaciones nos basamos en convertir el markdown a html y aplicar estilos mediante css.
En el archivo reglas.md se explica detalladamente el formato en cada uno de los casos.

### EPUB 

Se convierte markdown a html, con unos estilos básicos. Se generar el archivo EPUB usando JSZip y una plantilla estándar, incluyendo el texto,  metadatos y archivos auxiliares, como la imagen de portada.

### PDF 

El diseño se hace casi en su totalidad con CSS. Se convierte el archivo markdown a html y se le inyecta la hoja de estilos correspondiente. Como este código viene heredado de usar pandoc (y no se usa pandoc porque en web tendría que ser mediante wasm y complicaría mucho), de todas formas se usan plantillas html similares a las de pandoc, pero basadas en Moustache.

He intentado mantener las plantilla con las mínimas modificaciones posibles y que todo el diseño recaiga sobre la hoja de estilos, para que no sea necesario modificar nunca ese html.

Por ahora hay dos:

- PDF para imprmir: NO incluye la imagen de portada, inserta una página en blanco y una portadilla adicional, y una página de copyright. El resto de cosas referentes al diseño (diferencia de páginas pares e impares, saltos de página, secciones, recae sobre el css)

- PDF digital: pensado para leer en pantalla. Incluye la imagen de portada como primera página.
  * Portada compacta, si el documento solo tiene título y autor (sin editorial, copyright, dedicatoria ni TOC), el título se muestra inline al inicio del contenido para ahorrar espacio en pantallas móviles. Esto se calcula en template-engine.js compactTitlePage.
  * Tabla de Contenidos: Si está activada (`enableTOC`), se genera automáticamente una página con el índice de capítulos (h1), con leader dots y números de página usando target-counter()de paged.js. La página del TOC no tiene numeración visible.

La diferencia principal está en la portada y portadilla. Se podrían unificar en una pero creo que complicaría en exceso las reglas css.

Para generar el PDF, se genera un html intermedio, que luego se convierte a PDF.

IMPORTANTE: Maquetaco no es capaz de generar por sí mismo un archivo PDF. El funcionamiento actual consiste en que hay que pulsar en IMPRIMIR del navegador y usar una impresora virtual para generar el pdf. Todos los sistemas operativos actuales disponen de una impresora virtual pdf por lo que no supone un problema.

Este proceso se podría automatizar más, pero...

#### Complicaciones y soluciones

Las especificaciones de **CSS Paged Media** definen características avanzadas para maquetación impresa: cabeceras y pies de página, márgenes por cara (izquierda/derecha), numeración, contadores, saltos de página,etc. 

Sin embargo, no he encontrado ninguna solución directa (gratuita) que las implemtente todas correctamente.

- **PrinceXML**: Soporte perfecto pero privado y caro.

- **wkhtmltopdf**: Soporte parcial, sin separación silábica, motor obsoleto. Libre.

- **Puppeteer** o **chromium headless**: Soporta bien paged media, pero hay un bug conocido con la separación silábica. 

- **WeasyPrint**: Soporte parcial, problemas con los contadores. Libre.

- **Paged.js**: Soporte completo (polyfill). Separación silábica. Libre. Requiere navegador para imprimir.

> *La separación silábica en Paged.js funciona porque delega en el navegador (CSS `hyphens: auto`), pero esto solo funciona si el PDF se genera desde el diálogo de impresión del navegador. Con herramientas CLI como Puppeteer, la separación silábica falla.


Con todo esto en cuenta, maquetaco usa **Paged.js**, que renderiza el documento completo en el navegador, aplicando todos los estilos de página, cabeceras, pies, y márgenes correctamente.

Para obtener el PDF final, el usuario debe usar el diálogo de impresión del navegador ("Guardar como PDF"). No es la solución más elegante, pero es la única forma de conseguir que todo esto funcione a la vez:

- Separación silábica automática correcta
- Cabeceras alternadas en páginas pares/impares, 
- Márgenes simétricos para encuadernación
- Todas las características de maquetación profesional

Si en algún momento encuentro una solución mejor, se podría saltar el paso de usar el diálogo de impresión, pero realmente al funcionar maquetaco como una aplicación web, no es una pega que afecte demasiado, siempre y cuando se haga desde un navegador moderno.


El sistema incluye varias plantillas para generar PDFs con diferentes estilos y propósitos:

#### PDF Digital

- Pensado para leer en pantalla (tamaño de papel A4 o A5)
- Incluye la imagen de portada como primera página
- Encabezado o pie de página igual en todas las páginas.
- Aplica estilos a tipografía, márgenes, interlineado, separación silábica, líneas viudas y huérfanas, etc. Todo exclusivamente a través de css.

#### PDF Para imprmir

- Pensado para imprimir en papel, el pdf resultante se puede subir directamente a servicios como Amazon KDP.
- Tamaño de papel 6x9 pulgadas.
- No incluye la imagen de portada como primera página 
- Diferencia entre páginas izquierdas y derechas en cuanto al encabezado y pie, numeración de páginas, márgenes simétricos... también puede dejar intencionadamente página en blanco para que los capítulos empiecen en página impar, y se dejan páginas en blanco de cortesía al inicio.
- Aplica estilos a tipografía, márgenes, interlineado, separación silábica, líneas viudas y huérfanas, etc. Todo exclusivamente a través de css.


### Arquitectura CSS modular para exportación

Los estilos CSS para las plantillas de exportación usan **dos sistemas de composición**, esto es un parche y finalmente se unificará, pero para resolver problemas he ido improvisando técnicas:

#### 1. CSS modular (archivos separados)

Se usa para características que Paged.js no soporta con selectores de clase (como las reglas `@page`).


- theme.css: CSS base: tamaño página, tipografía, márgenes, estructura |
- header-footer--title-author.css: Cabecera: Número de página y Título/Autor en páginas pares/impares.
- header-footer--title-h1.css: Cabecera: Número de página y título/H1 en páginas pares/impares.
- header-footer--h1-h2.css: Cabecera: Número de página y H1/H2 en páginas pares/impares.
- header-footer--footer-only.css: Sin cabecera, solo número de página en el pie

**Nomenclatura:** caracteristica--opcion.css (doble guión para variantes)

#### 2. Clases en <body>

Se usa para características que sí funcionan con selectores CSS normales.

Por ahora:

- body.paragraph-spaced: Párrafos separados sin sangría

Las reglas para estas clases están definidas dentro del theme.css de cada plantilla.

#### Limitaciones de Paged.js

En principio me hubiera gustado tenerlo todo en un único CSS con variables o clases, pero resultaba demasiado ilegible. Además, con Paged.js (al menos en la versión actual) hay varias limitaciones:

- Para el contenido de cabeceras/pies (función string() de Paged Media) no funcionan las clases aplicadas al elemento html ni al body. Las reglas @page no heredan selectores de clase.
- Tampoco funciona calc() dentro de @page, por lo que los márgenes están hardcodeados en mm.

**Mejoras pendientes:**
- Añadir más modularidad para el tamaño de página



# Estructura del proyecto

El flujo de trabajo se divide en tareas muy diferenciadas:

- Importar documento (docx) y convertirlo a markdown (ODT pendiente)
- Editar markdown
- Generar salida (pdf o epub)

En `src/lib/converters` se encuentran los scripts de conversión (docx, md) y utilidades de renderizado (paged-renderer, template-engine).

En src/lib/export-themes se agrupan los archivos necesarios para cada formato de exportación, conteniendo la plantilla HTML y el CSS correspondiente:
- **print/**: Plantilla PDF para impresión en papel (márgenes simétricos, páginas en blanco...).
- **screen/**: Plantilla PDF para pantalla (A5, portada incluida...).
- **epub/**: Estilos CSS base para la generación de EPUB.

Para la reactividad se usa Svelte 5 (modo runes)

Para interface se usa Bits-ui (librería de componentes minimalista) con un estilo propio.

En src/lib/components se encuentran los componentes, que se intentarán mantener con el código css mínimo y que sea exclusivo y necesario solo para ese componente.

Para el estado de la aplicación usamos un único estado reactivo (en `src/lib/stores/appState.svelte.js`) que contiene:
- el archivo markdown (solo el cuerpo, sin frontmatter)
- tabla de contenidos (para cada título, su número de línea y clase)
- metadatos estructurados (ver sección siguiente).

## Arquitectura de Metadatos

Los metadatos del documento (título, autor, copyright, tags, etc.) se gestionan de forma separada al contenido Markdown:

```
appState.config = {
    // Metadatos (editados desde ConfigPanel)
    title: '',
    author: '',
    copyright: '',
    date: '',
    lang: 'es',
    tags: [],  // Array de strings
    
    // Contenido (editado en el Editor, SIN frontmatter)
    content: '# Mi documento...',
    
    // Otros
    imagePreview: '',
    toc: []
}
```

### Flujo de Importación

1. **Al importar `.docx`:**
   - `docx-to-md.js` extrae título/autor del documento.
   - Devuelve `{ content, metadata, warnings }`.
   - `App.svelte` puebla los campos de `appState.config` desde `metadata`.
   - El contenido se guarda SIN frontmatter.

2. **Al importar `.md`:**
   - `parseFrontmatter()` extrae el YAML del inicio del archivo.
   - Los campos del frontmatter pueblan `appState.config`.
   - El contenido (sin frontmatter) se guarda en `appState.config.content`.

3. **Al importar `.txt`:**
   - Se carga directamente en `content` (no hay frontmatter).

### Flujo de Exportación (pendiente)

1. **Exportar a `.md`:**
   - `generateFrontmatter()` crea el bloque YAML desde `appState.config`.
   - Se concatena frontmatter + content.

2. **Exportar a PDF/EPUB:**
   - Los metadatos se leen directamente de `appState.config`.
   - No se genera frontmatter (se usan los campos estructurados).

### Utilidades

El archivo `src/lib/utils/frontmatter.js` proporciona:

- `parseFrontmatter(text)`: Extrae YAML de un Markdown, devuelve `{ metadata, content }`.
- `generateFrontmatter(metadata)`: Genera bloque YAML desde objeto.
- `combineWithFrontmatter(metadata, content)`: Combina ambos en un documento completo.

## Importación DOCX

La conversión de DOCX se realiza con Mammoth + Turndown en `src/lib/converters/docx-to-md.js`:

Generalmente viene bien un postprocesado y limpieza y aquí se aplican varios trucos:


1. **DOCX → HTML (Mammoth):** Conversión inicial inyectando tokens `[[EMPTY_LINE]]` para preservar párrafos vacíos.
2. **Análisis de estructura:** 
    *   **Por estilos:** Detección de Título (H1) y Autor (H2 único). Ajuste de niveles (H3->H1).
    *   **Heurístico (Fallback):** Si no hay estilos, busca párrafos cortos y *sin punto final* al inicio para Título y Autor.
3. **HTML → Markdown (Turndown):** Conversión a markdown estándar.
4. **Post-procesado y Limpieza:**
    *   **Limpieza de espacios:** Eliminación de espacios al final de línea y reducción de múltiples líneas en blanco.
    *   **Generación de escenas:** Conversión de bloques de >2 líneas vacías en separadores de escena (`***`).
    *   **Normalización:** Unificación de distintos estilos de separadores (`* * *`, `---`, etc.) a `***`.
    *   **Consolidación:** Fusión de separadores contiguos.
    *   **Limpieza contextual:** Eliminación de separadores antes de Títulos y *al inicio del documento*.
5. **Retorno:** Devuelve objeto `{ content, metadata, warnings }`

## Edición

El editor se basa en **CodeMirror 6** (`svelte-codemirror-editor`). 

He optado por CodeMirror porque es robusto y permite extenderlo facilmente, pero tampoco lo domino así que está sujeto a cambiar.

Personalizaciones:
- Un tema visual propio (`editorTheme.js`) para que no desentone con el resto de la app
- Soporte para enlaces clickables (mediante una extensión propia `clickableLinks.js`) para que sea más fácil navegar
- Detección de headers para poder cambiar su tipo o navegar a ellos desde la TOC

## Componentes UI

Para la interfaz he usado **bits-ui**, que son componentes "headless" (sin estilos). He usado esta librería de forma provisional y sin conocerla a fondo, posiblemente cambie.

## Estilos

Todo el CSS está en `src/lib/styles`. 
Hay un sistema de tokens en tokens-minimal.css, en components-minimal.css están los estilos para los componentes y en theme.css para el layout. Hay mucho código css acumulado de pruebas, versiones anteriores y copiado de otros proyectos, sobra muchísimo código y necesita una limpieza.