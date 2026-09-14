// @vitest-environment jsdom
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { SimulationStateSchema } from '@codequest/domain';

import { PreviewControls } from './PreviewControls';

const state: SimulationStateSchema = {
  avatar: { cellX: 0, cellZ: 0, facing: 'east' },
  collected: [],
  inventory: {},
  flags: {},
  stepCount: 0,
};

describe('renderer / PreviewControls', () => {
  it('emits a nudge when a pad button is pressed', () => {
    const onNudge = vi.fn();
    const { getByLabelText } = render(
      <PreviewControls state={state} onNudge={onNudge} enabled />,
    );
    fireEvent.click(getByLabelText('Move forward'));
    expect(onNudge).toHaveBeenCalledTimes(1);
    expect(onNudge.mock.calls[0][0].direction).toBe('forward');
  });

  it('renders nothing when disabled', () => {
    const onNudge = vi.fn();
    const { container } = render(
      <PreviewControls state={state} onNudge={onNudge} enabled={false} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('binds arrow keys to directions when enabled', () => {
    const onNudge = vi.fn();
    render(<PreviewControls state={state} onNudge={onNudge} enabled />);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(onNudge.mock.calls.some((call) => call[0].direction === 'left')).toBe(true);
  });
});