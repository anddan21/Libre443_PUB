const SocketHandler = {
    socket: null,
    room: null,

    init(room) {
        this.room = room;
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to signaling server:', this.socket.id);
        });

        // Listener: system messages (shown to everyone, including the sender)
        this.socket.on('system-message', (data) => {
            if (data?.message) {
                UI.appendSystemMessage(data.message);
            }
        });

        // Listener: a new user joined
        this.socket.on('user-joined', async (userId) => {
            console.log('New user joined:', userId);
            // When someone joins, we initiate the connection (send an offer)
            await WebRTCHandler.createOffer();
        });

        // Listener: offer received
        this.socket.on('offer', async (data) => {
            console.log('Offer received from', data.from);
            await WebRTCHandler.handleOffer(data.offer);
        });

        // Listener: answer received
        this.socket.on('answer', async (data) => {
            console.log('Answer received from', data.from);
            await WebRTCHandler.handleAnswer(data.answer);
        });

        // Listener: ICE candidate received
        this.socket.on('ice-candidate', async (data) => {
            console.log('ICE candidate received from', data.from);
            await WebRTCHandler.handleCandidate(data.candidate);
        });

        // Listener: room is full
        this.socket.on('room-full', () => {
            alert('This room is full. You cannot join. Maximum 2 users allowed.');
            if (appState.localStream) {
                appState.localStream.getTracks().forEach(track => track.stop());
                appState.localStream = null;
            }
            window.location.href = '/';
        });

        // Only one session allowed (no second tab / self-connection) for users with id !== 1
        this.socket.on('already-connected', () => {
            alert('You are already connected in another tab. Only one session is allowed.');
            if (appState.localStream) {
                appState.localStream.getTracks().forEach(track => track.stop());
                appState.localStream = null;
            }
            window.location.href = '/';
        });

        // Listener: chat message received
        this.socket.on('chat-message', (data) => {
            console.log('Message received', data);
            if (data.from !== this.socket.id) {
                UI.appendMessage(data.message, false, data.from, data.fromUsername);
            }
        });
    },

    joinRoom(room, username, userId) {
        if (this.socket) {
            this.socket.emit('join', { room, username, id: userId ?? undefined });
        }
    },

    sendOffer(room, offer) {
        if (this.socket) {
            this.socket.emit('offer', { room, offer });
        }
    },

    sendAnswer(room, answer) {
        if (this.socket) {
            this.socket.emit('answer', { room, answer });
        }
    },

    sendIceCandidate(room, candidate) {
        if (this.socket) {
            this.socket.emit('ice-candidate', { room, candidate });
        }
    },

    sendMessage(room, message) {
        if (this.socket) {
            this.socket.emit('chat-message', { room, message });
        }
    },

    sendSystemMessage(room, message) {
        if (this.socket) {
            this.socket.emit('system-message', { room, message });
        }
    }
};
