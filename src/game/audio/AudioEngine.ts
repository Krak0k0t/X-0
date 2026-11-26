export type MusicContext = 'menu' | 'race_calm' | 'race_intense' | 'finale';

export interface MusicTrackInfo {
  index: number;
  context: MusicContext;
  title: string;
  tempoBpm: number;
  rootHz: number;
  scaleIntervals: number[];
}

export const MUSIC_TRACKS: MusicTrackInfo[] = [
  {
    index: 0,
    context: 'menu',
    title: 'Orbital Quarantine',
    tempoBpm: 72,
    rootHz: 110, // A2
    scaleIntervals: [0, 2, 3, 7, 8, 12],
  },
  {
    index: 1,
    context: 'race_calm',
    title: 'Crystal Dust Drive',
    tempoBpm: 116,
    rootHz: 130.81, // C3
    scaleIntervals: [0, 3, 5, 7, 10, 12],
  },
  {
    index: 2,
    context: 'race_intense',
    title: 'Needle Resonance',
    tempoBpm: 136,
    rootHz: 98.0, // G2
    scaleIntervals: [0, 1, 5, 7, 8, 12],
  },
  {
    index: 3,
    context: 'finale',
    title: 'Voice in the Iron',
    tempoBpm: 92,
    rootHz: 146.83, // D3
    scaleIntervals: [0, 2, 5, 7, 9, 12],
  },
];

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private musicGainA: GainNode | null = null;
  private musicGainB: GainNode | null = null;
  private activeBus: 'A' | 'B' = 'A';
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  private schedulerTimer: number | null = null;
  private stepCount = 0;
  private isInitialized = false;

  public isPlaying = false;
  public currentTrackIndex = 0;
  public volume = 0.55;
  public muted = false;
  private lastRustleAt = 0;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    if (!this.isInitialized && this.ctx) {
      this.isInitialized = true;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.value = 0.14;
      this.ambientGain.connect(this.masterGain);

      this.musicGainA = this.ctx.createGain();
      this.musicGainA.gain.value = 0.35;
      this.musicGainA.connect(this.masterGain);

      this.musicGainB = this.ctx.createGain();
      this.musicGainB.gain.value = 0.0;
      this.musicGainB.connect(this.masterGain);

      this.startIndependentAmbient();
    }
    return this.ctx;
  }

  private startIndependentAmbient(): void {
    if (!this.ctx || !this.ambientGain) return;
    // Streaming noise buffer (small 2s loop, zero external downloads)
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 2.4;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 260;
    filter.Q.value = 1.4;

    noise.connect(filter);
    filter.connect(this.ambientGain);
    noise.start();
  }

  public unlockAndPlayMenu(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startSequencer();
    }
  }

  public setVolume(vol: number, withRustle = false): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.04,
      );
    }
    if (withRustle) {
      const now = performance.now();
      if (now - this.lastRustleAt > 65) {
        this.lastRustleAt = now;
        this.playRustle();
      }
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.ctx.currentTime,
        0.05,
      );
    }
  }

  public togglePlay(): boolean {
    const ctx = this.ensureContext();
    if (!ctx) return this.isPlaying;
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying) {
      this.startSequencer();
    } else if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    return this.isPlaying;
  }

  public nextTrack(): MusicTrackInfo {
    const nextIdx = (this.currentTrackIndex + 1) % MUSIC_TRACKS.length;
    this.crossfadeToTrack(nextIdx);
    return MUSIC_TRACKS[nextIdx];
  }

  public setContext(context: MusicContext): void {
    const found = MUSIC_TRACKS.findIndex((t) => t.context === context);
    if (found >= 0 && found !== this.currentTrackIndex) {
      this.crossfadeToTrack(found);
    }
  }

  private crossfadeToTrack(nextIdx: number): void {
    const ctx = this.ensureContext();
    this.currentTrackIndex = nextIdx;
    if (!ctx || !this.musicGainA || !this.musicGainB) return;

    // 2.5-second smooth crossfade between buses A and B
    const now = ctx.currentTime;
    const outgoing = this.activeBus === 'A' ? this.musicGainA : this.musicGainB;
    const incoming = this.activeBus === 'A' ? this.musicGainB : this.musicGainA;
    this.activeBus = this.activeBus === 'A' ? 'B' : 'A';

    outgoing.gain.cancelScheduledValues(now);
    outgoing.gain.setValueAtTime(outgoing.gain.value, now);
    outgoing.gain.linearRampToValueAtTime(0, now + 2.5);

    incoming.gain.cancelScheduledValues(now);
    incoming.gain.setValueAtTime(incoming.gain.value, now);
    incoming.gain.linearRampToValueAtTime(0.36, now + 2.5);
  }

  private startSequencer(): void {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
    }
    this.schedulerTimer = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || this.ctx.state !== 'running') return;
      this.scheduleStep();
    }, 220);
  }

  private scheduleStep(): void {
    if (!this.ctx) return;
    const track = MUSIC_TRACKS[this.currentTrackIndex];
    const bus = this.activeBus === 'A' ? this.musicGainA : this.musicGainB;
    if (!bus) return;

    const now = this.ctx.currentTime;
    const step = this.stepCount++;

    // Deep pad bass on beat 0 and 4
    if (step % 4 === 0) {
      const interval = track.scaleIntervals[(step / 4) % track.scaleIntervals.length];
      const freq = track.rootHz * Math.pow(2, interval / 12);
      this.triggerTone(bus, freq, now, 0.85, 'triangle', 0.18);
    }

    // Melodic arpeggio shimmer
    if (step % 2 === 0 || track.context === 'race_intense') {
      const idx = (step * 3 + Math.floor(step / 8)) % track.scaleIntervals.length;
      const freq = track.rootHz * 2 * Math.pow(2, track.scaleIntervals[idx] / 12);
      this.triggerTone(bus, freq, now, 0.28, 'sine', 0.08);
    }

    // Subtle percussive pulse during races
    if (track.context === 'race_calm' || track.context === 'race_intense') {
      if (step % 2 === 0) {
        this.triggerTone(bus, 62, now, 0.09, 'sine', 0.14);
      }
    }
  }

  private triggerTone(
    dest: AudioNode,
    freq: number,
    time: number,
    duration: number,
    type: OscillatorType,
    peakGain: number,
  ): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);

    g.gain.setValueAtTime(0.0001, time);
    g.gain.linearRampToValueAtTime(peakGain, time + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(g);
    g.connect(dest);
    osc.start(time);
    osc.stop(time + duration + 0.02);
  }

  public playUiClick(pitchShift = 1): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    this.triggerTone(this.masterGain, 320 * pitchShift, now, 0.07, 'triangle', 0.12);
    this.triggerTone(this.masterGain, 640 * pitchShift, now, 0.04, 'sine', 0.06);
  }

  public playStartResonance(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    // Deep, warm ceremonial gong/start resonance
    this.triggerTone(this.masterGain, 110, now, 0.9, 'sine', 0.25);
    this.triggerTone(this.masterGain, 165, now + 0.05, 0.75, 'triangle', 0.14);
    this.triggerTone(this.masterGain, 220, now + 0.1, 0.65, 'sine', 0.10);
  }

  private playRustle(): void {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.triggerTone(this.masterGain, 900 + Math.random() * 250, now, 0.03, 'sine', 0.03);
  }

  public updateEngineHum(active: boolean, speedNorm: number): void {
    if (!active) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
      }
      return;
    }
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    if (!this.engineOsc || !this.engineGain) {
      this.engineOsc = ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 240;
      this.engineGain = ctx.createGain();
      this.engineGain.gain.value = 0.0001;
      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);
      this.engineOsc.start();
    }
    const targetFreq = 46 + Math.min(1.4, Math.max(0, speedNorm)) * 78;
    this.engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.06);
    this.engineGain.gain.setTargetAtTime(0.04 + speedNorm * 0.04, ctx.currentTime, 0.06);
  }

  public playImpact(weight = 1): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const jitter = 0.92 + Math.random() * 0.16;
    this.triggerTone(this.masterGain, 85 * jitter, now, 0.18, 'sawtooth', 0.2 * weight);
    this.triggerTone(this.masterGain, 52 * jitter, now, 0.24, 'sine', 0.28 * weight);
  }

  public playHop(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.16);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playMutationSound(isIncident: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;
    if (isIncident) {
      this.triggerTone(this.masterGain, 155, now, 0.35, 'sawtooth', 0.18);
      this.triggerTone(this.masterGain, 112, now + 0.08, 0.35, 'square', 0.14);
    } else {
      this.triggerTone(this.masterGain, 293.66, now, 0.35, 'sine', 0.14);
      this.triggerTone(this.masterGain, 440.0, now + 0.07, 0.4, 'triangle', 0.12);
      this.triggerTone(this.masterGain, 587.33, now + 0.14, 0.45, 'sine', 0.10);
    }
  }

  public dispose(): void {
    if (this.schedulerTimer !== null) {
      window.clearInterval(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    if (this.engineOsc) {
      try {
        this.engineOsc.stop();
      } catch {
        // ignore
      }
      this.engineOsc = null;
    }
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
