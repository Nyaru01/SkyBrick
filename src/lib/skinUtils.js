/**
 * Utility to map card skin IDs to their image paths
 * @param {string} skinId - The ID of the skin (e.g., 'classic', 'papyrus', 'cyberpunk')
 * @returns {string} The path to the skin image
 */
export const getCardSkinPath = (skinId) => {
    switch (skinId) {
        case 'papyrus':
            return '/card-back-papyrus.jpg';
        case 'neon':
            return '/card-back-neon.png';
        case 'cyberpunk':
            return '/card-back-cyberpunk.png';
        case 'carbon':
            return '/card-back-carbon.png';
        case 'obsidian':
            return '/card-back-obsidian.png';
        case 'gold':
            return '/card-back-gold.png';
        case 'galaxy':
            return '/card-back-galaxy.png';
        case 'classic':
        default:
            return '/card-back.png?v=2';
    }
};
