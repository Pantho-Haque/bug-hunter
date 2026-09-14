export type RunnerCommand = {
  name: 'moveForward';
  sequence: number;
};

export type RunnerRequest = {
  runId: number;
  source: string;
  type: 'run';
};

export type RunnerResponse =
  | { type: 'ready' }
  | {
      commands: RunnerCommand[];
      durationMs: number;
      logs: string[];
      runId: number;
      type: 'complete';
    }
  | {
      durationMs: number;
      message: string;
      runId: number;
      type: 'fault';
    };

export function isRunnerResponse(value: unknown): value is RunnerResponse {
  if (!value || typeof value !== 'object' || !('type' in value)) return false;

  const message = value as Record<string, unknown>;
  if (message.type === 'ready') return true;
  if (message.type !== 'complete' && message.type !== 'fault') return false;

  return (
    typeof message.runId === 'number' && typeof message.durationMs === 'number'
  );
}
