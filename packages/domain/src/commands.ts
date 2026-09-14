import { z } from 'zod';

export const commandKindSchema = z.enum([
  'moveForward',
  'turnLeft',
  'turnRight',
  'collect',
  'interact',
]);
export type CommandKindSchema = z.infer<typeof commandKindSchema>;

export const gameCommandSchema = z.object({
  commandId: z.string().min(1),
  kind: commandKindSchema,
  sourceLine: z.number().int().nonnegative(),
});
export type GameCommandSchema = z.infer<typeof gameCommandSchema>;

export const commandAppliedEventSchema = z.object({
  type: z.literal('commandApplied'),
  commandId: z.string().min(1),
  sourceLine: z.number().int().nonnegative(),
  command: gameCommandSchema,
  before: z.unknown(),
  after: z.unknown(),
  reasonKey: z.string().min(1),
});
export type CommandAppliedEventSchema = z.infer<typeof commandAppliedEventSchema>;

export const commandRejectedEventSchema = z.object({
  type: z.literal('commandRejected'),
  commandId: z.string().min(1),
  sourceLine: z.number().int().nonnegative(),
  kind: commandKindSchema,
  reasonKey: z.string().min(1),
  suggestionKey: z.string().min(1).optional(),
});
export type CommandRejectedEventSchema = z.infer<typeof commandRejectedEventSchema>;

export const runFaultSchema = z.object({
  type: z.literal('runFault'),
  code: z.enum(['timeout', 'memory', 'syntax', 'blockedApi', 'cancelled']),
  sourceLine: z.number().int().nonnegative().optional(),
  reasonKey: z.string().min(1),
});
export type RunFaultSchema = z.infer<typeof runFaultSchema>;

export const runEventSchema = z.discriminatedUnion('type', [
  commandAppliedEventSchema,
  commandRejectedEventSchema,
  runFaultSchema,
]);
export type RunEventSchema = z.infer<typeof runEventSchema>;

export const runLifecycleStateSchema = z.enum([
  'idle',
  'booting',
  'running',
  'paused',
  'stepping',
  'complete',
  'fault',
  'cancelled',
]);
export type RunLifecycleStateSchema = z.infer<typeof runLifecycleStateSchema>;