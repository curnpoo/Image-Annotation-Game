import React, { useState } from 'react';
import type { DrawingStroke, PlayerCosmetics } from '../../types';
import { useAvatar } from '../../hooks/useAvatar';
import { FRAMES, THEMES } from '../../constants/cosmetics';

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
    cosmetics?: PlayerCosmetics; // NEW: Pass cosmetics to check for theme match
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
    cosmetics,
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
    let bgColor = backgroundColor || '#ffffff';

    // Apply "Match Avatar to Theme" logic ONLY if explicitly enabled (must be exactly true, not undefined/null)
    // User complained that even with toggle OFF, avatar was still matching theme
    if (cosmetics?.matchAvatarToTheme === true && cosmetics.activeTheme) {
        const theme = THEMES.find(t => t.id === cosmetics.activeTheme);
        if (theme?.value) {
            bgColor = theme.value;
        }
    }

    // Helper to resolve frame data from ID
    const resolveFrame = (frameId?: string) => {
        if (!frameId) return null;
        return FRAMES.find(f => f.id === frameId) || null;
    };
    const frameData = resolveFrame(frame);
    const frameClass = frameData?.className || '';
    const frameType = (frameData as { type?: string })?.type;
    
    // Check if frame is a glow type (has box-shadow in className)
    const isGlowFrame = frameClass.includes('shadow-[');

    // Render special frame backgrounds (rainbow, wood)
    const renderSpecialFrameBackground = () => {
        if (frameType === 'rainbow') {
            return (
                <div 
                    className="absolute inset-0 z-0 rounded-[inherit]"
                    style={{
                        background: 'linear-gradient(135deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3, #ff0000)',
                        backgroundSize: '400% 400%',
                        animation: 'rainbow-bg-pan 4s linear infinite'
                    }}
                />
            );
        }
        if (frameType === 'wood') {
            return (
                <div 
                    className="absolute inset-0 z-0 rounded-[inherit]"
                    style={{
                        background: `
                            repeating-linear-gradient(
                                90deg,
                                #8B4513 0px,
                                #A0522D 2px,
                                #CD853F 4px,
                                #8B4513 6px,
                                #D2691E 8px,
                                #8B4513 10px
                            ),
                            repeating-linear-gradient(
                                0deg,
                                transparent 0px,
                                rgba(0,0,0,0.1) 1px,
                                transparent 2px
                            )
                        `,
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), inset 0 -2px 4px rgba(255,255,255,0.1)'
                    }}
                />
            );
        }
        return null;
    };

    // Check if frame needs inner padding (rainbow/wood fill the container)
    const frameNeedsPadding = frameType === 'rainbow' || frameType === 'wood';

    // Calculate padding for special frames
    const framePadding = frameNeedsPadding ? Math.max(3, size * 0.08) : 0;

    // If we have an image URL, use that for best performance (no strokes rendering)
    if (imageUrl) {
        return (
            <div
                className={`rounded-2xl relative shadow-sm flex items-center justify-center ${isGlowFrame ? frameClass : ''} ${className}`}
                style={{
                    width: size,
                    height: size,
                    borderColor: color,
                    borderWidth: (frameClass || frameType) ? 0 : 2,
                    color: color,
                    background: frameNeedsPadding ? 'transparent' : bgColor
                }}
            >
                {/* Special Frame Background (rainbow/wood) */}
                {renderSpecialFrameBackground()}
                
                {/* Inner content container for special frames */}
                {frameNeedsPadding ? (
                    <div 
                        className="absolute rounded-xl overflow-hidden z-10"
                        style={{
                            inset: framePadding,
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
                ) : (
                    <>
                        {/* Non-glow Frame Layer */}
                        {frameClass && !isGlowFrame && (
                            <div className={`absolute inset-0 z-20 pointer-events-none rounded-[inherit] ${frameClass}`} style={{ color: color }}></div>
                        )}
                        <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
                            <img 
                                src={imageUrl} 
                                alt="Avatar" 
                                className="w-full h-full object-contain pointer-events-none select-none relative z-10"
                                loading="lazy" 
                            />
                        </div>
                    </>
                )}
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
                className={`rounded-2xl flex items-center justify-center shadow-sm relative ${isGlowFrame ? frameClass : ''} ${className}`}
                style={{
                    color: color,
                    width: size,
                    height: size,
                    background: frameNeedsPadding ? 'transparent' : bgColor,
                    fontSize: size * 0.6
                }}
            >
                {/* Special Frame Background (rainbow/wood) */}
                {renderSpecialFrameBackground()}
                
                {/* Inner content container for special frames */}
                {frameNeedsPadding ? (
                    <div 
                        className="absolute rounded-xl overflow-hidden z-10 flex items-center justify-center"
                        style={{
                            inset: framePadding,
                            background: bgColor,
                            fontSize: size * 0.5
                        }}
                    >
                        {isLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                <div
                                    className="border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
                                    style={{ width: size * 0.3, height: size * 0.3 }}
                                />
                            </div>
                        ) : (
                            <span>{avatar || '👤'}</span>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Non-glow Frame Layer */}
                        {frameClass && !isGlowFrame && (
                            <div className={`absolute inset-0 z-20 pointer-events-none rounded-[inherit] ${frameClass}`} style={{ color: color }}></div>
                        )}
                        <div className="absolute inset-0 rounded-[inherit] overflow-hidden flex items-center justify-center">
                            {isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-[1px] z-10">
                                    <div
                                        className="border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"
                                        style={{ width: size * 0.4, height: size * 0.4 }}
                                    />
                                </div>
                            ) : (
                                <span className="relative z-10" style={{ fontSize: size * 0.6 }}>{avatar || '👤'}</span>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Optimized Image Rendering (this branch is actually unreachable since imageUrl is handled above, but keeping for safety)
    if (imageUrl && !imageError) {
        return (
            <div
                className={`relative rounded-2xl overflow-hidden ${className || ''}`}
                style={{
                    width: size,
                    height: size,
                    background: frameNeedsPadding ? 'transparent' : (backgroundColor || '#ffffff'),
                    border: (frameClass || frameType) ? undefined : `2px solid ${color || '#000000'}`,
                }}
            >
                {/* Special Frame Background (rainbow/wood) */}
                {renderSpecialFrameBackground()}
                
                {frameNeedsPadding ? (
                    <div 
                        className="absolute rounded-xl overflow-hidden z-10"
                        style={{
                            inset: framePadding,
                            background: backgroundColor || '#ffffff'
                        }}
                    >
                        <img
                            src={imageUrl}
                            alt="Avatar"
                            className="w-full h-full object-contain pointer-events-none select-none"
                            loading="lazy"
                            onError={() => setImageError(true)}
                        />
                    </div>
                ) : (
                    <>
                        {/* Frame Layer */}
                        {frameClass && (
                            <div className={`absolute inset-0 z-20 pointer-events-none rounded-[inherit] ${frameClass}`} style={{ color: color }}></div>
                        )}
                        <img
                            src={imageUrl}
                            alt="Avatar"
                            className="w-full h-full object-contain pointer-events-none select-none relative z-10"
                            loading="lazy"
                            onError={() => setImageError(true)}
                        />
                    </>
                )}
            </div>
        );
    }

    return (
        <div
            className={`relative rounded-2xl ${isGlowFrame ? frameClass : ''} ${className || ''}`}
            style={{
                width: size,
                height: size,
                background: frameNeedsPadding ? 'transparent' : (backgroundColor || '#ffffff'),
                border: (frameClass || frameType) ? undefined : `2px solid ${color || '#000000'}`,
            }}
        >
            {/* Special Frame Background (rainbow/wood) */}
            {renderSpecialFrameBackground()}
            
            {frameNeedsPadding ? (
                <div 
                    className="absolute rounded-xl overflow-hidden z-10"
                    style={{
                        inset: framePadding,
                        background: backgroundColor || '#ffffff'
                    }}
                >
                    <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full"
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
            ) : (
                <>
                    {/* Non-glow Frame Layer */}
                    {frameClass && !isGlowFrame && (
                        <div className={`absolute inset-0 z-20 pointer-events-none rounded-[inherit] ${frameClass}`} style={{ color: color }}></div>
                    )}

                    <div className="absolute inset-0 rounded-[inherit] overflow-hidden">
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
                </>
            )}
        </div>
    );
};

export const AvatarDisplay = React.memo(AvatarDisplayBase);
