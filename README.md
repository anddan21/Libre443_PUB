# Libre443

Private web app for one to one text chat and video calls that runs entirely over standard HTTPS on port 443.

## What it does

- **Login page.** The site root is a public landing page with a login form. Users are defined in environment variables, not in the repository.
- **Video calls.** After login the user enters `/chat.html`. Camera and microphone are requested automatically, and when a second user joins the room a peer to peer WebRTC connection is established.
- **Text chat.** Real time messages over Socket.IO in the same room, plus system messages such as "X joined the room" and "X is already here".
- **NAT traversal.** ICE servers (TURN over TLS on port 443, e.g. Coturn) are served from `/api/ice` only to logged in users.
- **Session rules.** A room holds two people. Regular users can have only one active session, a second tab is rejected.
- **Responsive UI.** Desktop: video on the left, chat on the right. Mobile: vertical layout with a scrollable chat.
- **Safe exit.** Exit button and the browser Back button both ask for confirmation.

## Tech stack

- **Backend:** Node.js, Express 5, Socket.IO 4, cookie-parser
- **Realtime media:** WebRTC (signaling over Socket.IO), TURN server (Coturn) over TLS
- **Frontend:** vanilla JavaScript, HTML, CSS
- **Production:** HTTPS on port 443

## Project structure

```
libre443-server/
  server.js            Express app: login, auth guard, /api/version, /api/ice, /api/me
  src/
    config.js          Loads .env: port, users, TURN settings
    sockets.js         Rooms, WebRTC signaling (offer/answer/ICE), chat messages
  public/
    index.html         Landing page with login form
    chat.html          Video call and chat page
    js/                Client logic: socket.js, webrtc.js, ui.js, main.js
    css/style.css
  .env.example         Required environment variables
IDEA.txt               Concept and technical requirements
IMPLEMENTATION.txt     Development plan and status
```

## Getting started

```bash
cd libre443-server
npm install
cp .env.example .env    # set users and TURN credentials
node server.js          # listens on PORT, default 3000
```

`.env` variables:

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default 3000) |
| `LIBRE443_USERS` | JSON array of users: `[{"id":1,"username":"user1","password":"..."}]` |
| `TURN_URLS` | TURN server URL, e.g. `turns:your-turn-host:443?transport=tcp` |
| `TURN_USERNAME` | TURN username |
| `TURN_CREDENTIAL` | TURN password |

Open the site in two browsers, log in as two different users, and the call starts automatically. In production put the app behind HTTPS (camera and microphone require a secure context).

## Security notes

Known limitations of the current version, kept here on purpose:

- **Auth cookie is not signed.** The `bf_auth` cookie stores the username as is, so it can be forged. Next step: signed cookies or server side sessions.
- **Passwords are compared in plain text** from `.env`. Next step: store bcrypt or argon2 hashes.
- **Socket.IO connections are not tied to the login.** Next step: check the session during the socket handshake.
- **Secrets** live only in `.env`, which is excluded from git. See `.env.example`.

## Author

**Andrey Zabolotsky**, Senior Full Stack Developer
[LinkedIn](https://linkedin.com/in/andzab) · [GitHub](https://github.com/anddan21)
