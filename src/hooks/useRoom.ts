import { useState, useEffect, useCallback } from 'react';
import type { GameRoom } from '../types';
import { StorageService } from '../services/storage';

export const useRoom = (roomCode: string | null, currentPlayerId: string | null) => {
    const [room, setRoom] = useState<GameRoom | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchRoom = useCallback(() => {
        if (!roomCode) return;
        const data = StorageService.getRoom(roomCode);
        if (data) {
            setRoom(data);
            setError(null);
        } else {
            setError('Room not found');
            setRoom(null);
        }
    }, [roomCode]);

    // Polling
    useEffect(() => {
        if (!roomCode) return;

        // Initial fetch
        fetchRoom();

        const intervalId = setInterval(() => {
            fetchRoom();

            // Update last seen
            if (currentPlayerId && roomCode) {
                StorageService.updateRoom(roomCode, (r) => {
                    const pIndex = r.players.findIndex(p => p.id === currentPlayerId);
                    if (pIndex >= 0) {
                        r.players[pIndex].lastSeen = Date.now();
                    }
                    return r;
                });
            }
        }, 1000); // Poll every second

        return () => clearInterval(intervalId);
    }, [roomCode, currentPlayerId, fetchRoom]);

    return { room, error, refreshRoom: fetchRoom };
};
