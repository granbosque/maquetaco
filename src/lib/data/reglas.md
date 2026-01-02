# Reglas de transformación

Este documento describe las reglas aplicadas durante la conversión de textos entre formatos.


## Importación de docx

- Detección automática de título y autor
- Promoción de niveles de títulos
- *(pendiente desarrollar)*


## Markdown a HTML

- Conversión de comillas rectas a tipográficas
- Guiones cortos a rayas de diálogo
- *(pendiente de detallar)*


## Estilos generales (todas las plantillas)

1. Texto justificado con separación silábica
2. Sangría de primera línea (excepto primer párrafo de sección)
3. Títulos sin separación silábica
4. Párrafos especiales (citas, dedicatoria, colofón) sin separación silábica
5. Negritas se muestran como versalitas en lugar de negrita


## Control de viudas y huérfanas

- **Viudas y huérfanas**: Mínimo 2 líneas.
- **Inicio de sección**: Los párrafos justo después de un título deben tener al menos 4 líneas antes de saltar de página.
- **Fin de sección**: Los últimos párrafos de un capítulo deben tener al menos 4 líneas.


## Separación silábica

- **Cuerpo de texto**: Activada automáticamante (`auto`).
- **Títulos**: Desactivada.
- **Configuración fina (impresión)**: Mínimo 6 letras por palabra, 3 antes y 3 después del guion. Zona límite de 8%.


## Cabeceras y pies

| Formato           | Posición                | Contenido                       | Notas                    |
| ----------------- | ----------------------- | ------------------------------- | ------------------------ |
| **PDF impresión** | Cabecera (extremos)     | Número de página                |                          |
|                   | Cabecera (interior)     | Título obra (izq) / Autor (der) | En versalitas            |
|                   | Primera página capítulo | Vacío                           | El número se oculta      |
| **PDF pantalla**  | Pie (centro)            | Número de página                |                          |
| **Mobile**        | Pie (centro)            | Número de página                |                          |
| **EPUB**          | —                       | —                               | Controlado por el lector |


## Encabezados

Todos los encabezados evitan quedarse solos al final de una página.

| Nivel | Tamaño               | Estilo               | Notas                       |
| ----- | -------------------- | -------------------- | --------------------------- |
| h1    | Grande (1.15-1.8em)  | Versalitas, centrado | Inicia nueva página/sección |
| h2    | Medio (1.1-1.4em)    | Centrado             | —                           |
| h3    | Normal (1.05-1.2em)  | Normal               | —                           |
| h4    | Normal (1-1.1em)     | *Cursiva*            | —                           |
| h5    | Pequeño (0.95-1em)   | Normal               | —                           |
| h6    | Pequeño (0.9-0.95em) | *Cursiva*            | —                           |


## Saltos de página y páginas en blanco

### PDF impresión
- **Inicio de capítulos**: Siempre en página **impar (derecha)**. Se inserta una página en blanco automáticamente si es necesario.
- **Páginas en blanco**: Totalmente vacías (sin cabeceras ni numeración).
- **Primera página de capítulo**: Sin cabecera ni número de página.

### PDF pantalla
- **Inicio de capítulos**: Salto de página simple (`break-before: page`).
- **Sin páginas en blanco automáticas**.

### EPUB
- Saltos de página lógicos (`break-before`) antes de cada capítulo (h1).


## Página de título

| Formato           | Comportamiento                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| **PDF pantalla**  | Compacta (inline) si solo hay título/autor; página completa si hay publisher, copyright, dedicatoria o TOC |
| **PDF impresión** | Siempre página completa: portadilla + portada + copyright                                                  |
| **EPUB**          | Sin página visual (metadatos en archivo OPF)                                                               |


## Secciones especiales

El título (h1) de estas secciones se oculta automáticamente:

| Sección     | Posición del texto                                   |
| ----------- | ---------------------------------------------------- |
| Colofón     | Alineado abajo                                       |
| Dedicatoria | Centrado verticalmente, alineado derecha, en cursiva |
| Epígrafe    | Arriba a la izquierda                                |


### PDF para impresión

- **Tamaño**: 6×9 pulgadas
- **Márgenes**:
  - Superior/Inferior: 26mm
  - Interior (Lomo): 32mm
  - Exterior: 14mm
- Capítulos empiezan en página impar (derecha)
- Cabeceras con número de página y título/autor
- Páginas en blanco automáticas cuando es necesario

### PDF para pantalla

- **Tamaño**: A5 (pantalla) o 90×160mm (móvil)
- **Márgenes**:
  - Pantalla: 26mm vertical, 14mm horizontal
  - Móvil: 12mm vertical, 8mm horizontal
- Numeración centrada en la parte inferior
- Sin cabeceras

### EPUB

- Sin paginación fija
- Tipografía base: Garamond/Georgia
- Interlineado amplio (1.5)
- Sangría de párrafo: 1.5em
