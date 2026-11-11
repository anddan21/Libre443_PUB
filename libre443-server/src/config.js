const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
    let raw;
    try {
        raw = fs.readFileSync(filePath, 'utf8');
    } catch {
        return;
    }
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (!match) continue;
        let value = match[2] ?? '';
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        } else {
            const comment = value.indexOf('#');
            if (comment >= 0) value = value.slice(0, comment);
            value = value.trim();
        }
        if (process.env[match[1]] === undefined) process.env[match[1]] = value;
    }
}

function loadUsers() {
    const raw = process.env.LIBRE443_USERS || '';
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        console.error('LIBRE443_USERS is not valid JSON');
        return [];
    }
}

loadEnv(path.join(__dirname, '..', '.env'));

module.exports = {
    PORT: process.env.PORT || 3000,
    users: loadUsers(),
    turn: {
        urls: process.env.TURN_URLS || '',
        username: process.env.TURN_USERNAME || '',
        credential: process.env.TURN_CREDENTIAL || '',
    },
};
