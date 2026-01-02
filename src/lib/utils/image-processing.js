/**
 * Redimensiona una imagen en el cliente para optimizar rendimiento y tamaño
 * @param {File} file - El archivo de imagen original
 * @param {number} maxWidth - Ancho máximo permitido (default: 1200px)
 * @param {number} quality - Calidad de la compresión JPEG (0-1, default: 0.8)
 * @returns {Promise<string>} Promesa que resuelve al Data URL de la imagen redimensionada
 */
export async function resizeImage(file, maxWidth = 1200, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Calcular nuevas dimensiones manteniendo aspect ratio
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('No se pudo obtener el contexto del canvas'));
                    return;
                }

                // Mejorar calidad de escalado
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';

                ctx.drawImage(img, 0, 0, width, height);

                // Determinar tipo de salida (mantener PNG si es PNG para transparencia, si no JPEG)
                const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

                // Si es PNG, quality se ignora en toDataURL estándar, pero lo pasamos por si acaso
                resolve(canvas.toDataURL(outputType, quality));
            };

            img.onerror = (err) => {
                reject(new Error('Error al cargar la imagen para redimensionar'));
            };

            img.src = e.target.result;
        };

        reader.onerror = (err) => {
            reject(new Error('Error al leer el archivo'));
        };

        reader.readAsDataURL(file);
    });
}
