/**
 * SkyBrick AI Engine
 * Contains decision logic for AI players with 3 difficulty levels
 */

// Difficulty levels
export const AI_DIFFICULTY = {
    NORMAL: 'normal',
    HARD: 'hard',
    HARDCORE: 'hardcore',
};

// AI player names (without emoji - emoji is set separately)
export const AI_NAMES = ['IA Alpha', 'IA Beta', 'IA Gamma'];

/**
 * Get a random element from an array
 */
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Get random indices from an array
 */
const getRandomIndices = (count, max) => {
    const indices = [];
    while (indices.length < count) {
        const idx = Math.floor(Math.random() * max);
        if (!indices.includes(idx)) {
            indices.push(idx);
        }
    }
    return indices;
};

/**
 * Calculate the visible score of a hand (only revealed cards)
 */
const calculateVisibleScore = (hand) => {
    return hand.reduce((sum, card) => {
        if (card === null) return sum;
        if (!card.isRevealed) return sum;
        return sum + card.value;
    }, 0);
};

/**
 * Get indices of hidden cards in a hand
 */
const getHiddenCardIndices = (hand) => {
    return hand
        .map((card, idx) => (card && !card.isRevealed ? idx : -1))
        .filter(idx => idx !== -1);
};

/**
 * Get indices of revealed cards in a hand
 */
const getRevealedCardIndices = (hand) => {
    return hand
        .map((card, idx) => (card && card.isRevealed ? idx : -1))
        .filter(idx => idx !== -1);
};

/**
 * Find the highest value revealed card in a hand
 */
const findHighestRevealedCard = (hand) => {
    let maxValue = -Infinity;
    let maxIndex = -1;

    hand.forEach((card, idx) => {
        if (card && card.isRevealed && card.value > maxValue) {
            maxValue = card.value;
            maxIndex = idx;
        }
    });

    return { index: maxIndex, value: maxValue };
};

/**
 * Check if placing a card at an index could complete a column
 * IMPORTANT: We should NOT try to complete columns of low/negative values
 * because eliminating 3x "-2" loses us -6 points!
 * 
 * @param {Array} hand - Player's hand
 * @param {number} cardIndex - Index where card would be placed
 * @param {number} cardValue - Value of the card being placed
 * @param {boolean} forceCheck - If true, skip value threshold check (for finding positions only)
 * @returns {boolean} True if column completion is beneficial
 */
const checkColumnPotential = (hand, cardIndex, cardValue, forceCheck = false) => {
    // Cards are arranged in 4 columns of 3 rows
    // Column indices: [0,1,2], [3,4,5], [6,7,8], [9,10,11]
    const col = Math.floor(cardIndex / 3);
    const colStart = col * 3;
    const colIndices = [colStart, colStart + 1, colStart + 2];

    // CRITICAL FIX: Don't try to complete columns with low/negative values!
    // Eliminating 3x "-2" = losing -6 points (bad!)
    // Eliminating 3x "0" = losing 0 points but removing 3 cards (neutral, but wastes opportunity)
    // Eliminating 3x "1" or "2" = marginal benefit (only 3-6 points saved)
    // Only actively pursue column completion for cards with value > 2
    const MIN_VALUE_FOR_COLUMN_ELIMINATION = 3;

    if (!forceCheck && cardValue < MIN_VALUE_FOR_COLUMN_ELIMINATION) {
        return false; // Don't prioritize completing columns of low-value cards
    }

    let matchCount = 0;
    let hiddenCount = 0;

    colIndices.forEach(idx => {
        if (idx === cardIndex) return; // Skip the target position
        const card = hand[idx];
        if (card === null) return;
        if (!card.isRevealed) {
            hiddenCount++;
        } else if (card.value === cardValue) {
            matchCount++;
        }
    });

    // Return true if completing the column (2 matches) or high potential (1 match + 1 hidden)
    return matchCount === 2 || (matchCount === 1 && hiddenCount >= 1);
};

/**
 * Find the best replacement position for a card
 */
