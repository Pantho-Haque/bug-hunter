export type RunnerCommandKind = 'moveForward' | 'turnLeft' | 'turnRight' | 'collect' | 'interact';

export interface RunnerCommand {
  readonly kind: RunnerCommandKind;
  readonly sourceLine: number;
}

export interface RunnerLog {
  readonly level: 'log' | 'warn' | 'error';
  readonly message: string;
}

export interface RunnerRequest {
  readonly type: 'run';
  readonly runId: string;
  readonly source: string;
  readonly capabilities: readonly RunnerCommandKind[];
}

export type RunnerResponse =
  | { readonly type: 'ready' }
  | { readonly type: 'runStarted'; readonly runId: string }
  | { readonly type: 'commandRequested'; readonly runId: string; readonly command: RunnerCommand }
  | { readonly type: 'log'; readonly runId: string; readonly log: RunnerLog }
  | { readonly type: 'runFinished'; readonly runId: string; readonly durationMs: number }
  | {
      readonly type: 'runFault';
      readonly runId: string;
      readonly code: 'timeout' | 'memory' | 'syntax' | 'blockedApi' | 'cancelled';
      readonly sourceLine?: number;
    };

export const isRunnerResponse = (value: unknown): value is RunnerResponse =>
  typeof value === 'object' && value !== null && 'type' in value;