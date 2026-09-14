import { z } from 'zod';

import { DIRECTIONS, type Direction } from './ids';

export const directionSchema = z.enum([...DIRECTIONS] as [Direction, ...Direction[]]);
export type DirectionSchema = z.infer<typeof directionSchema>;

export const cellSchema = z.object({
  cellX: z.number().int(),
  cellZ: z.number().int(),
});
export type CellSchema = z.infer<typeof cellSchema>;

export const avatarStateSchema = z.object({
  cellX: z.number().int(),
  cellZ: z.number().int(),
  facing: directionSchema,
});
export type AvatarStateSchema = z.infer<typeof avatarStateSchema>;

export const collectedSetSchema = z.array(z.string());
export type CollectedSetSchema = z.infer<typeof collectedSetSchema>;

export const inventorySchema = z.record(z.string(), z.number().int().nonnegative());
export type InventorySchema = z.infer<typeof inventorySchema>;

export const flagSetSchema = z.record(z.string(), z.boolean());
export type FlagSetSchema = z.infer<typeof flagSetSchema>;

export const simulationStateSchema = z.object({
  avatar: avatarStateSchema,
  collected: collectedSetSchema,
  inventory: inventorySchema,
  flags: flagSetSchema,
  stepCount: z.number().int().nonnegative(),
});
export type SimulationStateSchema = z.infer<typeof simulationStateSchema>;