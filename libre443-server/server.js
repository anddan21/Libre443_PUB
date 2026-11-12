const express = require('express');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const config = require('./src/config');
const setupSockets = require('./src/sockets');
const pkg = require('./package.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const usersData = { users: config.users };
if (!usersData.users.length) {
    console.error('No users configured. Set LIBRE443_USERS in .env');
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Protect chat: only with valid auth cookie
app.get('/chat.html', (req, res, next) => {
    const username = req.cookies && req.cookies.bf_auth;
    const valid = username && usersData.users.some(u => u.username === username);
    if (!valid) {
        return res.redirect('/');
    }
    next();
});

app.post('/login', (req, res) => {
    const { username, password } = req.body || {};
    const user = usersData.users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.redirect('/?error=1');
    }
    res.cookie('bf_auth', user.username, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.redirect('/chat.html');
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/version', (req, res) => {
    res.json({ version: pkg.version });
});

app.get('/api/ice', (req, res) => {
    const username = req.cookies && req.cookies.bf_auth;
    const valid = username && usersData.users.some(u => u.username === username);
    if (!valid) {
        return res.status(401).json({});
    }
    const { urls, username: turnUser, credential } = config.turn;
    if (!urls || !turnUser || !credential) {
        return res.status(503).json({ iceServers: [] });
    }
    res.json({
        iceServers: [{ urls, username: turnUser, credential }],
    });
});

app.get('/api/me', (req, res) => {
    const username = req.cookies && req.cookies.bf_auth;
    const valid = username && usersData.users.some(u => u.username === username);
    if (!valid) {
        return res.status(401).json({});
    }
    const user = usersData.users.find(u => u.username === username);
    res.json({ username, id: user ? user.id : null });
});

// Initialize WebRTC signaling and chat
setupSockets(io);

server.listen(config.PORT, () => {
    console.log(`Server started and listening on port ${config.PORT}`);
});
