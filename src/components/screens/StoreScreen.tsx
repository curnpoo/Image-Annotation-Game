import React, { useState } from 'react';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { AuthService } from '../../services/auth';
import { UNLOCKABLE_BRUSHES, POWERUPS, FONTS, FRAMES, THEMES } from '../../constants/cosmetics';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface StoreScreenProps {
    onBack: () => void;
    onFontChange?: (fontId: string) => void;
}

type Tab = 'brushes' | 'powerups' | 'fonts' | 'frames' | 'themes';

export const StoreScreen: React.FC<StoreScreenProps> = ({ onBack, onFontChange }) => {
    const [balance, setBalance] = useState(CurrencyService.getCurrency());
    const [activeTab, setActiveTab] = useState<Tab>('brushes');
    const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
    const purchasedItems = CurrencyService.getPurchasedItems();

    const isOwned = (itemId: string, price: number) =>
        price === 0 || purchasedItems.includes(itemId);

    const isEquipped = (item: any) => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return false;

        if (activeTab === 'fonts') return currentUser.cosmetics?.activeFont === item.id;
        if (activeTab === 'frames') return currentUser.frame === item.id || (item.id === 'none' && !currentUser.frame);
        if (activeTab === 'themes') return currentUser.cosmetics?.activeTheme === item.id || (item.id === 'default' && !currentUser.cosmetics?.activeTheme);
        
        return false;
    };

    const handleAction = (item: any) => {
        const owned = isOwned(item.id, item.price);

        // Equip Logic (for cosmetic types)
        if (['fonts', 'frames', 'themes'].includes(activeTab) && owned) {
            const currentUser = AuthService.getCurrentUser();
            if (currentUser) {
                let updates: any = {};
                let message = `Equipped ${item.name}!`;

                if (activeTab === 'fonts') {
                    updates = { cosmetics: { ...currentUser.cosmetics, activeFont: item.id } };
                    onFontChange?.(item.id);
                    message = `✏️ ${message}`;
                } else if (activeTab === 'frames') {
                    updates = { frame: item.id === 'none' ? null : item.id };
                    message = `🖼️ ${message}`;
                } else if (activeTab === 'themes') {
                    updates = { 
                        backgroundColor: item.value, // Set visual background
                        cosmetics: { ...currentUser.cosmetics, activeTheme: item.id } // Set logical theme ID
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

        if (CurrencyService.purchaseItem(item.id, item.price)) {
            vibrate(HapticPatterns.success);
            setBalance(CurrencyService.getCurrency());
            setPurchaseMessage(`✅ Purchased ${item.name}!`);
            setTimeout(() => setPurchaseMessage(null), 2000);
        } else {
            vibrate(HapticPatterns.error);
            setPurchaseMessage(`❌ Not enough money!`);
            setTimeout(() => setPurchaseMessage(null), 2000);
        }
    };

    const tabs = [
        { id: 'brushes' as Tab, label: 'BRUSHES', icon: '🖌️', items: UNLOCKABLE_BRUSHES.filter(b => b.price > 0) },
        { id: 'powerups' as Tab, label: 'POWERUPS', icon: '⚡', items: POWERUPS },
        { id: 'fonts' as Tab, label: 'FONTS', icon: '✏️', items: FONTS },
        { id: 'frames' as Tab, label: 'FRAMES', icon: '🖼️', items: FRAMES },
        { id: 'themes' as Tab, label: 'THEMES', icon: '🎨', items: THEMES }
    ];

    const currentItems = tabs.find(t => t.id === activeTab)?.items || [];

    return (
        <div
            className="fixed inset-0 overflow-hidden flex flex-col bg-gray-950"
            style={{
                height: '100dvh'
            }}
        >
            {/* Background Gradients */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] opacity-50" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] opacity-50" />
            </div>

            {/* Header safe area */}
            <div className="pt-[max(1rem,env(safe-area-inset-top))] px-4 pb-2 z-10">
                <div className="flex items-center justify-between mb-2">
                    <button
                        onClick={() => {
                            vibrate();
                            onBack();
                        }}
                        className="w-12 h-12 rounded-full glass-panel flex items-center justify-center text-xl active:scale-90 transition-transform bg-white/5 border border-white/10 text-white shadow-lg"
                    >
                        ←
                    </button>
                    <div className="glass-panel px-5 py-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-yellow-400 font-mono font-black shadow-lg shadow-yellow-500/5">
                        {formatCurrency(balance)}
                    </div>
                </div>

                <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg mb-4 text-center">
                    <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">STORE</span>
                </h1>

                {/* Floating Tabs */}
                {/* Horizontal scroll for tabs on mobile */}
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

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-[max(2rem,env(safe-area-inset-bottom))] scrollbar-hide z-10">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-2xl mx-auto pt-2">
                    {currentItems.map((item: any) => {
                        const owned = isOwned(item.id, item.price);
                        const isEquippable = ['fonts', 'frames', 'themes'].includes(activeTab);
                        const equipped = isEquippable && isEquipped(item);

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleAction(item)}
                                disabled={isEquippable ? false : owned}
                                className={`relative group flex flex-col items-center p-4 rounded-3xl transition-all duration-300 border
                                    ${equipped
                                        ? 'bg-green-500/20 border-green-500/50 shadow-[0_0_30px_rgba(74,222,128,0.2)]'
                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] active:scale-95'
                                    }
                                    ${!owned && balance < item.price ? 'opacity-70 grayscale-[0.5]' : ''}
                                `}
                            >
                                {/* Preview */}
                                <div 
                                    className={`w-full aspect-square mb-3 rounded-2xl flex items-center justify-center text-5xl shadow-inner relative overflow-hidden
                                        ${activeTab === 'fonts' ? 'aspect-video bg-black/20' : 'bg-black/20'}
                                    `}
                                    style={activeTab === 'themes' ? { background: item.value } : undefined}
                                >
                                    {activeTab === 'fonts' ? (
                                        <span style={{ fontFamily: item.fontFamily }} className="text-white text-3xl">Aa</span>
                                    ) : activeTab === 'frames' ? (
                                        <div className="relative flex items-center justify-center w-full h-full">
                                             {/* Avatar placeholder with frame */}
                                             <div className={`w-16 h-16 rounded-full bg-white/20 ${item.className || ''}`}>
                                                 <div className="w-full h-full flex items-center justify-center text-2xl">👤</div>
                                             </div>
                                        </div>
                                    ) : activeTab === 'themes' ? (
                                        // Empty content, background is set
                                        null
                                    ) : (
                                        <span className="filter drop-shadow-lg">{item.emoji || item.preview || '🎁'}</span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="text-center w-full mb-3">
                                    <h3
                                        className="font-bold text-white text-sm mb-1 line-clamp-1"
                                        style={activeTab === 'fonts' ? { fontFamily: item.fontFamily } : undefined}
                                    >
                                        {item.name}
                                    </h3>
                                    {item.description && (
                                        <p className="text-[10px] text-white/50 line-clamp-2 leading-tight h-[2.5em]">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Action Button / Price */}
                                <div className={`w-full py-2 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1 transition-colors
                                    ${isEquippable && owned
                                        ? equipped ? 'bg-green-500 text-white' : 'bg-white/10 text-white group-hover:bg-white/20'
                                        : owned
                                            ? 'bg-white/10 text-white/50 cursor-default'
                                            : (balance >= item.price ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-red-500/20 text-red-400')
                                    }
                                `}>
                                    {isEquippable && owned
                                        ? equipped ? 'Selected' : 'Equip'
                                        : owned
                                            ? 'Owned'
                                            : formatCurrency(item.price)
                                    }
                                </div>
                            </button>
                        );
                    })}
                </div>

                {currentItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-50">
                        <div className="text-6xl mb-4 grayscale">📭</div>
                        <p className="text-white font-bold">Coming Soon</p>
                    </div>
                )}
            </div>
        </div>
    );
};
