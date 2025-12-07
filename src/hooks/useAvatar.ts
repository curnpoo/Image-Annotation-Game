import { useState, useEffect } from 'react';
import { AvatarService } from '../services/avatarService';
import type { DrawingStroke } from '../types';

export const useAvatar = (playerId?: string) => {
    const [strokes, setStrokes] = useState<DrawingStroke[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!playerId) {
            setStrokes(null);
            return;
        }

        let isMounted = true;

        const fetchAvatar = async () => {
            setIsLoading(true);
            try {
                const data = await AvatarService.getAvatarStrokes(playerId);
                if (isMounted) {
                    setStrokes(data);
                }
            } catch (error) {
                console.error('Failed to fetch avatar', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchAvatar();

        return () => {
            isMounted = false;
        };
    }, [playerId]);

    return { strokes, isLoading };
};
