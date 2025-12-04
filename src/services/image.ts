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

                // Basic compression could go here if needed
                // For now, just return the base64 string
                resolve(result);
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }
};
