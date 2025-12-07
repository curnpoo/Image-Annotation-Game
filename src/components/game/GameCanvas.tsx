import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DrawingStroke } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface GameCanvasProps {
    imageUrl: string;
    brushColor: string;
    brushSize: number;
    isDrawingEnabled: boolean;
    strokes: DrawingStroke[];
    onStrokesChange: (strokes: DrawingStroke[]) => void;
    isEraser?: boolean;
    isEyedropper?: boolean;
    onColorPick?: (color: string) => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
    imageUrl,
    brushColor,
    brushSize,
    isDrawingEnabled,
    strokes,
    onStrokesChange,
    isEraser = false,
    isEyedropper = false,
    onColorPick
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentStroke, setCurrentStroke] = useState<DrawingStroke | null>(null);

    // No internal image canvas needed for display, only for eyedropper color picking
    // But we still need to load the image into a hidden canvas if we want to pick colors from it.
    // We can keep imageCanvasRef logic.
    const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!imageUrl) return;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = imageUrl;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(img, 0, 0);
                imageCanvasRef.current = canvas;
            }
        };
    }, [imageUrl]);

    const drawAll = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;

        // Always fill with white background first
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        strokes.forEach(stroke => {
            if (stroke.points.length === 0) return;
            ctx.beginPath();
            ctx.strokeStyle = stroke.color;
            ctx.fillStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
            if (stroke.points.length === 1) {
                const x = stroke.points[0].x / 100 * width;
                const y = stroke.points[0].y / 100 * height;
                ctx.arc(x, y, stroke.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.moveTo(stroke.points[0].x / 100 * width, stroke.points[0].y / 100 * height);
                for (let i = 1; i < stroke.points.length; i++) {
                    ctx.lineTo(stroke.points[i].x / 100 * width, stroke.points[i].y / 100 * height);
                }
                ctx.stroke();
            }
        });

        if (currentStroke && currentStroke.points.length > 0) {
            ctx.beginPath();
            ctx.strokeStyle = currentStroke.color;
            ctx.fillStyle = currentStroke.color;
            ctx.lineWidth = currentStroke.size;
            ctx.globalCompositeOperation = currentStroke.isEraser ? 'destination-out' : 'source-over';
            if (currentStroke.points.length === 1) {
                const x = currentStroke.points[0].x / 100 * width;
                const y = currentStroke.points[0].y / 100 * height;
                ctx.arc(x, y, currentStroke.size / 2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.moveTo(currentStroke.points[0].x / 100 * width, currentStroke.points[0].y / 100 * height);
                for (let i = 1; i < currentStroke.points.length; i++) {
                    ctx.lineTo(currentStroke.points[i].x / 100 * width, currentStroke.points[i].y / 100 * height);
                }
                ctx.stroke();
            }
        }
        ctx.globalCompositeOperation = 'source-over';
    }, [strokes, currentStroke]);

    // Handle resize - match resolution to container size
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeCanvas = () => {
            // Simply match the container's size (controlled by parent CSS)
            const width = container.clientWidth;
            const height = container.clientHeight;

            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
                requestAnimationFrame(drawAll);
            }
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        return () => window.removeEventListener('resize', resizeCanvas);
    }, [drawAll]);

    // Draw when strokes change
    useEffect(() => {
        drawAll();
    }, [drawAll]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        return {
            x: ((clientX - rect.left) / rect.width) * 100,
            y: ((clientY - rect.top) / rect.height) * 100
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawingEnabled && !isEyedropper) return;
        if ('touches' in e) e.preventDefault();
        vibrate(HapticPatterns.soft);
        const point = getPoint(e);

        if (isEyedropper && onColorPick) {
            // Eyedropper logic remains same...
            const canvas = canvasRef.current;
            const imgCanvas = imageCanvasRef.current;
            if (!canvas) return;
            // 1. Try picking from strokes
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const x = (point.x / 100) * canvas.width;
                const y = (point.y / 100) * canvas.height;
                const p = ctx.getImageData(x, y, 1, 1).data;
                if (p[3] > 0) {
                    const hex = "#" + [p[0], p[1], p[2]].map(x => x.toString(16).padStart(2, '0')).join('');
                    onColorPick(hex);
                    return;
                }
            }
            // 2. Try picking from image
            if (imgCanvas) {
                const ctx = imgCanvas.getContext('2d');
                if (ctx) {
                    const x = (point.x / 100) * imgCanvas.width;
                    const y = (point.y / 100) * imgCanvas.height;
                    const p = ctx.getImageData(x, y, 1, 1).data;
                    const hex = "#" + [p[0], p[1], p[2]].map(x => x.toString(16).padStart(2, '0')).join('');
                    onColorPick(hex);
                    return;
                }
            }
            return;
        }

        setIsDrawing(true);
        setCurrentStroke({
            color: brushColor,
            size: brushSize,
            points: [point],
            isEraser
        });
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !currentStroke) return;
        e.preventDefault();
        const point = getPoint(e);
        setCurrentStroke(prev => prev ? {
            ...prev,
            points: [...prev.points, point]
        } : null);
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (currentStroke) {
            onStrokesChange([...strokes, currentStroke]);
            setCurrentStroke(null);
        }
    };

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 w-full h-full touch-none"
            style={{
                touchAction: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                zIndex: 20
            }}
        >
            <canvas
                ref={canvasRef}
                className={`w-full h-full block touch-none ${isEyedropper ? 'cursor-cell' : 'cursor-crosshair'}`}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
            />
        </div>
    );
};
