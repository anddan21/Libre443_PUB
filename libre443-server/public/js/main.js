// Global object that holds the app state
const appState = {
    room: 'main',
    localStream: null,
    username: null,
    userId: null
};

async function enterRoom() {
    try {
        appState.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        appState.localStream.getTracks().forEach(track => { track.enabled = true; });

        const videoBtn = document.getElementById('toggle-video-btn');
        const audioBtn = document.getElementById('toggle-audio-btn');
        videoBtn.textContent = 'Video: On';
        videoBtn.classList.add('btn-on');
        videoBtn.classList.remove('btn-off');
        audioBtn.textContent = 'Audio: On';
        audioBtn.classList.add('btn-on');
        audioBtn.classList.remove('btn-off');

        UI.setLocalVideoStream(appState.localStream);
        try {
            await WebRTCHandler.loadIceServers();
        } catch (error) {
            console.error('TURN config error:', error);
            alert('Could not load call server settings.');
            return;
        }
        WebRTCHandler.init(appState.localStream, appState.room);
        SocketHandler.init(appState.room);
        SocketHandler.joinRoom(appState.room, appState.username, appState.userId);
        UI.showMainContent();
    } catch (error) {
        console.error('Media access error:', error);
        alert('Could not access camera and microphone. Check permissions.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    UI.init();

    try {
        const versionRes = await fetch('/api/version');
        const versionData = await versionRes.json();
        document.getElementById('app-version').textContent = `v${versionData.version}`;
    } catch (e) {
        console.error('Version fetch error:', e);
    }

    const meRes = await fetch('/api/me', { credentials: 'include' });
    if (!meRes.ok) {
        window.location.href = '/';
        return;
    }
    const meData = await meRes.json();
    appState.username = meData.username || null;
    appState.userId = meData.id != null ? meData.id : null;

    await enterRoom();

    // Handle sending a chat message
    document.getElementById('send-btn').addEventListener('click', () => {
        const messageInput = document.getElementById('chat-input');
        const message = messageInput.value.trim();

        if (message && appState.room) {
            SocketHandler.sendMessage(appState.room, message);
            UI.appendMessage(message, true);
            messageInput.value = '';
        }
    });

    // Handle Enter to send message
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('send-btn').click();
        }
    });

    // Handle video toggle
    document.getElementById('toggle-video-btn').addEventListener('click', (e) => {
        if (appState.localStream) {
            const videoTrack = appState.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                e.target.textContent = videoTrack.enabled ? 'Video: On' : 'Video: Off';
                if (videoTrack.enabled) {
                    e.target.classList.add('btn-on');
                    e.target.classList.remove('btn-off');
                } else {
                    e.target.classList.add('btn-off');
                    e.target.classList.remove('btn-on');
                }
                SocketHandler.sendSystemMessage(appState.room, `turned ${videoTrack.enabled ? 'on' : 'off'} their video`);
            }
        }
    });

    // Handle audio toggle
    document.getElementById('toggle-audio-btn').addEventListener('click', (e) => {
        if (appState.localStream) {
            const audioTrack = appState.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                e.target.textContent = audioTrack.enabled ? 'Audio: On' : 'Audio: Off';
                if (audioTrack.enabled) {
                    e.target.classList.add('btn-on');
                    e.target.classList.remove('btn-off');
                } else {
                    e.target.classList.add('btn-off');
                    e.target.classList.remove('btn-on');
                }
                SocketHandler.sendSystemMessage(appState.room, `turned ${audioTrack.enabled ? 'on' : 'off'} their audio`);
            }
        }
    });

    // Handle full screen mode on remote video click
    document.getElementById('remote-video').addEventListener('click', () => {
        document.body.classList.toggle('fullscreen-mode');
    });

    // Exit confirmation modal
    const exitOverlay = document.getElementById('exit-modal-overlay');
    const exitCancelBtn = document.getElementById('exit-modal-cancel');
    const exitConfirmBtn = document.getElementById('exit-modal-confirm');

    function showExitModal() {
        exitOverlay.classList.add('visible');
        exitOverlay.setAttribute('aria-hidden', 'false');
    }

    function closeExitModal() {
        exitOverlay.classList.remove('visible');
        exitOverlay.setAttribute('aria-hidden', 'true');
    }

    document.getElementById('exit-btn').addEventListener('click', showExitModal);

    exitCancelBtn.addEventListener('click', closeExitModal);
    exitConfirmBtn.addEventListener('click', () => { window.location.href = '/'; });

    exitOverlay.addEventListener('click', (e) => {
        if (e.target === exitOverlay) closeExitModal();
    });

    // Browser back button: show same exit confirmation instead of leaving immediately
    const path = location.pathname;
    history.replaceState({ chat: true }, '', path + '#chat');
    history.pushState({ chat: true }, '', path + '#');
    window.addEventListener('popstate', () => {
        history.pushState({ chat: true }, '', path + '#');
        showExitModal();
    });
});
