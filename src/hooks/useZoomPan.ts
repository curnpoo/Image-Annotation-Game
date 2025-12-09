import { useState, useCallback, useRef } from 'react';
import { useGesture } from '@use-gesture/react';
import { vibrate, HapticPatterns } from '../utils/haptics';

interface UseZoomPanOptions {
    minScale?: number;
    maxScale?: number;
}

interface UseZoomPanReturn {
    scale: number;
    offsetX: number;
    offsetY: number;
    isZoomed: boolean;
    isPinching: boolean;
    resetZoom: () => void;
    bind: ReturnType<typeof useGesture>;
    contentStyle: React.CSSProperties;
}

/**
 * iOS-like pinch-to-zoom hook with two-finger pan
 * 
 * Features:
 * - Two-finger pinch to zoom (1×-4×)
 * - Two-finger pan when zoomed (moves with pinch origin)
 * - Exposes isPinching so parent can disable drawing during gesture
 * - Spring animation on release
 * - Rubber-banding at limits
 */
export function useZoomPan(options: UseZoomPanOptions = {}): UseZoomPanReturn {
    const {
        minScale = 1,
        maxScale = 4
    } = options;

    const [scale, setScale] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [isPinching, setIsPinching] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    // Store initial values at gesture start
    const initialScaleRef = useRef(1);
    const initialOffsetRef = useRef({ x: 0, y: 0 });
    const startOriginRef = useRef<[number, number] | null>(null);
    const containerSizeRef = useRef({ width: 300, height: 300 }); // Will be updated

    // Track if we've vibrated at bounds
    const vibratedRef = useRef(false);

    /**
     * Reset zoom to 1x and pan to center
     */
    const resetZoom = useCallback(() => {
        vibrate(HapticPatterns.medium);
        setIsAnimating(true);
        setScale(1);
        setOffsetX(0);
        setOffsetY(0);
        initialScaleRef.current = 1;
        initialOffsetRef.current = { x: 0, y: 0 };
        setTimeout(() => setIsAnimating(false), 350);
    }, []);

    /**
     * Calculate max pan based on zoom level
     */
    const getMaxPan = useCallback((currentScale: number) => {
        if (currentScale <= 1) return 0;
        return ((currentScale - 1) / currentScale) * 100;
    }, []);

    /**
     * Combined gesture handler - pinch with pan via origin tracking
     */
    const bind = useGesture(
        {
            onPinchStart: ({ origin, event }) => {
                event?.preventDefault();
                setIsPinching(true);
                setIsAnimating(false);
                initialScaleRef.current = scale;
                initialOffsetRef.current = { x: offsetX, y: offsetY };
                startOriginRef.current = origin;
                vibratedRef.current = false;

                // Try to get container size from event target
                const target = event?.target as HTMLElement;
                if (target) {
                    const rect = target.closest('[data-zoom-container]')?.getBoundingClientRect();
                    if (rect) {
                        containerSizeRef.current = { width: rect.width, height: rect.height };
                    }
                }
            },
            onPinch: ({ offset: [d], origin }) => {
                // d is the current scale value
                let newScale = d;

                // Apply rubber-band at limits
                if (newScale < minScale) {
                    const overshoot = minScale - newScale;
                    newScale = minScale - (overshoot * 0.3);
                } else if (newScale > maxScale) {
                    const overshoot = newScale - maxScale;
                    newScale = maxScale + (overshoot * 0.3);
                }

                // Haptic at bounds
                if ((newScale <= minScale || newScale >= maxScale) && !vibratedRef.current) {
                    vibrate(HapticPatterns.light);
                    vibratedRef.current = true;
                } else if (newScale > minScale && newScale < maxScale) {
                    vibratedRef.current = false;
                }

                setScale(newScale);

                // Track pan via origin movement (two-finger drag)
                if (newScale > 1 && startOriginRef.current) {
                    const deltaX = origin[0] - startOriginRef.current[0];
                    const deltaY = origin[1] - startOriginRef.current[1];

                    // Convert pixel delta to percentage of container
                    const { width, height } = containerSizeRef.current;
                    const panX = initialOffsetRef.current.x + (deltaX / width) * 100;
                    const panY = initialOffsetRef.current.y + (deltaY / height) * 100;

                    const maxPan = getMaxPan(newScale);
                    setOffsetX(Math.max(-maxPan, Math.min(maxPan, panX)));
                    setOffsetY(Math.max(-maxPan, Math.min(maxPan, panY)));
                }
            },
            onPinchEnd: () => {
                setIsPinching(false);
                setIsAnimating(true);
                startOriginRef.current = null;

                // Clamp scale to bounds
                let finalScale = scale;
                if (finalScale < minScale) finalScale = minScale;
                if (finalScale > maxScale) finalScale = maxScale;

                // Snap back to 1 if very close
                if (finalScale < 1.15) {
                    finalScale = 1;
                    setOffsetX(0);
                    setOffsetY(0);
                    initialOffsetRef.current = { x: 0, y: 0 };
                } else {
                    // Clamp offset to valid range for final scale
                    const maxPan = getMaxPan(finalScale);
                    setOffsetX(prev => Math.max(-maxPan, Math.min(maxPan, prev)));
                    setOffsetY(prev => Math.max(-maxPan, Math.min(maxPan, prev)));
                }

                setScale(finalScale);
                initialScaleRef.current = finalScale;

                setTimeout(() => setIsAnimating(false), 350);
            }
        },
        {
            pinch: {
                from: () => [scale, 0],
                scaleBounds: { min: minScale * 0.5, max: maxScale * 1.5 },
                rubberband: 0.15
            }
        }
    );

    /**
     * Transform style for the content
     */
    const contentStyle: React.CSSProperties = {
        transform: `scale(${scale}) translate(${offsetX}%, ${offsetY}%)`,
        transformOrigin: 'center center',
        transition: isAnimating
            ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            : 'none',
        willChange: isPinching ? 'transform' : 'auto'
    };

    return {
        scale,
        offsetX,
        offsetY,
        isZoomed: scale > 1.05,
        isPinching,
        resetZoom,
        bind,
        contentStyle
    };
}
