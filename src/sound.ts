export class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOsc: OscillatorNode | null = null;
  private initialized = false;

  init(): void {
    if (this.initialized) return;
    this.ctx = new AudioContext();
    this.initialized = true;
    this.startAmbient();
  }

  private startAmbient(): void {
    if (!this.ctx) return;

    // Low drone — ominous ambient
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientOsc.type = 'sawtooth';
    this.ambientOsc.frequency.setValueAtTime(38, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.03, this.ctx.currentTime);

    // Low pass filter for warmth
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.ambientOsc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);
    this.ambientOsc.start();
  }

  playInfection(): void {
    if (!this.ctx) return;

    // Short dissonant stab
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(220 + Math.random() * 80, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.3);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  updateNight(nightFactor: number): void {
    if (!this.ambientGain || !this.ambientOsc || !this.ctx) return;
    // Drone gets louder and deeper at night
    const baseGain = 0.03 + nightFactor * 0.04;
    const baseFreq = 38 - nightFactor * 10;
    this.ambientGain.gain.setTargetAtTime(baseGain, this.ctx.currentTime, 0.5);
    this.ambientOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.5);
  }
}
