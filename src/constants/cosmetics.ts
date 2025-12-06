export const UNLOCKABLE_BRUSHES = [
    { id: 'default', name: 'Standard', emoji: '🖊️', price: 0 },
    { id: 'marker', name: 'Marker', emoji: '🖍️', price: 15 },
    { id: 'calligraphy', name: 'Ink Pen', emoji: '✒️', price: 15 },
    { id: 'pixel', name: 'Pixel', emoji: '👾', price: 25 },
    { id: 'neon', name: 'Neon', emoji: '✨', price: 50 },
    { id: 'spray', name: 'Spray', emoji: '💨', price: 25 }
];

export const UNLOCKABLE_COLORS = [
    // Standard (free)
    { id: '#000000', name: 'Black', price: 0 },
    { id: '#ffffff', name: 'White', price: 0 },
    { id: '#FF0000', name: 'Red', price: 0 },
    { id: '#00FF00', name: 'Green', price: 0 },
    { id: '#0000FF', name: 'Blue', price: 0 },

    // Unlockables
    { id: '#FFD700', name: 'Gold', locked: true, price: 25 },
    { id: '#C0C0C0', name: 'Silver', locked: true, price: 15 },
    { id: '#FF69B4', name: 'Hot Pink', locked: true, price: 15 },
    { id: '#00CCFF', name: 'Cyan', locked: true, price: 15 },
    { id: '#9D00FF', name: 'Electric Purple', locked: true, price: 25 }
];

export const BADGES = [
    { id: 'first_win', name: 'First Win', emoji: '🏆', description: 'Won your first round!', price: 0 },
    { id: 'artist', name: 'True Artist', emoji: '🎨', description: 'Drew 100 strokes in one round', price: 0 },
    { id: 'speed', name: 'Speed Demon', emoji: '⚡', description: 'Submitted in under 5 seconds', price: 0 },
    { id: 'social', name: 'Chatty', emoji: '💭', description: 'Sent 50 messages', price: 0 },
    { id: 'saboteur', name: 'Chaos Agent', emoji: '😈', description: 'Successfully sabotaged a round', price: 0 },
    { id: 'high_roller', name: 'High Roller', emoji: '🎰', description: 'Win big at the casino', price: 0 },
    { id: 'rich', name: 'Loaded', emoji: '💰', description: 'Have 100$ at once', price: 0 }
];

// Purchasable powerups (consumable items)
export const POWERUPS = [
    { id: 'extra_time', name: 'Extra Time', emoji: '⏰', description: '+10 seconds drawing time', price: 10, consumable: true },
    { id: 'double_vote', name: 'Double Vote', emoji: '✌️', description: 'Your vote counts twice', price: 15, consumable: true },
    { id: 'shield', name: 'Anti-Sabotage', emoji: '🛡️', description: 'Block sabotage effects', price: 20, consumable: true },
    { id: 'reveal', name: 'Reveal Saboteur', emoji: '👁️', description: 'See who the saboteur is', price: 25, consumable: true },
    { id: 'steal', name: 'Vote Steal', emoji: '🎭', description: 'Steal 1 vote from leader', price: 30, consumable: true }
];

// Player card themes (permanent unlocks)
export const CARD_THEMES = [
    { id: 'default', name: 'Classic', preview: '⬜', description: 'Standard white card', price: 0 },
    { id: 'dark', name: 'Dark Mode', preview: '⬛', description: 'Sleek dark background', price: 15 },
    { id: 'gradient', name: 'Sunset', preview: '🌅', description: 'Orange to purple gradient', price: 25 },
    { id: 'neon', name: 'Neon Glow', preview: '💜', description: 'Glowing neon border', price: 35 },
    { id: 'gold', name: 'Golden', preview: '🏆', description: 'Luxurious gold trim', price: 50 },
    { id: 'holographic', name: 'Holographic', preview: '🌈', description: 'Rainbow shimmer effect', price: 75 },
    { id: 'galaxy', name: 'Galaxy', preview: '🌌', description: 'Starry space background', price: 100 }
];
