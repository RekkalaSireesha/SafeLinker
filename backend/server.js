
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./database');

const authRoutes = require('./routes/authRoutes');
const scanRoutes = require('./routes/scanRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const quizRoutes = require('./routes/quizRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = Number(process.env.PORT || 5000);

if (!process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'REPLACE_WITH_A_LONG_RANDOM_SECRET') {
    throw new Error('Configure a strong JWT_SECRET in backend/.env');
}

app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_ORIGIN || true
}));
app.use(express.json({ limit: '20kb' }));

app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false
}));

app.use('/api/auth', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false
}), authRoutes);

app.use('/api/scans', scanRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch {
        res.status(503).json({
            status: 'error',
            database: 'disconnected'
        });
    }
});

app.use((req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Unexpected server error.' });
});

async function startServer() {
    await db.query('SELECT 1');

    app.listen(PORT, () => {
        console.log(`SafeLinker API running at http://localhost:${PORT}`);
    });
}

startServer().catch(error => {
    console.error('Failed to start SafeLinker:', error.message);
    process.exit(1);
});
