
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const verifyToken = require('../middleware/auth');
const {
    validateUsername,
    validatePassword
} = require('../utils/validators');

const router = express.Router();

router.post('/signup', async (req, res) => {
    const { username, password } = req.body || {};

    if (!validateUsername(username) ||
        !validatePassword(password)) {
        return res.status(400).json({
            error: 'Username must be 3-50 letters, digits or underscores. Password must be 8-72 characters.'
        });
    }

    try {
        const hash = await bcrypt.hash(password, 12);

        await db.query(
            'INSERT INTO users (username, password) VALUES (?, ?)',
            [username, hash]
        );

        res.status(201).json({
            message: 'Account created. You can now log in.'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                error: 'That username is already taken.'
            });
        }

        console.error(error);
        res.status(500).json({ error: 'Unable to create account.' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body || {};

    if (typeof username !== 'string' ||
        typeof password !== 'string') {
        return res.status(400).json({
            error: 'Enter your username and password.'
        });
    }

    try {
        const [rows] = await db.query(
            'SELECT id, username, password, role FROM users WHERE username = ?',
            [username]
        );

        if (!rows.length ||
            !(await bcrypt.compare(password, rows[0].password))) {
            return res.status(401).json({
                error: 'Invalid username or password.'
            });
        }

        const user = rows[0];

        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
        );

        res.json({
            token,
            username: user.username,
            role: user.role
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed.' });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    res.json({
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
    });
});

module.exports = router;
