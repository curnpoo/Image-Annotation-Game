import React, { useRef, useEffect, useState } from 'react';
import { hexToHsl } from '../../utils/colorUtils';

interface ColorWheelProps {
    color: string;
    onChange: (color: string) => void;
    size?: number;
    className?: string;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
    color,
    onChange,
    size = 200,
    className = ''
}) => {
    const wheelRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Parse initial color
    const [hsl, setHsl] = useState({ h: 0, s: 100, l: 50 });

    useEffect(() => {
        if (color.startsWith('#')) {
            const { h, s, l } = hexToHsl(color);
            setHsl({ h, s, l });
        } else if (color.startsWith('hsl')) {
            // Simple parse for hsl(h, s%, l%)
            const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
            if (match) {
                setHsl({
                    h: parseInt(match[1]),
                    s: parseInt(match[2]),
                    l: parseInt(match[3])
                });
            }
        }
    }, []); // Only on mount to avoid loops, or careful dependency

    const handleWheelInteraction = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if (!wheelRef.current) return;

        const rect = wheelRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

        const dx = clientX - centerX;
        const dy = clientY - centerY;

        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle < 0) angle += 360;

        // Angle + 90 to match CSS gradient if needed, but assuming 0=Red at right (standard math) or top.
        // Let's assume standard math: 0 is right. conic-gradient starts top.
        // So we need to rotate +90.
        const hue = Math.round((angle + 90) % 360);

        updateColor(hue, hsl.s, hsl.l);
    };

    const updateColor = (h: number, s: number, l: number) => {
        setHsl({ h, s, l });
        onChange(`hsl(${h}, ${s}%, ${l}%)`);
    };

    const onMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        handleWheelInteraction(e);
    };

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                handleWheelInteraction(e);
            }
        };

        const onMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, hsl]);

    return (
        <div className={`flex flex-col items-center gap-4 ${className}`}>
            {/* Wheel */}
            <div
                ref={wheelRef}
                className="relative rounded-full shadow-xl cursor-crosshair touch-none"
                style={{
                    width: size,
                    height: size,
                    background: 'conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)',
                    border: '4px solid white',
                    boxShadow: '0 0 15px rgba(0,0,0,0.2)'
                }}
                onMouseDown={onMouseDown}
                onTouchStart={(e) => handleWheelInteraction(e.nativeEvent)}
                onTouchMove={(e) => handleWheelInteraction(e.nativeEvent)}
            >
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-inner border-4 border-white pointer-events-none transition-colors"
                    style={{
                        width: size * 0.3,
                        height: size * 0.3,
                        backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
                    }}
                />
            </div>

            {/* Sliders */}
            <div className="w-full px-4 space-y-6 bg-white/5 rounded-2xl py-6">
                {/* Saturation */}
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold w-4 text-white/50">S</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={hsl.s}
                        onChange={(e) => updateColor(hsl.h, parseInt(e.target.value), hsl.l)}
                        className="flex-1 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, #808080, hsl(${hsl.h}, 100%, 50%))`
                        }}
                    />
                </div>
                {/* Lightness */}
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold w-4 text-white/50">L</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={hsl.l}
                        onChange={(e) => updateColor(hsl.h, hsl.s, parseInt(e.target.value))}
                        className="flex-1 h-6 bg-gray-200 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, black, hsl(${hsl.h}, ${hsl.s}%, 50%), white)`
                        }}
                    />
                </div>
            </div>

            {/* Presets */}
            <div className="flex gap-3">
                <button
                    onClick={() => updateColor(0, 0, 0)}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg bg-black hover:scale-110 transition-transform"
                    title="Black"
                />
                <button
                    onClick={() => updateColor(0, 0, 100)}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 shadow-lg bg-white hover:scale-110 transition-transform"
                    title="White"
                />
                <button
                    onClick={() => updateColor(0, 100, 50)} // Reset to Red
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg bg-red-500 hover:scale-110 transition-transform"
                    title="Reset Red"
                />
            </div>
        </div>
    );
};
