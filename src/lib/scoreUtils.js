export const calculateRoundScore = (rawScore, isFinisher, isStrictlyLowest) => {
    if (!isFinisher) return rawScore;

    // If finisher did NOT get strictly lowest score, double points if positive.
    if (!isStrictlyLowest) {
        return rawScore > 0 ? rawScore * 2 : rawScore;
    }

    return rawScore;
};

export const checkStrictlyLowest = (finisherId, roundScores) => {
    const finisherScore = roundScores[finisherId];
    if (finisherScore === undefined) return false;

    for (const [pid, score] of Object.entries(roundScores)) {
        if (pid === finisherId) continue;
        if (score <= finisherScore) {
            return false; // Someone else has lower or equal score
        }
    }
    return true;
};
