/**
 * UniversalAudioManager - Dual-Engine Audio & Speech Player (AudioMaster)
 * Primary: Server-Side High-Fidelity Google Audio Stream (/api/tts)
 * Fallback: Browser Web SpeechSynthesis API with auto-unlock and queue management
 */
class SpeechSynthesisManager {
  constructor() {
    this.queue = [];
    this.isPlaying = false;
    this.isMuted = false;
    this.audioUnlocked = false;
    this.currentAudioElement = null;
    this.rate = 1.0;
    this.volume = 1.0;

    // Web Speech API fallback setup
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.loadVoices();

    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }

    // Auto-unlock audio on any initial user click/touch
    this.setupAudioUnlocker();
  }

  setupAudioUnlocker() {
    const unlockEvents = ['click', 'touchstart', 'keydown'];
    const unlockHandler = () => {
      this.unlockAudio();
      unlockEvents.forEach((evt) => document.removeEventListener(evt, unlockHandler));
    };
    unlockEvents.forEach((evt) => document.addEventListener(evt, unlockHandler, { once: true }));
  }

  /**
   * Play silent audio buffer to unlock browser Autoplay policy for subsequent real-time messages
   */
  unlockAudio() {
    if (this.audioUnlocked) return;
    try {
      // 1. Unlock HTML5 Audio
      const silentAudio = new Audio(
        'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA'
      );
      silentAudio.volume = 0.01;
      const playPromise = silentAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            this.audioUnlocked = true;
            console.log('🔊 [AudioMaster] HTML5 Audio unlocked successfully');
          })
          .catch((e) => {
            console.warn('Audio unlock pending user gesture:', e.message);
          });
      }

      // 2. Unlock Web Speech API
      if (this.synth) {
        this.synth.resume();
      }
    } catch (e) {
      console.warn('Audio unlock error:', e);
    }
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  getBestVoice(bcp47Tag) {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    if (!bcp47Tag) return null;
    const cleanTag = bcp47Tag.toLowerCase().replace('_', '-');
    const primaryLang = cleanTag.split('-')[0];

    return (
      this.voices.find((v) => v.lang.toLowerCase().replace('_', '-') === cleanTag) ||
      this.voices.find((v) => v.lang.toLowerCase().startsWith(primaryLang)) ||
      this.voices[0] ||
      null
    );
  }

  /**
   * Main Speak Method: Adds speech request to the sequential queue
   * @param {string} text - Text to speak
   * @param {string} bcp47Tag - Target Language code (e.g. 'es', 'hi', 'ja', 'fr', 'en-US')
   * @param {function} onStart - Callback when audio starts playing
   * @param {function} onEnd - Callback when audio finishes
   */
  speak(text, bcp47Tag = 'en-US', onStart = null, onEnd = null) {
    if (!text || !text.trim() || this.isMuted) return;

    this.queue.push({
      text: text.trim(),
      lang: bcp47Tag,
      onStart,
      onEnd
    });

    this.processQueue();
  }

  processQueue() {
    if (this.isPlaying || this.queue.length === 0) return;

    const item = this.queue.shift();
    this.isPlaying = true;

    // Try Primary Engine: Server-side stream (/api/tts)
    this.playServerTTS(item)
      .then(() => {
        this.isPlaying = false;
        if (item.onEnd) item.onEnd();
        this.processQueue();
      })
      .catch((err) => {
        console.warn('[AudioMaster] Server TTS stream fallback triggered:', err.message);
        // Fallback to Web Speech API
        this.playWebSpeechAPI(item)
          .then(() => {
            this.isPlaying = false;
            if (item.onEnd) item.onEnd();
            this.processQueue();
          })
          .catch((e2) => {
            console.error('[AudioMaster] All TTS playback engines failed:', e2);
            this.isPlaying = false;
            if (item.onEnd) item.onEnd();
            this.processQueue();
          });
      });
  }

  /**
   * Primary Engine: Plays MP3 audio via /api/tts endpoint
   */
  playServerTTS(item) {
    return new Promise((resolve, reject) => {
      const cleanLang = item.lang.split('-')[0].toLowerCase();
      const ttsUrl = `/api/tts?text=${encodeURIComponent(item.text)}&lang=${encodeURIComponent(cleanLang)}`;

      const audio = new Audio();
      this.currentAudioElement = audio;
      audio.src = ttsUrl;
      audio.volume = this.volume;
      audio.playbackRate = this.rate;

      audio.onplay = () => {
        if (item.onStart) item.onStart();
      };

      audio.onended = () => {
        this.currentAudioElement = null;
        resolve();
      };

      audio.onerror = (e) => {
        this.currentAudioElement = null;
        reject(new Error(`HTML5 Audio error: ${e}`));
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // If browser blocked autoplay, attempt unlock & reject to fallback
          console.warn('Audio play restricted by browser policy:', err.message);
          this.currentAudioElement = null;
          reject(err);
        });
      }
    });
  }

  /**
   * Secondary Fallback Engine: Web Speech API (speechSynthesis)
   */
  playWebSpeechAPI(item) {
    return new Promise((resolve) => {
      if (!this.synth) {
        return resolve();
      }

      // Resume synthesis if paused by browser
      this.synth.resume();

      const utterance = new SpeechSynthesisUtterance(item.text);
      const voice = this.getBestVoice(item.lang);

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = item.lang;
      }

      utterance.rate = this.rate;
      utterance.volume = this.volume;

      utterance.onstart = () => {
        if (item.onStart) item.onStart();
      };

      utterance.onend = () => {
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis utterance error:', e);
        resolve();
      };

      // Watchdog timer in case utterance stalls
      const maxDuration = Math.max(3000, item.text.length * 150);
      const watchdog = setTimeout(() => {
        if (this.synth.speaking) {
          this.synth.cancel();
          resolve();
        }
      }, maxDuration);

      const originalEnd = utterance.onend;
      utterance.onend = () => {
        clearTimeout(watchdog);
        if (originalEnd) originalEnd();
      };

      this.synth.speak(utterance);
    });
  }

  stop() {
    this.queue = [];
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {}
      this.currentAudioElement = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.isPlaying = false;
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  }

  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.currentAudioElement) {
      this.currentAudioElement.volume = this.volume;
    }
  }

  setRate(rate) {
    this.rate = Math.max(0.5, Math.min(2.0, rate));
  }
}

window.SpeechSynthesisManager = SpeechSynthesisManager;
