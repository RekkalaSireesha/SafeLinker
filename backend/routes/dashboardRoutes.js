
const express = require('express');
const db = require('../database');
const verifyToken = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
    try {
        const [stats] = await db.query(
            `SELECT
                COUNT(*) AS totalScans,
                COALESCE(SUM(risk_level = 'High Risk'), 0) AS highRisk,
                COALESCE(SUM(risk_level = 'Medium Risk'), 0) AS mediumRisk,
                COALESCE(SUM(risk_level = 'Low Risk'), 0) AS lowRisk
             FROM scans
             WHERE user_id = ?`,
            [req.user.id]
        );

        const [recentScans] = await db.query(
            `SELECT id, url, risk_level AS riskLevel, score,
                    created_at AS createdAt
             FROM scans
             WHERE user_id = ?
             ORDER BY created_at DESC, id DESC
             LIMIT 10`,
            [req.user.id]
        );

        const [daily] = await db.query(
            `SELECT DATE(created_at) AS day, COUNT(*) AS total,
                    SUM(risk_level = 'High Risk') AS highRisk
             FROM scans
             WHERE user_id = ?
               AND created_at >= CURRENT_DATE - INTERVAL 6 DAY
             GROUP BY DATE(created_at)
             ORDER BY day`,
            [req.user.id]
        );

        const [quiz] = await db.query(
            `SELECT COUNT(*) AS attempts,
                    COALESCE(MAX(score), 0) AS bestScore,
                    COALESCE(MAX(total_questions), 0) AS questionCount
             FROM quiz_attempts WHERE user_id = ?`,
            [req.user.id]
        );

        res.json({
            username: req.user.username,
            stats: stats[0],
            recentScans,
            daily,
            quiz: quiz[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Unable to load dashboard.'
        });
    }
});

module.exports = router;
