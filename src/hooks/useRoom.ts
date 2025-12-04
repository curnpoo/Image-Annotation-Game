import { useState, useEffect } from 'react';
import type { GameRoom } from '../types';
import { StorageService } from '../services/storage';

export const useRoom = (roomCode: string | null, currentPlayerId: string | null) => {
    const [room, setRoom] = useState<GameRoom | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Real-time subscription to Firebase
    useEffect(() => {
        if (!roomCode) {
            setRoom(null);
            setError(null);
            return;
        }

        // Subscribe to real-time updates
        const unsubscribe = StorageService.subscribeToRoom(roomCode, (roomData) => {
            if (roomData) {
                setRoom(roomData);
                setError(null);
            } else {
                setRoom(null);
                setError('Room not found');
            }
        });

        // Cleanup subscription on unmount
        return () => {
            unsubscribe();
        };
    }, [roomCode]);

    // Update player's lastSeen periodically
    useEffect(() => {
        if (!roomCode || !currentPlayerId) return;

        const updateLastSeen = async () => {
            try {
                await StorageService.updateRoom(roomCode, (r) => {
                    const pIndex = r.players.findIndex(p => p.id === currentPlayerId);
                    if (pIndex >= 0) {
                        r.players[pIndex].lastSeen = Date.now();
                    }
                    return r;
                });
            } catch (err) {
                console.error('Failed to update lastSeen:', err);
            }
        };

        // Update every 30 seconds instead of every second (reduces Firebase writes)
        const intervalId = setInterval(updateLastSeen, 30000);

        return () => clearInterval(intervalId);
    }, [roomCode, currentPlayerId]);

    const refreshRoom = async () => {
        if (!roomCode) return;
        try {
            const data = await StorageService.getRoom(roomCode);
            if (data) {
                setRoom(data);
                setError(null);
            }
        } catch (err) {
            console.error('Failed to refresh room:', err);
        }
    };

    return { room, error, refreshRoom };
};
