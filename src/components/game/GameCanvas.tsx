import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DrawingStroke } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface GameCanvasProps {
    imageUrl: string;
    brushColor: string;
    brushSize: number;
    brushType?: string; // Add prop
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
    brushType = 'default',
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

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        const toScreen = (p: { x: number, y: number }) => ({
            x: (p.x / 100) * width,
            y: (p.y / 100) * height
        });

        const renderStroke = (stroke: DrawingStroke) => {
            if (stroke.points.length === 0) return;

            const points = stroke.points.map(toScreen);

            // Default settings
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = stroke.color;
            ctx.fillStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.globalCompositeOperation = stroke.isEraser ? 'destination-out' : 'source-over';
            ctx.shadowBlur = 0;
            ctx.shadowColor = 'transparent';
            ctx.globalAlpha = 1.0;
            ctx.imageSmoothingEnabled = true;

            if (stroke.isEraser) {
                ctx.beginPath();
                if (points.length === 1) {
                    ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.moveTo(points[0].x, points[0].y);
                    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
                    ctx.stroke();
                }
                return;
            }

            switch (stroke.type) {
                case 'marker':
                    // Marker: Semi-transparent to simulate ink build-up. 
                    // Note: 'multiply' would be ideal for color mixing but risks invisibility on transparent layers.
                    // We use 'source-over' with low alpha to allow manual darkening by layering.
                    ctx.globalAlpha = 0.5;
                    ctx.globalCompositeOperation = 'source-over';
                    // We simulate "mkarker on paper" by having a slightly fuzzy edge but solid core
                    ctx.shadowBlur = stroke.size * 0.2;
                    ctx.shadowColor = stroke.color;

                    ctx.beginPath();
                    if (points.length === 1) {
                        ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
                        ctx.stroke();
                    }
                    break;

                case 'neon':
                    // Neon: Intense glow + Core
                    ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow

                    // 1. Wide diffuse glow
                    ctx.shadowBlur = 30;
                    ctx.shadowColor = stroke.color;
                    ctx.globalAlpha = 0.5;
                    ctx.lineWidth = stroke.size * 1.5;

                    ctx.beginPath();
                    if (points.length === 1) {
                        ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
                        ctx.stroke();
                    }

                    // 2. Tighter bright glow
                    ctx.shadowBlur = 10;
                    ctx.globalAlpha = 0.8;
                    ctx.lineWidth = stroke.size;
                    ctx.stroke();

                    // 3. White Core
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = 'white';
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = Math.max(1, stroke.size / 3);
                    ctx.globalAlpha = 1.0;
                    ctx.stroke();
                    break;

                case 'pixel':
                    // Pixel: Snap to grid based on brush size
                    ctx.imageSmoothingEnabled = false;
                    const gridSize = Math.max(1, Math.floor(stroke.size));

                    const drawPixel = (px: number, py: number) => {
                        // Snap to grid
                        const snapX = Math.floor(px / gridSize) * gridSize;
                        const snapY = Math.floor(py / gridSize) * gridSize;
                        ctx.fillRect(snapX, snapY, gridSize, gridSize);
                    };

                    points.forEach((p, i) => {
                        if (i === 0) {
                            drawPixel(p.x, p.y);
                        } else {
                            const prev = points[i - 1];
                            const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
                            const steps = Math.ceil(dist / gridSize * 2); // Oversample to catch diagonals
                            for (let s = 1; s <= steps; s++) {
                                const t = s / steps;
                                drawPixel(
                                    prev.x + (p.x - prev.x) * t,
                                    prev.y + (p.y - prev.y) * t
                                );
                            }
                        }
                    });
                    break;

                case 'calligraphy':
                    // Calligraphy: Fixed Angle Pen (45 degrees)
                    const angle = -45 * Math.PI / 180;
                    const penWidth = stroke.size;

                    ctx.fillStyle = stroke.color;
                    ctx.strokeStyle = stroke.color;
                    ctx.lineWidth = 1; // Minimal width for the filler lines

                    points.forEach((p, i) => {
                        if (i > 0) {
                            const prev = points[i - 1];
                            const dx = (penWidth / 2) * Math.cos(angle);
                            const dy = (penWidth / 2) * Math.sin(angle);

                            ctx.beginPath();
                            ctx.moveTo(prev.x - dx, prev.y - dy); // Top-Left
                            ctx.lineTo(p.x - dx, p.y - dy);       // Top-Right
                            ctx.lineTo(p.x + dx, p.y + dy);       // Bottom-Right
                            ctx.lineTo(prev.x + dx, prev.y + dy); // Bottom-Left
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke(); // Fill gaps to avoid aliasing artifacts
                        }
                    });
                    break;

                case 'spray':
                    // Spray: Large, noisy, falloff
                    const radiusS = stroke.size * 3; // Larger spread
                    const dotCountS = Math.floor(stroke.size * 1.5); // More dots

                    points.forEach((p, i) => {
                        const prev = i > 0 ? points[i - 1] : p;
                        const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
                        // Interpolate heavily to avoid "clumping" at points
                        const steps = Math.max(1, Math.ceil(dist / (stroke.size * 0.1)));

                        for (let s = 0; s < steps; s++) {
                            const t = s / steps;
                            const cx = prev.x + (p.x - prev.x) * t;
                            const cy = prev.y + (p.y - prev.y) * t;

                            for (let d = 0; d < dotCountS; d++) {
                                // Random angle
                                const a = Math.random() * Math.PI * 2;
                                // Random radius with Bias towards center (Gaussian-ish)
                                // r = radius * (1 - sqrt(random)) gives center bias? 
                                // Or use Box-Muller for real gaussian.
                                // Simple approximation: r = radius * rand^2
                                const r = radiusS * Math.pow(Math.random(), 2);

                                const px = cx + Math.cos(a) * r;
                                const py = cy + Math.sin(a) * r;

                                // Noise texture: Draw tiny rectangles/dots
                                ctx.fillRect(px, py, 1, 1);
                            }
                        }
                    });
                    break;

                default:
                    // Standard
                    ctx.beginPath();
                    if (points.length === 1) {
                        ctx.arc(points[0].x, points[0].y, stroke.size / 2, 0, Math.PI * 2);
                        ctx.fill();
                    } else {
                        ctx.moveTo(points[0].x, points[0].y);
                        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
                        ctx.stroke();
                    }
                    break;
            }
        };

        strokes.forEach(renderStroke);

        if (currentStroke && currentStroke.points.length > 0) {
            renderStroke(currentStroke);
        }

        // Restore context
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
            isEraser,
            type: brushType // Use prop
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
