
import { calculateFinalScores } from './src/lib/skyjoEngine.js';

const mockGameState = {
    players: [
        {
            id: 'player-1',
            name: 'P1',
            hand: [
                { value: 5, isRevealed: true },
                { value: 10, isRevealed: true },
                { value: -2, isRevealed: true },
                null, null, null, null, null, null, null, null, null // mostly null for simplicity
            ].map(c => c ? { ...c } : { value: 0, isRevealed: true }) // fill with 0s
        },
        {
            id: 'player-2',
            name: 'P2',
            hand: [
                { value: 10, isRevealed: true },
                { value: 10, isRevealed: true },
                { value: 10, isRevealed: true },
                null, null, null, null, null, null, null, null, null
            ].map(c => c ? { ...c } : { value: 5, isRevealed: true })
        }
    ],
    finishingPlayerIndex: 0
};

const scores = calculateFinalScores(mockGameState);
console.log('Scores:', JSON.stringify(scores, null, 2));

const totalScores = {};
scores.forEach(score => {
    totalScores[score.playerId] = (totalScores[score.playerId] || 0) + score.finalScore;
});
console.log('Total Scores:', JSON.stringify(totalScores, null, 2));

const archiveData = mockGameState.players.map(p => ({
    id: p.id,
    finalScore: totalScores[p.id] || 0
}));

console.log('Archive Data:', JSON.stringify(archiveData, null, 2));
