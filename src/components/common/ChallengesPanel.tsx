import React, { useState, useEffect } from 'react';
import { ChallengeService } from '../../services/challenges';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { XPService } from '../../services/xp';
import type { PlayerChallengeState, Challenge } from '../../types';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface ChallengesPanelProps {
    onClose?: () => void;
    embedded?: boolean; // If true, render without modal overlay wrapper
}

export const ChallengesPanel: React.FC<ChallengesPanelProps> = ({ onClose, embedded = false }) => {
    const [challenges, setChallenges] = useState<PlayerChallengeState[]>([]);
    const [definitions, setDefinitions] = useState<Record<string, Challenge>>({});

    useEffect(() => {
        loadChallenges();
        
        const handleUpdate = () => loadChallenges();
        window.addEventListener('challenges-updated', handleUpdate);
        return () => window.removeEventListener('challenges-updated', handleUpdate);
    }, []);

    const loadChallenges = () => {
        const list = ChallengeService.getChallenges();
        setChallenges(list);

        // Resolve definitions
        const defs: Record<string, Challenge> = {};
        list.forEach(c => {
            const def = ChallengeService.getChallengeDefinition(c);
            if (def) defs[c.challengeId] = def;
        });
        setDefinitions(defs);
    };

    const handleClaim = (instanceId: string) => {
        vibrate(HapticPatterns.success);
        ChallengeService.claimReward(instanceId);
    };

    const content = (
        <div className={`w-full max-w-md ${embedded ? '' : 'p-6'}`}>
            {!embedded && (
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-white flex items-center gap-2">
                        <span className="text-3xl">🗓️</span> Daily Challenges
                    </h2>
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            <div className="space-y-3">
                {challenges.map(challenge => {
                    const def = definitions[challenge.challengeId];
                    if (!def) return null; // Should not happen

                    const percent = Math.min(100, Math.floor((challenge.progress / def.target) * 100));

                    return (
                        <div 
                            key={challenge.challengeId}
                            className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300
                                ${challenge.completed && !challenge.claimed 
                                    ? 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                                    : 'bg-black/40 border-white/10'
                                }
                                ${challenge.claimed ? 'opacity-60 grayscale-[0.5]' : ''}
                            `}
                        >
                            <div className="p-4 relative z-10 flex items-center gap-4">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl
                                    ${challenge.completed 
                                        ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-lg' 
                                        : 'bg-white/5 text-white/50'
                                    }
                                `}>
                                    {def.icon}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className="font-bold text-white leading-tight truncate pr-2">
                                            {def.description}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {def.reward.currency > 0 && (
                                                <span className="text-xs font-bold text-yellow-400 bg-yellow-400/10 px-1.5 py-0.5 rounded">
                                                    +{def.reward.currency}$
                                                </span>
                                            )}
                                            {def.reward.xp > 0 && (
                                                <span className="text-xs font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">
                                                    +{def.reward.xp}XP
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar or Claim Button */}
                                    <div className="mt-2">
                                        {challenge.completed && !challenge.claimed ? (
                                            <button
                                                onClick={() => handleClaim(challenge.challengeId)}
                                                className="w-full py-2 rounded-lg bg-yellow-400 hover:bg-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-lg animate-pulse"
                                            >
                                                Claim Reward
                                            </button>
                                        ) : (
                                            <div className="relative h-4 bg-white/5 rounded-full overflow-hidden">
                                                <div 
                                                    className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-full
                                                        ${challenge.claimed ? 'bg-green-500' : 'bg-blue-500'}
                                                    `}
                                                    style={{ width: `${percent}%` }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white drop-shadow-md">
                                                    {challenge.claimed ? 'COMPLETED' : `${challenge.progress} / ${def.target}`}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    if (embedded) return content;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-gray-900/90 backdrop-blur-xl rounded-3xl w-full max-w-md border border-white/20 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"/>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none"/>
                {content}
            </div>
        </div>
    );
};
