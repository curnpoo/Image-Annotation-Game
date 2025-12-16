
import React, { useState } from 'react';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { AuthService } from '../../services/auth';
import { UNLOCKABLE_BRUSHES, POWERUPS, FONTS, FRAMES, THEMES } from '../../constants/cosmetics';
import { vibrate, HapticPatterns } from '../../utils/haptics';
import type { Player } from '../../types';


interface StoreScreenProps {
    onBack: () => void;
    onEquip: (type: 'font' | 'theme' | 'frame', id: string, value?: string) => void;
    player?: Player | null; // Accept parent state
}

type Tab = 'brushes' | 'powerups' | 'fonts' | 'frames' | 'themes';

interface StoreSection {
    title?: string;
    items: any[];
}

export const StoreScreen: React.FC<StoreScreenProps> = ({ onBack, onEquip, player }) => {
    const [balance, setBalance] = useState(CurrencyService.getCurrency());
    const [activeTab, setActiveTab] = useState<Tab>('brushes');
    const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
    const purchasedItems = CurrencyService.getPurchasedItems();
    const inventory = CurrencyService.getInventory();
    
    // Local state for "Match Avatar to Theme" toggle (optimistic UI)
    const [matchAvatarToTheme, setMatchAvatarToTheme] = useState(player?.cosmetics?.matchAvatarToTheme ?? false);

    const isOwned = (itemId: string, price: number, type?: 'consumable' | 'permanent') => {
        if (price === 0) return true;
        if (type === 'consumable') return false; // Consumables are never "fully owned"
        return purchasedItems.includes(itemId);
    };

    const getInventoryCount = (itemId: string) => inventory[itemId] || 0;

    // Use passed player prop for immediate optimistic UI update
    const isEquipped = (item: any) => {
        const currentUser = player || AuthService.getCurrentUser();
        if (!currentUser) return false;

        if (activeTab === 'fonts') return currentUser.cosmetics?.activeFont === item.id;
        if (activeTab === 'frames') return currentUser.frame === item.id || (item.id === 'none' && !currentUser.frame);
        if (activeTab === 'themes') return currentUser.cosmetics?.activeTheme === item.id || (item.id === 'default' && !currentUser.cosmetics?.activeTheme);
        
        return false;
    };

    const handleAction = (item: any) => {
        const owned = isOwned(item.id, item.price, item.type);

        // Equip Logic (for cosmetic types)
        if (['fonts', 'frames', 'themes'].includes(activeTab) && owned) {
            if (activeTab === 'fonts') onEquip('font', item.id);
            else if (activeTab === 'frames') onEquip('frame', item.id);
            else if (activeTab === 'themes') onEquip('theme', item.id, item.value);

            const currentUser = AuthService.getCurrentUser();
            if (currentUser) {
                let updates: any = {};
                let message = `Equipped ${item.name}!`;

                if (activeTab === 'fonts') {
                    updates = { cosmetics: { ...currentUser.cosmetics, activeFont: item.id } };
                    message = `✏️ ${message}`;
                } else if (activeTab === 'frames') {
                    updates = { frame: item.id === 'none' ? null : item.id };
                    message = `🖼️ ${message}`;
                } else if (activeTab === 'themes') {
                    // Only update avatar backgroundColor if matchAvatarToTheme is enabled
                    const shouldUpdateBg = currentUser.cosmetics?.matchAvatarToTheme === true;
                    updates = { 
                        ...(shouldUpdateBg ? { backgroundColor: item.value } : {}),
                        cosmetics: { ...currentUser.cosmetics, activeTheme: item.id } 
                    };
                    message = `🎨 ${message}`;
                }
                AuthService.updateUser(currentUser.id, updates);
                
                try {
                    vibrate(HapticPatterns.light);
                } catch (err) {
                    console.error('Haptic feedback failed:', err);
                }

                setPurchaseMessage(message);
                setTimeout(() => setPurchaseMessage(null), 1500);
            }
            return;
        }

        // Purchase Logic
        if (item.price === 0) return;

        if (CurrencyService.purchaseItem(item.id, item.price, item.type)) {
            vibrate(HapticPatterns.success);
            setBalance(CurrencyService.getCurrency());
            const isConsumable = item.type === 'consumable';
            setPurchaseMessage(isConsumable 
                ? `✅ +1 ${item.name} (${CurrencyService.getItemCount(item.id)})` 
                : `✅ Purchased ${item.name}!`
            );
            setTimeout(() => setPurchaseMessage(null), 2000);
        } else {
            vibrate(HapticPatterns.error);
            setPurchaseMessage(`❌ Not enough money!`);
            setTimeout(() => setPurchaseMessage(null), 2000);
        }
    };

    const tabs = [
        { id: 'brushes' as Tab, label: 'BRUSHES', icon: '🖌️' },
        { id: 'powerups' as Tab, label: 'POWERUPS', icon: '⚡' },
        { id: 'frames' as Tab, label: 'FRAMES', icon: '🖼️' },
        { id: 'themes' as Tab, label: 'THEMES', icon: '🎨' },
        { id: 'fonts' as Tab, label: 'FONTS', icon: '✏️' }
    ];

    const getSections = (): StoreSection[] => {
        switch (activeTab) {
            case 'powerups':
                return [
                    { title: 'Consumables (One-time use)', items: POWERUPS.filter(p => p.type === 'consumable') },
                    { title: 'Permanent Upgrades', items: POWERUPS.filter(p => p.type === 'permanent') }
                ];
            case 'frames':
                return [
                    { title: 'Basic Frames', items: FRAMES.filter(f => f.price < 200 && f.id !== 'none') },
                    { title: 'Premium Frames', items: FRAMES.filter(f => f.price >= 200) }
                ];
            case 'brushes':
                return [{ items: UNLOCKABLE_BRUSHES.filter(b => b.price > 0) }];
            case 'fonts':
                return [{ items: FONTS }];
            case 'themes':
                return [{ items: THEMES }];
            default:
                return [];
        }
    };

    const sections = getSections();

    return (
        <div
            className="fixed inset-0 overflow-hidden flex flex-col"
            style={{ 
                height: '100dvh',
                background: 'transparent',
                isolation: 'isolate'
            }}
        >
            {/* Background accent glows - Removed to prevent dirty look on light themes */}

            {/* Header safe area */}
            <div className="pt-[max(1rem,env(safe-area-inset-top))] px-4 pb-2 z-10">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => {
                            vibrate();
                            onBack();
                        }}
                        className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-xl active:scale-90 transition-transform shadow-lg"
                        style={{ 
                            background: 'var(--theme-card-bg)', 
                            border: '1px solid var(--theme-border)',
                            color: 'var(--theme-text)'
                        }}
                    >
                        ←
                    </button>
                    <div className="glass-panel px-5 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-mono font-black shadow-lg shadow-yellow-500/5">
                        {formatCurrency(balance)}
                    </div>
                </div>

                <h1 className="text-4xl font-black tracking-tighter drop-shadow-lg mb-4 text-center" style={{ color: 'var(--theme-text)' }}>
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">STORE</span>
                </h1>

                {/* Floating Tabs */}
                <div className="flex overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
                    <div className="flex p-1 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner min-w-max mx-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    vibrate();
                                    setActiveTab(tab.id);
                                }}
                                className={`py-3 px-4 rounded-xl text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 ${activeTab === tab.id
                                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25 scale-[1.02]'
                                        : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                                    }`}
                            >
                                <span className="text-base">{tab.icon}</span>
                                <span className="tracking-wider">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Toast Message */}
            {purchaseMessage && (
                <div className="absolute top-32 left-1/2 -translate-x-1/2 z-50 animate-bounce-gentle w-full flex justify-center pointer-events-none">
                    <div className="glass-panel px-6 py-3 rounded-full border border-white/20 text-white font-bold shadow-2xl flex items-center gap-3 backdrop-blur-xl bg-black/80">
                        {purchaseMessage}
                    </div>
                </div>
            )}

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))] scrollbar-hide z-10">
                <div className="max-w-2xl mx-auto pt-2 space-y-6">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-3">
                            {section.title && (
                                <div className="flex items-center justify-between sticky top-0 backdrop-blur-md py-2 z-10 w-full pr-2" style={{ background: 'var(--theme-card-bg)' }}>
                                    <h3 className="font-bold uppercase tracking-widest text-xs pl-2" style={{ color: 'var(--theme-text-secondary)' }}>
                                        {section.title}
                                    </h3>
                                    
                                    {/* Match Avatar Toggle (Only shows in relevant section, e.g. solid colors or just once at top if easier) */}
                                    {/* Better placement: If activeTab is themes, show it at the very top of list or section */}
                                </div>
                            )}
                            {activeTab === 'themes' && idx === 0 && (
                                <div className="mb-4 px-2">
                                    <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm" style={{ color: 'var(--theme-text)' }}>Match Avatar</span>
                                            <span className="text-[10px]" style={{ color: 'var(--theme-text-secondary)' }}>Sync avatar background to theme</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                vibrate();
                                                if (!player?.cosmetics) return;
                                                
                                                // Toggle local state immediately (optimistic)
                                                const newState = !matchAvatarToTheme;
                                                setMatchAvatarToTheme(newState);
                                                
                                                // Persist to server
                                                await AuthService.updateUser(player.id, {
                                                    cosmetics: {
                                                        ...player.cosmetics,
                                                        matchAvatarToTheme: newState
                                                    }
                                                });
                                            }}
                                            className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${matchAvatarToTheme ? 'bg-green-500' : 'bg-white/20'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 ${matchAvatarToTheme ? 'left-7' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-3">
                                {section.items.map((item: any) => {
                                    const owned = isOwned(item.id, item.price, item.type);
                                    const isEquippable = ['fonts', 'frames', 'themes'].includes(activeTab);
                                    const quantity = item.type === 'consumable' ? getInventoryCount(item.id) : 0;
                                    const equipped = isEquippable && isEquipped(item);

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleAction(item)}
                                            disabled={isEquippable ? false : owned}
                                            className={`w-full group flex items-center p-3 rounded-2xl transition-all duration-300 border relative overflow-hidden
                                                ${equipped
                                                    ? 'bg-gradient-to-r from-green-500/20 to-green-600/10 border-green-500/50'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-[0.98]'
                                                }
                                                ${!owned && balance < item.price ? 'opacity-70 grayscale-[0.5]' : ''}
                                            `}
                                        >
                                            {/* Left: Icon/Preview */}
                                            <div className="flex-shrink-0 mr-4">
                                                <div 
                                                    className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shadow-inner relative overflow-hidden bg-black/30
                                                        ${activeTab === 'themes' ? 'border border-white/10' : ''}
                                                    `}
                                                    style={activeTab === 'themes' ? { background: item.value } : undefined}
                                                >
                                                    {activeTab === 'fonts' ? (
                                                        <span style={{ fontFamily: item.fontFamily }} className="text-white">Aa</span>
                                                    ) : activeTab === 'frames' ? (
                                                        <div className={`w-12 h-12 rounded-full bg-white/10 flex items-center justify-center ${item.className || ''}`}>
                                                            <span className="text-xl">👤</span>
                                                        </div>
                                                    ) : activeTab === 'themes' ? (
                                                        null
                                                    ) : (
                                                        <span className="filter drop-shadow-lg scale-110">{item.emoji || item.preview || '🎁'}</span>
                                                    )}

                                                     {/* Quantity Badge */}
                                                    {item.type === 'consumable' && quantity > 0 && (
                                                        <div className="absolute top-1 right-1 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white/20">
                                                            x{quantity}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Middle: Info */}
                                            <div className="flex-1 text-left min-w-0">
                                                    <div className="flex items-baseline gap-2">
                                                    <h3 
                                                        className="font-bold text-base truncate"
                                                        style={activeTab === 'fonts' ? { fontFamily: item.fontFamily, color: 'var(--theme-text)' } : { color: 'var(--theme-text)' }}
                                                    >
                                                        {item.name}
                                                    </h3>
                                                    {equipped && <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider bg-green-500/20 px-1.5 rounded">Active</span>}
                                                </div>
                                                <p className="text-xs line-clamp-1 mt-0.5" style={{ color: 'var(--theme-text-secondary)' }}>
                                                    {item.description}
                                                </p>
                                            </div>

                                            {/* Right: Action/Price */}
                                            <div className="flex-shrink-0 ml-4">
                                                <div className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors
                                                    ${isEquippable && owned
                                                        ? equipped 
                                                            ? 'bg-transparent text-green-400 border border-green-500/30' 
                                                            : 'bg-white/10 text-white hover:bg-white/20'
                                                        : owned
                                                            ? 'bg-white/5 text-white/30 cursor-default'
                                                            : (balance >= item.price 
                                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                                                                : 'bg-red-500/10 text-red-400 border border-red-500/20')
                                                    }
                                                `}>
                                                    {isEquippable && owned
                                                        ? equipped ? 'Selected' : 'Equip'
                                                        : owned && item.type !== 'consumable'
                                                            ? 'Owned'
                                                            : formatCurrency(item.price)
                                                    }
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {sections.every(s => s.items.length === 0) && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-50">
                            <div className="text-6xl mb-4 grayscale">📭</div>
                            <p className="font-bold" style={{ color: 'var(--theme-text)' }}>Coming Soon</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
