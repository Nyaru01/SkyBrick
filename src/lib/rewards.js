
export const LEVEL_REWARDS = {
    2: {
        type: 'emoji',
        content: '🍪',
        name: 'Cookie Pixel',
        description: '0 calorie, 100% virtuel. Mangez-le avec les yeux.',
        rarity: 'common'
    },
    3: {
        type: 'skin',
        image: '/skin-retro.png',
        name: 'Skin Rétro',
        description: 'Pour détruire les briques comme en 1999. Attention, c\'est pixelisé.',
        rarity: 'uncommon'
    },
    4: { type: 'emoji', content: '🎓', name: 'Savant Fou', description: 'E=mc² ? Non, Vitesse = Puissance. C\'est ça la vraie science.', rarity: 'common' },
    5: {
        type: 'skin',
        image: '/skin-neon.png',
        name: 'Skin Néon',
        description: 'Tellement brillant que vos briques auront besoin de lunettes de soleil.',
        rarity: 'rare'
    },
    6: {
        type: 'skin',
        image: '/skin-cyber.png',
        name: 'Skin Cyber',
        description: 'Venu du futur pour optimiser vos rebonds. Haute technologie.',
        rarity: 'rare'
    },
    7: { type: 'emoji', content: '⚡', name: 'Surcharge', description: 'Idéal pour le multitâche... même contre une IA.', rarity: 'common' },
    8: {
        type: 'skin',
        image: '/skin-carbon.png',
        name: 'Skin Carbone',
        description: 'Tactique, robuste et léger. Conçu pour la destruction pure.',
        rarity: 'epic'
    },
    9: { type: 'generic', content: '🎯', name: 'Précision Ultime', description: 'Le combo parfait. Enfin, sauf si vous ratez la balle.', rarity: 'uncommon' },
    10: { type: 'emoji', content: '🚀', name: 'Vers les Sommets', description: 'Votre score décolle... on espère que c\'est vers le haut !', rarity: 'rare' },
    11: { type: 'generic', content: '🧱', name: 'Brick Crusher', description: 'Vous ne jouez plus, vous pulvérisez. *Bruit de briques qui cassent*', rarity: 'rare' },
    12: {
        type: 'skin',
        image: '/skin-obsidian.png',
        name: 'Skin Obsidienne',
        description: 'Sorti tout droit du volcan. Brûlant de puissance.',
        rarity: 'epic'
    },
    13: {
        type: 'skin',
        image: '/skin-gold.png',
        name: 'Skin Or',
        description: 'Si brillant que les briques seront éblouies (littéralement).',
        rarity: 'epic'
    },
    14: { type: 'emoji', content: '👑', name: 'Maître du SkyBrick', description: 'Inclinez-vous, mortels. Le patron des briques est là.', rarity: 'epic' },
    15: { type: 'generic', content: '🧙‍♂️', name: 'Grand Maître', description: 'Vous voyez les mouvements comme dans Matrix.', rarity: 'epic' },
    16: { type: 'emoji', content: '💎', name: 'Précieux', description: 'Mon préééciiiieux... Ne le laissez pas tomber.', rarity: 'legendary' },
    17: { type: 'generic', content: '🏆', name: 'Légende du Casse-Brique', description: 'On racontera vos exploits aux briques futures.', rarity: 'legendary' },
    18: {
        type: 'skin',
        image: '/skin-galaxy.png',
        name: 'Skin Galaxie',
        description: 'L\'univers entier dans votre balle. Ne la perdez pas.',
        rarity: 'legendary'
    },
    19: {
        type: 'generic',
        content: '🥇',
        name: 'Trophée de Légende',
        description: 'L\'ultime récompense du maître absolu du SkyBrick.',
        rarity: 'mythic'
    },
};

/**
 * Helper to get rewards as an array for UI lists
 */
export const getRewardsList = () => {
    return Object.entries(LEVEL_REWARDS).map(([level, reward]) => ({
        level: parseInt(level),
        ...reward,
        // Map types to legacy icon format for ExperienceBar if needed
        icon: reward.type === 'emoji' ? reward.content :
            reward.type === 'skin' ? '🎨' :
                reward.type === 'generic' ? reward.content : '🎁'
    })).sort((a, b) => a.level - b.level);
};
