/**
 * SocketHandler - Manages real-time room communication and event routing via Socket.IO
 */
class SocketHandler {
  constructor(callbacks = {}) {
    this.socket = null;
    this.callbacks = callbacks;
  }

  connect() {
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server with ID:', this.socket.id);
      if (this.callbacks.onConnect) this.callbacks.onConnect(this.socket.id);
    });

    this.socket.on('room_joined', (data) => {
      if (this.callbacks.onRoomJoined) this.callbacks.onRoomJoined(data);
    });

    this.socket.on('user_joined', (data) => {
      if (this.callbacks.onUserJoined) this.callbacks.onUserJoined(data);
    });

    this.socket.on('user_left', (data) => {
      if (this.callbacks.onUserLeft) this.callbacks.onUserLeft(data);
    });

    this.socket.on('user_updated', (data) => {
      if (this.callbacks.onUserUpdated) this.callbacks.onUserUpdated(data);
    });

    this.socket.on('user_speaking_state', (data) => {
      if (this.callbacks.onUserSpeakingState) this.callbacks.onUserSpeakingState(data);
    });

    this.socket.on('translated_message', (data) => {
      if (this.callbacks.onTranslatedMessage) this.callbacks.onTranslatedMessage(data);
    });

    this.socket.on('system_message', (data) => {
      if (this.callbacks.onSystemMessage) this.callbacks.onSystemMessage(data);
    });

    this.socket.on('disconnect', () => {
      console.warn('[Socket] Disconnected from server');
      if (this.callbacks.onDisconnect) this.callbacks.onDisconnect();
    });
  }

  joinRoom(roomId, username, languageCode) {
    if (!this.socket) return;
    this.socket.emit('join_room', { roomId, username, languageCode });
  }

  updateLanguage(languageCode) {
    if (!this.socket) return;
    this.socket.emit('update_language', { languageCode });
  }

  sendSpeakingState(isSpeaking) {
    if (!this.socket) return;
    this.socket.emit('speaking_state', { isSpeaking });
  }

  sendSpeech(text, originalLanguage, messageType = 'speech') {
    if (!this.socket) return;
    this.socket.emit('speech_message', { text, originalLanguage, messageType });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

window.SocketHandler = SocketHandler;

