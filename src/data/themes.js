export const THEMES = {
    'CYBERPUNK': {
        id: 'CYBERPUNK',
        label: 'Néon City',
        colors: {
            primary: '#00f2ff', // Cyan
            secondary: '#9d00ff', // Purple
            accent: '#f59e0b', // Amber
            background: 'rgba(15, 23, 42, 0.2)', // Slate 900 fade
            text: '#ffffff',
            paddle: '#00f2ff',
            ball: '#ffffff',
            brickBase: '#00f2ff',
            brickAi: '#9d00ff',
            shield: '#00f2ff',
            uiGradient: 'from-cyan-400 via-blue-500 to-purple-600'
        },
        effects: {
            particles: 'neon', // Standard squares
            background: 'pulse', // Bass pulse
            font: 'sans-serif'
        },
        soundProfile: 'electronic'
    },
    'ZEN_GARDEN': {
        id: 'ZEN_GARDEN',
        label: 'Jardin Zen',
        colors: {
            primary: '#10b981', // Emerald
            secondary: '#0ea5e9', // Sky
            accent: '#f472b6', // Pink
            background: '#064e3b', // Deep Green (Opaque)
            text: '#ecfdf5',
            paddle: '#10b981',
            ball: '#f0fdf4',
            brickBase: '#10b981',
            brickAi: '#0ea5e9',
            shield: '#34d399',
            uiGradient: 'from-emerald-400 via-teal-500 to-cyan-600'
        },
        effects: {
            particles: 'circle', // Soft circles/petals
            background: 'wave', // Gentle waves
            font: 'serif'
        },
        soundProfile: 'ambient'
    },
    'RETRO_ARCADE': {
        id: 'RETRO_ARCADE',
        label: '8-Bit Rétro',
        colors: {
            primary: '#ef4444', // Red
            secondary: '#3b82f6', // Blue
            accent: '#eab308', // Yellow
            background: 'rgba(0, 0, 0, 0.3)', // Pitch black
            text: '#fbbf24',
            paddle: '#ef4444',
            ball: '#ffffff',
            brickBase: '#ef4444',
            brickAi: '#3b82f6',
            shield: '#ef4444',
            uiGradient: 'from-red-500 via-orange-500 to-yellow-500'
        },
        effects: {
            particles: 'pixel', // Big chunky pixels
            background: 'grid', // Retro Grid
            font: 'monospace'
        },
        soundProfile: 'chiptune'
    }
};
