// audio.js — every sound is synthesized with WebAudio at the moment it is
// needed: soft footstep taps (the thief's quiet, the wardens' loud enough
// to place them by ear), a rising sting as suspicion climbs, a caught
// chord, and a small chime for the sapphire. No audio files, no network.

export class SoundKit {
  constructor() {
    this.context = null;
    this.muted = false;
    this.lastStepAt = new Map();
  }

  // ensure starts the context on the first user gesture, as browsers ask.
  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.context = new AudioContext();
    }
    if (this.context?.state === 'suspended') this.context.resume();
  }

  tone(freqFrom, freqTo, seconds, type, gainPeak, when = 0) {
    if (!this.context || this.muted) return;
    const t0 = this.context.currentTime + when;
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqTo), t0 + seconds);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
    osc.connect(gain).connect(this.context.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.05);
  }

  // footstep is a short filtered thud; volume scales with how close and
  // how loud the walker is, so a warden's round can be heard coming.
  // Alternate feet sit a shade apart in pitch, like real steps.
  footstep(volume, pitch) {
    if (!this.context || this.muted || volume <= 0.01) return;
    this.otherFoot = !this.otherFoot;
    const footPitch = pitch * (this.otherFoot ? 1.07 : 0.96);
    this.tone(140 * footPitch, 60 * footPitch, 0.07, 'triangle', Math.min(0.22, volume));
  }

  suspicionTick(level) {
    // A soft tick that quickens the pulse as the meter climbs.
    this.tone(660 + level * 500, 660 + level * 500, 0.05, 'square', 0.03 + level * 0.05);
  }

  caught() {
    this.tone(320, 90, 0.5, 'sawtooth', 0.16);
    this.tone(214, 60, 0.6, 'sawtooth', 0.12, 0.05);
  }

  gemTaken() {
    this.tone(880, 880, 0.12, 'sine', 0.12);
    this.tone(1318, 1318, 0.22, 'sine', 0.12, 0.1);
  }

  floorCleared() {
    this.tone(523, 523, 0.14, 'sine', 0.12);
    this.tone(659, 659, 0.14, 'sine', 0.12, 0.12);
    this.tone(784, 784, 0.3, 'sine', 0.12, 0.24);
  }
}