const findBestReplacementPosition = (hand, cardValue, difficulty) => {
    const revealedIndices = getRevealedCardIndices(hand);
    const hiddenIndices = getHiddenCardIndices(hand);

    // Check for column completion opportunities first
    for (const idx of [...revealedIndices, ...hiddenIndices]) {
        if (hand[idx] === null) continue;
        // CRITICAL FIX: Never replace a card with the same value (waste of turn)
        if (hand[idx].isRevealed && hand[idx].value === cardValue) continue;

        if (checkColumnPotential(hand, idx, cardValue)) {
            return idx;
        }
    }

    const highest = findHighestRevealedCard(hand);

    // EXCELLENT CARDS (<= 0)
    // Always replace highest revealed card if it's > cardValue, or reveal a hidden card
    if (cardValue <= 0) {
        // If we have a high revealed card (5+ for Hardcore/Hard), replace it
        if (highest.index !== -1 && highest.value >= 5) {
            return highest.index;
        }
        // Hardcore: Even if highest is low (e.g. 4), replacing with 0 is +4 diff, worth it
        if (difficulty === AI_DIFFICULTY.HARDCORE && highest.index !== -1 && highest.value > cardValue) {
            return highest.index;
        }

        // If no high cards revealed, still prefer replacing ANY revealed card that's worse
        if (highest.index !== -1 && cardValue < highest.value) {
            return highest.index;
        }
    }

    // GOOD CARDS (1-4)
    if (cardValue <= 4) {
        // Replace significantly worse card
        if (highest.index !== -1 && highest.value >= cardValue + 4) {
            return highest.index;
        }

        // Hard/Hardcore: Smart hidden card usage
        if (hiddenIndices.length > 0) {
            if (difficulty === AI_DIFFICULTY.HARD || difficulty === AI_DIFFICULTY.HARDCORE) {
                // Prefer corners and edges for better column building
                const cornerIndices = [0, 2, 9, 11].filter(i => hiddenIndices.includes(i));
                if (cornerIndices.length > 0) {
                    return getRandomElement(cornerIndices);
                }
            }
            return getRandomElement(hiddenIndices);
        }
    }

    // MEDIOCRE/BAD CARDS (> 4)
    // Only replace if we have something TERRIBLE revealed (like a 12)
    if (highest.index !== -1 && cardValue < highest.value && highest.value >= 10) {
        return highest.index;
    }

    return -1; // Don't replace
};

// ============================================
// MAIN AI DECISION FUNCTIONS
// ============================================

/**
 * Choose 2 initial cards to reveal
 * Strategy: Random for normal, prefer corners for hard/hardcore
 */
export const chooseInitialCardsToReveal = (hand, difficulty = AI_DIFFICULTY.NORMAL) => {
    // Normal: Random
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        return getRandomIndices(2, hand.length);
    }

    // Hard/Hardcore: prefer corner positions (better for column building visibility)
    const preferredPositions = [0, 2, 9, 11]; // Corners
    const shuffled = [...preferredPositions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
};

/**
 * Decide whether to draw from pile or discard
 */
