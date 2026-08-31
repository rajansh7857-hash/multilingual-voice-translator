// PolyGlot Live - Real-Time Multilingual Voice Translator Server
const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const cors = require('cors');
const { Server } = require('socket.io');
const { SUPPORTED_LANGUAGES, getLanguage } = require('./services/languageList');
const { translateText, translateToMultiple } = require('./services/translationService');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-Memory Room Store
const rooms = new Map();

function getOrCreateRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      createdAt: new Date(),
      users: new Map()
    });
  }
  return rooms.get(roomId);
}

// REST Endpoints
app.get('/api/languages', (req, res) => {
  res.json({
    success: true,
    languages: SUPPORTED_LANGUAGES
  });
});

app.get('/api/health', (req, res) => {
  let totalUsers = 0;
  rooms.forEach((room) => (totalUsers += room.users.size));
  res.json({
    status: 'healthy',
    activeRooms: rooms.size,
    totalConnectedUsers: totalUsers,
    uptimeSeconds: Math.floor(process.uptime())
  });
});

app.post('/api/translate', async (req, res) => {
  try {
    const { text, from, to } = req.body;
    if (!text || !to) {
      return res.status(400).json({ error: 'Text and target language (to) are required.' });
    }
    const translated = await translateText(text, from || 'auto', to);
    res.json({ success: true, original: text, from, to, translated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Universal Server-Side Text-To-Speech (TTS) Streaming Endpoint
 * Provides 100% reliable MP3 audio playback in all 35+ languages across any browser/OS
 */
app.get('/api/tts', (req, res) => {
  try {
    const { text, lang } = req.query;
    if (!text || !text.trim()) {
      return res.status(400).send('Text parameter is required');
    }

    const cleanText = text.trim();
    // Normalize language code (e.g. 'zh-CN' -> 'zh-CN', 'hi-IN' -> 'hi', 'en-US' -> 'en')
    let targetLang = (lang || 'en').trim().toLowerCase();
    if (targetLang === 'zh-cn' || targetLang === 'zh') {
      targetLang = 'zh-CN';
    } else {
      targetLang = targetLang.split('-')[0];
    }

    // Google Translate TTS URL
    const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      cleanText
    )}&tl=${encodeURIComponent(targetLang)}&client=tw-ob`;

    const options = {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/'
      }
    };

    https
      .get(ttsUrl, options, (proxyRes) => {
        if (proxyRes.statusCode !== 200) {
          console.warn(`[TTS Proxy] Error status: ${proxyRes.statusCode}`);
          return res.status(proxyRes.statusCode).send('Failed to generate TTS audio');
        }

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache audio for 24h
        res.setHeader('Accept-Ranges', 'bytes');

        proxyRes.pipe(res);
      })
      .on('error', (err) => {
        console.error('[TTS Proxy Error]', err.message);
        res.status(500).send('TTS Streaming Error');
      });
  } catch (err) {
    console.error('[TTS Server Error]', err);
    res.status(500).send('Internal Server Error');
  }
});

// Socket.IO Real-Time Handlers
io.on('connection', (socket) => {
  let currentRoomId = null;
  let currentUser = null;

  // 1. Join Room
  socket.on('join_room', ({ roomId, username, languageCode }) => {
    if (!roomId || !username) return;

    currentRoomId = roomId.trim().toUpperCase();
    socket.join(currentRoomId);

    const langInfo = getLanguage(languageCode || 'en');
    currentUser = {
      id: socket.id,
      username: username.trim(),
      language: langInfo.code,
      bcp47: langInfo.bcp47,
      langName: langInfo.name,
      flag: langInfo.flag,
      isSpeaking: false,
      joinedAt: new Date()
    };

    const room = getOrCreateRoom(currentRoomId);
    room.users.set(socket.id, currentUser);

    const userList = Array.from(room.users.values());

    socket.emit('room_joined', {
      roomId: currentRoomId,
      user: currentUser,
      users: userList
    });

    socket.to(currentRoomId).emit('user_joined', {
      user: currentUser,
      users: userList
    });

    io.to(currentRoomId).emit('system_message', {
      type: 'info',
      text: `${currentUser.username} joined the session (${currentUser.flag} ${currentUser.langName})`,
      timestamp: new Date()
    });

    console.log(
      `[Socket] ${currentUser.username} (${socket.id}) joined room [${currentRoomId}] speaking [${currentUser.langName}]`
    );
  });

  // 2. Language Change
  socket.on('update_language', ({ languageCode }) => {
    if (!currentRoomId || !currentUser) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;

    const langInfo = getLanguage(languageCode);
    currentUser.language = langInfo.code;
    currentUser.bcp47 = langInfo.bcp47;
    currentUser.langName = langInfo.name;
    currentUser.flag = langInfo.flag;
    room.users.set(socket.id, currentUser);

    const userList = Array.from(room.users.values());
    io.to(currentRoomId).emit('user_updated', {
      user: currentUser,
      users: userList
    });

    io.to(currentRoomId).emit('system_message', {
      type: 'info',
      text: `${currentUser.username} switched language to ${currentUser.flag} ${currentUser.langName}`,
      timestamp: new Date()
    });
  });

  // 3. Speaking State
  socket.on('speaking_state', ({ isSpeaking }) => {
    if (!currentRoomId || !currentUser) return;
    currentUser.isSpeaking = isSpeaking;
    socket.to(currentRoomId).emit('user_speaking_state', {
      userId: socket.id,
      username: currentUser.username,
      isSpeaking
    });
  });

  // 4. Speech or Text Message Broadcast with Parallel Multi-Language Translation
  socket.on('speech_message', async ({ text, originalLanguage, messageType = 'speech' }) => {
    if (!currentRoomId || !currentUser || !text || !text.trim()) return;

    const room = rooms.get(currentRoomId);
    if (!room) return;

    const cleanText = text.trim();
    const srcLang = originalLanguage || currentUser.language;
    const srcLangInfo = getLanguage(srcLang);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const timestamp = new Date();

    const targetLangs = new Set();
    room.users.forEach((u) => {
      targetLangs.add(u.language);
    });

    try {
      const translations = await translateToMultiple(cleanText, srcLang, Array.from(targetLangs));
      translations[srcLang] = cleanText;

      room.users.forEach((roomUser, memberSocketId) => {
        const memberLang = roomUser.language;
        const memberBcp47 = roomUser.bcp47;
        const translatedContent = translations[memberLang] || cleanText;
        const isSender = memberSocketId === socket.id;

        const payload = {
          id: messageId,
          senderId: socket.id,
          senderName: currentUser.username,
          senderFlag: srcLangInfo.flag,
          senderLangName: srcLangInfo.name,
          srcLanguage: srcLang,
          targetLanguage: memberLang,
          targetBcp47: memberBcp47,
          originalText: cleanText,
          translatedText: translatedContent,
          isSelf: isSender,
          messageType,
          timestamp
        };

        io.to(memberSocketId).emit('translated_message', payload);
      });

      console.log(
        `[Translate & Broadcast] Room [${currentRoomId}] | ${currentUser.username} (${srcLang}): "${cleanText}" -> Translated for ${targetLangs.size} languages.`
      );
    } catch (err) {
      console.error('[Broadcast Error]', err);
      io.to(currentRoomId).emit('translated_message', {
        id: messageId,
        senderId: socket.id,
        senderName: currentUser.username,
        senderFlag: srcLangInfo.flag,
        senderLangName: srcLangInfo.name,
        srcLanguage: srcLang,
        targetLanguage: srcLang,
        targetBcp47: currentUser.bcp47,
        originalText: cleanText,
        translatedText: cleanText,
        isSelf: false,
        messageType,
        timestamp
      });
    }
  });

  // 5. Disconnect
  socket.on('disconnect', () => {
    if (!currentRoomId || !currentUser) return;
    const room = rooms.get(currentRoomId);
    if (room) {
      room.users.delete(socket.id);
      const remainingUsers = Array.from(room.users.values());

      socket.to(currentRoomId).emit('user_left', {
        userId: socket.id,
        username: currentUser.username,
        users: remainingUsers
      });

      io.to(currentRoomId).emit('system_message', {
        type: 'warning',
        text: `${currentUser.username} left the session`,
        timestamp: new Date()
      });

      if (room.users.size === 0) {
        rooms.delete(currentRoomId);
        console.log(`[Room Cleaned] Room [${currentRoomId}] closed (0 users).`);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 PolyGlot Live Server is running!`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`🎙️ Real-Time Voice Translation & Audio TTS Active`);
  console.log(`====================================================`);
});
