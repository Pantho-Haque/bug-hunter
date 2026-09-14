import { z } from 'zod';

import {
  commandKindSchema,
  runLifecycleStateSchema,
  runIdSchema,
} from '@codequest/domain';

export const runnerCommandKindSchema = commandKindSchema;
export type RunnerCommandKind = z.infer<typeof runnerCommandKindSchema>;

export const runnerCommandSchema = z.object({
  commandId: z.string().min(1),
  kind: commandKindSchema,
  sourceLine: z.number().int().nonnegative(),
});
export type RunnerCommandSchema = z.infer<typeof runnerCommandSchema>;

export const runnerLogLevelSchema = z.enum(['log', 'warn', 'error']);
export const runnerLogSchema = z.object({
  level: runnerLogLevelSchema,
  message: z.string(),
});
export type RunnerLogSchema = z.infer<typeof runnerLogSchema>;

export const runnerCapabilitiesSchema = z.object({
  apiVersion: z.string().min(1),
  allowedCommandKinds: z.array(commandKindSchema).min(1),
  allowLogs: z.boolean().default(true),
});
export type RunnerCapabilitiesSchema = z.infer<typeof runnerCapabilitiesSchema>;

export const hostToWorkerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('run'),
    runId: runIdSchema,
    source: z.string().max(20_000),
    capabilities: runnerCapabilitiesSchema,
    budgets: z.object({
      memoryBytes: z.number().int().positive(),
      maxInstructions: z.number().int().positive(),
      maxCommands: z.number().int().positive(),
      deadlineMs: z.number().int().positive(),
    }),
  }),
  z.object({ type: z.literal('cancel'), runId: runIdSchema, reason: z.string().min(1) }),
  z.object({ type: z.literal('pause'), runId: runIdSchema }),
  z.object({ type: z.literal('step'), runId: runIdSchema }),
]);
export type HostToWorkerSchema = z.infer<typeof hostToWorkerSchema>;

export const workerToHostSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready') }),
  z.object({ type: z.literal('runStarted'), runId: runIdSchema, apiVersion: z.string().min(1) }),
  z.object({
    type: z.literal('commandRequested'),
    runId: runIdSchema,
    command: runnerCommandSchema,
  }),
  z.object({ type: z.literal('log'), runId: runIdSchema, log: runnerLogSchema }),
  z.object({
    type: z.literal('runFinished'),
    runId: runIdSchema,
    durationMs: z.number().nonnegative(),
    appliedCommands: z.number().int().nonnegative(),
    rejectedCommands: z.number().int().nonnegative(),
  }),
  z.object({
    type: z.literal('runFault'),
    runId: runIdSchema,
    code: z.enum(['timeout', 'memory', 'syntax', 'blockedApi', 'cancelled']),
    sourceLine: z.number().int().nonnegative().optional(),
    reason: z.string().min(1).optional(),
  }),
]);
export type WorkerToHostSchema = z.infer<typeof workerToHostSchema>;

export const lifecycleStateValue = runLifecycleStateSchema;

export const parseHostToWorker = (value: unknown): HostToWorkerSchema => {
  const result = hostToWorkerSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`invalid host→worker message: ${result.error.message}`);
  }
  return result.data;
};

export const parseWorkerToHost = (value: unknown): WorkerToHostSchema => {
  const result = workerToHostSchema.safeParse(value);
  if (!result.success) {
    throw new Error(`invalid worker→host message: ${result.error.message}`);
  }
  return result.data;
};

export const isWorkerToHost = (value: unknown): value is WorkerToHostSchema =>
  workerToHostSchema.safeParse(value).success;

export const isHostToWorker = (value: unknown): value is HostToWorkerSchema =>
  hostToWorkerSchema.safeParse(value).success;