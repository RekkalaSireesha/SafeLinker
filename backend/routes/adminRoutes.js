
const express = require('express');
const db = require('../database');
const verifyToken = require('../middleware/auth');
const verifyAdmin = require('../middleware/admin');

const router = express.Router();

router.use(verifyToken, verifyAdmin);

router.get('/stats', async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT COUNT(*) AS totalUsers FROM users'
        );

        const [scans] = await db.query(
            `SELECT COUNT(*) AS totalScans,
                    SUM(risk_level = 'High Risk') AS highRisk,
                    SUM(risk_level = 'Medium Risk') AS mediumRisk,
                    SUM(risk_level = 'Low Risk') AS lowRisk
             FROM scans`
        );

        const [recent] = await db.query(
            `SELECT s.id, s.url, s.risk_level AS riskLevel,
                    s.score, s.created_at AS createdAt, u.username
             FROM scans s
             JOIN users u ON u.id = s.user_id
             ORDER BY s.created_at DESC, s.id DESC
             LIMIT 20`
        );

        res.json({
            totalUsers: users[0].totalUsers,
            ...scans[0],
            recent
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to load admin statistics.' });
    }
});

router.get('/users', async (req, res) => {
    try {
        const [users] = await db.query(
            `SELECT u.id, u.username, u.role, u.created_at AS createdAt,
                    COUNT(s.id) AS totalScans
             FROM users u
             LEFT JOIN scans s ON s.user_id = u.id
             GROUP BY u.id, u.username, u.role, u.created_at
             ORDER BY u.created_at DESC`
        );

        res.json({ users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to load users.' });
    }
});

module.exports = router;
