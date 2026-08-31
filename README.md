# 🌐 PolyGlot Live - Real-Time Multilingual Voice Translator

**PolyGlot Live** is a full-stack, real-time voice translation web application. It allows multiple participants (e.g., 5 or more members) who speak completely different languages to join a shared room, speak naturally into their microphones in their native language, and have their words translated and spoken out loud into each participant's respective language in real time!

---

## ✨ Key Features

1. **Simultaneous 5+ Member Multi-Language Rooms**:
   - Every participant selects their native language (e.g. English, Spanish, Hindi, Japanese, French, German, Arabic, Chinese, Russian, etc.).
   - When User A speaks in Hindi, User B hears Japanese, User C hears Spanish, User D hears French, and User E hears English!
2. **Microphone Voice-to-Voice (STT + Translation + TTS)**:
   - **Speech-to-Text (STT)**: High accuracy real-time speech recognition via the browser Web Speech API.
   - **Real-Time Translation Engine**: Fast parallel translation pipeline with smart in-memory caching and resilient multi-provider fallback.
   - **Text-to-Speech (TTS)**: Automatic speech synthesis with native accent voice matching and non-overlapping audio queue.
3. **Live Subtitles & Conversation Feed**:
   - Real-time subtitle stream showing translated text, original transcript accordion, speaker name, and language flags.
   - Replay button on any message to re-listen to the audio.
4. **Live Audio Waveform Visualizer & Speaking Status**:
   - Web Audio API canvas visualizer displaying real-time microphone levels.
   - Animated speaking rings and active speaker banners.
5. **On-the-Fly Controls**:
   - Switch language on the fly without leaving the room.
   - Toggle Continuous Listening vs. Manual Speech.
   - Mute/Unmute incoming speech audio playback.
   - Quick text chat fallback (typed messages are also translated and spoken to everyone).
   - 1-click shareable room link for easy testing across tabs and devices.
6. **Zero Paid Setup**: Runs out of the box with zero external API key requirements.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- A modern web browser supporting Web Speech API (Google Chrome, Microsoft Edge, Safari, Brave, Opera)

### 2. Installation
Open a terminal in the project directory:
```bash
cd d:/multilingual-voice-translator
npm install
```

### 3. Start the Server
```bash
npm start
```
The server will start at:
👉 **`http://localhost:3000`**

---

## 🧪 How to Test with 5 Members (Multi-Language Scenario)

You can test the 5-member multi-language experience on a single computer using multiple browser tabs or across multiple devices on the same local network:

1. Open `http://localhost:3000` in **Tab 1**:
   - Name: `Alex`
   - Language: `🇺🇸 English`
   - Click **Start Multi-User Room** (e.g., Room Code `POLY-801`).
   - Click the **Copy Link** button in the header.

2. Open the copied link in **Tab 2**:
   - Name: `Carlos`
   - Language: `🇪🇸 Spanish (Español)`
   - Click **Join Room**.

3. Open the link in **Tab 3**:
   - Name: `Rahul`
   - Language: `🇮🇳 Hindi (हिन्दी)`
   - Click **Join Room**.

4. Open the link in **Tab 4**:
   - Name: `Kenji`
   - Language: `🇯🇵 Japanese (日本語)`
   - Click **Join Room**.

5. Open the link in **Tab 5**:
   - Name: `Claire`
   - Language: `🇫🇷 French (Français)`
   - Click **Join Room**.

### 🎤 Testing Voice & Translation:
- In **Tab 3 (Rahul - Hindi)**, click **"Start Speaking"** (or type a message) and speak in Hindi:
  > *"नमस्ते दोस्तों, आप सब कैसे हैं?"*
- Switch to **Tab 1 (English)**: You will see and hear: *"Hello friends, how are you all?"* in English!
- Switch to **Tab 2 (Spanish)**: You will see and hear: *"Hola amigos, ¿cómo están todos?"* in Spanish!
- Switch to **Tab 4 (Japanese)**: You will see and hear: *"こんにちは友達、みなさんお元気ですか？"* in Japanese!
- Switch to **Tab 5 (French)**: You will see and hear: *"Bonjour les amis, comment allez-vous tous ?"* in French!

---

## 🤖 Automated Simulation Test

To verify the full 5-member simultaneous real-time translation backend automatically:
```bash
npm test
```
This runs `test-simulation.js`, simulating 5 concurrent participants speaking in English, Hindi, Japanese, Spanish, and French simultaneously.

---

## 📁 Project Structure

```
multilingual-voice-translator/
├── package.json               # Node.js dependencies & scripts
├── server.js                  # Express + Socket.IO Server & Translation Hub
├── test-simulation.js         # Automated 5-user multilingual test suite
├── services/
│   ├── languageList.js        # 30+ supported languages metadata (BCP-47, flags, names)
│   └── translationService.js  # Resilient multi-engine translation pipeline & cache
├── public/
│   ├── index.html             # Sleek modern interface with Lobby and Live Room
│   ├── css/
│   │   └── style.css          # Glassmorphism, animations, responsive layout
│   └── js/
│       ├── app.js             # Main frontend controller & UI bindings
│       ├── socketHandler.js   # Real-time WebSocket event client
│       ├── speechRecognition.js # Web Speech STT controller
│       ├── speechSynthesis.js # Web Speech TTS controller & speech queue
│       └── audioVisualizer.js # Web Audio API microphone waveform visualizer
└── README.md                  # Project documentation
```

---

## 🌍 Supported Languages
Supports 35+ major world languages:
- **English** (`en-US`), **Spanish** (`es-ES`), **Hindi** (`hi-IN`), **French** (`fr-FR`), **German** (`de-DE`), **Japanese** (`ja-JP`), **Chinese Mandarin** (`zh-CN`), **Arabic** (`ar-SA`), **Russian** (`ru-RU`), **Portuguese** (`pt-BR`), **Italian** (`it-IT`), **Korean** (`ko-KR`), **Bengali** (`bn-IN`), **Tamil** (`ta-IN`), **Telugu** (`te-IN`), **Marathi** (`mr-IN`), **Gujarati** (`gu-IN`), **Urdu** (`ur-PK`), **Turkish** (`tr-TR`), **Vietnamese** (`vi-VN`), **Indonesian** (`id-ID`), **Dutch** (`nl-NL`), **Polish** (`pl-PL`), **Ukrainian** (`uk-UA`), **Swedish** (`sv-SE`), **Greek** (`el-GR`), **Thai** (`th-TH`), **Hebrew** (`he-IL`), and more.

