import React from 'react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmColor?: 'red' | 'blue' | 'green' | 'orange';
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmColor = 'blue',
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    const colorClasses = {
        red: 'from-red-500 to-rose-600 hover:shadow-red-500/30',
        blue: 'from-blue-500 to-indigo-600 hover:shadow-blue-500/30',
        green: 'from-green-500 to-emerald-600 hover:shadow-green-500/30',
        orange: 'from-orange-500 to-amber-600 hover:shadow-orange-500/30'
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-zinc-900 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-4 border border-white/10 pop-in relative overflow-hidden">
                {/* Content */}
                <div className="relative z-10">
                    <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 mb-6">{message}</p>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={onCancel}
                            className="w-full py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl font-bold transition-all active:scale-95 border border-white/10"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`w-full py-3 bg-gradient-to-r text-white rounded-xl font-bold shadow-lg transition-all active:scale-95 ${colorClasses[confirmColor]}`}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
