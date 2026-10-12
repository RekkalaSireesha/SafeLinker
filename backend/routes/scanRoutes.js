
const express = require('express');
const db = require('../database');
const verifyToken = require('../middleware/auth');
const { analyzeUrl } = require('../services/urlAnalyzer');
const { checkThreatIntel } = require('../services/threatIntel');
const { validateUrl } = require('../utils/validators');

const router = express.Router();

router.use(verifyToken);

router.post('/', async (req, res) => {
    const { url } = req.body || {};

    if (!validateUrl(url)) {
        return res.status(400).json({
            error: 'Enter a valid HTTP or HTTPS URL without embedded credentials.'
        });
    }

    try {
        const analysis = analyzeUrl(url);
        const intelligence = await checkThreatIntel(url);

        if (intelligence.checked && intelligence.threats.length > 0) {
            analysis.score = 100;
            analysis.riskLevel = 'High Risk';
            analysis.reasons.push(
                'Threat intelligence identified a known threat.'
            );
        }

        const [result] = await db.query(
            `INSERT INTO scans
             (user_id, url, risk_level, score, reasons)
             VALUES (?, ?, ?, ?, ?)`,
            [
                req.user.id,
                url,
                analysis.riskLevel,
                analysis.score,
                JSON.stringify(analysis.reasons)
            ]
        );

        res.status(201).json({
            id: result.insertId,
            url,
            ...analysis,
            threatIntel: intelligence
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to scan this URL.' });
    }
});

router.get('/history', async (req, res) => {
    const search = String(req.query.search || '').slice(0, 200);
    const risk = String(req.query.risk || '');
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(
        1, parseInt(req.query.limit, 10) || 20
    ));
    const offset = (page - 1) * limit;

    const conditions = ['user_id = ?'];
    const params = [req.user.id];

    if (search) {
        conditions.push('url LIKE ?');
        params.push(`%${search}%`);
    }

    if (['Low Risk', 'Medium Risk', 'High Risk'].includes(risk)) {
        conditions.push('risk_level = ?');
        params.push(risk);
    }

    const where = conditions.join(' AND ');

    try {
        const [countRows] = await db.query(
            `SELECT COUNT(*) AS total FROM scans WHERE ${where}`,
            params
        );

        const [rows] = await db.query(
            `SELECT id, url, risk_level AS riskLevel, score,
                    reasons, created_at AS createdAt
             FROM scans
             WHERE ${where}
             ORDER BY created_at DESC, id DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        const history = rows.map(scan => {
            try {
                scan.reasons = JSON.parse(scan.reasons || '[]');
            } catch {
                scan.reasons = [];
            }
            return scan;
        });

        res.json({
            total: countRows[0].total,
            page,
            limit,
            history
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to load scan history.' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Invalid scan ID.' });
    }

    try {
        const [result] = await db.query(
            'DELETE FROM scans WHERE id = ? AND user_id = ?',
            [id, req.user.id]
        );

        if (!result.affectedRows) {
            return res.status(404).json({
                error: 'Scan not found in your history.'
            });
        }

        res.json({ message: 'Scan deleted successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Unable to delete scan.' });
    }
});

module.exports = router;
