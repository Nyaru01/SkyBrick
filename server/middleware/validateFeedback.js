import { body, validationResult } from 'express-validator';

export const validateFeedback = [
    body('username')
        .trim()
        .notEmpty().withMessage('Username required')
        .isLength({ max: 50 }).withMessage('Username too long'),

    body('content')
        .trim()
        .notEmpty().withMessage('Content required')
        .isLength({ min: 10, max: 5000 }).withMessage('Content must be 10-5000 chars'),

    body('type')
        .optional()
        .isIn(['bug', 'suggestion', 'other']).withMessage('Invalid type'),

    body('device_info')
        .optional()
    // .isObject() removes "isObject" check if sending stringified JSON or handle parsing
    // If sending verified object from client, validation ok.
    ,

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
