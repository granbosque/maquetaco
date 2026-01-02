# ¡Bienvenido!

**Maquetaco** es una herramienta gratuita y de código abierto para maquetar libros desde una única fuente hacia diferentes formatos: EPUB, PDF para pantalla, PDF para imprenta…

Se ejecuta completamente en tu navegador, sin cookies ni enviar datos a ningún servidor.

Internamente, Maquetaco trabaja con **Markdown**, un formato de texto plano muy sencillo que solo marca lo esencial: títulos, cursiva y poco más. Sin especificar fuentes, tamaños, colores, márgenes, interlineados, etc. Todo eso se aplica automáticamente en el momento de generar los archivos finales. Esto garantiza que tu documento esté limpio y que el formateo final sea consistente y profesional.

Puedes escribir directamente en el editor, pegar texto o importar un archivos en formato Word (_docx_).  Si importas un documento, Maquetaco hace una conversión razonablemente inteligente e intenta detectar los capítulos. Verás que en cuanto al formato, en el editor únicamente se mantienen las cursivas, títulos, separadores de escena y notas al pie. En textos narrativos, raramente necesitarás más. 

Maquetaco se basa en tecnologías de código abierto y combina varias ténicas para generar pdfs con aspecto profesional: markdown para el texto, que se convierte a html; css para definir los estilos, pagedjs para formato avanzado como estilos de página, cabeceras y pies.

En cualquier caso, puedes usar el editor incorporado para retocar el texto. Más adelante tienes una guía sencilla del formato markdown y enlaces para información más avanzada.

# Si vienes de Word

Si vas a importar un documento de Word, ten en cuenta que Maquetaco solo conservará el formato esencial: títulos, cursivas, y separadores de escena. Todo lo demás (fuentes, tamaños, interlineado, etc.) se descarta porque la maquetación final se aplica automáticamente.

Para que la conversión funcione mejor:

- **Usa los estilos de título de Word** (Título 1, Título 2...) en lugar de simular títulos con negrita y tamaño grande. Maquetaco detecta los estilos correctamente.
- **Separa los párrafos con Enter**, sin añadir líneas extra ni tabulaciones.
- **Usa cursiva para énfasis**. En textos narrativos, la negrita raramente es necesaria (en los PDFs se convertirá a versalitas).
- **No te preocupes por sangrías ni saltos de página**: Maquetaco los gestiona automáticamente.




# Cómo formatear

Maquetaco incorpora una serie de plantillas predefinidas que ya están preparadas según las convenciones más habituales en libros impresos y digitales. Por ejemplo, esta párrafo, que es el primero de su bloque (el primero tras un título), no tiene sangría de primera línea.

Este segundo párrafo sí tiene sangría, porque viene después de otro párrafo. Pero de eso no te tienes que preocupar: Maquetaco lo formatea automáticamente. Si estás viendo este texto desde la pestaña *Editor*, no verás lás sangrías ni el formato final: te puedes olvidar de él y solo se aplicará cuando exportes el documento. Si estás viendo este texto desde la pestaña *Vista Previa*, ya verás estas reglas aplicadas.

Para separar párrafos debes dejar una línea en blanco.

***

Y para separar escenas, puedes usar tres asteriscos o tres guiones, como justo antes de estas palabras.

Puedes usar *cursivas* para destacar palabras o párrafos, rodeándolas de asteriscos, o **negritas** usando doble asterisco (aunque en textos literarios rara vez se usan, y cuando lo exportes a **PDF** se convertirá en versalitas).

## Títulos

Para indicar los títulos, se usa el caráter almohadilla. Si necesitas más de un nivel, puedes usar hasta 6 almohadillas.

### Niveles

El título que hay sobre este párrafo es de nivel 3, porque tiene tres almohadillas delante.

## Diálogos y tipografía

Uno de los problemas habituales al trabajar con editores como Word es escribir los diálogos correctamente.

---¿Cómo puedo escribirlos bien? ---te preguntarás, ya que el carácter de la raya de diálogo no es igual al guion y no está en el teclado.

---Es muy sencillo. Escribe tres guiones seguidos y se convertirán automáticamente en una raya de diálogo.

Lo mismo ocurre con las comillas: si escribes "comillas rectas", Maquetaco las convierte automáticamente en comillas tipográficas. En español y otros idiomas latinos, se usan las comillas angulares "así". Puedes escribirlas como comillas normales (lla que tienes en el teclado) y se convertirán según el idioma seleccionado.

También puedes escribir tres puntos (...) para puntos suspensivos tipográficos (…), o -- para un guion largo (–).

Prueba a alternar entre *Editor* y *Vista Previa* para ver cómo se transforman estos párrafos.

## Formato avanzado

Aunque por ahora no es posible personalizar las plantilas, si necesitas algún formato especial para alguna parte de tu documento, puedes usar sintaxis html y css. Por ejemplo:

<div style="text-align: center; margin: 3em 8em; border: solid 1px gray; border-radius: 1em; ">
    Este párrafo aparecerá centrado, con borde redondeado y margen horizontal grande.
</div>

# La interfaz

A la **izquierda** tienes el panel de estructura: todos los títulos del documento. Haz clic en cualquiera para saltar a esa sección. Desde ese panel también puedes asignar tipos especiales a los capítulos (dedicatoria, epígrafe, colofón).

En el **centro** está el editor, donde escribes tu texto. Todo lo que cambies se refleja inmediatamente en la estructura y la vista previa.

A la **derecha**, la configuración: título del libro, autor, copyright, portada y otros metadatos.


# Prueba ahora

Este documento es tu campo de juegos. Modifica este texto y observa cómo cambia la estructura. Añade un nuevo capítulo escribiendo "# Mi capítulo". Abre la Vista Previa para ver cómo quedará maquetado.

