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
            // Helper: wait a minimum time so users can see progress
            const minDelay = (ms: number) => new Promise(r => setTimeout(r, ms));

            try {
                // 0. Cleanup old rooms (>24 hours)
                StorageService.cleanupOldRooms().catch(err => {
                    console.error('Room cleanup failed:', err);
                });

                // Small initial delay so loading screen renders first
                await minDelay(100);

                // 1. Sync with Auth
                onProgress?.('auth', 'loading');
                const authUser = await AuthService.syncUser();
                let session = StorageService.getSession();
                await minDelay(200); // Minimum visible loading time
                onProgress?.('auth', 'completed');

                await minDelay(100); // Brief pause before next stage

                if (authUser) {
                    onProgress?.('profile', 'loading');

                    // Always sync profile data from AuthUser (Remote Source of Truth)
                    if (session && session.id === authUser.id) {
                        session = {
                            ...session,
                            name: authUser.username,
                            color: authUser.color || session.color,
                            frame: authUser.frame || session.frame || 'none',
                            avatarStrokes: authUser.avatarStrokes || session.avatarStrokes,
                            cosmetics: authUser.cosmetics || session.cosmetics
                        };
                        StorageService.saveSession(session);
                        setPlayer(session);
                    }

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
                    await minDelay(200);
                    onProgress?.('profile', 'completed');
                } else {
                    // No auth user - still show progress
                    onProgress?.('profile', 'loading');
                    await minDelay(200);
                    onProgress?.('profile', 'completed');
                }

                await minDelay(100);

                // Check for active games
                onProgress?.('room', 'loading');

                if (session) {
                    setPlayer(session);

                    // Auto-rejoin logic
                    const lastRoomCode = StorageService.getRoomCode();
                    const lastActive = StorageService.getLastLocalActivity();
                    const isRecent = Date.now() - lastActive < 10 * 60 * 1000; // 10 minutes

                    if (lastRoomCode && isRecent) {
                        setRoomCode(lastRoomCode);
                        try {
                            const room = await StorageService.joinRoom(lastRoomCode, session);
                            if (!room) {
                                StorageService.leaveRoom();
                                onProgress?.('room', 'completed');
                                setCurrentScreen('home');
                            } else {
                                onProgress?.('room', 'completed');
                            }
                        } catch (e) {
                            console.error('Failed to auto-rejoin', e);
                            onProgress?.('room', 'completed');
                            setCurrentScreen('home');
                        }
                    } else {
                        onProgress?.('room', 'completed');
                        setCurrentScreen('home');
                    }
                } else {
                    // No session - mark room check as complete
                    onProgress?.('room', 'completed');
                }
            } finally {
                // Add delay so user sees all green checkmarks before screen dismisses
                await new Promise(resolve => setTimeout(resolve, 500));
                // Signal completion regardless of path
                if (onComplete) onComplete();
            }
        };

        initSession();
    }, [setCurrentScreen]);

    // Sync on visibility change (Foreground)
    useEffect(() => {
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible' && player) {
                const authUser = await AuthService.syncUser();
                if (authUser && authUser.id === player.id) {
                    const updatedSession = {
                        ...player,
                        name: authUser.username,
                        color: authUser.color || player.color,
                        frame: authUser.frame || player.frame,
                        avatarStrokes: authUser.avatarStrokes || player.avatarStrokes,
                        cosmetics: authUser.cosmetics || player.cosmetics
                    };

                    if (JSON.stringify(updatedSession) !== JSON.stringify(player)) {
                        StorageService.saveSession(updatedSession);
                        setPlayer(updatedSession);
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [player]);

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
