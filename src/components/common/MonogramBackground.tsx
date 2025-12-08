import React, { useEffect, useMemo, useState } from 'react';

interface MonogramBackgroundProps {
    speed?: 'normal' | 'slow';
    blur?: 'none' | 'sm' | 'md' | 'lg';
    opacity?: number;
}

export const MonogramBackground: React.FC<MonogramBackgroundProps> = ({
    speed = 'normal',
    blur = 'none',
    opacity = 0.2
}) => {
    const [style, setStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        // Distance to move (must match pattern size for perfect seamless loop)
        const patternSize = 240;

        // Use random integer multipliers for seamless looping directions
        const possibleMultipliers = [-3, -2, -1, 1, 2, 3];
        const xMult = possibleMultipliers[Math.floor(Math.random() * possibleMultipliers.length)];
        const yMult = possibleMultipliers[Math.floor(Math.random() * possibleMultipliers.length)];

        const x = xMult * patternSize;
        const y = yMult * patternSize;

        setStyle({
            '--pan-x': `${x}px`,
            '--pan-y': `${y}px`,
        } as React.CSSProperties);
    }, []);

    const svgPattern = useMemo(() => {
        const icons = [
            { icon: '🎨', x: 20, y: 40, size: 40, rotate: 15 },
            { icon: '✏️', x: 100, y: 30, size: 35, rotate: -20 },
            { icon: '🖌️', x: 180, y: 45, size: 38, rotate: 10 },
            { icon: '📐', x: 40, y: 140, size: 35, rotate: -15 },
            { icon: '🖊️', x: 120, y: 130, size: 32, rotate: 25 },
            { icon: '✒️', x: 200, y: 150, size: 36, rotate: -10 },
            { icon: '🖍️', x: 80, y: 210, size: 34, rotate: 5 },
            { icon: '📝', x: 160, y: 200, size: 38, rotate: -5 },
        ];

        const svgContent = icons.map((item) =>
            `<text x="${item.x}" y="${item.y}" font-size="${item.size}" transform="rotate(${item.rotate}, ${item.x}, ${item.y})" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif" opacity="1" dominant-baseline="middle" text-anchor="middle">${item.icon}</text>`
        ).join('');

        // Use fill="black" so the mask is opaque (fully visible)
        // The background color of the div will show through.
        const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
            <style>text { fill: black; }</style>
            ${svgContent}
        </svg>
        `.trim();

        return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }, []);

    // Animation duration based on speed prop
    const animationDuration = speed === 'slow' ? '60s' : '30s';
    const panDuration = speed === 'slow' ? '240s' : '120s';

    // Blur class based on prop
    const blurClass = {
        'none': '',
        'sm': 'blur-sm',
        'md': 'blur-md',
        'lg': 'blur-lg'
    }[blur];

    return (
        <div
            className={`absolute inset-0 pointer-events-none z-0 overflow-hidden ${blurClass}`}
            style={{ ...style, opacity }}
        >
            <div
                className="absolute inset-0 w-full h-full"
                style={{
                    backgroundColor: 'currentColor',
                    maskImage: `url('${svgPattern}')`,
                    WebkitMaskImage: `url('${svgPattern}')`,
                    maskRepeat: 'repeat',
                    WebkitMaskRepeat: 'repeat',
                    maskSize: '240px 240px',
                    WebkitMaskSize: '240px 240px',
                    // Use a long duration for "very slow"
                    animation: `pastel-cycle ${animationDuration} infinite linear, mask-pan ${panDuration} infinite linear`
                }}
            />
        </div>
    );
};
