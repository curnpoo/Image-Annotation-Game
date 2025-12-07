import React, { useState, useRef, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface ShareDropdownProps {
    roomCode: string;
    /** Custom URL - defaults to join URL with room code */
    url?: string;
}

export const ShareDropdown: React.FC<ShareDropdownProps> = ({
    roomCode,
    url
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [copied, setCopied] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Generate the share URL
    const shareUrl = url || `${window.location.origin}?join=${roomCode}`;

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setShowQR(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            vibrate(HapticPatterns.success);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join my Ano Draw game!',
                    text: `Join my game with code: ${roomCode}`,
                    url: shareUrl
                });
                vibrate(HapticPatterns.success);
                setIsOpen(false);
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            // Fallback: copy and show toast
            handleCopy();
        }
    };

    const toggleQR = () => {
        vibrate(HapticPatterns.light);
        setShowQR(!showQR);
    };

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                ref={buttonRef}
                onClick={() => {
                    vibrate(HapticPatterns.light);
                    setIsOpen(!isOpen);
                    if (!isOpen) setShowQR(false);
                }}
                className="bg-white/10 hover:bg-white/20 text-[var(--theme-text)] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
            >
                <span className="text-lg">📤</span>
                Share
            </button>

            {/* Dropdown Menu */}
            <div
                ref={dropdownRef}
                className={`absolute right-0 top-full mt-2 z-50 transition-all duration-200 ease-out origin-top-right ${isOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                    }`}
            >
                <div
                    className="rounded-2xl p-1 shadow-2xl min-w-[180px] overflow-hidden"
                    style={{
                        backgroundColor: 'var(--theme-card-bg)',
                        border: '2px solid var(--theme-border)'
                    }}
                >
                    {/* Copy Option */}
                    <button
                        onClick={handleCopy}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/10"
                    >
                        <span className="text-xl">{copied ? '✓' : '📋'}</span>
                        <span
                            className="font-bold"
                            style={{ color: copied ? '#22c55e' : 'var(--theme-text)' }}
                        >
                            {copied ? 'Copied!' : 'Copy Link'}
                        </span>
                    </button>

                    {/* Share Option */}
                    <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/10"
                    >
                        <span className="text-xl">📲</span>
                        <span className="font-bold" style={{ color: 'var(--theme-text)' }}>
                            {typeof navigator.share === 'function' ? 'Share' : 'Copy & Share'}
                        </span>
                    </button>

                    {/* Divider */}
                    <div
                        className="mx-3 my-1 h-px"
                        style={{ backgroundColor: 'var(--theme-border)' }}
                    />

                    {/* QR Code Option */}
                    <button
                        onClick={toggleQR}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors hover:bg-white/10"
                    >
                        <span className="text-xl">📱</span>
                        <span className="font-bold" style={{ color: 'var(--theme-text)' }}>
                            QR Code
                        </span>
                        <span
                            className={`ml-auto text-sm transition-transform duration-200 ${showQR ? 'rotate-180' : ''
                                }`}
                            style={{ color: 'var(--theme-text-secondary)' }}
                        >
                            ▼
                        </span>
                    </button>

                    {/* QR Code Panel */}
                    <div
                        className={`overflow-hidden transition-all duration-300 ease-out ${showQR ? 'max-h-[250px] opacity-100' : 'max-h-0 opacity-0'
                            }`}
                    >
                        <div className="p-3">
                            <div className="bg-white p-3 rounded-xl flex items-center justify-center">
                                <QRCode
                                    value={shareUrl}
                                    size={160}
                                    level="M"
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                />
                            </div>
                            <p
                                className="text-center text-xs mt-2 font-medium opacity-70"
                                style={{ color: 'var(--theme-text-secondary)' }}
                            >
                                Scan to join game
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
