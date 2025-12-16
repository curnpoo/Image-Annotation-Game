import React, { useState } from 'react';
import type { Player } from '../../types';
import { AvatarDisplay } from '../common/AvatarDisplay';
import { ColorWheel } from '../common/ColorWheel';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { StatsService } from '../../services/stats';
import { BadgeService } from '../../services/badgeService';
import { XPService } from '../../services/xp';
import { POWERUPS } from '../../constants/cosmetics';
// AuthService removed - not currently used in this component

interface ProfileScreenProps {
    player: Player;
    onBack: () => void;
    onUpdateProfile: (updates: Partial<Player>) => void;
    onEditAvatar: () => void;
    onShowStats?: () => void;
    onShowGallery: () => void;
}

type Tab = 'edit' | 'stats';

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
    player,
    onBack,
    onUpdateProfile,
    onEditAvatar,
    onShowGallery
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('edit');
    const [name, setName] = useState(player.name);
    const [backgroundColor, setBackgroundColor] = useState(player.backgroundColor || '#ffffff');
    const [cardColor, setCardColor] = useState(player.cosmetics?.activeCardColor || '#ffffff');
    const [activeBadge, setActiveBadge] = useState(player.cosmetics?.activeBadge || '');
    const [activeStat, setActiveStat] = useState(player.cosmetics?.activeStat || 'level');
    const [activePowerups, setActivePowerups] = useState<string[]>(player.activePowerups || []);

    const balance = CurrencyService.getCurrency();
    const stats = StatsService.getStats();
    const level = XPService.getLevel();

    const unlockedBadges = BadgeService.getUnlockedBadges();
    const inventory = CurrencyService.getInventory();
    const purchasedItems = CurrencyService.getPurchasedItems();

    const isOwned = (id: string, type?: 'consumable' | 'permanent') => {
        if (type === 'consumable') {
            return (inventory[id] || 0) > 0;
        }
        return purchasedItems.includes(id); // Permanent
    };

    const togglePowerup = (id: string) => {
        if (activePowerups.includes(id)) {
            setActivePowerups(prev => prev.filter(p => p !== id));
        } else {
            if (activePowerups.length >= 3) {
                // Haptic error?
                return; 
            }
            setActivePowerups(prev => [...prev, id]);
        }
    };


    const handleSave = () => {
        if (name.trim()) {
            onUpdateProfile({
                name: name.trim(),
                backgroundColor: backgroundColor,
                cosmetics: {
                    ...player.cosmetics || { brushesUnlocked: [], colorsUnlocked: [], badges: [] },
                    ...player.cosmetics || { brushesUnlocked: [], colorsUnlocked: [], badges: [] },
                    activeCardColor: cardColor,
                    activeBadge: activeBadge,
                    activeStat: activeStat
                } as any, // Cast to any to include activePowerups if not in type yet
                activePowerups: activePowerups
            });
            onBack();
        }
    };

    const statItems = [
        { label: 'Games Played', value: stats.gamesPlayed, emoji: '🎮' },
        { label: 'Games Won', value: stats.gamesWon, emoji: '🏆' },
        { label: 'Rounds Won', value: stats.roundsWon, emoji: '✅' },
        { label: 'Rounds Lost', value: stats.roundsLost, emoji: '❌' },
        { label: 'Times Sabotaged', value: stats.timesSabotaged, emoji: '💥' },
        { label: 'Times Saboteur', value: stats.timesSaboteur, emoji: '🎭' },
        { label: 'Total $ Earned', value: formatCurrency(stats.totalCurrencyEarned), emoji: '💰' },
        { label: 'Total XP Earned', value: stats.totalXPEarned, emoji: '⭐' },
        { label: 'Highest Level', value: stats.highestLevel, emoji: '📈' },
    ];

    return (
        <div
            className="h-[100dvh] w-full flex flex-col overflow-hidden"
            style={{
                paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                backgroundColor: 'var(--theme-bg-primary)'
            }}
        >
            {/* Home Button Card */}
            <button
                onClick={onBack}
                className="mx-4 mb-4 rounded-[2rem] p-4 border-2 flex items-center gap-4 hover:brightness-110 active:scale-95 transition-all shadow-lg"
                style={{
                    backgroundColor: 'var(--theme-card-bg)',
                    borderColor: 'var(--theme-border)'
                }}
            >
                <div className="text-3xl">🏠</div>
                <div className="flex-1 text-left">
                    <div className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Back to Home</div>
                    <div className="text-sm font-medium" style={{ color: 'var(--theme-text-secondary)' }}>Return to main menu</div>
                </div>
                <div className="text-2xl" style={{ color: 'var(--theme-text-secondary)' }}>←</div>
            </button>

            {/* Header with Tabs */}
            <div className="px-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-black drop-shadow-lg" style={{ color: 'var(--theme-text)' }}>👤 PROFILE</h1>
                    <div className="px-4 py-2 rounded-xl font-bold text-white shadow-md"
                        style={{ backgroundColor: 'var(--theme-accent)' }}>
                        {formatCurrency(balance)}
                    </div>
                </div>

                {/* Tab Buttons */}
                <div
                    className="flex rounded-2xl p-1"
                    style={{ backgroundColor: 'var(--theme-bg-secondary)' }}
                >
                    {(['edit', 'stats'] as Tab[]).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeTab === tab ? 'shadow-md' : 'opacity-60'
                                }`}
                            style={{
                                backgroundColor: activeTab === tab ? 'var(--theme-card-bg)' : 'transparent',
                                color: activeTab === tab ? 'var(--theme-text)' : 'var(--theme-text-secondary)'
                            }}
                        >
                            {tab === 'edit' ? '✏️ Edit Profile' : '📊 Statistics'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col px-4 pb-4 overflow-y-auto overscroll-contain touch-pan-y">
                {activeTab === 'edit' ? (
                    /* Edit Tab Content */
                    <div className="flex-1 flex flex-col space-y-4">
                        {/* Name Input */}
                        <div className="rounded-[2rem] p-4 shadow-lg"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                border: '2px solid var(--theme-border)'
                            }}>
                            <label className="block text-sm font-bold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>NAME</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={15}
                                className="w-full px-4 py-3 rounded-2xl border-2 focus:outline-none font-bold text-center text-lg"
                                style={{
                                    backgroundColor: 'var(--theme-bg-secondary)',
                                    color: 'var(--theme-text)',
                                    borderColor: 'var(--theme-border)'
                                }}
                            />
                        </div>

                        {/* Avatar Display */}
                        <div className="flex-1 rounded-[2rem] p-4 shadow-lg flex flex-col min-h-0"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                border: '2px solid var(--theme-border)'
                            }}>
                            <label className="block text-sm font-bold mb-2 shrink-0" style={{ color: 'var(--theme-text-secondary)' }}>YOUR AVATAR</label>
                            <button
                                onClick={onEditAvatar}
                                className="flex-1 w-full flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-dashed transition-all group hover:scale-[1.02]"
                                style={{
                                    borderColor: 'var(--theme-border)',
                                    backgroundColor: 'var(--theme-bg-secondary)'
                                }}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                        <div className="relative">
                                            <AvatarDisplay
                                                strokes={player.avatarStrokes}
                                                avatar={player.avatar}
                                                frame={player.frame}
                                                color={player.color}
                                                backgroundColor={backgroundColor}
                                                cosmetics={player.cosmetics} // Pass cosmetics for theme matching
                                                size={56}
                                                imageUrl={player.avatarImageUrl}
                                            />
                                        </div>
                                    <div className="absolute -bottom-2 -right-2 text-2xl text-white p-3 rounded-full shadow-lg border-2 border-white"
                                        style={{ backgroundColor: 'var(--theme-accent)' }}>
                                        ✏️
                                    </div>
                                </div>
                                <span className="font-black text-xl" style={{ color: 'var(--theme-accent)' }}>TAP TO EDIT</span>
                                <span className="text-sm font-medium opacity-60" style={{ color: 'var(--theme-text)' }}>Customize your look</span>
                            </button>
                        </div>

                        {/* Background Color Picker */}
                        <div className="rounded-[2rem] p-4 shadow-lg flex flex-col items-center"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                border: '2px solid var(--theme-border)'
                            }}>
                            <label className="block text-sm font-bold mb-4" style={{ color: 'var(--theme-text-secondary)' }}>BACKGROUND COLOR</label>

                            <ColorWheel
                                color={backgroundColor}
                                onChange={setBackgroundColor}
                                size={220}
                                className="mb-4 w-full"
                            />

                            {/* Color Preview Badge */}
                            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                                <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor }} />
                                <span className="font-mono text-xs uppercase opacity-70" style={{ color: 'var(--theme-text)' }}>{backgroundColor}</span>
                            </div>
                        </div>

                        {/* Card Styling Section */}
                        <div className="rounded-[2rem] p-4 shadow-lg space-y-6"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                border: '2px solid var(--theme-border)'
                            }}>
                            <h3 className="text-lg font-bold text-center" style={{ color: 'var(--theme-text)' }}>💳 CARD STYLING</h3>

                            {/* Card Preview */}
                            <div className="w-full">
                                <label className="block text-sm font-bold mb-2 text-center" style={{ color: 'var(--theme-text-secondary)' }}>PREVIEW</label>
                                <div className="flex items-center justify-between p-4 rounded-2xl relative overflow-hidden transition-all select-none shadow-sm"
                                    style={{
                                        backgroundColor: 'var(--theme-highlight)',
                                        borderLeft: cardColor ? `8px solid ${cardColor}` : 'none',
                                        background: cardColor ? `linear-gradient(90deg, ${cardColor}22, var(--theme-highlight) 30%)` : 'var(--theme-highlight)'
                                    }}>
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="w-24 h-24 mb-2">
                                        <AvatarDisplay
                                            strokes={player.avatarStrokes}
                                            avatar={player.avatar}
                                            frame={player.frame}
                                            color={player.color}
                                            backgroundColor={backgroundColor} // This is the local state being edited, but let's check if we should show the EFFECTIVE color? 
                                            // Actually, in Edit mode, user wants to pick a color. If "Match Theme" is ON, they might be confused why their picker doesn't work. 
                                            // However, match switch is in Store. 
                                            // If match is ON, AvatarDisplay will override it. 
                                            // This is good behavior: shows what they will actually look like.
                                            cosmetics={player.cosmetics}
                                            size={96}
                                            className="!rounded-3xl shadow-md"
                                        />
                                    </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <div className="font-bold text-lg text-[var(--theme-text)] leading-tight">{name || 'Player'}</div>
                                                {/* Badge Preview */}
                                                {activeBadge && (
                                                    <span className="text-xl drop-shadow-md">
                                                        {BadgeService.getBadgeInfo(activeBadge)?.emoji}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 mt-0.5">
                                                {/* Stat Preview */}
                                                {activeStat === 'level' && (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                                                        <span className="text-xs">{XPService.getTierForLevel(level).icon}</span>
                                                        <span className="text-[10px] font-black opacity-70 uppercase">Lvl {level}</span>
                                                    </div>
                                                )}
                                                {activeStat === 'wins' && (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                                                        <span className="text-xs">🏆</span>
                                                        <span className="text-[10px] font-black opacity-70 uppercase">{stats.gamesWon} Wins</span>
                                                    </div>
                                                )}
                                                {activeStat === 'earnings' && (
                                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/5 dark:bg-white/10">
                                                        <span className="text-xs">💰</span>
                                                        <span className="text-[10px] font-black opacity-70 uppercase">{formatCurrency(stats.totalCurrencyEarned)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 relative z-10 opacity-50">
                                        <div className="px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest"
                                            style={{ backgroundColor: '#D97706', color: '#3E2723' }}>
                                            READY!
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Card Color */}
                            <div className="flex flex-col items-center w-full">
                                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--theme-text-secondary)' }}>CARD COLOR</label>
                                <ColorWheel
                                    color={cardColor}
                                    onChange={setCardColor}
                                    size={220}
                                    className="mb-4 w-full"
                                />
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20">
                                    <div className="w-6 h-6 rounded-full border border-gray-200" style={{ backgroundColor: cardColor }} />
                                    <span className="font-mono text-xs uppercase opacity-70" style={{ color: 'var(--theme-text)' }}>{cardColor}</span>
                                </div>
                            </div>

                            {/* Badge Selection */}
                            <div className="flex flex-col items-center">
                                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--theme-text-secondary)' }}>SHOWOFF BADGE</label>
                                {unlockedBadges.length > 0 ? (
                                    <div className="grid grid-cols-4 gap-2 w-full">
                                        {unlockedBadges.map(badgeId => {
                                            const info = BadgeService.getBadgeInfo(badgeId);
                                            if (!info) return null;
                                            const isSelected = activeBadge === badgeId;
                                            return (
                                                <button
                                                    key={badgeId}
                                                    onClick={() => setActiveBadge(badgeId)}
                                                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl transition-all border-2 ${isSelected ? 'scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'
                                                        }`}
                                                    style={{
                                                        backgroundColor: isSelected ? 'var(--theme-accent)' : 'var(--theme-bg-secondary)',
                                                        borderColor: isSelected ? 'var(--theme-text)' : 'transparent'
                                                    }}
                                                    title={info.name}
                                                >
                                                    {info.emoji}
                                                </button>
                                            );
                                        })}
                                        {/* Option to unequip */}
                                        <button
                                            onClick={() => setActiveBadge('')}
                                            className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold transition-all border-2 ${activeBadge === '' ? 'scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'
                                                }`}
                                            style={{
                                                backgroundColor: 'var(--theme-bg-secondary)',
                                                borderColor: activeBadge === '' ? 'var(--theme-text)' : 'transparent',
                                                color: 'var(--theme-text)'
                                            }}
                                        >
                                            NONE
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center p-4 opacity-60 text-sm">
                                        Playing games to unlock badges!
                                    </div>
                                )}
                            </div>

                            {/* Stat Selection */}
                            <div className="flex flex-col items-center">
                                <label className="block text-sm font-bold mb-4" style={{ color: 'var(--theme-text-secondary)' }}>STAT TO SHOW</label>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {[
                                        { id: 'level', label: 'Level', emoji: '⭐' },
                                        { id: 'wins', label: 'Wins', emoji: '🏆' },
                                        { id: 'earnings', label: 'Earnings', emoji: '💰' },
                                        { id: 'none', label: 'None', emoji: '🚫' }
                                    ].map(stat => (
                                        <button
                                            key={stat.id}
                                            onClick={() => setActiveStat(stat.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${activeStat === stat.id ? 'scale-105 shadow-md' : 'opacity-60 hover:opacity-100'}`}
                                            style={{
                                                backgroundColor: activeStat === stat.id ? 'var(--theme-accent)' : 'var(--theme-bg-secondary)',
                                                borderColor: activeStat === stat.id ? 'var(--theme-text)' : 'transparent',
                                                color: 'var(--theme-text)'
                                            }}
                                        >
                                            {stat.emoji} {stat.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Powerup Loadout Section */}
                        <div className="rounded-[2rem] p-4 shadow-lg space-y-4"
                            style={{
                                backgroundColor: 'var(--theme-card-bg)',
                                border: '2px solid var(--theme-border)'
                            }}>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>⚡ POWERUP LOADOUT</h3>
                                <span className="text-sm font-bold opacity-60" style={{ color: 'var(--theme-text)' }}>{activePowerups.length}/3</span>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2">
                                {POWERUPS.map(p => {
                                    const owned = isOwned(p.id, p.type as 'consumable' | 'permanent' | undefined);
                                    const selected = activePowerups.includes(p.id);
                                    const count = inventory[p.id] || 0;
                                    
                                    return (
                                        <button
                                            key={p.id}
                                            onClick={() => owned && togglePowerup(p.id)}
                                            disabled={!owned}
                                            className={`relative aspect-square rounded-xl p-2 flex flex-col items-center justify-center gap-1 transition-all border-2 group
                                                ${selected 
                                                    ? 'border-[var(--theme-accent)] bg-[var(--theme-accent)]/10 shadow-lg scale-105' 
                                                    : owned 
                                                        ? 'border-transparent bg-[var(--theme-bg-secondary)] hover:bg-[var(--theme-highlight)]' 
                                                        : 'border-transparent bg-[var(--theme-bg-secondary)] opacity-40 grayscale cursor-not-allowed'
                                                }`}
                                        >
                                            <div className="text-2xl filter drop-shadow-md">{p.emoji}</div>
                                            <div className="text-[10px] font-bold text-center leading-tight truncate w-full" style={{ color: 'var(--theme-text)' }}>
                                                {p.name}
                                            </div>
                                            
                                            {/* Count Badge for Consumables */}
                                            {p.type === 'consumable' && owned && (
                                                <div className="absolute top-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                                    x{count}
                                                </div>
                                            )}
                                            
                                            {/* Selected Indicator */}
                                            {selected && (
                                                <div className="absolute -top-2 -right-2 bg-[var(--theme-accent)] text-white p-1 rounded-full shadow-sm">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {!purchasedItems.some(id => POWERUPS.some(p => p.id === id)) && Object.keys(inventory).length === 0 && (
                                <div className="text-center p-4 opacity-60 text-sm">
                                    Visit the Store to buy powerups!
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            className="w-full py-4 text-white font-bold text-xl rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0"
                            style={{
                                background: 'linear-gradient(135deg, var(--theme-accent) 0%, #FFD700 100%)'
                            }}
                        >
                            Save Changes
                        </button>
                    </div>
                ) : (
                    /* Stats Tab Content */
                    <div className="space-y-4">
                        {/* Current Status Card */}
                        <div
                            className="rounded-2xl p-4 text-white text-center"
                            style={{ background: 'linear-gradient(135deg, var(--theme-accent), #9B59B6)' }}
                        >
                            <div className="text-lg font-bold mb-2">Current Status</div>
                            <div className="flex justify-around">
                                <div>
                                    <div className="text-2xl font-black">LVL {level}</div>
                                    <div className="text-xs opacity-80">Level</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-black">{formatCurrency(balance)}</div>
                                    <div className="text-xs opacity-80">Balance</div>
                                </div>
                            </div>
                        </div>

                        {/* Match History Button */}
                        <button
                            onClick={onShowGallery}
                            className="w-full py-4 rounded-2xl flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-white border-2 border-white/20"
                            style={{ 
                                background: 'linear-gradient(135deg, var(--theme-bg-secondary), var(--theme-card-bg))',
                            }}
                        >
                            <span className="text-2xl">📚</span>
                            <span className="font-bold text-lg">View Match History</span>
                        </button>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {statItems.map((item, i) => (
                                <div
                                    key={i}
                                    className="rounded-2xl p-4 text-center"
                                    style={{
                                        backgroundColor: 'var(--theme-card-bg)',
                                        border: '2px solid var(--theme-border)'
                                    }}
                                >
                                    <div className="text-2xl mb-1">{item.emoji}</div>
                                    <div className="text-xl font-bold" style={{ color: 'var(--theme-text)' }}>{item.value}</div>
                                    <div className="text-xs" style={{ color: 'var(--theme-text-secondary)' }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
