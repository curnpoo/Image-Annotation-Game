import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../services/auth';
import { StorageService } from '../services/storage';
import { XPService } from '../services/xp';
import { StatsService } from '../services/stats';
import type { Player, Screen } from '../types';

interface UsePlayerSessionProps {
    setCurrentScreen: (screen: Screen) => void;
    onProgress?: (stageId: string, status: 'loading' | 'completed' | 'error') => void;
    onComplete?: () => void;
}

export const usePlayerSession = ({ setCurrentScreen, onProgress, onComplete }: UsePlayerSessionProps) => {
    const [player, setPlayer] = useState<Player | null>(null);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Initial loading state (removed artificial delay)
    useEffect(() => {
        setIsInitialLoading(false);
    }, []);

    // Restore session
    useEffect(() => {
        const initSession = async () => {
            try {
                // 0. Cleanup old rooms (>24 hours)
                StorageService.cleanupOldRooms().catch(err => {
                    console.error('Room cleanup failed:', err);
                });

                // 1. Sync with Auth
                onProgress?.('auth', 'loading');
                const authUser = await AuthService.syncUser();
                let session = StorageService.getSession();
                onProgress?.('auth', 'completed');

                if (authUser) {
                    onProgress?.('profile', 'loading');
                    if (!session || session.id !== authUser.id) {
                        if (authUser.avatarStrokes && authUser.color) {
                            session = {
                                id: authUser.id,
                                name: authUser.username,
                                color: authUser.color,
                                frame: authUser.frame || 'none',
                                avatarStrokes: authUser.avatarStrokes,
                                joinedAt: authUser.createdAt,
                                lastSeen: Date.now(),
                                cosmetics: authUser.cosmetics,
                                level: XPService.getLevel(),
                                xp: XPService.getXP(),
                                stats: StatsService.getStats()
                            };
                            StorageService.saveSession(session);
                            setPlayer(session);
                        }
                    }
                    onProgress?.('profile', 'completed');
                }

                if (session) {
                    setPlayer(session);

                    // Auto-rejoin logic
                    const lastRoomCode = StorageService.getRoomCode();
                    const lastActive = StorageService.getLastLocalActivity();
                    const isRecent = Date.now() - lastActive < 10 * 60 * 1000; // 10 minutes

                    if (lastRoomCode && isRecent) {
                        onProgress?.('room', 'loading');
                        setRoomCode(lastRoomCode);
                        try {
                            const room = await StorageService.joinRoom(lastRoomCode, session);
                            if (!room) {
                                StorageService.leaveRoom();
                                setCurrentScreen('home');
                            } else {
                                onProgress?.('room', 'completed');
                            }
                        } catch (e) {
                            console.error('Failed to auto-rejoin', e);
                            setCurrentScreen('home');
                        }
                    } else {
                        setCurrentScreen('home');
                    }
                }
            } finally {
                // Signal completion regardless of path
                if (onComplete) onComplete();
            }
        };

        initSession();
    }, [setCurrentScreen]);

    const handleUpdateProfile = useCallback((profileData: Partial<Player>) => {
        if (!player) return;
        const updatedPlayer = {
            ...player,
            ...profileData,
            level: XPService.getLevel(),
            xp: XPService.getXP(),
            stats: StatsService.getStats()
        };
        setPlayer(updatedPlayer);
        StorageService.saveSession(updatedPlayer);

        // Sync profile changes to Firebase auth (for persistence across logins)
        AuthService.updateUser(player.id, {
            avatarStrokes: updatedPlayer.avatarStrokes,
            avatarImageUrl: updatedPlayer.avatarImageUrl,
            color: updatedPlayer.color,
            backgroundColor: updatedPlayer.backgroundColor,
            frame: updatedPlayer.frame
        });

        if (roomCode) {
            StorageService.joinRoom(roomCode, updatedPlayer);
        }
    }, [player, roomCode]);


    return {
        player,
        setPlayer,
        roomCode,
        setRoomCode,
        isInitialLoading,
        handleUpdateProfile
    };
};
