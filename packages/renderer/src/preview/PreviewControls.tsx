import { useEffect, useRef } from 'react';

import type { SimulationStateSchema } from '@codequest/domain';

export type PreviewDirection = 'forward' | 'backward' | 'left' | 'right';

export interface PreviewNudge {
  readonly direction: PreviewDirection;
  readonly id: number;
}

export interface PreviewControlsProps {
  readonly state: SimulationStateSchema;
  readonly onNudge: (nudge: PreviewNudge) => void;
  readonly enabled: boolean;
}

const keyToDirection: Record<string, PreviewDirection> = {
  w: 'forward',
  arrowup: 'forward',
  s: 'backward',
  arrowdown: 'backward',
  a: 'left',
  arrowleft: 'left',
  d: 'right',
  arrowright: 'right',
};

export function PreviewControls({ state, onNudge, enabled }: PreviewControlsProps) {
  const nudgeIdRef = useRef(0);
  void state;

  useEffect(() => {
    if (!enabled) return undefined;
    const activeKeys = new Set<string>();
    let lastFire = 0;

    const fire = (direction: PreviewDirection) => {
      nudgeIdRef.current += 1;
      onNudge({ direction, id: nudgeIdRef.current });
      lastFire = performance.now();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as Element | null;
      const isTextField =
        target !== null &&
        typeof target.matches === 'function' &&
        target.matches('textarea, input, select, [contenteditable="true"]');
      if (isTextField) return;
      const direction = keyToDirection[event.key.toLowerCase()];
      if (!direction) return;
      event.preventDefault();
      if (activeKeys.has(event.key.toLowerCase())) return;
      activeKeys.add(event.key.toLowerCase());
      if (performance.now() - lastFire > 180) {
        fire(direction);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      activeKeys.delete(event.key.toLowerCase());
    };

    const handleBlur = () => {
      activeKeys.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, onNudge]);

  if (!enabled) return null;

  const buttons: readonly { direction: PreviewDirection; label: string; glyph: string; className: string }[] = [
    { direction: 'forward', label: 'Move forward', glyph: '↑', className: 'preview-pad-up' },
    { direction: 'left', label: 'Move left', glyph: '←', className: 'preview-pad-left' },
    { direction: 'backward', label: 'Move backward', glyph: '↓', className: 'preview-pad-down' },
    { direction: 'right', label: 'Move right', glyph: '→', className: 'preview-pad-right' },
  ];

  return (
    <div className="preview-pad" aria-label="Preview movement pad" role="group">
      {buttons.map((button) => (
        <button
          key={button.direction}
          aria-label={button.label}
          className={`preview-pad-button ${button.className}`}
          onClick={() => {
            nudgeIdRef.current += 1;
            onNudge({ direction: button.direction, id: nudgeIdRef.current });
          }}
          type="button"
        >
          <span aria-hidden="true">{button.glyph}</span>
        </button>
      ))}
    </div>
  );
}