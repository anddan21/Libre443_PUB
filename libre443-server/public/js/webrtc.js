const WebRTCHandler = {
    peerConnection: null,
    room: null,

    configuration: {
        iceServers: [],
        iceTransportPolicy: 'relay'
    },

    async loadIceServers() {
        const res = await fetch('/api/ice', { credentials: 'include' });
        if (!res.ok) {
            throw new Error('TURN config unavailable');
        }
        const data = await res.json();
        this.configuration = {
            iceServers: data.iceServers || [],
            iceTransportPolicy: 'relay'
        };
    },

    init(localStream, room) {
        this.room = room;
        this.peerConnection = new RTCPeerConnection(this.configuration);

        // Добавляем локальные треки в соединение
        localStream.getTracks().forEach(track => {
            this.peerConnection.addTrack(track, localStream);
        });

        // Обработка удаленного потока
        this.peerConnection.ontrack = (event) => {
            console.log('Remote track received');
            UI.setRemoteVideoStream(event.streams[0]);
        };

        // Сбор ICE кандидатов и отправка через Socket.IO
        this.peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                SocketHandler.sendIceCandidate(this.room, event.candidate);
            }
        };

        this.peerConnection.onconnectionstatechange = () => {
            console.log('WebRTC connection state:', this.peerConnection.connectionState);
        };
    },

    async createOffer() {
        try {
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            SocketHandler.sendOffer(this.room, offer);
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    },

    async handleOffer(offer) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            SocketHandler.sendAnswer(this.room, answer);
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    },

    async handleAnswer(answer) {
        try {
            await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    },

    async handleCandidate(candidate) {
        try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error adding ICE candidate:', error);
        }
    }
};
