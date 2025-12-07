import React, { useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    url?: string;
    title?: string;
    description?: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    url = window.location.origin,
    title = 'Ano Draw',
    description = 'Join me on Ano Draw - the party drawing game!'
}) => {
    const [copied, setCopied] = useState(false);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
        } else {
            const timer = setTimeout(() => setVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!visible && !isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
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
                    title,
                    text: description,
                    url
                });
                vibrate(HapticPatterns.success);
            } catch (err) {
                // User cancelled or share failed
                if ((err as Error).name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            // Fallback to copy
            handleCopy();
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className={`relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                    }`}
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    border: '2px solid var(--theme-border)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-white/20 transition-colors"
                    style={{ color: 'var(--theme-text)' }}
                >
                    ✕
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="text-4xl mb-2">📤</div>
                    <h2 className="text-2xl font-black" style={{ color: 'var(--theme-text)' }}>
                        Share Ano Draw
                    </h2>
                    <p className="text-sm opacity-70 mt-1" style={{ color: 'var(--theme-text-secondary)' }}>
                        Invite friends to play!
                    </p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-4 rounded-2xl mb-6 flex items-center justify-center">
                    <QRCode
                        value={url}
                        size={200}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#000000"
                    />
                </div>

                {/* URL Display */}
                <div
                    className="flex items-center gap-2 p-3 rounded-xl mb-4"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                >
                    <div
                        className="flex-1 font-mono text-sm truncate"
                        style={{ color: 'var(--theme-text)' }}
                    >
                        {url}
                    </div>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 rounded-lg font-bold text-sm transition-all hover:scale-105 active:scale-95"
                        style={{
                            backgroundColor: copied ? '#22c55e' : 'var(--theme-accent)',
                            color: '#fff'
                        }}
                    >
                        {copied ? '✓ Copied' : 'Copy'}
                    </button>
                </div>

                {/* Share Button */}
                {typeof navigator.share === 'function' && (
                    <button
                        onClick={handleShare}
                        className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                        style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff'
                        }}
                    >
                        <span>📲</span> Share with Friends
                    </button>
                )}
            </div>
        </div>
    );
};
