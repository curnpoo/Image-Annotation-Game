import React from 'react';
import type { DrawingStroke } from '../../types';

interface AvatarDisplayProps {
    strokes?: DrawingStroke[];
    avatar?: string; // Fallback emoji
    frame?: string;
    color?: string;
    size?: number; // pixel size (e.g. 48 for w-12)
    className?: string;
}

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
    strokes,
    avatar,
    frame,
    color,
    size = 48,
    className = ''
}) => {
    // If no strokes, render emoji fallback
    if (!strokes || strokes.length === 0) {
        return (
            <div
                className={`rounded-full bg-white flex items-center justify-center shadow-sm ${frame || ''} ${className}`}
                style={{
                    color: color,
                    width: size,
                    height: size,
                    fontSize: size * 0.6
                }}
            >
                {avatar || '👤'}
            </div>
        );
    }

    return (
        <div
            className={`rounded-full bg-white overflow-hidden relative shadow-sm flex items-center justify-center ${frame || ''} ${className}`}
            style={{
                width: size,
                height: size,
                borderColor: color
            }}
        >
            <svg
                viewBox="0 0 100 100"
                className="w-full h-full"
                style={{ color: color }}
            >
                {strokes.map((stroke, i) => {
                    if (!stroke || !stroke.points || stroke.points.length === 0) return null;

                    if (stroke.points.length === 1) {
                        const p = stroke.points[0];
                        return (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={(stroke.size / 3) / 2}
                                fill={stroke.color}
                            />
                        );
                    }

                    return (
                        <path
                            key={i}
                            d={stroke.points.map((p, j) =>
                                p ? `${j === 0 ? 'M' : 'L'} ${p.x} ${p.y}` : ''
                            ).join(' ')}
                            stroke={stroke.color}
                            strokeWidth={stroke.size / 3}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    );
                })}
            </svg>
        </div>
    );
};
