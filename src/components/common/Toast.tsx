import React, { useEffect, useState } from 'react';

interface ToastProps {
    message: string;
    type?: 'error' | 'success' | 'info';
    onClose: () => void;
    duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'error', onClose, duration = 3000 }) => {
    const [isLeaving, setIsLeaving] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLeaving(true);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getStyles = () => {
        switch (type) {
            case 'error':
                return {
                    bg: 'from-red-500 to-pink-500',
                    border: '#FF69B4',
                    emoji: '😱'
                };
            case 'success':
                return {
                    bg: 'from-green-400 to-emerald-500',
                    border: '#32CD32',
                    emoji: '🎉'
                };
            case 'info':
                return {
                    bg: 'from-cyan-400 to-blue-500',
                    border: '#00D9FF',
                    emoji: '💡'
                };
            default:
                return {
                    bg: 'from-red-500 to-pink-500',
                    border: '#FF69B4',
                    emoji: '😱'
                };
        }
    };

    const styles = getStyles();

    return (
        <div
            className={`fixed left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ${isLeaving ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}
            style={{
                bottom: 'max(1rem, env(safe-area-inset-bottom) + 1rem)',
                animation: isLeaving ? '' : 'pop-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
            }}
        >
            <div
                className={`bg-gradient-to-r ${styles.bg} text-white px-6 py-3 rounded-2xl flex items-center gap-3 font-bold text-sm shadow-xl max-w-[90vw]`}
                style={{
                    boxShadow: `0 8px 0 rgba(0, 0, 0, 0.2), 0 12px 30px rgba(0, 0, 0, 0.3)`,
                    border: `3px solid ${styles.border}`,
                }}
            >
                <span className="text-xl bounce-scale flex-shrink-0">{styles.emoji}</span>
                <span className="truncate">{message}</span>
                <button
                    onClick={() => {
                        setIsLeaving(true);
                        setTimeout(onClose, 300);
                    }}
                    className="ml-2 hover:scale-110 transition-transform text-lg flex-shrink-0"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};
