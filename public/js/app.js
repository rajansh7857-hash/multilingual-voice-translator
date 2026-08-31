/**
 * Main Application Logic - PolyGlot Live
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Application State
  const state = {
    user: {
      username: '',
      language: 'en',
      bcp47: 'en-US'
    },
    currentRoomId: '',
    languages: [],
    usersInRoom: [],
    isMuted: false,
    isMicActive: false
  };

  // Test greetings map for instant audio testing across languages
  const TEST_GREETINGS = {
    en: 'Hello! Audio and speech synthesis are working perfectly.',
    es: '¡Hola! El audio y la síntesis de voz funcionan perfectamente.',
    hi: 'नमस्ते! ऑडियो और अनुवाद आवाज़ पूरी तरह से काम कर रही है।',
    fr: "Bonjour ! L'audio et la synthèse vocale fonctionnent parfaitement.",
    de: 'Hallo! Audio und Sprachausgabe funktionieren einwandfrei.',
    ja: 'こんにちは！音声と翻訳音声は完全に機能しています。',
    'zh-CN': '你好！音频和语音合成功能完全正常。',
    ar: 'مرحباً! الصوت وتحويل النص إلى كلام يعملان بشكل مثالي.',
    ru: 'Здравствуйте! Аудио и синтез речи работают отлично.',
    pt: 'Olá! O áudio e a síntese de voz estão funcionando perfeitamente.',
    it: "Ciao! L'audio e la sintesi vocale funzionano perfettamente.",
    ko: '안녕하세요! 오디오 및 음성 합성이 완벽하게 작동합니다.',
    bn: 'হ্যালো! অডিও এবং ভয়েস অনুবাদ পুরোপুরি কাজ করছে।',
    ta: 'வணக்கம்! ஆடியோ மற்றும் குரல் மொழிபெயர்ப்பு சரியாக செயல்படுகிறது.',
    te: 'నమస్కారం! ఆడియో మరియు వాయిస్ అనువాదం ఖచ్చితంగా పనిచేస్తోంది.',
    mr: 'नमस्कार! ऑडिओ आणि व्हॉइस भाषांतर उत्तम प्रकारे कार्य करत आहे.',
    gu: 'નમસ્તે! ઑડિઓ અને અવાજ અનુવાદ સંપૂર્ણપણે કાર્યરત છે.',
    ur: 'ہیلو! آڈیو اور ترجمہ کی آواز بالکل ٹھیک کام کر رہی ہے۔',
    tr: 'Merhaba! Ses ve ses sentezi mükemmel şekilde çalışıyor.',
    vi: 'Xin chào! Âm thanh và tổng hợp giọng nói đang hoạt động hoàn hảo.',
    id: 'Halo! Audio dan sintesis suara berfungsi dengan sempurna.',
    nl: 'Hallo! Audio en spraaksynthese werken perfect.',
    pl: 'Cześć! Dźwięk i synteza mowy działają bez zarzutu.',
    uk: 'Привіт! Аудіо та синтез мовлення працюють бездоганно.',
    th: 'สวัสดี! ระบบเสียงและการสังเคราะห์เสียงทำงานได้อย่างสมบูรณ์แบบ',
    sv: 'Hej! Ljud och talsyntes fungerar perfekt.',
    el: 'Γεια σας! Ο ήχος και η σύνθεση ομιλίας λειτουργούν άψογα.',
    he: 'שלום! השמע והקראת הקול פועלים בצורה מושלמת.'
  };

  // DOM Elements - Lobby
  const lobbyScreen = document.getElementById('lobbyScreen');
  const roomScreen = document.getElementById('roomScreen');
  const lobbyUsername = document.getElementById('lobbyUsername');
  const lobbyLanguage = document.getElementById('lobbyLanguage');
  const lobbyRoomId = document.getElementById('lobbyRoomId');
  const btnCreateRoom = document.getElementById('btnCreateRoom');
  const btnJoinRoom = document.getElementById('btnJoinRoom');
  const tabCreate = document.getElementById('tabCreate');
  const tabJoin = document.getElementById('tabJoin');
  const joinRoomGroup = document.getElementById('joinRoomGroup');
  const btnTestAudioLobby = document.getElementById('btnTestAudioLobby');

  // DOM Elements - Room
  const displayRoomId = document.getElementById('displayRoomId');
  const btnCopyRoom = document.getElementById('btnCopyRoom');
  const navLanguageSelect = document.getElementById('navLanguageSelect');
  const btnLeaveRoom = document.getElementById('btnLeaveRoom');
  const btnTestAudioRoom = document.getElementById('btnTestAudioRoom');
  const participantsList = document.getElementById('participantsList');
  const userCountBadge = document.getElementById('userCountBadge');
  const liveSpeakerBanner = document.getElementById('liveSpeakerBanner');
  const activeSpeakerName = document.getElementById('activeSpeakerName');
  const speakerLiveText = document.getElementById('speakerLiveText');
  const messagesContainer = document.getElementById('messagesContainer');
  const emptyFeed = document.getElementById('emptyFeed');

  // DOM Elements - Controls
  const btnMic = document.getElementById('btnMic');
  const btnMuteAudio = document.getElementById('btnMuteAudio');
  const audioCanvas = document.getElementById('audioCanvas');
  const manualTextInput = document.getElementById('manualTextInput');
  const btnSendManualText = document.getElementById('btnSendManualText');

  // Visualizer & Speech Engines
  const visualizer = new AudioVisualizer(audioCanvas);
  const speechSynthesizer = new SpeechSynthesisManager();

  // Speech Recognition (STT)
  const speechRecognizer = new SpeechRecognitionManager({
    onInterim: (interimText) => {
      socketHandler.sendSpeakingState(true);
      showLiveSpeakerBanner(state.user.username, interimText);
    },
    onFinal: (finalText) => {
      socketHandler.sendSpeakingState(false);
      socketHandler.sendSpeech(finalText, state.user.language, 'speech');
      hideLiveSpeakerBanner();
    },
    onStateChange: (isListening) => {
      state.isMicActive = isListening;
      updateMicButtonUI(isListening);
      if (isListening) {
        visualizer.start();
        socketHandler.sendSpeakingState(true);
      } else {
        visualizer.stop();
        socketHandler.sendSpeakingState(false);
        hideLiveSpeakerBanner();
      }
    },
    onError: (error) => {
      showToast(`Mic Notice: ${error}`, 'info');
    }
  });

  // Socket Handler
  const socketHandler = new SocketHandler({
    onConnect: (id) => {
      console.log('Connected with socket ID:', id);
    },
    onRoomJoined: (data) => {
      state.currentRoomId = data.roomId;
      state.user = data.user;
      renderRoomScreen();
      updateParticipantsList(data.users);
      showToast(`Joined room ${data.roomId}`, 'success');
      speechSynthesizer.unlockAudio();
    },
    onUserJoined: (data) => {
      updateParticipantsList(data.users);
    },
    onUserLeft: (data) => {
      updateParticipantsList(data.users);
    },
    onUserUpdated: (data) => {
      updateParticipantsList(data.users);
    },
    onUserSpeakingState: (data) => {
      setParticipantSpeakingState(data.userId, data.isSpeaking);
      if (data.isSpeaking) {
        showLiveSpeakerBanner(data.username, 'Speaking...');
      } else {
        hideLiveSpeakerBanner();
      }
    },
    onTranslatedMessage: (payload) => {
      appendMessageToFeed(payload);

      // Play audio TTS for receiver if not self and not muted
      if (!payload.isSelf && !state.isMuted) {
        speechSynthesizer.speak(payload.translatedText, payload.targetLanguage || payload.targetBcp47);
      }
    },
    onSystemMessage: (msg) => {
      appendSystemMessage(msg);
    },
    onDisconnect: () => {
      showToast('Disconnected from server', 'error');
    }
  });

  // Load Languages
  async function loadLanguages() {
    try {
      const response = await fetch('/api/languages');
      const data = await response.json();
      if (data.success && data.languages) {
        state.languages = data.languages;
        populateLanguageDropdowns(data.languages);
      }
    } catch (e) {
      console.error('Failed to load languages:', e);
    }
  }

  function populateLanguageDropdowns(languages) {
    lobbyLanguage.innerHTML = '';
    navLanguageSelect.innerHTML = '';

    languages.forEach((lang) => {
      const optionLobby = document.createElement('option');
      optionLobby.value = lang.code;
      optionLobby.dataset.bcp47 = lang.bcp47;
      optionLobby.textContent = `${lang.flag} ${lang.name} (${lang.native})`;
      if (lang.code === 'en') optionLobby.selected = true;
      lobbyLanguage.appendChild(optionLobby);

      const optionNav = document.createElement('option');
      optionNav.value = lang.code;
      optionNav.dataset.bcp47 = lang.bcp47;
      optionNav.textContent = `${lang.flag} ${lang.name}`;
      if (lang.code === 'en') optionNav.selected = true;
      navLanguageSelect.appendChild(optionNav);
    });
  }

  // Audio Testing Function
  function testAudioInLanguage(langCode) {
    speechSynthesizer.unlockAudio();
    const cleanLang = (langCode || 'en').split('-')[0].toLowerCase();
    const greeting = TEST_GREETINGS[cleanLang] || `Hello, testing audio in ${langCode}. Everything is working.`;
    
    showToast(`Playing sample voice in ${langCode.toUpperCase()}...`, 'info');
    speechSynthesizer.speak(greeting, langCode);
  }

  btnTestAudioLobby.addEventListener('click', () => {
    const selectedLang = lobbyLanguage.value;
    testAudioInLanguage(selectedLang);
  });

  btnTestAudioRoom.addEventListener('click', () => {
    testAudioInLanguage(state.user.language);
  });

  // URL Parameter check for room
  const urlParams = new URLSearchParams(window.location.search);
  const paramRoom = urlParams.get('room');
  if (paramRoom) {
    lobbyRoomId.value = paramRoom.toUpperCase();
    tabJoin.click();
  }

  function generateRandomRoomId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 3; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    code += '-';
    for (let i = 0; i < 3; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  }

  // Tabs
  tabCreate.addEventListener('click', () => {
    tabCreate.classList.add('active');
    tabJoin.classList.remove('active');
    joinRoomGroup.style.display = 'none';
    btnCreateRoom.style.display = 'flex';
    btnJoinRoom.style.display = 'none';
  });

  tabJoin.addEventListener('click', () => {
    tabJoin.classList.add('active');
    tabCreate.classList.remove('active');
    joinRoomGroup.style.display = 'block';
    btnCreateRoom.style.display = 'none';
    btnJoinRoom.style.display = 'flex';
  });

  // Create Room
  btnCreateRoom.addEventListener('click', () => {
    speechSynthesizer.unlockAudio();
    const username = lobbyUsername.value.trim();
    if (!username) {
      showToast('Please enter your name', 'error');
      lobbyUsername.focus();
      return;
    }
    const roomId = generateRandomRoomId();
    const selectedLang = lobbyLanguage.value;
    const selectedBcp47 = lobbyLanguage.options[lobbyLanguage.selectedIndex].dataset.bcp47;

    state.user.username = username;
    state.user.language = selectedLang;
    state.user.bcp47 = selectedBcp47;

    speechRecognizer.setLanguage(selectedBcp47);
    socketHandler.connect();
    socketHandler.joinRoom(roomId, username, selectedLang);
  });

  // Join Room
  btnJoinRoom.addEventListener('click', () => {
    speechSynthesizer.unlockAudio();
    const username = lobbyUsername.value.trim();
    const roomId = lobbyRoomId.value.trim().toUpperCase();

    if (!username) {
      showToast('Please enter your name', 'error');
      lobbyUsername.focus();
      return;
    }
    if (!roomId) {
      showToast('Please enter a Room Code', 'error');
      lobbyRoomId.focus();
      return;
    }

    const selectedLang = lobbyLanguage.value;
    const selectedBcp47 = lobbyLanguage.options[lobbyLanguage.selectedIndex].dataset.bcp47;

    state.user.username = username;
    state.user.language = selectedLang;
    state.user.bcp47 = selectedBcp47;

    speechRecognizer.setLanguage(selectedBcp47);
    socketHandler.connect();
    socketHandler.joinRoom(roomId, username, selectedLang);
  });

  // Language Change in Navbar
  navLanguageSelect.addEventListener('change', (e) => {
    const newLang = e.target.value;
    const selectedBcp47 = e.target.options[e.target.selectedIndex].dataset.bcp47;
    state.user.language = newLang;
    state.user.bcp47 = selectedBcp47;
    speechRecognizer.setLanguage(selectedBcp47);
    socketHandler.updateLanguage(newLang);
    showToast(`Language switched to ${e.target.options[e.target.selectedIndex].textContent}`, 'info');
  });

  // Copy Room Link
  btnCopyRoom.addEventListener('click', () => {
    const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${state.currentRoomId}`;
    navigator.clipboard.writeText(inviteUrl).then(() => {
      showToast('Room invite link copied to clipboard!', 'success');
    }).catch(() => {
      showToast(`Room Code: ${state.currentRoomId}`, 'info');
    });
  });

  // Leave Room
  btnLeaveRoom.addEventListener('click', () => {
    speechRecognizer.stop();
    speechSynthesizer.stop();
    visualizer.stop();
    socketHandler.disconnect();
    window.location.href = window.location.pathname;
  });

  // Mic Toggle
  btnMic.addEventListener('click', () => {
    speechSynthesizer.unlockAudio();
    speechRecognizer.toggle();
  });

  // Mute Audio Toggle
  btnMuteAudio.addEventListener('click', () => {
    const isMuted = speechSynthesizer.toggleMute();
    state.isMuted = isMuted;
    if (isMuted) {
      btnMuteAudio.classList.add('muted');
      btnMuteAudio.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
      `;
      showToast('Incoming audio playback muted', 'info');
    } else {
      btnMuteAudio.classList.remove('muted');
      btnMuteAudio.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
      `;
      showToast('Incoming audio playback enabled', 'info');
    }
  });

  // Send Manual Text Message
  function handleSendManualText() {
    speechSynthesizer.unlockAudio();
    const text = manualTextInput.value.trim();
    if (!text) return;

    socketHandler.sendSpeech(text, state.user.language, 'text');
    manualTextInput.value = '';
  }

  btnSendManualText.addEventListener('click', handleSendManualText);
  manualTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSendManualText();
  });

  // UI Helpers
  function renderRoomScreen() {
    lobbyScreen.style.display = 'none';
    roomScreen.style.display = 'flex';
    displayRoomId.textContent = state.currentRoomId;
    navLanguageSelect.value = state.user.language;
  }

  function updateMicButtonUI(isActive) {
    if (isActive) {
      btnMic.classList.add('recording');
      btnMic.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
        <span>Listening... (Tap to Stop)</span>
      `;
    } else {
      btnMic.classList.remove('recording');
      btnMic.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
        <span>Start Speaking</span>
      `;
    }
  }

  function updateParticipantsList(users) {
    state.usersInRoom = users;
    userCountBadge.textContent = users.length;
    participantsList.innerHTML = '';

    users.forEach((u) => {
      const isSelf = u.id === state.user.id || u.username === state.user.username;
      const initial = u.username.charAt(0).toUpperCase();

      const item = document.createElement('div');
      item.className = `participant-item ${isSelf ? 'self' : ''} ${u.isSpeaking ? 'is-speaking' : ''}`;
      item.id = `participant_${u.id}`;

      item.innerHTML = `
        <div class="participant-info">
          <div class="participant-avatar">
            ${initial}
            <div class="speaking-pulse"></div>
          </div>
          <div class="participant-details">
            <span class="participant-name">
              ${escapeHtml(u.username)}
              ${isSelf ? '<span class="you-tag">YOU</span>' : ''}
            </span>
            <span class="participant-lang">${u.flag || '🌐'} ${escapeHtml(u.langName || u.language)}</span>
          </div>
        </div>
      `;

      participantsList.appendChild(item);
    });
  }

  function setParticipantSpeakingState(userId, isSpeaking) {
    const item = document.getElementById(`participant_${userId}`);
    if (item) {
      if (isSpeaking) {
        item.classList.add('is-speaking');
      } else {
        item.classList.remove('is-speaking');
      }
    }
  }

  function showLiveSpeakerBanner(username, previewText) {
    liveSpeakerBanner.classList.remove('hidden');
    activeSpeakerName.textContent = username;
    speakerLiveText.textContent = previewText;
  }

  function hideLiveSpeakerBanner() {
    liveSpeakerBanner.classList.add('hidden');
  }

  function appendMessageToFeed(msg) {
    if (emptyFeed) {
      emptyFeed.style.display = 'none';
    }

    const card = document.createElement('div');
    card.className = `message-card ${msg.isSelf ? 'self' : 'other'}`;

    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    card.innerHTML = `
      <div class="msg-header">
        <div class="msg-sender-info">
          <span>${escapeHtml(msg.senderName)}</span>
          <span class="msg-lang-tag">${msg.senderFlag || '🌐'} ${escapeHtml(msg.senderLangName || msg.srcLanguage)}</span>
        </div>
        <div class="msg-actions">
          <span class="msg-time">${timeStr}</span>
          <button class="btn-speak-repeat" title="Listen again" aria-label="Replay audio">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
          </button>
        </div>
      </div>
      <div class="msg-body-translated">${escapeHtml(msg.translatedText)}</div>
      ${
        msg.originalText && msg.originalText !== msg.translatedText
          ? `<div class="msg-original-accordion">
              <span>Original: <span class="msg-original-text">"${escapeHtml(msg.originalText)}"</span></span>
            </div>`
          : ''
      }
    `;

    // Replay button on message card
    const btnReplay = card.querySelector('.btn-speak-repeat');
    btnReplay.addEventListener('click', () => {
      speechSynthesizer.unlockAudio();
      speechSynthesizer.speak(msg.translatedText, msg.targetLanguage || msg.targetBcp47);
    });

    messagesContainer.appendChild(card);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function appendSystemMessage(msg) {
    const div = document.createElement('div');
    div.className = 'system-msg';
    div.textContent = msg.text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  function showToast(message, type = 'info') {
    let container = document.getElementById('toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize
  await loadLanguages();
});
