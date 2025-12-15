import React, { useState } from 'react';
import type { DrawingStroke } from '../../types';
import { useAvatar } from '../../hooks/useAvatar';
import { FRAMES } from '../../constants/cosmetics';

interface AvatarDisplayProps {
    strokes?: DrawingStroke[];
    avatar?: string; // Fallback emoji
    frame?: string;
    color?: string; // This is actually the stroke "color" in the parent usage usually? Or frame color?
    // In Player interface: 
    // color: string; // Avatar background color (this seems to be stroke color based on existing usage?)
    // backgroundColor?: string; // Avatar background fill
    // Check usage in ProfileScreen: player.color passed to color prop.
    backgroundColor?: string;
    size?: number; // pixel size (e.g. 48 for w-12)
    className?: string;
    playerId?: string; // NEW: ID to fetch avatar for
    imageUrl?: string; // NEW: Pre-rendered image URL for efficiency
}

const AvatarDisplayBase: React.FC<AvatarDisplayProps> = ({
    strokes,
    avatar,
    frame,
    color, // Used for border/text color usually
    backgroundColor,
    size = 48,
    className = '',
    playerId,
    imageUrl
}) => {
    const [imageError, setImageError] = useState(false);

    // Reset error if url changes
    React.useEffect(() => {
        setImageError(false);
    }, [imageUrl]);
    // If strokes are NOT provided (undefined OR empty array), try to fetch them
    const { strokes: fetchedStrokes, isLoading } = useAvatar((!strokes || strokes.length === 0) ? playerId : undefined);

    // Ensure backgroundColor has a valid default (handles undefined, null, empty string)
    const bgColor = backgroundColor || '#ffffff';

    // Helper to resolve frame class from ID (or use raw string if legacy/direct)
    const resolveFrameClass = (frameId?: string) => {
        if (!frameId) return '';
        const found = FRAMES.find(f => f.id === frameId);
        return found ? found.className : frameId;
    };
    const frameClass = resolveFrameClass(frame);

    // If we have an image URL, use that for best performance (no strokes rendering)
    if (imageUrl) {
        return (
            <div
                className={`rounded-2xl overflow-hidden relative shadow-sm flex items-center justify-center ${frameClass || ''} ${className}`}
                style={{
                    width: size,
                    height: size,
                    borderColor: color,
                    borderWidth: frameClass ? 0 : 2, // Only show border if no frame
                    color: color,
                    background: bgColor
                }}
            >
                <img 
                    src={imageUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-contain pointer-events-none select-none"
                    loading="lazy" 
                />
            </div>
        );
    }

    // Use provided strokes or fetched strokes
    const displayStrokes = strokes || fetchedStrokes;

    // Loading state (optional: show spinner or just fallback emoji)
    // For now, we fall back to emoji while loading or if no strokes found

    // If no strokes, render emoji fallback (or loading spinner if fetching)
    if (!displayStrokes || displayStrokes.length === 0) {
        return (
            <div
                className={`rounded-2xl flex items-center justify-center shadow-sm relative overflow-hidden ${frameClass || ''} ${className}`}
                style={{
                    color: color,
                    width: size,
                    height: size,
                    background: bgColor,
                    fontSize: size * 0.6
                }}
            >
                {isLoading ? (
                    // Loading spinner
                    <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                        <div
                            className="border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
                            style={{ width: size * 0.4, height: size * 0.4 }}
                        />
                    </div>
                ) : (
                    avatar || '👤'
                )}
            </div>
        );
    }

    // Optimized Image Rendering
    if (imageUrl && !imageError) {
        return (
            <div
                className={`relative rounded-full overflow-hidden ${className || ''}`}
                style={{
                    width: size,
                    height: size,
                    background: backgroundColor || '#ffffff',
                    border: frameClass ? undefined : `2px solid ${color || '#000000'}`,
                }}
            >
                {/* Frame Layer */}
                {frameClass && (
                    <div className={`absolute inset-0 z-20 pointer-events-none ${frameClass}`} style={{ color: color }}></div>
                )}

                <img
                    src={imageUrl}
                    alt="Avatar"
                    className="w-full h-full object-contain pointer-events-none select-none relative z-10"
                    loading="lazy"
                    onError={() => setImageError(true)}
                />
            </div>
        );
    }

    return (
        <div
            className={`relative rounded-full overflow-hidden ${className || ''}`}
            style={{
                width: size,
                height: size,
                background: backgroundColor || '#ffffff',
                border: frameClass ? undefined : `2px solid ${color || '#000000'}`,
            }}
        >
            {/* Frame Layer */}
            {frameClass && (
                <div className={`absolute inset-0 z-20 pointer-events-none ${frameClass}`} style={{ color: color }}></div>
            )}

            <svg
                viewBox="0 0 100 100"
                className="w-full h-full absolute inset-0 z-10"
                style={{ pointerEvents: 'none' }}
            >
                {displayStrokes.map((stroke, i) => {
                    if (!stroke || !stroke.points || stroke.points.length === 0) return null;

                    if (stroke.points.length === 1) {
                        const p = stroke.points[0];
                        return (
                            <circle
                                key={i}
                                cx={p.x}
                                cy={p.y}
                                r={(stroke.size / 3) / 2} // Scaled down to match editor look
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
                            strokeWidth={stroke.size / 3} // Scaled down to match editor look
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

export const AvatarDisplay = React.memo(AvatarDisplayBase);
