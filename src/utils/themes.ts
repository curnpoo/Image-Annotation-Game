// CARD_THEMES removed


export const getThemeVariables = (themeId: string = 'default') => {
    switch (themeId) {
        case 'dark':
            return {
                '--theme-bg': '#0f172a',
                '--theme-bg-secondary': '#1e293b',
                '--theme-text': '#f8fafc',
                '--theme-text-secondary': '#94a3b8',
                '--theme-accent': '#e94560',
                '--theme-border': '#334155',
                '--theme-button-bg': '#e94560',
                '--theme-button-text': '#ffffff',
                '--theme-card-bg': 'rgba(30, 41, 59, 0.95)',
                '--theme-font': "'Inter', sans-serif",
                '--theme-radius': '0.75rem',
            };
        case 'cardboard':
            return {
                '--theme-bg': '#d2b48c',
                '--theme-bg-secondary': '#e6ccb2',
                '--theme-text': '#5d4037',
                '--theme-text-secondary': '#8d6e63',
                '--theme-accent': '#8b4513',
                '--theme-border': '#8b4513',
                '--theme-button-bg': '#8b4513',
                '--theme-button-text': '#d2b48c',
                '--theme-card-bg': '#faeedd',
                '--theme-font': "'Chalkboard SE', 'Comic Sans MS', sans-serif",
                '--theme-radius': '255px 15px 225px 15px/15px 225px 15px 255px', // Organic/Rough
            };
        case 'neon':
            return {
                '--theme-bg': '#000000',
                '--theme-bg-secondary': '#0a0a0a',
                '--theme-text': '#00ff00',
                '--theme-text-secondary': '#00cc00',
                '--theme-accent': '#00ff00',
                '--theme-border': '#00ff00',
                '--theme-button-bg': '#000000',
                '--theme-button-text': '#00ff00',
                '--theme-card-bg': 'rgba(0, 0, 0, 0.9)',
                '--theme-font': "'Courier New', monospace",
                '--theme-radius': '0px', // Sharp
            };
        case 'retro':
            return {
                '--theme-bg': '#E0E7FF', // Light Indigo
                '--theme-bg-secondary': '#C7D2FE',
                '--theme-text': '#4338ca', // Indigo 700
                '--theme-text-secondary': '#6366f1',
                '--theme-accent': '#4f46e5',
                '--theme-border': '#312e81',
                '--theme-button-bg': '#4f46e5',
                '--theme-button-text': '#ffffff',
                '--theme-card-bg': '#ffffff',
                '--theme-font': "'Courier New', monospace",
                '--theme-radius': '0px',
            };
        case 'default':
        default:
            return {
                '--theme-bg': 'linear-gradient(135deg, #0f766e 0%, #0c4a6e 100%)', // Darker Teal to Navy fade
                '--theme-bg-secondary': '#f0fdf4',
                '--theme-text': '#f0f9ff', // Light text for dark bg
                '--theme-text-secondary': '#bae6fd',
                '--theme-accent': '#2dd4bf', // Teal accent
                '--theme-border': 'rgba(45, 212, 191, 0.3)',
                '--theme-button-bg': 'linear-gradient(to right, #14b8a6, #0ea5e9)',
                '--theme-button-text': '#ffffff',
                '--theme-card-bg': 'rgba(255, 255, 255, 0.8)', // More transparent
                '--theme-font': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                '--theme-radius': '1.5rem',
            };
    }
};

// Deprecated: kept for backward compatibility if needed, but should point to variables
export const getThemeStyles = (_themeId: string = 'default') => {
    return {}; // Handled via CSS variables now
};


export const getThemeContainerStyle = (themeId: string = 'default') => {
    // Returns styles for the container (gradient borders etc)
    // This simplifies the logic by returning a complete style object
    const styles = getThemeStyles(themeId);

    // Default fallback for layout
    return {
        padding: '1.25rem', // p-5
        borderRadius: 'var(--theme-radius)', // Dynamic Radius
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // shadow-xl
        backgroundColor: 'var(--card-bg)',
        border: '4px solid var(--theme-border)',
        color: 'var(--theme-text)',
        ...styles
    };
};

export const getThemeClass = (themeId: string = 'default'): string => {
    switch (themeId) {
        case 'dark':
            return 'theme-bg-dark';
        case 'cardboard':
            return 'theme-bg-cardboard';
        case 'neon':
            return 'theme-bg-neon';
        case 'gold':
            return 'theme-bg-gold';
        case 'galaxy':
            return 'theme-bg-galaxy';
        default:
            return 'theme-bg-default';
    }
};
