import rateLimit from 'express-rate-limit';

export const feedbackLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Max 5 feedbacks per IP per window
    message: { error: 'Too many feedbacks. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
