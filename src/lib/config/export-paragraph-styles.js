/**
 * Estilos de párrafo disponibles para exportación
 * Controlan la separación y sangría entre párrafos
 */

export const paragraphStyles = [
    {
        id: 'indent',
        name: 'Sangría',
        description: 'Clásico: sin separación, con sangría de primera línea',
        class: '',  // default, no class needed
        icon: 'ParagraphIndent'
    },
    {
        id: 'spaced',
        name: 'Separados',
        description: 'Moderno: separación entre párrafos',
        class: 'paragraph-spaced',
        icon: 'ParagraphSpaced'
    }
];
