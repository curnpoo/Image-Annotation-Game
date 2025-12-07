import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const ImageService = {
    processImage: (file: File, roomCode: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            // Check size (max 20MB)
            if (file.size > 20 * 1024 * 1024) {
                reject(new Error('Image too large (max 20MB)'));
                return;
            }

            // Check file type
            if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
                reject(new Error('Invalid file format. Use JPG, PNG, GIF or WebP'));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;

                // Create an image to get dimensions
                const img = new Image();
                img.onload = async () => {
                    try {
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

                        // Set canvas to a reasonable max size (e.g., 600x600 for storage optimization)
                        const maxSize = 600;
                        const outputSize = Math.min(size, maxSize);
                        canvas.width = outputSize;
                        canvas.height = outputSize;

                        // Draw the cropped and resized image
                        ctx.drawImage(
                            img,
                            offsetX, offsetY, size, size,  // Source: crop from center
                            0, 0, outputSize, outputSize    // Dest: fill canvas
                        );

                        // Convert to base64 with compression (0.6 quality for WebP)
                        const squareBase64 = canvas.toDataURL('image/webp', 0.6);

                        // UPLOAD TO FIREBASE STORAGE
                        const timestamp = Date.now();
                        const fileName = `${timestamp}_${Math.random().toString(36).substr(2, 9)}.webp`;
                        const storageRef = ref(storage, `game-images/${roomCode}/${fileName}`);

                        console.log('Uploading processed image to Firebase Storage...');
                        const snapshot = await uploadString(storageRef, squareBase64, 'data_url');
                        const downloadURL = await getDownloadURL(snapshot.ref);

                        console.log('Image uploaded successfully:', downloadURL);
                        resolve(downloadURL);

                    } catch (error: any) {
                        console.error('Error processing/uploading image:', error);

                        // Check for Firebase Storage permission errors
                        if (error?.code === 'storage/unauthorized' ||
                            error?.message?.includes('403') ||
                            error?.message?.includes('Forbidden') ||
                            error?.serverResponse?.includes('403')) {
                            reject(new Error('Storage permission denied. Please check Firebase Storage rules.'));
                        } else if (error?.code === 'storage/unknown') {
                            reject(new Error('Storage error. Please try again.'));
                        } else {
                            reject(new Error(error?.message || 'Failed to upload image'));
                        }
                    }
                };

                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = result;
            };
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    }
};
