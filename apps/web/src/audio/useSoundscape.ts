import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createSoundscape } from './soundscape';
import type { SoundEvent, Soundscape } from './soundscape';

export interface UseSoundscapeOptions {
  readonly enabled: boolean;
  readonly volume: number;
  readonly ambient: boolean;
}

export const useSoundscape = ({ enabled, volume, ambient }: UseSoundscapeOptions): Soundscape => {
  const ref = useRef<Soundscape | null>(null);
  // Resolved lazily so StrictMode's mount/unmount/mount cycle gets a fresh instance
  // after the cleanup disposes the first one.
  const get = useCallback((): Soundscape => (ref.current ??= createSoundscape()), []);

  // Browsers block audio until a user gesture; `play` is only ever reached from one,
  // so the first call primes the context and lets the ambient effect start safely.
  const [primed, setPrimed] = useState(false);

  useEffect(() => {
    get().setVolume(volume);
  }, [get, volume]);

  useEffect(() => {
    get().setMuted(!enabled);
  }, [get, enabled]);

  useEffect(() => {
    if (!primed || !ambient || !enabled) return;
    const scape = get();
    scape.startAmbient();
    return () => scape.stopAmbient();
  }, [get, primed, ambient, enabled]);

  useEffect(
    () => () => {
      ref.current?.dispose();
      ref.current = null;
    },
    [],
  );

  const play = useCallback(
    (event: SoundEvent) => {
      if (!enabled) return;
      setPrimed(true);
      get().play(event);
    },
    [get, enabled],
  );

  return useMemo<Soundscape>(
    () => ({
      play,
      startAmbient: () => get().startAmbient(),
      stopAmbient: () => get().stopAmbient(),
      setVolume: (level) => get().setVolume(level),
      setMuted: (muted) => get().setMuted(muted),
      dispose: () => get().dispose(),
    }),
    [get, play],
  );
};
