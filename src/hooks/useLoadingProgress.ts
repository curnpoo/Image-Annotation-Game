import { useState, useEffect, useCallback, useRef } from 'react';
import type { LoadingStage } from '../types';

export interface UseLoadingProgressReturn {
    stages: LoadingStage[];
    isOnline: boolean;
    isSlow: boolean;
    addStage: (id: string, label: string) => void;
    updateStage: (id: string, status: LoadingStage['status'], error?: string) => void;
    clearStages: () => void;
    startScenario: (scenario: 'initial' | 'join' | 'start' | 'upload' | 'create') => void;
}

const SCENARIO_STAGES: Record<string, { id: string; label: string }[]> = {
    initial: [
        { id: 'auth', label: 'Connecting to account...' },
        { id: 'profile', label: 'Loading profile data...' },
        { id: 'room', label: 'Checking for active games...' },
    ],
    join: [
        { id: 'connect', label: 'Connecting to server...' },
        { id: 'room', label: 'Fetching room data...' },
        { id: 'players', label: 'Loading player profiles...' },
        { id: 'sync', label: 'Syncing game state...' },
    ],
    create: [
        { id: 'connect', label: 'Connecting to server...' },
        { id: 'create', label: 'Creating room...' },
        { id: 'configure', label: 'Configuring settings...' },
    ],
    start: [
        { id: 'init', label: 'Initializing round...' },
        { id: 'roles', label: 'Assigning player roles...' },
        { id: 'sync', label: 'Syncing all players...' },
    ],
    upload: [
        { id: 'process', label: 'Processing image...' },
        { id: 'compress', label: 'Compressing for upload...' },
        { id: 'upload', label: 'Uploading to cloud...' },
        { id: 'verify', label: 'Verifying upload...' },
    ],
};

const SLOW_THRESHOLD_MS = 5000; // 5 seconds for slow warning

export const useLoadingProgress = (): UseLoadingProgressReturn => {
    const [stages, setStages] = useState<LoadingStage[]>([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSlow, setIsSlow] = useState(false);
    const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const stageTimersRef = useRef<Map<string, number>>(new Map());

    // Network status listeners
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Track slow loading - any stage loading > 5s
    useEffect(() => {
        const loadingStages = stages.filter(s => s.status === 'loading');

        if (loadingStages.length > 0) {
            // Start slow timer if not already running
            if (!slowTimerRef.current) {
                slowTimerRef.current = setTimeout(() => {
                    setIsSlow(true);
                }, SLOW_THRESHOLD_MS);
            }
        } else {
            // Clear timer if no loading stages
            if (slowTimerRef.current) {
                clearTimeout(slowTimerRef.current);
                slowTimerRef.current = null;
            }
            setIsSlow(false);
        }

        return () => {
            if (slowTimerRef.current) {
                clearTimeout(slowTimerRef.current);
            }
        };
    }, [stages]);

    const addStage = useCallback((id: string, label: string) => {
        setStages(prev => {
            // Don't add if already exists
            if (prev.some(s => s.id === id)) return prev;
            return [...prev, { id, label, status: 'pending' }];
        });
    }, []);

    const updateStage = useCallback((id: string, status: LoadingStage['status'], error?: string) => {
        const now = Date.now();

        setStages(prev => prev.map(stage => {
            if (stage.id !== id) return stage;

            // Track timing for loading stages
            if (status === 'loading') {
                stageTimersRef.current.set(id, now);
            } else if (status === 'completed' || status === 'error') {
                stageTimersRef.current.delete(id);
            }

            return { ...stage, status, error };
        }));

        // Auto-advance next pending stage to loading when one completes
        if (status === 'completed') {
            setStages(prev => {
                const idx = prev.findIndex(s => s.id === id);
                const nextPending = prev.findIndex((s, i) => i > idx && s.status === 'pending');
                if (nextPending !== -1) {
                    return prev.map((s, i) =>
                        i === nextPending ? { ...s, status: 'loading' as const } : s
                    );
                }
                return prev;
            });
        }
    }, []);

    const clearStages = useCallback(() => {
        setStages([]);
        setIsSlow(false);
        stageTimersRef.current.clear();
        if (slowTimerRef.current) {
            clearTimeout(slowTimerRef.current);
            slowTimerRef.current = null;
        }
    }, []);

    const startScenario = useCallback((scenario: keyof typeof SCENARIO_STAGES) => {
        clearStages();
        const scenarioStages = SCENARIO_STAGES[scenario] || [];
        const initializedStages: LoadingStage[] = scenarioStages.map((s, i) => ({
            ...s,
            status: i === 0 ? 'loading' : 'pending' as const,
        }));
        setStages(initializedStages);
    }, [clearStages]);

    return {
        stages,
        isOnline,
        isSlow,
        addStage,
        updateStage,
        clearStages,
        startScenario,
    };
};