export const decideDrawSource = (gameState, difficulty = AI_DIFFICULTY.NORMAL) => {
    const discardTop = gameState.discardPile[gameState.discardPile.length - 1];
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];

    if (!discardTop) {
        return 'DRAW_PILE';
    }

    const discardValue = discardTop.value;

    // Normal: Take discard if value <= 4
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        if (discardValue <= 4) {
            return 'DISCARD_PILE';
        }
        // Also take if it can complete a column
        const hand = currentPlayer.hand;
        for (let i = 0; i < hand.length; i++) {
            if (hand[i] && checkColumnPotential(hand, i, discardValue)) {
                if (hand[i].isRevealed && hand[i].value === discardValue) continue;
                return 'DISCARD_PILE';
            }
        }
        return 'DRAW_PILE';
    }

    // Hard / Hardcore: Sophisticated analysis
    if (difficulty === AI_DIFFICULTY.HARD || difficulty === AI_DIFFICULTY.HARDCORE) {
        // Always take negative cards
        if (discardValue <= 0) {
            return 'DISCARD_PILE';
        }

        // Hardcore: Aggressively take low cards (<= 4)
        const threshold = difficulty === AI_DIFFICULTY.HARDCORE ? 4 : 3;

        if (discardValue <= threshold) {
            const highest = findHighestRevealedCard(currentPlayer.hand);
            if (highest.value > discardValue + 2) { // Tighter threshold for swap
                return 'DISCARD_PILE';
            }
            // Check column potential
            for (let i = 0; i < currentPlayer.hand.length; i++) {
                if (currentPlayer.hand[i] && checkColumnPotential(currentPlayer.hand, i, discardValue)) {
                    return 'DISCARD_PILE';
                }
            }
        }

        // Check for column completion (Primary strat for Hardcore)
        for (let i = 0; i < currentPlayer.hand.length; i++) {
            if (currentPlayer.hand[i] && checkColumnPotential(currentPlayer.hand, i, discardValue)) {
                // Fix: Don't take from discard if we would just replace same value
                if (currentPlayer.hand[i].isRevealed && currentPlayer.hand[i].value === discardValue) continue;
                return 'DISCARD_PILE';
            }
        }

        return 'DRAW_PILE';
    }

    return 'DRAW_PILE';
};

/**
 * Decide what to do with a drawn card (replace or discard+reveal)
 * Returns: { action: 'REPLACE' | 'DISCARD_AND_REVEAL', cardIndex: number }
 */
export const decideCardAction = (gameState, difficulty = AI_DIFFICULTY.NORMAL) => {
    const drawnCard = gameState.drawnCard;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const hand = currentPlayer.hand;
    const drawnValue = drawnCard.value;

    // If came from discard, MUST replace
    if (gameState.turnPhase === 'MUST_REPLACE') {
        const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty);
        // If no good position found, just replace a random card (should rarely happen for AI)
        const finalIndex = replaceIndex !== -1 ? replaceIndex : getRandomElement(
            hand.map((c, i) => c !== null ? i : -1).filter(i => i !== -1)
        );
        return { action: 'REPLACE', cardIndex: finalIndex };
    }

    // Normal: Strategic decision
    if (difficulty === AI_DIFFICULTY.NORMAL) {
        const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty);
        if (drawnValue <= 3 && replaceIndex !== -1) {
            return { action: 'REPLACE', cardIndex: replaceIndex };
        }
        const highest = findHighestRevealedCard(hand);
        if (highest.index !== -1 && drawnValue < highest.value - 2) {
            return { action: 'REPLACE', cardIndex: highest.index };
        }
        // Default: discard and reveal
        const hiddenIndices = getHiddenCardIndices(hand);
        if (hiddenIndices.length > 0) {
            return { action: 'DISCARD_AND_REVEAL', cardIndex: getRandomElement(hiddenIndices) };
        }
    }

    // Hard / Hardcore
    const replaceIndex = findBestReplacementPosition(hand, drawnValue, difficulty);

    // 1. Column Completion (Highest Priority)
    // Check if this card completes a column
    // (Handled inside findBestReplacementPosition, but verified here)
    if (replaceIndex !== -1 && checkColumnPotential(hand, replaceIndex, drawnValue)) {
        return { action: 'REPLACE', cardIndex: replaceIndex };
    }

    // 2. Good Card Strategy
    // Hardcore: Always keep cards <= 4 if they improve the board
    const goodCardThreshold = difficulty === AI_DIFFICULTY.HARDCORE ? 4 : 3;
    if (drawnValue <= goodCardThreshold && replaceIndex !== -1) {
        return { action: 'REPLACE', cardIndex: replaceIndex };
    }

    // 3. High Card Replacement
    const highest = findHighestRevealedCard(hand);
    if (highest.index !== -1 && drawnValue < highest.value) {
        // Hardcore: Strict improvement
        return { action: 'REPLACE', cardIndex: highest.index };
    }

    // 4. Bad/Mediocre Card -> Discard & Reveal Strategy
    const hiddenIndices = getHiddenCardIndices(hand);
    if (hiddenIndices.length > 0) {
        // Hardcore/Hard: Target specific hidden cards to reveal

        let bestHiddenIdx = hiddenIndices[0];
        let bestScore = -Infinity;

        for (const idx of hiddenIndices) {
            const col = Math.floor(idx / 3);
            const colStart = col * 3;
            const colIndices = [colStart, colStart + 1, colStart + 2];

            // Score based on column potential
            let score = 0;
            const revealedVals = colIndices
                .filter(i => i !== idx && hand[i] && hand[i].isRevealed)
                .map(i => hand[i].value);

            // Hardcore Logic:
            // - If column has 2 identical revealed cards: +20 (Try for SkyBrick)
            // - If column has 1 revealed card: +5 (Start building)
            // - If column has 0 revealed cards: +1 (Explore)

            if (revealedVals.length === 2 && revealedVals[0] === revealedVals[1]) {
                score = 20;
            } else if (revealedVals.length === 1) {
                // Hardcore: Prefer columns where the revealed card is GOOD
                if (difficulty === AI_DIFFICULTY.HARDCORE && revealedVals[0] <= 4) {
                    score = 8;
                } else {
                    score = 5;
                }
            } else {
                score = 1;
            }

            // Hardcore: Avoid revealing the last card if score is high (risky)
            if (difficulty === AI_DIFFICULTY.HARDCORE && hiddenIndices.length === 1) {
                const totalScore = calculateVisibleScore(hand);
                if (totalScore > 50) {
                    // Start closing out game, just take random
                    score = 0;
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestHiddenIdx = idx;
            }
        }

        // Add some randomness only for Normal (not reached here technically due to if block above)
        // Hardcore is deterministic in its "best" choice
        return { action: 'DISCARD_AND_REVEAL', cardIndex: bestHiddenIdx };
    }

    // No hidden cards left, must replace (Last Resort)
    const validIndices = hand.map((c, i) => c !== null ? i : -1).filter(i => i !== -1);
    // Try to minimize damage
    let bestIdx = validIndices[0];
    let minDiff = Infinity; // We want minimum (new - old) which is negative or small positive
    // Actually we want to replace the card where (drawn - current) is minimized?
    // No, we want to replace the HIGHEST value card to minimize total score.

    // We already checked "highest" above. If we are here, drawnValue >= highest.value.
    // So we just replace the highest value card to minimize the GAIN.
    bestIdx = findHighestRevealedCard(hand).index;
    if (bestIdx === -1) bestIdx = validIndices[0];

    return { action: 'REPLACE', cardIndex: bestIdx };
};

