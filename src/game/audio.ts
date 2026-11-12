/**
 * An original, quiet pentatonic forest melody, synthesized in the browser.
 * No recordings, third-party music, or remote audio resources are used.
 * Call unlock() from a pointer/keyboard gesture before enabling playback.
 */

export type SoundEffect = 'collect' | 'bloom' | 'magic' | 'complete' | 'click' | 'surprise';

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
type Voice = { oscillator: OscillatorNode; envelope: GainNode };

const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// A deliberately sparse original phrase: rests leave room for the forest.
const MELODY: readonly (number | null)[] = [
  72, null, 76, 79, null, 76, 74, null,
  69, null, 72, 76, null, 74, 72, null,
  67, null, 72, 74, null, 76, 79, null,
  76, null, 74, 72, null, 69, 67, null,
];
const BEAT = 0.82;

export class GameAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = false;
  private unlocked = false;
  private timer: ReturnType<typeof setInterval> | null = null;
  private voices = new Set<Voice>();
  private nextNoteAt = 0;
  private noteIndex = 0;
  private listening = false;
  private resumePending: Promise<void> | null = null;

  private onVisibility = () => {
    if (typeof document !== 'undefined' && document.hidden) this.pause();
    else this.start();
  };

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled) this.start();
    else this.pause();
  }

  /** Safe to call on every user gesture, including when the sound is muted. */
  unlock(): void {
    this.unlocked = true;
    if (!this.listening && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
      this.listening = true;
    }
    this.start();
  }

  private ensureContext(): AudioContext | null {
    if (this.context?.state !== 'closed' && this.context) return this.context;
    if (typeof window === 'undefined') return null;
    const Constructor = window.AudioContext || (window as AudioWindow).webkitAudioContext;
    if (!Constructor) return null;
    try {
      const context = new Constructor();
      const master = context.createGain();
      master.gain.value = 0.32;
      master.connect(context.destination);
      this.context = context;
      this.master = master;
      return context;
    } catch {
      // Some embedded/mobile browsers do not expose an audio output device.
      return null;
    }
  }

  private mayPlay(): boolean {
    return this.enabled && this.unlocked && (typeof document === 'undefined' || !document.hidden);
  }

  private start(): void {
    if (!this.mayPlay() || this.timer || this.resumePending) return;
    const context = this.ensureContext();
    if (!context) return;
    this.resumePending = (async () => {
      try {
        if (context.state === 'suspended') await context.resume();
        if (this.context !== context || context.state !== 'running' || !this.mayPlay() || this.timer) return;
        this.nextNoteAt = context.currentTime + 0.08;
        this.schedule();
        this.timer = setInterval(() => this.schedule(), 180);
      } catch {
        // A later deliberate gesture can retry if browser autoplay policy intervenes.
      }
    })().finally(() => { this.resumePending = null; });
  }

  private schedule(): void {
    const context = this.context;
    if (!context || context.state !== 'running' || !this.mayPlay()) return;
    // Do not queue a backlog after a browser tab or device has been asleep.
    if (this.nextNoteAt < context.currentTime - BEAT) this.nextNoteAt = context.currentTime + 0.03;
    while (this.nextNoteAt < context.currentTime + 0.45) {
      const note = MELODY[this.noteIndex % MELODY.length];
      if (note !== null) {
        this.tone(note, this.nextNoteAt, 1.45, 0.11, 'sine', 0.06);
        // Very soft overtone gives the melody a little bell-like sparkle.
        this.tone(note + 12, this.nextNoteAt + 0.012, 0.8, 0.012, 'sine', 0.015);
      }
      if (this.noteIndex % 8 === 0) {
        const chord = this.noteIndex % 32 < 16 ? [48, 55, 64] : [45, 52, 60];
        for (const chordNote of chord) this.tone(chordNote, this.nextNoteAt, BEAT * 8 + 0.5, 0.035, 'sine', 0.7);
      }
      this.noteIndex += 1;
      this.nextNoteAt += BEAT;
    }
  }

  private tone(
    midi: number,
    when: number,
    duration: number,
    volume: number,
    type: OscillatorType = 'sine',
    attack = 0.015,
  ): void {
    const context = this.context;
    if (!context || !this.master || context.state === 'closed') return;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency(midi), when);
    envelope.gain.setValueAtTime(0, when);
    envelope.gain.linearRampToValueAtTime(volume, when + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + Math.max(duration, attack + 0.04));
    oscillator.connect(envelope);
    envelope.connect(this.master);
    const voice = { oscillator, envelope };
    this.voices.add(voice);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.voices.delete(voice);
    };
    oscillator.start(when);
    oscillator.stop(when + duration + 0.05);
  }

  effect(kind: SoundEffect): void {
    if (!this.mayPlay()) return;
    const context = this.context;
    if (!context || context.state !== 'running') {
      this.start();
      return;
    }
    const now = context.currentTime + 0.005;
    const patterns: Record<SoundEffect, readonly number[]> = {
      collect: [79, 84],
      bloom: [72, 76, 79, 84],
      magic: [76, 79, 83, 88],
      complete: [72, 76, 79, 84, 88],
      click: [79],
      surprise: [67, 72, 76, 79, 84, 88, 91],
    };
    patterns[kind].forEach((note, index) => {
      this.tone(note, now + index * (kind === 'click' ? 0.03 : 0.11), kind === 'click' ? 0.11 : 0.68, 0.18, 'sine');
    });
  }

  private pause(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    for (const voice of this.voices) {
      voice.oscillator.onended = null;
      try { voice.oscillator.stop(); } catch { /* Already stopped. */ }
      voice.oscillator.disconnect();
      voice.envelope.disconnect();
    }
    this.voices.clear();
    if (this.context?.state === 'running') void this.context.suspend().catch(() => undefined);
  }

  dispose(): void {
    this.pause();
    if (this.listening && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }
    this.listening = false;
    const context = this.context;
    this.context = null;
    this.master = null;
    this.unlocked = false;
    this.noteIndex = 0;
    this.resumePending = null;
    if (context && context.state !== 'closed') void context.close().catch(() => undefined);
  }
}

export const audio = new GameAudio();

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

export function stopSpeech(): void {
  if (speechSupported) window.speechSynthesis.cancel();
}

/** Reads a discovered message; pronunciation depends on installed browser voices. */
export function speak(text: string): void {
  if (!speechSupported || !text.trim()) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(
    text.replace(/\{name\}/g, '').replace(/[🌼🍄🎂😄✨🎁🧭📖]/gu, ''),
  );
  utterance.lang = 'ro-RO';
  utterance.rate = 0.92;
  utterance.pitch = 1.17;
  utterance.volume = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const romanian = voices.find(voice => /^ro(-|_)/i.test(voice.lang))
    ?? voices.find(voice => /^ro$/i.test(voice.lang));
  if (romanian) utterance.voice = romanian;
  try { window.speechSynthesis.speak(utterance); } catch { /* Text remains available on screen. */ }
}
