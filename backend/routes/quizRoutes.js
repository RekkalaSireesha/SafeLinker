
const express = require('express');
const db = require('../database');
const verifyToken = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

const questions = [
    {
        question: 'An email unexpectedly asks for your bank password. What should you do?',
        options: [
            'Click its link',
            'Verify through the official bank website or app',
            'Reply with your password'
        ],
        answer: 1,
        explanation: 'Use an official channel instead of an unexpected link.'
    },
    {
        question: 'A website has HTTPS. Does that guarantee it is legitimate?',
        options: [
            'Yes, always',
            'No, phishing websites can also use HTTPS',
            'Only on mobile phones'
        ],
        answer: 1,
        explanation: 'HTTPS encrypts the connection but does not prove the website is trustworthy.'
    },
    {
        question: 'A stranger offers a prize and demands an urgent payment.',
        options: [
            'Pay immediately',
            'Share bank details',
            'Treat it as suspicious and verify independently'
        ],
        answer: 2,
        explanation: 'Unexpected prizes and pressure to pay are common scam warning signs.'
    },
    {
        question: 'How should you handle an unexpected shortened URL?',
        options: [
            'Open it without checking',
            'Verify the sender and destination safely first',
            'Enter your credentials'
        ],
        answer: 1,
        explanation: 'Shortened URLs hide the final destination.'
    },
    {
        question: 'What should you do with a suspicious message?',
        options: [
            'Forward it to everyone',
            'Report it through a trusted channel',
            'Send your password to confirm your identity'
        ],
        answer: 1,
        explanation: 'Report suspicious messages and avoid interacting with their links.'
    }
];

router.get('/', (req, res) => {
    res.json(questions.map((q, id) => ({
        id,
        question: q.question,
        options: q.options
    })));
});

router.post('/submit', async (req, res) => {
    const answers = req.body?.answers;

    if (!Array.isArray(answers) ||
        answers.length !== questions.length ||
        answers.some(a => !Number.isInteger(a) || a < 0 || a > 2)) {
        return res.status(400).json({
            error: 'Submit an answer for every question.'
        });
    }

    const results = questions.map((q, i) => ({
        correct: answers[i] === q.answer,
        explanation: q.explanation
    }));

    const score = results.filter(r => r.correct).length;

    try {
        await db.query(
            `INSERT INTO quiz_attempts
             (user_id, score, total_questions) VALUES (?, ?, ?)`,
            [req.user.id, score, questions.length]
        );

        res.json({
            score,
            totalQuestions: questions.length,
            results
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to save quiz results.' });
    }
});

module.exports = router;
