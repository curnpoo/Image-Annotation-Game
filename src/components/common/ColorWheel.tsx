import React, { useEffect, useState } from 'react';
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
    className = ''
}) => {
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

    const updateColor = (h: number, s: number, l: number) => {
        setHsl({ h, s, l });
        onChange(`hsl(${h}, ${s}%, ${l}%)`);
    };

    return (
        <div className={`flex flex-col items-center gap-4 w-full ${className}`}>
            <style>{`
                input[type=range] {
                    -webkit-appearance: none;
                    background: transparent;
                }

                input[type=range]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    height: 24px;
                    width: 24px;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    border: 2px solid #e5e7eb;
                    margin-top: 0px; 
                }

                input[type=range]::-moz-range-thumb {
                    height: 24px;
                    width: 24px;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    border: 2px solid #e5e7eb;
                }
            `}</style>

            {/* Color Preview */}
            <div
                className="rounded-full shadow-lg border-4 border-white transition-colors"
                style={{
                    width: 80,
                    height: 80,
                    backgroundColor: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`
                }}
            />

            {/* Sliders */}
            <div className="w-full space-y-3">
                {/* Hue */}
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-secondary)' }}>Hue</label>
                    <input
                        type="range"
                        min="0"
                        max="360"
                        value={hsl.h}
                        onChange={(e) => updateColor(parseInt(e.target.value), hsl.s, hsl.l)}
                        className="w-full h-5 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: 'linear-gradient(to right, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))'
                        }}
                    />
                </div>
                {/* Saturation */}
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-secondary)' }}>Saturation</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={hsl.s}
                        onChange={(e) => updateColor(hsl.h, parseInt(e.target.value), hsl.l)}
                        className="w-full h-5 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, hsl(${hsl.h}, 0%, ${hsl.l}%), hsl(${hsl.h}, 100%, ${hsl.l}%))`
                        }}
                    />
                </div>
                {/* Lightness */}
                <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--theme-text-secondary)' }}>Lightness</label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={hsl.l}
                        onChange={(e) => updateColor(hsl.h, hsl.s, parseInt(e.target.value))}
                        className="w-full h-5 rounded-full appearance-none cursor-pointer"
                        style={{
                            background: `linear-gradient(to right, hsl(${hsl.h}, ${hsl.s}%, 0%), hsl(${hsl.h}, ${hsl.s}%, 50%), hsl(${hsl.h}, ${hsl.s}%, 100%))`
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
                    onClick={() => updateColor(0, 100, 50)}
                    className="w-10 h-10 rounded-full border-2 border-white shadow-lg bg-red-500 hover:scale-110 transition-transform"
                    title="Reset Red"
                />
            </div>
        </div>
    );
};
