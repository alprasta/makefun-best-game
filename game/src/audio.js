// Spore Sprint — all sound is synthesized with WebAudio: no audio files, no network.
// Every effect is a small oscillator/noise burst. Audio starts only after a user
// gesture (browsers block it before then); everything is guarded so the game
// still runs when audio is unavailable (headless screenshots, muted tab).

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this._noiseBuf = null;
  }

  // Call from the first click / keypress. Safe to call repeatedly.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.32;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.32;
    return this.muted;
  }

  _tone({ freq = 440, freqEnd = null, dur = 0.12, type = 'sine', vol = 0.5, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      /* audio is decoration; never break the game */
    }
  }

  _noise({ dur = 0.15, vol = 0.3, freq = 1200, delay = 0 }) {
    if (!this.ctx || this.muted) return;
    try {
      if (!this._noiseBuf) {
        const len = this.ctx.sampleRate * 0.5;
        this._noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const data = this._noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      const t0 = this.ctx.currentTime + delay;
      const src = this.ctx.createBufferSource();
      src.buffer = this._noiseBuf;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = freq;
      filter.Q.value = 0.8;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t0);
      src.stop(t0 + dur + 0.05);
    } catch {
      /* ignore */
    }
  }

  click() { this._tone({ freq: 660, freqEnd: 520, dur: 0.07, type: 'triangle', vol: 0.35 }); }
  jump() { this._tone({ freq: 320, freqEnd: 640, dur: 0.14, type: 'square', vol: 0.16 }); }
  land() { this._noise({ dur: 0.08, vol: 0.14, freq: 300 }); }
  dash() { this._noise({ dur: 0.18, vol: 0.28, freq: 2400 }); }
  bounce() {
    this._tone({ freq: 220, freqEnd: 880, dur: 0.18, type: 'sine', vol: 0.45 });
    this._tone({ freq: 440, freqEnd: 1320, dur: 0.14, type: 'triangle', vol: 0.2, delay: 0.03 });
  }
  hurt() {
    this._tone({ freq: 220, freqEnd: 70, dur: 0.28, type: 'sawtooth', vol: 0.4 });
    this._noise({ dur: 0.2, vol: 0.2, freq: 500 });
  }
  checkpoint() {
    this._tone({ freq: 523, dur: 0.1, type: 'sine', vol: 0.35 });
    this._tone({ freq: 784, dur: 0.16, type: 'sine', vol: 0.35, delay: 0.09 });
  }
  portalOpen() {
    [523, 659, 784, 1047].forEach((f, i) =>
      this._tone({ freq: f, dur: 0.22, type: 'sine', vol: 0.3, delay: i * 0.07 }));
  }
  levelClear() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      this._tone({ freq: f, dur: 0.28, type: 'triangle', vol: 0.35, delay: i * 0.1 }));
  }
  win() {
    [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) =>
      this._tone({ freq: f, dur: 0.3, type: 'triangle', vol: 0.35, delay: i * 0.12 }));
  }
  gameOver() {
    [392, 330, 262, 196].forEach((f, i) =>
      this._tone({ freq: f, dur: 0.34, type: 'triangle', vol: 0.32, delay: i * 0.16 }));
  }

  // The pickup chime climbs in pitch as the combo grows — the reward you hear.
  pickup(combo) {
    const step = Math.min(combo, 12);
    const base = 660 * Math.pow(2, step / 12);
    this._tone({ freq: base, dur: 0.1, type: 'sine', vol: 0.4 });
    this._tone({ freq: base * 1.5, dur: 0.14, type: 'sine', vol: 0.3, delay: 0.05 });
  }
}
