
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
        image: '/card-back-papyrus.jpg',
        name: 'Skin Papyrus',
        description: 'Pour jouer comme en 1999 av. J-C. Attention, fragile.',
        rarity: 'uncommon'
    },
    4: { type: 'emoji', content: '🎓', name: 'Savant Fou', description: 'E=mc² ? Non, Skyjo = -2. C\'est ça la vraie science.', rarity: 'common' },
    5: {
        type: 'skin',
        image: '/card-back-neon.png',
        name: 'Skin Neon',
        description: 'Tellement brillant que vous aurez besoin de lunettes de soleil.',
        rarity: 'rare'
    },
    6: {
        type: 'skin',
        image: '/card-back-cyberpunk.png',
        name: 'Skin Cyberpunk',
        description: 'Venu du futur pour optimiser vos scores. Haute technologie.',
        rarity: 'rare'
    },
    7: { type: 'emoji', content: '🎭', name: 'Double Jeu', description: 'Idéal pour bluffer... même contre une IA.', rarity: 'common' },
    8: {
        type: 'skin',
        image: '/card-back-carbon.png',
        name: 'Skin Carbon',
        description: 'Tactique, robuste et léger. Conçu pour la compétition pure.',
        rarity: 'epic'
    },
    9: { type: 'generic', content: '🎰', name: 'Lucky Seven', description: 'Le chiffre porte-bonheur. Enfin, sauf si vous piochez un 12.', rarity: 'uncommon' },
    10: { type: 'emoji', content: '🚀', name: 'Vers la Lune', description: 'Votre score décolle... on espère que c\'est vers le bas !', rarity: 'rare' },
    11: { type: 'generic', content: '🦈', name: 'Card Shark', description: 'Vous ne jouez plus, vous chassez. *Musique des Dents de la Mer*', rarity: 'rare' },
    12: {
        type: 'skin',
        image: '/card-back-obsidian.png',
        name: 'Skin Obsidian',
        description: 'Sorti tout droit du volcan. Brûlant de puissance.',
        rarity: 'epic'
    },
    13: {
        type: 'skin',
        image: '/card-back-gold.png',
        name: 'Skin Gold',
        description: 'Si brillant que vos adversaires seront éblouis (littéralement).',
        rarity: 'epic'
    },
    14: { type: 'emoji', content: '👑', name: 'Roi du Skyjo', description: 'Inclinez-vous, mortels. Le patron est dans la place.', rarity: 'epic' },
    15: { type: 'generic', content: '🧙‍♂️', name: 'Grand Master', description: 'Vous voyez les chiffres en vert comme dans Matrix.', rarity: 'epic' },
    16: { type: 'emoji', content: '💎', name: 'Précieux', description: 'Mon préééciiiieux... Ne le jetez pas dans la lave.', rarity: 'legendary' },
    17: { type: 'generic', content: '🏆', name: 'Légende', description: 'On racontera vos exploits aux générations futures.', rarity: 'legendary' },
    18: {
        type: 'skin',
        image: '/card-back-galaxy.png',
        name: 'Skin Galaxy',
        description: 'L\'univers entier dans votre main. Ne le faites pas tomber.',
        rarity: 'legendary'
    },
    19: {
        type: 'generic',
        content: '🥇',
        name: 'Trophée de Légende',
        description: 'L\'ultime récompense du maître absolu du Skyjo.',
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
