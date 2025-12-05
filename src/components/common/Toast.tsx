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
            className={`fixed top-0 left-0 right-0 z-[200] transition-transform duration-300 ${isLeaving ? '-translate-y-full' : 'translate-y-0'
                }`}
        >
            <div
                className={`bg-gradient-to-r ${styles.bg} text-white px-4 py-1 flex items-center justify-center gap-2 font-bold text-xs shadow-md`}
                style={{
                    paddingTop: 'max(0.5rem, env(safe-area-inset-top))',
                    paddingBottom: '0.5rem'
                }}
            >
                <span className="text-sm bounce-scale flex-shrink-0">{styles.emoji}</span>
                <span className="truncate max-w-[80vw]">{message}</span>
                <button
                    onClick={() => {
                        setIsLeaving(true);
                        setTimeout(onClose, 300);
                    }}
                    className="ml-2 hover:scale-110 transition-transform text-sm flex-shrink-0 opacity-80 hover:opacity-100"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};
