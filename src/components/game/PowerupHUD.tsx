import React, { useState } from 'react';
import { CurrencyService } from '../../services/currency';
import { StorageService } from '../../services/storage';
import { POWERUPS } from '../../constants/cosmetics';

interface PowerupHUDProps {
    roomCode: string;
    playerId: string;
    activePowerups: string[]; // IDs of equipped powerups
    isDrawing: boolean; // Only enable relevant powerups in drawing phase
}

export const PowerupHUD: React.FC<PowerupHUDProps> = ({
    roomCode,
    playerId,
    activePowerups,
    isDrawing
}) => {
    const [cooldowns, setCooldowns] = useState<{ [id: string]: number }>({});
    const [usingId, setUsingId] = useState<string | null>(null);

    // Filter relevant powerups for this phase
    // Some powerups like "Timekeeper" (passive) or "Mirror Shield" (passive) don't need buttons
    // But maybe we show them as active buffs?
    // "Extra Time" -> Active (Drawing)
    // "Flash Bang" -> Active (Drawing)
    // "Vote Peep" -> Active (Voting) - This HUD is used in DrawingScreen, so Vote Peep should be disabled or hidden?
    // Actually, HUD should be used in both screens.
    // Let's filter by phase or just disabling.
    
    // Get inventory sync
    const [inventory, setInventory] = useState(CurrencyService.getInventory());
    const [_permanent, setPermanent] = useState(CurrencyService.getPurchasedItems()); // For permanent checks if needed

    // Update inventory on mount/usage
    const refreshInventory = () => {
        setInventory(CurrencyService.getInventory());
        setPermanent(CurrencyService.getPurchasedItems());
    };

    const handleUse = async (powerupId: string) => {
        if (usingId) return;
        
        const powerup = POWERUPS.find(p => p.id === powerupId);
        if (!powerup) return;

        // Check ownership/quantity
        if (powerup.type === 'consumable') {
            if ((inventory[powerupId] || 0) <= 0) return;
        }

        setUsingId(powerupId);

        try {
            // Apply Effect
            await StorageService.triggerPowerup(roomCode, playerId, powerupId);

            // Consume
            if (powerup.type === 'consumable') {
                CurrencyService.consumeItem(powerupId);
                refreshInventory();
            }

            // Cooldown
            setCooldowns(prev => ({ ...prev, [powerupId]: Date.now() + 5000 })); // 5s global cooldown for spam prevention?
            setTimeout(() => {
                setCooldowns(prev => {
                    const newCooldowns = { ...prev };
                    delete newCooldowns[powerupId];
                    return newCooldowns;
                });
            }, 5000);

        } catch (error) {
            console.error('Failed to use powerup:', error);
        } finally {
            setUsingId(null);
        }
    };

    if (activePowerups.length === 0) return null;

    return (
        <div className="flex flex-col gap-3 pointer-events-auto">
            {activePowerups.map(id => {
                const powerup = POWERUPS.find(p => p.id === id);
                if (!powerup) return null;

                // Determine if usable in current context
                const isPassive = ['timekeeper', 'mirror_shield'].includes(id);
                if (isPassive) return null; // Don't show buttons for passive buffs? Or show as small icons?

                // Only show active powerups relevant to phase
                // If isDrawing is true, show Extra Time, Flash Bang.
                // If not drawing (Voting), show Vote Peep, Double Vote, etc.
                const drawingPowerups = ['extra_time', 'flash_bang', 'shield'];
                const votingPowerups = ['vote_peep', 'double_vote', 'reveal', 'steal'];

                const isRelevant = isDrawing 
                    ? drawingPowerups.includes(id) 
                    : votingPowerups.includes(id);

                if (!isRelevant) return null;

                const count = inventory[id] || 0;
                const onCooldown = (cooldowns[id] || 0) > Date.now();
                const disabled = count <= 0 || onCooldown || usingId !== null;

                return (
                    <button
                        key={id}
                        onClick={() => handleUse(id)}
                        disabled={disabled}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all
                            ${disabled 
                                ? 'bg-gray-200 opacity-50 grayscale cursor-not-allowed' 
                                : 'bg-white hover:scale-110 hover:bg-yellow-50 active:scale-95 border-2 border-[var(--theme-accent)]'
                            }
                        `}
                    >
                        {powerup.emoji}
                        
                        {/* Count Badge */}
                        <div className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                            {count}
                        </div>

                        {/* Cooldown Overlay */}
                        {onCooldown && (
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                <div className="w-full h-full rounded-full border-2 border-white/50 animate-spin border-t-transparent" />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
