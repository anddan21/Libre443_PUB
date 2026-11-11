// Users with id !== 1 may only have one active session (no second tab = no self-connection)
const connectedByUsername = new Map(); // username -> socketId

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`New connection: Socket ID ${socket.id}`);

        socket.room = null;

        socket.on('join', (data) => {
            const room = typeof data === 'string' ? data : (data && data.room);
            const username = (typeof data === 'object' && data && data.username) ? data.username : null;
            const userId = (typeof data === 'object' && data && data.id != null) ? data.id : null;
            if (!room) return;

            const roomSize = io.sockets.adapter.rooms.get(room)?.size || 0;
            if (roomSize >= 2) {
                console.log(`User ${socket.id} tried to join full room: ${room}`);
                socket.emit('room-full');
                return;
            }

            // For users with id !== 1: allow only one connection (forbid second tab / self-connection)
            if (username && userId !== 1) {
                const existing = connectedByUsername.get(username);
                if (existing && existing !== socket.id) {
                    console.log(`User ${username} (id ${userId}) already connected, rejecting duplicate`);
                    socket.emit('already-connected');
                    return;
                }
                connectedByUsername.set(username, socket.id);
            }

            socket.room = room;
            socket.username = username || socket.id.substring(0, 5);
            console.log(`User ${socket.username} (${socket.id}) joined room: ${room}`);
            // Who is already in the room (before we join)
            const roomSet = io.sockets.adapter.rooms.get(room);
            const alreadyInRoom = roomSet
                ? [...roomSet].map((sid) => io.sockets.sockets.get(sid)).filter(Boolean)
                : [];
            const namesInRoom = alreadyInRoom.map((s) => s.username || s.id.substring(0, 5));

            socket.join(room);
            socket.to(room).emit('user-joined', socket.id);

            io.to(room).emit('system-message', { message: `${socket.username} joined the room` });

            if (namesInRoom.length > 0) {
                socket.emit('system-message', {
                    message: namesInRoom.length === 1
                        ? `${namesInRoom[0]} is already here`
                        : `${namesInRoom.join(', ')} are already here`
                });
            }
        });

        // WebRTC Signaling
        socket.on('offer', (data) => {
            console.log(`WebRTC Offer received from ${socket.id} for room ${data.room}`);
            socket.to(data.room).emit('offer', { offer: data.offer, from: socket.id });
        });

        socket.on('answer', (data) => {
            console.log(`WebRTC Answer received from ${socket.id} for room ${data.room}`);
            socket.to(data.room).emit('answer', { answer: data.answer, from: socket.id });
        });

        socket.on('ice-candidate', (data) => {
            console.log(`ICE Candidate received from ${socket.id} for room ${data.room}`);
            socket.to(data.room).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
        });

        // Chat
        socket.on('chat-message', (data) => {
            console.log(`Chat message sent in room ${data.room} by user ${socket.username || socket.id}`);
            io.to(data.room).emit('chat-message', {
                message: data.message,
                from: socket.id,
                fromUsername: socket.username || socket.id.substring(0, 5)
            });
        });

        // System messages from clients (e.g. video/audio toggles)
        socket.on('system-message', (data) => {
            io.to(data.room).emit('system-message', { message: `${socket.username || socket.id.substring(0, 5)} ${data.message}` });
        });

        socket.on('disconnect', () => {
            if (socket.username && connectedByUsername.get(socket.username) === socket.id) {
                connectedByUsername.delete(socket.username);
            }
            console.log(`User disconnected: ${socket.username || socket.id}`);
            if (socket.room) {
                io.to(socket.room).emit('system-message', { message: `${socket.username || socket.id.substring(0, 5)} left the room` });
            }
        });
    });
};
