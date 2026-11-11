const UI = {
    init() {
        this.localVideo = document.getElementById('local-video');
        this.remoteVideo = document.getElementById('remote-video');
        this.chatMessages = document.getElementById('chat-messages');
        this.mainContent = document.getElementById('main-content');
        this.roomControls = document.getElementById('room-controls');
    },

    showMainContent() {
        this.mainContent.style.display = 'flex';
        if (this.roomControls) this.roomControls.style.display = 'none';
    },

    showRoomControls() {
        this.mainContent.style.display = 'none';
        if (this.roomControls) this.roomControls.style.display = 'flex';
    },

    setLocalVideoStream(stream) {
        this.localVideo.srcObject = stream;
    },

    setRemoteVideoStream(stream) {
        // Устанавливаем поток только если он еще не установлен
        if (this.remoteVideo.srcObject !== stream) {
            this.remoteVideo.srcObject = stream;
        }
    },

    appendMessage(message, isSelf = false, senderId = null, senderUsername = null) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        if (isSelf) {
            messageDiv.classList.add('self');
            messageDiv.textContent = `You: ${message}`;
        } else {
            const label = senderUsername || (senderId ? senderId.substring(0, 5) + '...' : '?');
            messageDiv.textContent = `${label}: ${message}`;
        }

        this.chatMessages.appendChild(messageDiv);
        // Autoscroll
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    },

    appendSystemMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'system');
        messageDiv.textContent = `Sys: ${message}`;

        this.chatMessages.appendChild(messageDiv);
        // Autoscroll
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }
};
