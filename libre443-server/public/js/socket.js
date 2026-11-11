const SocketHandler = {
    socket: null,
    room: null,

    init(room) {
        this.room = room;
        this.socket = io();

        this.socket.on('connect', () => {
            console.log('Connected to signaling server:', this.socket.id);
        });

        // Слушатель: системные сообщения (должны отображаться у всех, включая отправителя)
        this.socket.on('system-message', (data) => {
            if (data?.message) {
                UI.appendSystemMessage(data.message);
            }
        });

        // Слушатель: новый пользователь присоединился
        this.socket.on('user-joined', async (userId) => {
            console.log('New user joined:', userId);
            // Если кто-то присоединился, мы инициируем соединение (отправляем offer)
            await WebRTCHandler.createOffer();
        });

        // Слушатель: получен offer
        this.socket.on('offer', async (data) => {
            console.log('Offer received from', data.from);
            await WebRTCHandler.handleOffer(data.offer);
        });

        // Слушатель: получен answer
        this.socket.on('answer', async (data) => {
            console.log('Answer received from', data.from);
            await WebRTCHandler.handleAnswer(data.answer);
        });

        // Слушатель: получен ICE кандидат
        this.socket.on('ice-candidate', async (data) => {
            console.log('ICE candidate received from', data.from);
            await WebRTCHandler.handleCandidate(data.candidate);
        });

        // Слушатель: комната заполнена
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

        // Слушатель: получено сообщение чата
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
