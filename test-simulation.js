// Multi-User Real-Time Translation Simulation Test (5 Members, 5 Languages)
const io = require('socket.io-client');
const http = require('http');

const SERVER_URL = 'http://localhost:3000';
const ROOM_ID = 'ROOM-5-LANGS';

const members = [
  { username: 'John (US)', lang: 'en' },
  { username: 'Carlos (Spain)', lang: 'es' },
  { username: 'Ravi (India)', lang: 'hi' },
  { username: 'Kenji (Japan)', lang: 'ja' },
  { username: 'Claire (France)', lang: 'fr' }
];

async function runSimulation() {
  console.log('\n======================================================');
  console.log('🧪 STARTING 5-MEMBER MULTILINGUAL TRANSLATION SIMULATION');
  console.log('======================================================\n');

  const sockets = [];
  const receivedMessages = new Map();

  // 1. Connect and join all 5 members
  for (const member of members) {
    const socket = io(SERVER_URL, { reconnection: false });
    sockets.push({ socket, member });
    receivedMessages.set(member.username, []);

    await new Promise((resolve) => {
      socket.on('connect', () => {
        socket.emit('join_room', {
          roomId: ROOM_ID,
          username: member.username,
          languageCode: member.lang
        });
      });

      socket.on('room_joined', (data) => {
        console.log(`✅ [Joined] ${member.username} joined room [${data.roomId}] with language: [${member.lang}]`);
        resolve();
      });

      socket.on('translated_message', (payload) => {
        receivedMessages.get(member.username).push(payload);
        console.log(`📩 [Received by ${member.username} (${payload.targetLanguage})]: "${payload.translatedText}" (from ${payload.senderName})`);
      });
    });
  }

  // Allow room states to settle
  await new Promise((res) => setTimeout(res, 1000));

  console.log('\n------------------------------------------------------');
  console.log('🗣️ TEST 1: User 1 (English) speaks to all 4 other members');
  console.log('------------------------------------------------------');
  
  const speechText1 = 'Welcome everyone to our global conference. How is the translation quality?';
  sockets[0].socket.emit('speech_message', {
    text: speechText1,
    originalLanguage: 'en',
    messageType: 'speech'
  });

  // Wait 3 seconds for parallel translation & broadcast
  await new Promise((res) => setTimeout(res, 3500));

  console.log('\n------------------------------------------------------');
  console.log('🗣️ TEST 2: User 3 (Hindi) speaks to all 4 other members');
  console.log('------------------------------------------------------');
  
  const speechText2 = 'नमस्ते मित्रों, अनुवाद प्रणाली बहुत तेज़ी से और सही काम कर रही है।';
  sockets[2].socket.emit('speech_message', {
    text: speechText2,
    originalLanguage: 'hi',
    messageType: 'speech'
  });

  await new Promise((res) => setTimeout(res, 3500));

  console.log('\n------------------------------------------------------');
  console.log('🗣️ TEST 3: User 4 (Japanese) speaks to all 4 other members');
  console.log('------------------------------------------------------');
  
  const speechText3 = '素晴らしいです！自分の母国語で話すだけで全員に通じるのはとても便利です。';
  sockets[3].socket.emit('speech_message', {
    text: speechText3,
    originalLanguage: 'ja',
    messageType: 'speech'
  });

  await new Promise((res) => setTimeout(res, 3500));

  console.log('\n======================================================');
  console.log('📊 SIMULATION VERIFICATION RESULTS:');
  console.log('======================================================');

  let passed = true;
  for (const member of members) {
    const msgs = receivedMessages.get(member.username);
    console.log(`✔️ ${member.username} successfully received ${msgs.length}/3 translated messages.`);
    if (msgs.length < 3) passed = false;
  }

  // Cleanup sockets
  sockets.forEach((s) => s.socket.disconnect());

  if (passed) {
    console.log('\n🎉 ALL 5-MEMBER MULTILINGUAL TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } else {
    console.error('\n❌ Some messages were not delivered.');
    process.exit(1);
  }
}

// Ensure server is running before executing simulation
http.get(`${SERVER_URL}/api/health`, (res) => {
  if (res.statusCode === 200) {
    runSimulation();
  }
}).on('error', (err) => {
  console.error('Server not reachable at http://localhost:3000. Please start the server first.');
  process.exit(1);
});

