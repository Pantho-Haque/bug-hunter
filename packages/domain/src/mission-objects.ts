import { z } from 'zod';

import { cellSchema } from './cells';

export const missionObjectKindEnumSchema = z.enum([
  'spawn',
  'goal',
  'collectible',
  'blocker',
  'interactable',
  'trigger',
  'decor',
]);
export type MissionObjectKindEnumSchema = z.infer<typeof missionObjectKindEnumSchema>;

export const collectibleEffectSchema = z.object({
  collectionEffect: z.string().min(1),
  onCollectStateKey: z.string().min(1).optional(),
});
export type CollectibleEffectSchema = z.infer<typeof collectibleEffectSchema>;

export const interactableActionSchema = z.object({
  actionKey: z.string().min(1),
  requiredFacing: z.enum(['north', 'east', 'south', 'west']).optional(),
  range: z.number().int().positive().optional(),
  stateTransitions: z
    .array(
      z.object({
        from: z.string().min(1),
        to: z.string().min(1),
      }),
    )
    .default([]),
});
export type InteractableActionSchema = z.infer<typeof interactableActionSchema>;

export const triggerEffectSchema = z.object({
  condition: z.string().min(1),
  effect: z.string().min(1),
});
export type TriggerEffectSchema = z.infer<typeof triggerEffectSchema>;

export const missionObjectBaseSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  required: z.boolean().default(false),
});

export const spawnObjectSchema = missionObjectBaseSchema.extend({
  kind: z.literal('spawn'),
  cell: cellSchema,
  facing: z.enum(['north', 'east', 'south', 'west']),
});
export type SpawnObjectSchema = z.infer<typeof spawnObjectSchema>;

export const goalObjectSchema = missionObjectBaseSchema.extend({
  kind: z.literal('goal'),
  cell: cellSchema,
  successConditions: z.array(z.string().min(1)).min(1),
});
export type GoalObjectSchema = z.infer<typeof goalObjectSchema>;

export const collectibleObjectSchema = missionObjectBaseSchema.extend({
  kind: z.literal('collectible'),
  cell: cellSchema,
  collectionEffect: z.string().min(1),
});
export type CollectibleObjectSchema = z.infer<typeof collectibleObjectSchema>;

export const blockerObjectSchema = missionObjectBaseSchema.extend({
  kind: z.literal('blocker'),
  occupiedCells: z.array(cellSchema).min(1),
  reasonKey: z.string().min(1),
});
export type BlockerObjectSchema = z.infer<typeof blockerObjectSchema>;

export const interactableObjectSchema = missionObjectBaseSchema.extend({
  kind: z.literal('interactable'),
  cell: cellSchema,
  actionKey: z.string().min(1),
  requiredFacing: z.enum(['north', 'east', 'south', 'west']).optional(),
  range: z.number().int().positive().default(1),
  initialState: z.string().min(1),
  stateTransitions: z
    .array(
      z.object({
        from: z.string().min(1),
        to: z.string().min(1),
      }),
    )
    .default([]),
});
export type InteractableObjectSchema = z.infer<typeof interactableObjectSchema>;

export const triggerObjectSchema = missionObjectBaseSchema.extend({
  kind: z.literal('trigger'),
  cells: z.array(cellSchema).min(1),
  condition: z.string().min(1),
  effect: z.string().min(1),
});
export type TriggerObjectSchema = z.infer<typeof triggerObjectSchema>;

export const decorObjectSchema = missionObjectBaseSchema.extend({
  kind: z.literal('decor'),
  cells: z.array(cellSchema).min(1),
  assetId: z.string().min(1),
  interactive: z.literal(false).default(false),
});
export type DecorObjectSchema = z.infer<typeof decorObjectSchema>;

export const missionObjectSchema = z.discriminatedUnion('kind', [
  spawnObjectSchema,
  goalObjectSchema,
  collectibleObjectSchema,
  blockerObjectSchema,
  interactableObjectSchema,
  triggerObjectSchema,
  decorObjectSchema,
]);
export type MissionObjectSchema = z.infer<typeof missionObjectSchema>;