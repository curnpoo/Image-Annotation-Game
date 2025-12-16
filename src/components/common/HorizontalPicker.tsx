import React, { useRef, useEffect, useState, useCallback } from 'react';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface HorizontalPickerProps {
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
    prefix?: string;
    suffix?: string;
    disabled?: boolean;
    options?: number[]; // Custom values to pick from
    maxAllowed?: number; // Max value user can select (e.g., based on balance)
    label?: string; // Optional label to display above picker
    compact?: boolean; // Compact mode for smaller displays
}

export const HorizontalPicker: React.FC<HorizontalPickerProps> = ({
    min,
    max,
    step = 1,
    value,
    onChange,
    prefix = '',
    suffix = '',
    disabled = false,
    options,
    maxAllowed,
    label,
    compact = false
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const lastValueRef = useRef(value);

    // Generate values array
    const values: number[] = options || [];
    if (!options) {
        for (let i = min; i <= max; i += step) {
            values.push(i);
        }
    }

    // Find index of current value
    const currentIndex = values.findIndex(v => v === value);

    // Calculate item width (each item is 80px)
    const itemWidth = 80;

    // Scroll to correct position when value changes externally
    useEffect(() => {
        if (scrollRef.current && !isDragging) {
            const targetScroll = currentIndex * itemWidth;
            scrollRef.current.scrollTo({
                left: targetScroll,
                behavior: 'smooth'
            });
        }
    }, [currentIndex, itemWidth, isDragging]);

    // Handle scroll to snap to nearest value
    const handleScroll = useCallback(() => {
        if (!scrollRef.current || disabled) return;

        const scrollLeft = scrollRef.current.scrollLeft;
        const index = Math.round(scrollLeft / itemWidth);
        const clampedIndex = Math.max(0, Math.min(values.length - 1, index));
        const newValue = values[clampedIndex];

        if (maxAllowed !== undefined && newValue > maxAllowed) {
            // Find the closest allowed value
            const allowedIndex = values.findIndex(v => v <= maxAllowed);
            if (allowedIndex >= 0) {
                onChange(values[Math.max(0, values.length - 1 - values.slice().reverse().findIndex(v => v <= maxAllowed))]);
            }
            return;
        }

        if (newValue !== lastValueRef.current) {
            lastValueRef.current = newValue;
            onChange(newValue);
            vibrate(HapticPatterns.light);
        }
    }, [disabled, itemWidth, maxAllowed, onChange, values]);

    // Handle scroll end to snap
    const handleScrollEnd = useCallback(() => {
        if (!scrollRef.current || disabled) return;

        const scrollLeft = scrollRef.current.scrollLeft;
        const index = Math.round(scrollLeft / itemWidth);
        const clampedIndex = Math.max(0, Math.min(values.length - 1, index));

        // Check if value is allowed
        let targetIndex = clampedIndex;
        if (maxAllowed !== undefined && values[clampedIndex] > maxAllowed) {
            // Find the closest allowed value
            targetIndex = values.reduce((closest, v, i) => {
                if (v <= maxAllowed) return i;
                return closest;
            }, 0);
        }

        // Snap to the value
        scrollRef.current.scrollTo({
            left: targetIndex * itemWidth,
            behavior: 'smooth'
        });

        const newValue = values[targetIndex];
        if (newValue !== lastValueRef.current) {
            lastValueRef.current = newValue;
            onChange(newValue);
        }
    }, [disabled, itemWidth, maxAllowed, onChange, values]);

    // Debounce scroll end detection
    const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const onScroll = useCallback(() => {
        handleScroll();
        setIsDragging(true);

        if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current);
        }

        scrollTimeout.current = setTimeout(() => {
            setIsDragging(false);
            handleScrollEnd();
        }, 100);
    }, [handleScroll, handleScrollEnd]);

    return (
        <div className="relative w-full max-w-md mx-auto">
            {/* Optional Label */}
            {label && (
                <div
                    className="text-center text-sm font-bold mb-3 uppercase tracking-wider"
                    style={{ color: 'var(--theme-text-secondary)' }}
                >
                    {label}
                </div>
            )}

            {/* Picker Container */}
            <div
                className="relative overflow-hidden rounded-2xl"
                style={{
                    background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.4) 100%)',
                    border: '2px solid rgba(255, 215, 0, 0.3)',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3), 0 0 20px rgba(255, 215, 0, 0.1)'
                }}
            >
                {/* Center Highlight */}
                <div
                    className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 z-10 pointer-events-none"
                    style={{
                        width: `${itemWidth}px`,
                        background: 'linear-gradient(180deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 215, 0, 0.1) 50%, rgba(255, 215, 0, 0.2) 100%)',
                        borderLeft: '2px solid rgba(255, 215, 0, 0.5)',
                        borderRight: '2px solid rgba(255, 215, 0, 0.5)',
                        boxShadow: '0 0 30px rgba(255, 215, 0, 0.3)'
                    }}
                />

                {/* Fade edges */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to right, var(--theme-bg-primary, #1a1a1a) 0%, transparent 100%)'
                    }}
                />
                <div
                    className="absolute right-0 top-0 bottom-0 w-24 z-10 pointer-events-none"
                    style={{
                        background: 'linear-gradient(to left, var(--theme-bg-primary, #1a1a1a) 0%, transparent 100%)'
                    }}
                />

                {/* Scrollable Content */}
                <div
                    ref={scrollRef}
                    onScroll={onScroll}
                    className="flex overflow-x-auto py-2 scroll-smooth hide-scrollbar"
                    style={{
                        WebkitOverflowScrolling: 'touch',
                        scrollSnapType: 'x mandatory',
                        paddingLeft: `calc(50% - ${itemWidth / 2}px)`,
                        paddingRight: `calc(50% - ${itemWidth / 2}px)`,
                    }}
                >
                    {values.map((val, index) => {
                        const isSelected = val === value;
                        const distance = Math.abs(index - currentIndex);
                        const scale = isSelected ? 1.2 : Math.max(0.6, 1 - distance * 0.15);
                        const opacity = isSelected ? 1 : Math.max(0.3, 1 - distance * 0.2);
                        const isMaxRestricted = maxAllowed !== undefined && val > maxAllowed;

                        return (
                            <div
                                key={val}
                                className="flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-150"
                                style={{
                                    width: `${itemWidth}px`,
                                    height: '44px',
                                    scrollSnapAlign: 'center',
                                    transform: `scale(${scale})`,
                                    opacity: isMaxRestricted ? 0.2 : opacity,
                                }}
                                onClick={() => {
                                    if (!disabled && !isMaxRestricted) {
                                        onChange(val);
                                        vibrate(HapticPatterns.medium);
                                    }
                                }}
                            >
                                <span
                                    className="font-bold transition-all duration-150"
                                    style={{
                                        fontSize: isSelected ? '1.75rem' : '1.25rem',
                                        color: isSelected ? '#FFD700' : 'var(--theme-text)',
                                        textShadow: isSelected ? '0 0 20px rgba(255, 215, 0, 0.5)' : 'none',
                                    }}
                                >
                                    {prefix}{val}{suffix}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected value display - hidden in compact mode */}
            {!compact && (
                <div
                    className="text-center mt-4 font-black text-3xl"
                    style={{
                        color: '#FFD700',
                        textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 2px 4px rgba(0,0,0,0.3)'
                    }}
                >
                    {prefix}{value}{suffix}
                </div>
            )}
        </div>
    );
};

// Add CSS to hide scrollbar
const style = document.createElement('style');
style.textContent = `
    .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    .hide-scrollbar::-webkit-scrollbar {
        display: none;
    }
`;
if (!document.querySelector('[data-horizontal-picker-style]')) {
    style.setAttribute('data-horizontal-picker-style', 'true');
    document.head.appendChild(style);
}

export default HorizontalPicker;
