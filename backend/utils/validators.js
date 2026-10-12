
function validateUsername(username) {
    return typeof username === 'string' &&
        /^[a-zA-Z0-9_]{3,50}$/.test(username);
}

function validatePassword(password) {
    return typeof password === 'string' &&
        password.length >= 8 &&
        password.length <= 72;
}

function validateUrl(value) {
    if (typeof value !== 'string' || value.length > 2083) {
        return false;
    }

    try {
        const url = new URL(value);

        if (!['http:', 'https:'].includes(url.protocol)) {
            return false;
        }

        if (!url.hostname.includes('.')) {
            return false;
        }

        if (url.username || url.password) {
            return false;
        }

        return true;
    } catch {
        return false;
    }
}

module.exports = {
    validateUsername,
    validatePassword,
    validateUrl
};
