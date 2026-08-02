// ─── Hourly chime (synthesized with Web Audio, no assets) ────────────────────

class ChimePlayer {
  private ctx: AudioContext | null = null;

  /** Create/resume the AudioContext. Must be called from a user gesture. */
  ensure(): void {
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  /** Play `count` soft bell strokes (used for the hour count). */
  play(count: number): void {
    this.ensure();
    const ctx = this.ctx;
    if (!ctx || count <= 0) return;
    const start = ctx.currentTime + 0.02;
    const n = Math.min(count, 12);
    for (let i = 0; i < n; i++) {
      const t = start + i * 0.34;
      this.tone(t, 880, 0.9, 0.16);
      this.tone(t, 880 * 2.42, 0.5, 0.06);
    }
    // final longer accent
    this.tone(start + n * 0.34, 1174.66, 1.3, 0.14);
  }

  /** Single stroke — used for the settings "test" button. */
  preview(): void {
    this.ensure();
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    this.tone(t, 880, 0.9, 0.16);
    this.tone(t, 880 * 2.42, 0.5, 0.06);
  }

  private tone(when: number, freq: number, dur: number, vol: number): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(vol, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.05);
  }
}

export const chime = new ChimePlayer();