/**
 * Execute a complete AI turn
 * Returns an array of actions to be executed with delays
 */
export const planAITurn = (gameState, difficulty = AI_DIFFICULTY.NORMAL) => {
    const actions = [];
    const phase = gameState.phase;
    const turnPhase = gameState.turnPhase;

    // Initial reveal phase
    if (phase === 'INITIAL_REVEAL') {
        const currentPlayer = gameState.players[gameState.currentPlayerIndex];
        const revealedCount = currentPlayer.hand.filter(c => c && c.isRevealed).length;

        if (revealedCount < 2) {
            const cardsToReveal = chooseInitialCardsToReveal(currentPlayer.hand, difficulty);
            actions.push({
                type: 'REVEAL_INITIAL',
                cardIndices: cardsToReveal,
            });
        }
        return actions;
    }

    // Playing/Final round phase
    if (phase === 'PLAYING' || phase === 'FINAL_ROUND') {
        if (turnPhase === 'DRAW') {
            // Step 1: Decide draw source
            const drawSource = decideDrawSource(gameState, difficulty);
            actions.push({
                type: 'DRAW',
                source: drawSource,
            });

            // We'll need to return here and let the store update
            // The next action will be decided after drawing
            return actions;
        }

        if (turnPhase === 'REPLACE_OR_DISCARD' || turnPhase === 'MUST_REPLACE') {
            // Step 2: Decide what to do with drawn card
            const decision = decideCardAction(gameState, difficulty);
            actions.push({
                type: decision.action,
                cardIndex: decision.cardIndex,
            });
            return actions;
        }
    }

    return actions;
};
