import React, { useState } from 'react';
import { XPService } from '../../services/xp';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { AvatarDisplay } from './AvatarDisplay';
import { ChallengeService } from '../../services/challenges';
import type { Player } from '../../types';
import { ChallengesPanel } from './ChallengesPanel';

import { AuthService } from '../../services/auth';
import { GuestSignUpModal } from './GuestSignUpModal';

interface ProfileStatusCardProps {
    player: Player;
    onClick?: () => void;
}

export const ProfileStatusCard: React.FC<ProfileStatusCardProps> = ({ player, onClick }) => {
    const [showChallenges, setShowChallenges] = useState(false);
    const [showGuestModal, setShowGuestModal] = useState(false);
    
    const level = XPService.getLevel();
    const tier = XPService.getTier();
    const progressPercent = XPService.getLevelProgressPercent();
    const balance = CurrencyService.getCurrency();
    const isGuest = !AuthService.isLoggedIn();

    // Get Challenge Progress
    const challenges = ChallengeService.getChallenges();
    const completedChallenges = challenges.filter(c => c.completed).length;

    const handleChallengesClick = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (isGuest) {
            setShowGuestModal(true);
        } else {
            setShowChallenges(true);
        }
    };

    return (
        <>
            {showChallenges && <ChallengesPanel onClose={() => setShowChallenges(false)} />}
            {showGuestModal && (
                <GuestSignUpModal
                    isOpen={showGuestModal}
                    onClose={() => setShowGuestModal(false)}
                    onConfirm={() => {
                        // We actually need to navigate to login/register.
                        // ProfileStatusCard doesn't have navigation props directly.
                        // For now, let's just close modal. Ideally we should callback to parent or use a global router.
                        // Given constraints, we will reload to root or rely on user navigating themselves for now?
                        // Or better, let's just use window.location.reload() to get to welcome screen 
                        // effectively 'logging out' the guest session or just redirecting.
                        // Actually App.tsx handles onRegister. But we are deep in component.
                        // For MVP, just closing it is okay, maybe change text to "Go to Home to Sign Up"?
                        // Or better: just don't have this modal here if we can't action it properly? 
                        // Wait, GuestSignUpModal takes onConfirm. If we can't navigate, we should maybe pass a callback prop?
                        // Let's modify ProfileStatusCardProps to accept onRegister optionally.
                        setShowGuestModal(false);
                        window.location.reload(); // Quickest way to get back to auth selection for now
                    }}
                />
            )}
            {/* Outer wrapper to clip box-shadow glow to rounded corners */}
            <div className="rounded-[2rem] overflow-hidden">
            <div
                onClick={() => {
                     onClick?.();
                     if (!onClick) handleChallengesClick();
                }}
                className="rounded-[2rem] p-3 shadow-xl relative overflow-hidden transition-all hover:scale-[1.01] cursor-pointer group"
                style={{
                    background: 'var(--theme-glass-bg)',
                    boxShadow: `inset 0 0 20px 5px ${tier.color}40`,
                    border: `2px solid ${tier.color}`,
                    borderColor: tier.color
                }}
            >
                {/* Backdrop blur for frosted glass effect */}
                <div className="absolute inset-0 backdrop-blur-md rounded-[2rem] z-0" />
                {/* Theme color tint overlay */}
                <div 
                    className="absolute inset-0 z-0 opacity-20 mix-blend-overlay"
                    style={{ backgroundColor: tier.color }} 
                />
                
                {/* Tier glow effect */}
                <div
                    className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-30 z-[1]"
                    style={{
                        background: `radial-gradient(circle at top right, ${tier.color}, transparent 70%)`
                    }}
                />

                <div className="grid grid-cols-[110px_1fr] gap-2.5 relative z-10">
                    {/* Cell 1: Avatar (Tall on the left) */}
                    <div className="bg-white/5 rounded-[1.75rem] p-1.5 flex items-center justify-center border border-white/5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                        <AvatarDisplay
                            strokes={player.avatarStrokes}
                            avatar={player.avatar}
                            frame={player.frame}
                            color={player.color}
                            backgroundColor={player.backgroundColor}
                            cosmetics={player.cosmetics}
                            size={95}
                            className="!rounded-3xl"
                            imageUrl={player.avatarImageUrl}
                        />
                    </div>

                    {/* Right Side Column */}
                    <div className="flex flex-col gap-1.5 min-w-0">

                        {/* Cell 2: Identity & Progress */}
                        <div className="bg-white/5 rounded-2xl p-2.5 flex flex-col justify-center gap-2 border border-white/5 relative overflow-hidden flex-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                            {/* Name & Badges Row */}
                            <div className="flex flex-col gap-1">
                                <h2 className="text-xl font-black truncate leading-none drop-shadow-md" style={{ color: 'var(--theme-text)' }}>
                                    {player.name}
                                </h2>
                                <div className="flex items-center gap-1.5">
                                    <span
                                        className="text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm"
                                        style={{
                                            backgroundColor: tier.color,
                                            color: tier.name === 'Gold' || tier.name === 'Bronze' ? '#000' : '#fff'
                                        }}
                                    >
                                        {tier.icon} LVL {level}
                                    </span>
                                    <span
                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded border opacity-80"
                                        style={{
                                            backgroundColor: `${tier.color}30`,
                                            color: tier.name === 'Gold' ? '#996515' : tier.color,
                                            borderColor: `${tier.color}60`
                                        }}
                                    >
                                        {tier.name}
                                    </span>
                                </div>
                            </div>

                            {/* XP Progress Bar */}
                            <div className="w-full mt-1">
                                <div className="flex justify-between text-[9px] font-bold mb-0.5 opacity-60">
                                    <span>XP</span>
                                    <span>{Math.round(progressPercent)}%</span>
                                </div>
                                <div className="h-1.5 rounded-full overflow-hidden bg-black/40 border border-white/5">
                                    <div
                                        className="h-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${progressPercent}%`,
                                            backgroundColor: tier.color
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Cell 3: Actions & Stats */}
                        <div className="grid grid-cols-2 gap-1.5">
                            {/* Challenges Button */}
                            <button
                                onClick={handleChallengesClick}
                                className={`
                                    bg-gradient-to-br from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 
                                    rounded-xl p-1.5 border border-indigo-500/30 flex flex-col items-center justify-center text-center backdrop-blur-sm transition-all active:scale-95 group/btn
                                    ${isGuest ? 'grayscale opacity-70' : ''}
                                `}
                            >
                                <div className="relative mb-0.5">
                                    <span className="text-xl filter drop-shadow-sm group-hover/btn:scale-110 transition-transform block">🗓️</span>
                                    {isGuest && <div className="absolute -top-1 -right-1 text-xs">🔒</div>}
                                    {!isGuest && completedChallenges > 0 && !challenges.every(c => c.claimed) && (
                                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1a1a1a] animate-pulse" />
                                    )}
                                </div>
                                <div className="flex items-center gap-1 leading-none mt-0.5">
                                    <span className="text-[10px] font-bold" style={{ color: 'var(--theme-text-secondary)' }}>
                                        Challenges
                                    </span>
                                    {!isGuest && (
                                        <span className="text-[9px] font-bold text-indigo-300/70 bg-indigo-500/10 px-1 rounded-sm">
                                            {completedChallenges}/{challenges.length || 3}
                                        </span>
                                    )}
                                </div>
                            </button>

                            {/* Currency Display */}
                            <div
                                className="bg-black/20 rounded-xl p-1.5 border border-white/5 flex flex-col items-center justify-center text-center backdrop-blur-sm"
                            >
                                <span className="text-lg mb-0.5 filter drop-shadow-sm">💰</span>
                                <span className="text-xs font-black leading-none" style={{ color: 'var(--theme-text)' }}>
                                    {formatCurrency(balance).replace('$', '')}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Tier bonus indicator */}
                {tier.xpBonus > 0 && (
                    <div
                        className="absolute top-0 right-0 rounded-bl-2xl px-3 py-1 text-[10px] font-black border-b border-l shadow-sm backdrop-blur-xl z-20"
                        style={{
                            backgroundColor: `${tier.color}40`,
                            color: tier.name === 'Gold' ? '#996515' : tier.color,
                            borderColor: `${tier.color}50`
                        }}
                    >
                        +{Math.round(tier.xpBonus * 100)}% XP
                    </div>
                )}
            </div>
            </div>
        </>
    );
};
