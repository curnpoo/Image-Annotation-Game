import React, { useState } from 'react';
import { CurrencyService, formatCurrency } from '../../services/currency';
import { AuthService } from '../../services/auth';
import { UNLOCKABLE_BRUSHES, POWERUPS, CARD_THEMES } from '../../constants/cosmetics';
import { vibrate, HapticPatterns } from '../../utils/haptics';

interface StoreScreenProps {
    onBack: () => void;
    onEquip?: () => void;
}

type Tab = 'brushes' | 'powerups' | 'themes';

export const StoreScreen: React.FC<StoreScreenProps> = ({ onBack, onEquip }) => {
    const [balance, setBalance] = useState(CurrencyService.getCurrency());
    const [activeTab, setActiveTab] = useState<Tab>('brushes');
    const [purchaseMessage, setPurchaseMessage] = useState<string | null>(null);
    const purchasedItems = CurrencyService.getPurchasedItems();

    const isOwned = (itemId: string, price: number) =>
        price === 0 || purchasedItems.includes(itemId);

    const handleAction = (item: any) => {
        const owned = isOwned(item.id, item.price);

        if (activeTab === 'themes' && owned) {
            // Equip Logic
            const currentUser = AuthService.getCurrentUser();
            if (currentUser) {
                const newCosmetics = { ...currentUser.cosmetics, activeTheme: item.id };
                AuthService.updateUser(currentUser.id, { cosmetics: newCosmetics });
                vibrate(HapticPatterns.light);
                setPurchaseMessage(`🎨 Equipped ${item.name}!`);
                setTimeout(() => setPurchaseMessage(null), 1500);
                if (onBack) {
                    // Refresh parent state implicity or explicity via onEquip if provided,
                    // but for now we just want the visual transition trigger.
                    onEquip?.();
                }
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

    const isEquipped = (itemId: string) => {
        const currentUser = AuthService.getCurrentUser();
        return currentUser?.cosmetics?.activeTheme === itemId;
    };

    const tabs = [
        { id: 'brushes' as Tab, label: '🖌️ Brushes', items: UNLOCKABLE_BRUSHES.filter(b => b.price > 0) },
        { id: 'powerups' as Tab, label: '⚡ Powerups', items: POWERUPS },
        { id: 'themes' as Tab, label: '🎨 Themes', items: CARD_THEMES }
    ];

    const currentItems = tabs.find(t => t.id === activeTab)?.items || [];

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-purple-600 via-purple-700 to-purple-900 flex flex-col"
            style={{
                paddingTop: 'max(1.5rem, env(safe-area-inset-top) + 1rem)',
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))'
            }}
        >
            {/* Home Button Card */}
            <button
                onClick={onBack}
                className="mx-4 mb-4 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border-2 border-white/20 flex items-center gap-4 hover:bg-white/20 active:scale-95 transition-all"
            >
                <div className="text-3xl">🏠</div>
                <div className="flex-1 text-left">
                    <div className="text-lg font-bold text-white">Back to Home</div>
                    <div className="text-white/60 text-sm">Return to main menu</div>
                </div>
                <div className="text-2xl text-white/60">←</div>
            </button>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 mb-2">
                <h1 className="text-2xl font-black text-white drop-shadow-lg">🛒 STORE</h1>
                <div className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold font-mono">
                    {formatCurrency(balance)}
                </div>
            </div>

            {/* Purchase message */}
            {purchaseMessage && (
                <div className="mx-4 mb-2 bg-white rounded-xl p-3 text-center font-bold pop-in shadow-lg">
                    {purchaseMessage}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 px-4 mb-4 overflow-x-auto no-scrollbar py-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                            ? 'bg-white text-purple-600 shadow-lg scale-105'
                            : 'bg-white/20 text-white hover:bg-white/30'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Items Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className="grid grid-cols-2 gap-3">
                    {currentItems.map((item: any) => {
                        const owned = isOwned(item.id, item.price);
                        const equipped = activeTab === 'themes' && isEquipped(item.id);

                        return (
                            <div
                                key={item.id}
                                className={`bg-white rounded-2xl p-4 shadow-lg flex flex-col items-center justify-between relative overflow-hidden transition-all ${equipped ? 'ring-4 ring-green-400 scale-[1.02]' : ''}`}
                            >
                                {equipped && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-bl-lg">
                                        ACTIVE
                                    </div>
                                )}

                                <div className="text-5xl mb-3 mt-1 hover:scale-110 transition-transform cursor-default">
                                    {item.emoji || item.preview || '🎁'}
                                </div>

                                <div className="text-center w-full mb-3">
                                    <div className="font-bold text-gray-800 text-lg leading-tight mb-1">
                                        {item.name}
                                    </div>
                                    {item.description && (
                                        <div className="text-xs text-gray-500 line-clamp-2 min-h-[2.5em]">
                                            {item.description}
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => handleAction(item)}
                                    disabled={activeTab === 'themes' ? false : owned} // Themes can be clicked to equip even if owned
                                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md ${activeTab === 'themes' && owned
                                        ? equipped
                                            ? 'bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-default'
                                            : 'bg-purple-500 text-white hover:bg-purple-600'
                                        : owned
                                            ? 'bg-gray-200 text-gray-500'
                                            : balance >= item.price
                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white hover:shadow-lg'
                                                : 'bg-red-50 text-red-400 border border-red-100'
                                        }`}
                                >
                                    {activeTab === 'themes' && owned
                                        ? equipped ? '✓ Equipped' : 'Equip'
                                        : owned
                                            ? '✓ Owned'
                                            : formatCurrency(item.price)
                                    }
                                </button>
                            </div>
                        );
                    })}
                </div>

                {currentItems.length === 0 && (
                    <div className="text-center text-white/70 py-12 flex flex-col items-center">
                        <div className="text-4xl mb-4">📭</div>
                        Nothing available in this category yet!
                    </div>
                )}
            </div>
        </div>
    );
};
