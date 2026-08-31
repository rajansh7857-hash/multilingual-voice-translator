/**
 * SpeechRecognitionManager - Handles Microphone Voice Capture (STT)
 * Uses browser native Web Speech API (webkitSpeechRecognition / SpeechRecognition)
 */
class SpeechRecognitionManager {
  constructor({ onInterim, onFinal, onStateChange, onError }) {
    this.onInterim = onInterim || (() => {});
    this.onFinal = onFinal || (() => {});
    this.onStateChange = onStateChange || (() => {});
    this.onError = onError || (() => {});

    this.recognition = null;
    this.isListening = false;
    this.currentLanguage = 'en-US';
    this.isContinuous = true;
    this.shouldKeepListening = false; // flag for auto-restart on silence

    this.init();
  }

  isSupported() {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  init() {
    if (!this.isSupported()) {
      console.warn('Web Speech API (SpeechRecognition) is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;
    this.recognition.lang = this.currentLanguage;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStateChange(true);
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (interimTranscript.trim()) {
        this.onInterim(interimTranscript.trim());
      }

      if (finalTranscript.trim()) {
        this.onFinal(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      // Ignore routine silence timeouts and auto-restart if active
      if (event.error === 'no-speech') {
        return;
      }
      console.warn('[STT Error]', event.error);
      this.onError(event.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      // If user enabled continuous mic, restart automatically
      if (this.shouldKeepListening) {
        try {
          this.recognition.start();
        } catch (e) {
          this.onStateChange(false);
        }
      } else {
        this.onStateChange(false);
      }
    };
  }

  setLanguage(bcp47Tag) {
    this.currentLanguage = bcp47Tag;
    if (this.recognition) {
      this.recognition.lang = bcp47Tag;
      // If currently listening, restart with new language
      if (this.isListening) {
        this.stop();
        setTimeout(() => this.start(), 200);
      }
    }
  }

  start() {
    if (!this.recognition) {
      this.init();
      if (!this.recognition) {
        this.onError('Speech Recognition not supported in this browser. Please use Chrome or Edge.');
        return;
      }
    }

    this.shouldKeepListening = true;
    try {
      this.recognition.start();
    } catch (e) {
      // Already running or starting
    }
  }

  stop() {
    this.shouldKeepListening = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    this.onStateChange(false);
  }

  toggle() {
    if (this.isListening) {
      this.stop();
    } else {
      this.start();
    }
  }
}

window.SpeechRecognitionManager = SpeechRecognitionManager;

