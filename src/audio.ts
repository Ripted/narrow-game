/**
 * Minimal Web Audio engine: chiptune-style SFX plus a per-zone ambient drone.
 * No external assets or dependencies. The AudioContext is created lazily on the
 * first user gesture so browsers do not block playback.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  muted = false;
  /** Master volume 0..1, applied on top of the internal headroom. */
  private volume = 0.22;

  private ensure(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC: typeof AudioContext | undefined =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : this.volume;
    if (muted) this.stopAmbient();
  }

  /** Sets the master volume (0..1). Unmutes if raised above zero. */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master && !this.muted) this.master.gain.value = this.volume;
  }

  getVolume(): number {
    return this.volume;
  }

  private tone(freq: number, dur: number, type: OscillatorType = 'square', gain = 0.2, slideTo?: number) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), now + dur);
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + dur);
  }

  blip() {
    this.tone(660, 0.06, 'square', 0.15);
  }

  step() {
    this.tone(140 + Math.random() * 40, 0.05, 'triangle', 0.08);
  }

  interact() {
    this.tone(520, 0.08, 'square', 0.18, 720);
  }

  pickup() {
    this.tone(880, 0.09, 'square', 0.2, 1320);
  }

  hit() {
    this.tone(200, 0.12, 'sawtooth', 0.25, 90);
  }

  hurt() {
    this.tone(120, 0.18, 'sawtooth', 0.22, 60);
  }

  /** Short engine growl; pitch tracks speed. */
  engine(pitch: number) {
    this.tone(pitch, 0.1, 'sawtooth', 0.06, pitch * 0.9);
  }

  achievement() {
    this.tone(523, 0.1, 'square', 0.2);
    window.setTimeout(() => this.tone(659, 0.1, 'square', 0.2), 90);
    window.setTimeout(() => this.tone(784, 0.16, 'square', 0.2), 180);
  }

  /** Base frequency of the ambient drone for each zone. */
  private zoneFreq(zone: string): number {
    switch (zone) {
      case 'polish_district': return 55;
      case 'dead_zone': return 40;
      case 'french_cafe': return 98;
      case 'speedrun_track': return 73;
      case 'dev_room': return 33;
      case 'meme_archives': return 82;
      default: return 65;
    }
  }

  setZone(zone: string) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const freq = this.zoneFreq(zone);
    if (!this.ambientOsc) {
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.value = 0.05;
      this.ambientGain.connect(this.master);

      this.ambientOsc = ctx.createOscillator();
      this.ambientOsc.type = 'sine';
      this.ambientOsc.frequency.value = freq;
      this.ambientOsc.connect(this.ambientGain);
      this.ambientOsc.start();

      this.ambientOsc2 = ctx.createOscillator();
      this.ambientOsc2.type = 'triangle';
      this.ambientOsc2.frequency.value = freq * 1.5;
      this.ambientOsc2.connect(this.ambientGain);
      this.ambientOsc2.start();
    } else {
      this.ambientOsc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.3);
      this.ambientOsc2?.frequency.setTargetAtTime(freq * 1.5, ctx.currentTime, 0.3);
    }
  }

  stopAmbient() {
    try {
      this.ambientOsc?.stop();
      this.ambientOsc2?.stop();
    } catch {
      // already stopped
    }
    this.ambientOsc = null;
    this.ambientOsc2 = null;
    this.ambientGain = null;
  }
}
