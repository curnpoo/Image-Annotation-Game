import { useState, useCallback } from 'react';
import type { ToastState } from '../types';
import { formatErrorMessage } from '../utils/errorHandler';

export const useNotifications = () => {
    const [toast, setToast] = useState<ToastState | null>(null);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    const showToast = useCallback((message: string, type: 'error' | 'success' | 'info' = 'error', action?: { label: string; onClick: () => void }) => {
        setToast({ message, type, action });
    }, []);

    const showError = useCallback((error: any) => {
        const message = formatErrorMessage(error);
        setToast({ message, type: 'error' });
    }, []);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    return {
        toast,
        // setToast is usually internal, but if needed we can export it or just use show/hide
        showToast,
        showError,
        hideToast,
        showNotificationPrompt,
        setShowNotificationPrompt
    };
};
