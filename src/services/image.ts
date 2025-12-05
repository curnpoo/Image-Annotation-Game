export const ImageService = {
    processImage: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Check size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                reject(new Error('Image too large (max 5MB)'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;

                // Create an image to get dimensions
                const img = new Image();
                img.onload = () => {
                    // Crop to square (center crop)
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        reject(new Error('Failed to create canvas context'));
                        return;
                    }

                    // Determine the square size (use the smaller dimension)
                    const size = Math.min(img.width, img.height);

                    // Calculate the crop offset (center the crop)
                    const offsetX = (img.width - size) / 2;
                    const offsetY = (img.height - size) / 2;

                    // Set canvas to a reasonable max size (e.g., 1024x1024)
                    const maxSize = 1024;
                    const outputSize = Math.min(size, maxSize);
                    canvas.width = outputSize;
                    canvas.height = outputSize;

                    // Draw the cropped and resized image
                    ctx.drawImage(
                        img,
                        offsetX, offsetY, size, size,  // Source: crop from center
                        0, 0, outputSize, outputSize    // Dest: fill canvas
                    );

                    // Convert to base64 with compression (0.85 quality for JPEG)
                    const squareBase64 = canvas.toDataURL('image/jpeg', 0.85);
                    resolve(squareBase64);
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = result;
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }
};
