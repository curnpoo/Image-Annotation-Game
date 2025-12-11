import React, { useEffect, useState } from 'react';
import { LoadingScreen } from '../common/LoadingScreen';
import type { LoadingStage } from '../../types';

interface JoiningGameScreenProps {
    roomCode: string;
    onCancel: () => void;
}

export const JoiningGameScreen: React.FC<JoiningGameScreenProps> = ({ roomCode, onCancel }) => {
    // Determine stages based on time (simulated progress since we don't have real granular hooks here for just "joining")
    const [stages, setStages] = useState<LoadingStage[]>([
        { id: 'connect', label: 'Connecting to server...', status: 'completed' },
        { id: 'room', label: `Locating Room ${roomCode}...`, status: 'loading' },
        { id: 'sync', label: 'Syncing game state...', status: 'pending' },
        { id: 'assets', label: 'Preparing assets...', status: 'pending' },
    ]);

    useEffect(() => {
        // Simulate progress for visual feedback (actual join is handled by App.tsx logic and waiting for Room update)
        const t1 = setTimeout(() => {
             setStages(s => s.map(st => st.id === 'room' ? { ...st, status: 'completed' } : st.id === 'sync' ? { ...st, status: 'loading' } : st));
        }, 800);
        
        const t2 = setTimeout(() => {
             setStages(s => s.map(st => st.id === 'sync' ? { ...st, status: 'completed' } : st.id === 'assets' ? { ...st, status: 'loading' } : st));
        }, 1800);

        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    return (
        <LoadingScreen 
            onGoHome={onCancel} 
            stages={stages}
            isOnline={true}
        />
    );
};
