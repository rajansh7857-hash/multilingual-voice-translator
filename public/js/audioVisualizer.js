/**
 * AudioVisualizer - Real-Time Waveform / Frequency Visualizer using Web Audio API
 */
class AudioVisualizer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.audioCtx = null;
    this.analyser = null;
    this.microphone = null;
    this.animationId = null;
    this.isActive = false;
    this.dataArray = null;

    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
      this.drawIdle();
    }
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = this.canvas.parentElement.clientWidth || 300;
    this.canvas.height = this.canvas.parentElement.clientHeight || 36;
  }

  async start() {
    if (this.isActive) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 64;

      this.microphone = this.audioCtx.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      this.isActive = true;
      this.draw();
    } catch (err) {
      console.warn('Audio Visualizer mic access failed:', err.message);
      this.drawIdle();
    }
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
    this.drawIdle();
  }

  drawIdle() {
    if (!this.ctx) return;
    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)';

    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
  }

  draw() {
    if (!this.isActive || !this.ctx) return;

    this.animationId = requestAnimationFrame(() => this.draw());

    this.analyser.getByteFrequencyData(this.dataArray);

    const width = this.canvas.width;
    const height = this.canvas.height;

    this.ctx.clearRect(0, 0, width, height);

    const barWidth = (width / this.dataArray.length) * 2;
    let x = 0;

    for (let i = 0; i < this.dataArray.length; i++) {
      const barHeight = (this.dataArray[i] / 255) * height * 0.85;

      const gradient = this.ctx.createLinearGradient(0, height, 0, 0);
      gradient.addColorStop(0, '#6366f1');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#06b6d4');

      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

      x += barWidth + 1;
    }
  }
}

window.AudioVisualizer = AudioVisualizer;

