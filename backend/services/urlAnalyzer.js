
const net = require('node:net');

const SHORTENERS = new Set([
    'bit.ly',
    'tinyurl.com',
    't.co',
    'is.gd',
    'ow.ly',
    'cutt.ly'
]);

const SUSPICIOUS_KEYWORDS = [
    'login',
    'verify',
    'verification',
    'password',
    'signin',
    'banking',
    'account',
    'wallet',
    'confirm',
    'payment',
    'suspended',
    'urgent'
];

function analyzeUrl(value) {
    const reasons = [];
    let score = 0;

    let parsed;

    try {
        parsed = new URL(value);
    } catch {
        return {
            score: 100,
            riskLevel: 'High Risk',
            reasons: ['The URL is not valid.']
        };
    }

    const hostname = parsed.hostname.toLowerCase();
    const fullUrl = value.toLowerCase();

    function flag(points, message) {
        score += points;
        reasons.push(message);
    }

    if (net.isIP(hostname)) {
        flag(35, 'The hostname is an IP address rather than a normal domain.');
    }

    if (parsed.protocol !== 'https:') {
        flag(10, 'The URL does not use HTTPS.');
    }

    if (value.length > 100) {
        flag(10, 'The URL is unusually long.');
    }

    if (hostname.startsWith('xn--') ||
        hostname.split('.').some(part => part.startsWith('xn--'))) {
        flag(25, 'The domain contains an internationalized hostname that should be checked carefully.');
    }

    if (hostname.split('.').length >= 5) {
        flag(15, 'The domain has an unusually deep subdomain structure.');
    }

    if (SHORTENERS.has(hostname)) {
        flag(20, 'The URL uses a known link-shortening service.');
    }

    if (parsed.port && !['80', '443'].includes(parsed.port)) {
        flag(10, 'The URL uses a non-standard port.');
    }

    if (parsed.hostname.includes('-') &&
        /\d/.test(parsed.hostname)) {
        flag(10, 'The hostname combines hyphens and digits.');
    }

    const foundKeywords = SUSPICIOUS_KEYWORDS.filter(keyword =>
        fullUrl.includes(keyword)
    );

    if (foundKeywords.length > 0) {
        flag(
            15,
            `Contains sensitive keywords: ${foundKeywords.join(', ')}.`
        );
    }

    if (parsed.username || parsed.password) {
        flag(40, 'The URL contains user-information fields.');
    }

    score = Math.min(100, score);

    let riskLevel = 'Low Risk';

    if (score >= 60) {
        riskLevel = 'High Risk';
    } else if (score >= 30) {
        riskLevel = 'Medium Risk';
    }

    if (reasons.length === 0) {
        reasons.push('No suspicious patterns were detected by these checks.');
    }

    return { score, riskLevel, reasons };
}

module.exports = { analyzeUrl };
