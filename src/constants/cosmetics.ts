export const UNLOCKABLE_BRUSHES = [
    { id: 'default', name: 'Simple', emoji: '🖊️', price: 0 },
    { id: 'marker', name: 'Marker', emoji: '🖍️', price: 150 },
    { id: 'calligraphy', name: 'Ink Pen', emoji: '✒️', price: 200 },
    { id: 'pixel', name: 'Pixel', emoji: '👾', price: 250 },
    { id: 'neon', name: 'Neon', emoji: '✨', price: 500 },
    { id: 'spray', name: 'Spray', emoji: '💨', price: 300 }
];

export const UNLOCKABLE_COLORS = [
    // Standard (free)
    { id: '#000000', name: 'Black', price: 0 },
    { id: '#ffffff', name: 'White', price: 0 },
    { id: '#FF0000', name: 'Red', price: 0 },
    { id: '#00FF00', name: 'Green', price: 0 },
    { id: '#0000FF', name: 'Blue', price: 0 },
    { id: '#FFA500', name: 'Orange', price: 0 },
    { id: '#FFFF00', name: 'Yellow', price: 0 },
    { id: '#800080', name: 'Purple', price: 0 },
    { id: '#A52A2A', name: 'Brown', price: 0 },
    { id: '#FFC0CB', name: 'Pink', price: 0 },

    // Unlockables
    { id: '#FFD700', name: 'Gold', locked: true, price: 250 },
    { id: '#C0C0C0', name: 'Silver', locked: true, price: 150 },
    { id: '#FF69B4', name: 'Hot Pink', locked: true, price: 150 },
    { id: '#00CCFF', name: 'Cyan', locked: true, price: 150 },
    { id: '#9D00FF', name: 'Electric Purple', locked: true, price: 250 }
];

export const BADGES = [
    // Achievement badges
    { id: 'first_win', name: 'First Win', emoji: '🏆', description: 'Won your first round!', price: 0 },
    { id: 'artist', name: 'True Artist', emoji: '🎨', description: 'Drew 100 strokes in one round', price: 0 },
    { id: 'speed', name: 'Speed Demon', emoji: '⚡', description: 'Submitted in under 5 seconds', price: 0 },
    { id: 'social', name: 'Chatty', emoji: '💭', description: 'Sent 50 messages', price: 0 },
    { id: 'saboteur', name: 'Chaos Agent', emoji: '😈', description: 'Successfully sabotaged a round', price: 0 },
    { id: 'high_roller', name: 'High Roller', emoji: '🎰', description: 'Win big at the casino', price: 0 },
    { id: 'rich', name: 'Loaded', emoji: '💰', description: 'Have 100$ at once', price: 0 },

    // Drawing-themed level milestone badges
    { id: 'level_5', name: 'Sketch Artist', emoji: '✏️', description: 'Drew your way to Level 5', price: 0, levelRequired: 5 },
    { id: 'level_10', name: 'Ink Master', emoji: '🖊️', description: 'Mastered the pen at Level 10', price: 0, levelRequired: 10 },
    { id: 'level_25', name: 'Canvas Virtuoso', emoji: '🖼️', description: 'A true artist at Level 25', price: 0, levelRequired: 25 },
    { id: 'level_50', name: 'Masterpiece Maker', emoji: '🎨', description: 'Creating masterpieces at Level 50', price: 0, levelRequired: 50 },
    { id: 'level_100', name: 'Legendary Illustrator', emoji: '👑', description: 'The ultimate artist at Level 100', price: 0, levelRequired: 100 }
];

// Purchasable powerups (consumable items)
export const POWERUPS = [
    { id: 'extra_time', name: 'Extra Time', emoji: '⏰', description: '+10 seconds drawing time', price: 50, consumable: true },
    { id: 'double_vote', name: 'Double Vote', emoji: '✌️', description: 'Your vote counts twice', price: 75, consumable: true },
    { id: 'shield', name: 'Anti-Sabotage', emoji: '🛡️', description: 'Block sabotage effects', price: 100, consumable: true },
    { id: 'reveal', name: 'Reveal Saboteur', emoji: '👁️', description: 'See who the saboteur is', price: 125, consumable: true },
    { id: 'steal', name: 'Vote Steal', emoji: '🎭', description: 'Steal 1 vote from leader', price: 150, consumable: true }
];

// Purchasable fonts (permanent unlocks)
export const FONTS = [
    { id: 'default', name: 'Inter', fontFamily: "'Inter', sans-serif", description: 'Clean & modern', price: 0 },
    { id: 'comic', name: 'Comic Neue', fontFamily: "'Comic Neue', cursive", description: 'Fun & playful', price: 100 },
    { id: 'pixel', name: 'Press Start 2P', fontFamily: "'Press Start 2P', cursive", description: 'Retro gaming vibes', price: 250 },
    { id: 'mono', name: 'JetBrains Mono', fontFamily: "'JetBrains Mono', monospace", description: 'Developer favorite', price: 150 },
    { id: 'handwritten', name: 'Caveat', fontFamily: "'Caveat', cursive", description: 'Handwritten style', price: 150 },
    { id: 'retro', name: 'VT323', fontFamily: "'VT323', monospace", description: 'Terminal nostalgia', price: 200 }
];

// Avatar Frames (New) - CSS classes or style IDs
export const FRAMES = [
    { id: 'none', name: 'None', preview: '⬜', description: 'No frame', price: 0 },
    { id: 'gold_glow', name: 'Golden Glow', preview: '✨', description: 'Radiate energy', price: 500, className: 'shadow-[0_0_15px_gold] border-yellow-400 border-2' },
    { id: 'neon_pink', name: 'Neon Pink', preview: '💖', description: 'Cyberpunk vibes', price: 400, className: 'shadow-[0_0_10px_#ff00ff] border-[#ff00ff] border-2' },
    { id: 'rainbow', name: 'Rainbow', preview: '🌈', description: 'Multicolor border', price: 600, className: 'bg-gradient-to-r from-red-500 via-green-500 to-blue-500 p-1 rounded-full' }, // Requires wrapper logic
    { id: 'wood', name: 'Wooden', preview: '🪵', description: 'Classic feel', price: 200, className: 'border-amber-800 border-4' }
];

// Avatar Background Themes (New) - CSS gradients
export const THEMES = [
    { id: 'default', name: 'Dark', preview: '⚫', description: 'Classic Dark', price: 0, value: '#1a1a1a' },
    { id: 'sunset', name: 'Sunset', preview: '🌅', description: 'Warm vibes', price: 300, value: 'linear-gradient(to bottom right, #ff512f, #dd2476)' },
    { id: 'ocean', name: 'Ocean', preview: '🌊', description: 'Cool breeze', price: 300, value: 'linear-gradient(to bottom right, #2193b0, #6dd5ed)' },
    { id: 'forest', name: 'Forest', preview: '🌲', description: 'Nature', price: 300, value: 'linear-gradient(to bottom right, #11998e, #38ef7d)' },
    { id: 'galaxy', name: 'Galaxy', preview: '🌌', description: 'Far out', price: 500, value: 'linear-gradient(to bottom right, #654ea3, #eaafc8)' }
];
