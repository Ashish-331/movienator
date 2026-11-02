// Native Web Audio API Sound Synthesizer
// Zero external audio files required - pure procedural audio synthesis!

class SoundSynthesizer {
  constructor() {
    this.ctx = null;
    this.muted = false;

    // Load persisted mute preference
    try {
      const saved = localStorage.getItem('movienator_sound_muted');
      if (saved !== null) {
        this.muted = JSON.parse(saved);
      }
    } catch (e) {
      this.muted = false;
    }
  }

  getAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  isMuted() {
    return this.muted;
  }

  setMuted(muted) {
    this.muted = !!muted;
    try {
      localStorage.setItem('movienator_sound_muted', JSON.stringify(this.muted));
    } catch (e) {
      // ignore
    }
  }

  toggleMute() {
    this.setMuted(!this.muted);
    if (!this.muted) {
      this.playClick();
    }
    return this.muted;
  }

  // Tactile button click
  playClick() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.045);
    } catch (e) {
      // ignore audio errors
    }
  }

  // Mystical crystal chime on new question
  playChime() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Arpeggio notes: D5, F#5, A5, D6
      const freqs = [587.33, 739.99, 880.00, 1174.66];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const overtone = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + idx * 0.06;
        const duration = 0.55;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2.01, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12 / (idx + 1), startTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        overtone.start(startTime);
        osc.stop(startTime + duration);
        overtone.stop(startTime + duration);
      });
    } catch (e) {
      // ignore
    }
  }

  // Transition whoosh / sweep
  playWhoosh() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const bufferSize = ctx.sampleRate * 0.22;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.value = 3.0;

      const now = ctx.currentTime;
      filter.frequency.setValueAtTime(300, now);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.1);
      filter.frequency.exponentialRampToValueAtTime(400, now + 0.22);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.15, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start(now);
      noise.stop(now + 0.23);
    } catch (e) {
      // ignore
    }
  }

  // Celebratory victory fanfare
  playVictory() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // Fanfare chords: C4, E4, G4, C5, E5, G5
      const notes = [
        { f: 261.63, t: 0.00, d: 0.18 },
        { f: 329.63, t: 0.14, d: 0.18 },
        { f: 392.00, t: 0.28, d: 0.22 },
        { f: 523.25, t: 0.44, d: 0.55 },
        { f: 659.25, t: 0.46, d: 0.55 },
        { f: 783.99, t: 0.48, d: 0.70 },
      ];

      notes.forEach(({ f, t, d }) => {
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + t;
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, startTime);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(f * 2, startTime);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.14, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + d);

        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc2.start(startTime);
        osc.stop(startTime + d);
        osc2.stop(startTime + d);
      });
    } catch (e) {
      // ignore
    }
  }

  // Whimsical playful defeat slide
  playDefeat() {
    if (this.muted) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { startF: 350, endF: 300, startT: 0.0, dur: 0.25 },
        { startF: 290, endF: 250, startT: 0.28, dur: 0.25 },
        { startF: 240, endF: 160, startT: 0.56, dur: 0.55 },
      ];

      notes.forEach(({ startF, endF, startT, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = now + startT;
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(startF, startTime);
        osc.frequency.exponentialRampToValueAtTime(endF, startTime + dur);

        // Low-pass filter to soften the brassy sawtooth
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, startTime);
        filter.frequency.exponentialRampToValueAtTime(300, startTime + dur);

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + dur);
      });
    } catch (e) {
      // ignore
    }
  }
}

export const soundEffects = new SoundSynthesizer();
