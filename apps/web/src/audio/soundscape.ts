export type SoundEvent = 'move' | 'turn' | 'collect' | 'interact' | 'blocked' | 'fault' | 'success' | 'ui';

export interface Soundscape {
  play(event: SoundEvent): void;
  startAmbient(): void;
  stopAmbient(): void;
  setVolume(level: number): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

type Wave = OscillatorType;

interface Tone {
  readonly freq: number;
  readonly at: number;
  readonly dur: number;
  readonly gain?: number;
  readonly wave?: Wave;
  readonly slideTo?: number;
}

const AMBIENT_PEAK = 0.06;
const AMBIENT_RAMP_S = 0.3;
const MUTE_RAMP_S = 0.05;

// Every cue is a list of short enveloped tones (seconds relative to trigger time).
// Peaks stay <= 0.35 so stacked cues cannot clip the master bus.
const CUES: Record<SoundEvent, readonly Tone[]> = {
  move: [{ freq: 180, at: 0, dur: 0.08, gain: 0.25, wave: 'triangle', slideTo: 120 }],
  turn: [
    { freq: 440, at: 0, dur: 0.06, gain: 0.2 },
    { freq: 554, at: 0.07, dur: 0.06, gain: 0.2 },
  ],
  collect: [
    { freq: 784, at: 0, dur: 0.1, gain: 0.22 },
    { freq: 1175, at: 0.08, dur: 0.14, gain: 0.22 },
  ],
  interact: [
    { freq: 1200, at: 0, dur: 0.02, gain: 0.15, wave: 'square' },
    { freq: 523, at: 0.03, dur: 0.12, gain: 0.22 },
  ],
  blocked: [{ freq: 110, at: 0, dur: 0.14, gain: 0.3, wave: 'triangle', slideTo: 80 }],
  fault: [
    { freq: 392, at: 0, dur: 0.12, gain: 0.2 },
    { freq: 311, at: 0.13, dur: 0.16, gain: 0.2 },
  ],
  success: [
    { freq: 523, at: 0, dur: 0.14, gain: 0.22 },
    { freq: 659, at: 0.14, dur: 0.14, gain: 0.22 },
    { freq: 784, at: 0.28, dur: 0.14, gain: 0.22 },
    { freq: 1047, at: 0.42, dur: 0.2, gain: 0.22 },
  ],
  ui: [{ freq: 1500, at: 0, dur: 0.03, gain: 0.12, wave: 'square' }],
};

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

const makeContext = (): AudioContext | null => {
  try {
    const Ctor = typeof AudioContext === 'function' ? AudioContext : null;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
};

export const createSoundscape = (): Soundscape => {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let volume = 0.7;
  let muted = false;
  let disposed = false;
  let unavailable = false;

  let ambientNodes: AudioNode[] = [];
  let ambientGain: GainNode | null = null;
  let chirpTimer: ReturnType<typeof setTimeout> | null = null;

  const masterLevel = (): number => (muted ? 0 : volume);

  const ensureContext = (): AudioContext | null => {
    if (disposed || unavailable) return null;
    if (!ctx) {
      ctx = makeContext();
      if (!ctx) {
        unavailable = true;
        return null;
      }
      master = ctx.createGain();
      master.gain.value = masterLevel();
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      void ctx.resume().catch(() => undefined);
    }
    return ctx;
  };

  const voice = (c: AudioContext, out: AudioNode, t: Tone, start: number): void => {
    const osc = c.createOscillator();
    const env = c.createGain();
    const peak = Math.min(0.35, t.gain ?? 0.2);
    const t0 = start + t.at;
    const t1 = t0 + t.dur;
    osc.type = t.wave ?? 'sine';
    osc.frequency.setValueAtTime(t.freq, t0);
    if (t.slideTo) osc.frequency.exponentialRampToValueAtTime(t.slideTo, t1);
    // 5 ms attack, linear decay to silence: no clicks at either edge.
    env.gain.setValueAtTime(0, t0);
    env.gain.linearRampToValueAtTime(peak, t0 + 0.005);
    env.gain.linearRampToValueAtTime(0, t1);
    osc.connect(env).connect(out);
    osc.start(t0);
    osc.stop(t1 + 0.01);
    osc.onended = () => {
      osc.disconnect();
      env.disconnect();
    };
  };

  const play = (event: SoundEvent): void => {
    const c = ensureContext();
    if (!c || !master) return;
    const now = c.currentTime;
    for (const tone of CUES[event]) voice(c, master, tone, now);
  };

  const scheduleChirp = (): void => {
    if (!ctx || !ambientGain) return;
    const c = ctx;
    const out = ambientGain;
    chirpTimer = setTimeout(() => {
      // Two or three quick sine blips around 2-3 kHz read as a distant bird.
      const base = 2000 + Math.random() * 1000;
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i += 1) {
        voice(c, out, { freq: base * (1 + i * 0.12), at: i * 0.09, dur: 0.06, gain: 0.35 }, c.currentTime);
      }
      scheduleChirp();
    }, 6000 + Math.random() * 10000);
  };

  const startAmbient = (): void => {
    const c = ensureContext();
    if (!c || !master || ambientGain) return;

    // Two seconds of white noise, looped, through a slowly wandering low-pass = wind.
    const seconds = 2;
    const buffer = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;

    const noise = c.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    filter.Q.value = 0.7;

    const lfo = c.createOscillator();
    const lfoDepth = c.createGain();
    lfo.type = 'sine';
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = 250;
    lfo.connect(lfoDepth).connect(filter.frequency);

    ambientGain = c.createGain();
    ambientGain.gain.setValueAtTime(0, c.currentTime);
    ambientGain.gain.linearRampToValueAtTime(AMBIENT_PEAK, c.currentTime + AMBIENT_RAMP_S * 3);

    noise.connect(filter).connect(ambientGain).connect(master);
    noise.start();
    lfo.start();
    ambientNodes = [noise, filter, lfo, lfoDepth];
    scheduleChirp();
  };

  const stopAmbient = (): void => {
    if (chirpTimer) {
      clearTimeout(chirpTimer);
      chirpTimer = null;
    }
    if (!ctx || !ambientGain) return;
    const gain = ambientGain;
    const nodes = ambientNodes;
    ambientGain = null;
    ambientNodes = [];
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + AMBIENT_RAMP_S);
    setTimeout(() => {
      for (const n of nodes) {
        if ('stop' in n && typeof (n as AudioScheduledSourceNode).stop === 'function') {
          (n as AudioScheduledSourceNode).stop();
        }
        n.disconnect();
      }
      gain.disconnect();
    }, AMBIENT_RAMP_S * 1000 + 50);
  };

  const applyMaster = (): void => {
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(masterLevel(), now + MUTE_RAMP_S);
  };

  return {
    play,
    startAmbient,
    stopAmbient,
    setVolume: (level) => {
      volume = clamp01(level / 100);
      applyMaster();
    },
    setMuted: (next) => {
      muted = next;
      applyMaster();
    },
    dispose: () => {
      if (disposed) return;
      disposed = true;
      stopAmbient();
      const c = ctx;
      ctx = null;
      master = null;
      if (c) setTimeout(() => void c.close().catch(() => undefined), AMBIENT_RAMP_S * 1000 + 100);
    },
  };
};