Cuando quieras empezar tu libro, limpia todo este contenido y escribe el tuyo, o arrastra un archivo *.docx* existente para importarlo.

# Formatos de salida

Maquetaco genera tu libro en varios formatos optimizados para diferentes usos. En todos ellos se aplica automáticamente el maquetado profesional:

**EPUB**: Formato estándar para libros electrónicos, compatible con la mayoría de lectores digitales (Kindle, Kobo, Apple Books). El texto se adapta automáticamente al tamaño de pantalla del dispositivo. Incluye portada, índice interactivo, metadatos completos, y formato adaptable según las preferencias del lector.

**PDF Pantalla**: Optimizado para lectura en ordenadores, tablets o móviles. Tamaño de página A5. Aplica sangrías automáticas en los párrafos, encabezados de página con título de capítulo, numeración automática, márgenes equilibrados, y saltos de página apropiados antes de cada capítulo. Perfecto para distribuir versiones digitales o leer en dispositivos.

**PDF Móvil**: Optimizado para lectura teléfonos móviles. Tamaño de página más pequeño y formato simplificado.

**PDF Impresión**: Preparado para imprenta profesional o autoedición. Tamaño 6x9 pulgadas con márgenes asimétricos (más anchos hacia el lomo para la encuadernación). Incluye páginas en blanco donde corresponde según convenciones editoriales, encabezados alternados en páginas pares e impares, numeración romana para páginas preliminares y arábiga para el contenido principal, y configuración de sangrado optimizada para texto impreso. En la sección "Generar" podrás ver las páginas una al lado de la otra.

# Estado de desarrollo

Maquetaco ya permite exportar a EPUB y PDF en varios formatos, editar en Markdown con resaltado de sintaxis, gestionar metadatos y portada automática, e importar documentos `.docx` o `.md`.

## Limitaciones

Algunas características están en desarrollo o pendientes de mejora:

- **Tablas de contenido e índice**. Al exportar a epub se genera una tabla de contenidos, pero en PDF.

- **Soporte para imágenes**: Actualmente no se pueden insertar imágenes en el contenido (en realidad, sí, usando la sintaxis markdown con una url o en base64) pero es muy usable.

- **Plantillas personalizables**: Los estilos de maquetación están predefinidos y no se pueden modificar desde la interfaz, aunque próximamente se podrá.

- **Control tipográfico avanzado**: Mejoras en el manejo de líneas viudas y huérfanas, ajustes de tracking y kerning. Por ahora el ajuste de líneas es básico y se puede mejorar.

- **Aplicación de escritorio**.


# Sobre este proyecto

**Maquetaco** es software libre y de código abierto, programado con cariño por [Andrés Granbosque](https://granbosque.es) porque leer, escribir y compartir nos hace libres.

## ¿Por qué HTML y CSS?

La idea central de Maquetaco es usar un único documento fuente (Markdown) para generar múltiples formatos de salida: EPUB, PDF para pantalla, PDF para impresión... Cada uno con estilos completamente diferentes.

**HTML y CSS son perfectos para esto**: el contenido se convierte una sola vez a HTML, y luego se aplican distintas hojas de estilo según el formato deseado. CSS es un estándar potentísimo para definir tipografía, márgenes, cabeceras, pies de página, y todo lo necesario para maquetar un libro profesional.

Sin embargo, no existe una solución gratuita que funcione completamente bien para generar PDFs desde HTML+CSS:

- Las especificaciones de **CSS Paged Media** (cabeceras, pies, márgenes por página, etc.) no están completamente soportadas por los navegadores.
- Las herramientas de conversión por línea de comandos suelen tener limitaciones con características avanzadas como la separación silábica.
- Las soluciones profesionales que funcionan al 100% son privativas y muy caras.

La solución de Maquetaco combina [Paged.js](https://pagedjs.org/) (que implementa CSS Paged Media mediante polyfills JavaScript) con el diálogo de impresión del navegador. No es perfecto, hay que pasar por la ventana de "Guardar como PDF", pero es la única forma de obtener separación silábica, cabeceras alternadas, márgenes simétricos y todas las características avanzadas funcionando a la vez.

## Herramientas utilizadas

Esta aplicación es posible gracias a un ecosistema de herramientas de código abierto:

##### Interfaz y editor

- [Svelte](https://svelte.dev/) y [SvelteKit](https://svelte.dev/docs/kit) para la aplicación web
- [CodeMirror](https://codemirror.net/) para el editor de texto
- [bits-ui](https://bits-ui.com/) para componentes de interfaz
- [Lucide](https://lucide.dev/) para iconos

##### Conversión de documentos

- [Mammoth](https://github.com/mwilliamson/mammoth.js) para convertir archivos Word (.docx) a HTML
- [Unified](https://unifiedjs.com/) con [remark](https://github.com/remarkjs/remark) y [rehype](https://github.com/rehypejs/rehype) para procesar Markdown
- [remark-smartypants](https://github.com/silvenon/remark-smartypants) para tipografía inteligente (comillas, rayas, puntos suspensivos)
- [Turndown](https://github.com/mixmark-io/turndown) para convertir HTML a Markdown

##### Generación de formatos

- [Paged.js](https://pagedjs.org/) para maquetación profesional de PDFs con CSS
- [JSZip](https://stuk.github.io/jszip/) para generar archivos EPUB
- [epub.js](https://github.com/futurepress/epub.js) para previsualizar EPUBs

El código fuente está disponible en [GitHub](https://github.com/granbosque/maquetaco). Si tienes cualquier sugerencia o encuentras algún problema, no dudes en [contactar](mailto:hola@granbosque.es).

---

¡Ahora borra este contenido y empieza a escribir tu libro!
