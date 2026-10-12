
const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Please log in to continue.'
        });
    }

    const token = header.slice(7);

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({
            error: 'Your session is invalid or expired. Please log in again.'
        });
    }
}

module.exports = verifyToken;
