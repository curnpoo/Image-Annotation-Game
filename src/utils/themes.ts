import { THEMES } from '../constants/cosmetics';

// Map of Theme ID -> Accent Color
const THEME_ACCENTS: Record<string, string> = {
    // Basics
    'default': '#FFB74D',
    'light': '#F59E0B',
    'midnight': '#60A5FA',
    'forest_dark': '#4ADE80',
    'coffee': '#D7CCC8',
    'slate': '#94A3B8',

    // Gradients
    'twilight': '#C084FC',
    'sunrise': '#FB923C',
    'ocean': '#38BDF8',
    'mint': '#86EFAC',
    'lavender': '#D8B4FE',
    'sunset': '#FB7185',
    'neon_city': '#00E5FF',
    'northern_lights': '#67E8F9',
    'galaxy': '#E879F9',
    'fire': '#EF4444',

    // Bold/Weird
    'mustard': '#EAB308',
    'clown': '#F87171',
    'hacker': '#22C55E',
    'barbie': '#F472B6',
    'rainbow_road': '#A855F7',
    'gold': '#FCD34D',
    'void': '#737373',
};

const isLightTheme = (themeId: string): boolean => {
    const theme = THEMES.find(t => t.id === themeId);
    if (themeId === 'premium-light' || themeId === 'light') return true;
    if (!theme) return false;
    
    const value = theme.value.toLowerCase();
    const lightThemes = ['light', 'sunrise', 'lavender', 'mustard', 'barbie', 'gold', 'mint', 'premium-light'];
    if (lightThemes.includes(themeId)) return true;
    
    if (!value.includes('gradient') && !value.includes('conic')) {
        if (value === '#f5f5f5' || value === '#ffffff' || value === '#ffd700') return true;
        if (value.startsWith('#') && value.length === 7) {
            const r = parseInt(value.slice(1, 3), 16);
            const g = parseInt(value.slice(3, 5), 16);
            const b = parseInt(value.slice(5, 7), 16);
            const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
            return luminance > 160;
        }
    }
    
    if (value.includes('#fcd34d') || value.includes('#fdba74') || value.includes('#e9d5ff') || 
        value.includes('#c084fc') || value.includes('#86efac') || value.includes('#ffd700')) {
        return true;
    }
    
    return false;
};

export const getThemeVariables = (themeId: string = 'default') => {
    const isLight = isLightTheme(themeId);
    const themeData = THEMES.find(t => t.id === themeId);
    const accent = THEME_ACCENTS[themeId] || '#FFB74D';
    
    const baseVariables = {
        '--theme-text': isLight ? '#1a1a1a' : '#F5F5F5',
        '--theme-text-secondary': isLight ? '#4a4a4a' : '#A3A3A3',
        '--theme-card-text': isLight ? '#1a1a1a' : '#F5F5F5',
        '--theme-accent': accent,
        '--theme-border': accent,
        '--theme-button-bg': accent,
        '--theme-button-text': isLight ? '#000000' : '#FFFFFF',
        '--theme-font': "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        '--theme-radius': '1.2rem',
        '--theme-glass-bg': isLight ? 'rgba(255, 255, 255, 0.4)' : 'rgba(30, 30, 50, 0.4)',
        '--theme-glass-border': isLight ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        '--theme-highlight': isLight ? '#FFE0B2' : '#444444',
        '--theme-bg': themeData?.value || 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
        '--theme-card-bg': isLight ? 'rgba(255, 255, 255, 0.6)' : 'rgba(30, 30, 30, 0.8)',
        '--card-border': `2px solid ${accent}`,
        '--theme-bg-secondary': isLight ? '#E0F2F1' : '#1a1a1a',
    };

    switch (themeId) {
        case 'light':
        case 'premium-light':
            return { ...baseVariables, '--theme-bg': 'linear-gradient(135deg, #FFF5EB 0%, #FFD1B3 100%)', '--theme-text': '#000000', '--theme-text-secondary': '#4A3B32', '--theme-border': '#E0F2F1', '--theme-accent': '#FFB74D', '--card-border': '1px solid rgba(0,0,0,0.1)' };
        case 'dark':
        case 'premium-dark':
            return { ...baseVariables, '--theme-bg': 'linear-gradient(135deg, #1F1F1F 0%, #2D2D2D 100%)', '--theme-text': '#FFF8E1', '--theme-text-secondary': '#D7CCC8', '--theme-border': '#FFB74D', '--card-border': '2px solid #FFB74D' };
        case 'default':
            return { ...baseVariables, '--theme-bg': 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)', '--card-border': '1px solid #333333' };
        default:
            return baseVariables;
    }
};

export const getThemeStyles = (_themeId: string = 'default') => ({});

export const getThemeContainerStyle = (themeId: string = 'default') => ({
    padding: '1.25rem',
    borderRadius: 'var(--theme-radius)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    backgroundColor: 'var(--card-bg)',
    border: '4px solid var(--theme-border)',
    color: 'var(--theme-text)',
    ...getThemeStyles(themeId)
});

export const getThemeClass = (themeId: string = 'default'): string => {
    switch (themeId) {
        case 'dark': return 'theme-bg-dark';
        case 'cardboard': return 'theme-bg-cardboard';
        case 'neon': return 'theme-bg-neon';
        case 'gold': return 'theme-bg-gold';
        case 'galaxy': return 'theme-bg-galaxy';
        case 'premium-light': return 'theme-bg-premium-light';
        case 'premium-dark': return 'theme-bg-premium-dark';
        default: return 'theme-bg-default';
    }
};
