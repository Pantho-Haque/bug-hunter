import { z } from 'zod';

import {
  apiVersionSchema,
  assetIdSchema,
  hintIdSchema,
  levelIdSchema,
  localeCodeSchema,
  rewardIdSchema,
  zoneIdSchema,
} from './ids-schemas';
import { missionObjectSchema } from './mission-objects';
import { simulationStateSchema } from './cells';

export const apiCapabilityRefSchema = z.object({
  capabilityId: z.string().min(1),
  unlockedFromMissionId: levelIdSchema,
  apiVersion: apiVersionSchema,
});
export type ApiCapabilityRefSchema = z.infer<typeof apiCapabilityRefSchema>;

export const briefingContentSchema = z.object({
  storySentence: z.string().min(1).max(200),
  goal: z.string().min(1).max(160),
  requiredCount: z.number().int().nonnegative(),
  optionalCount: z.number().int().nonnegative(),
  newConcepts: z.array(z.string().min(1)).default([]),
  priorConcepts: z.array(z.string().min(1)).default([]),
  controls: z.array(z.string().min(1)).min(1),
  checklist: z.array(z.string().min(1)).min(1),
  readAloud: z.string().min(1).optional(),
  locale: localeCodeSchema.default('en-US' as never),
});
export type BriefingContentSchema = z.infer<typeof briefingContentSchema>;

export const hintSchema = z.object({
  hintId: hintIdSchema,
  stage: z.number().int().min(1).max(4),
  prompt: z.string().min(1),
  reveal: z.string().min(1).optional(),
  scaffold: z.string().optional(),
});
export type HintSchema = z.infer<typeof hintSchema>;

export const exampleMissionSchema = z.object({
  title: z.string().min(1),
  problem: z.string().min(1),
  source: z.string().min(1),
  note: z.string().min(1),
});
export type ExampleMissionSchema = z.infer<typeof exampleMissionSchema>;

export const completionContractSchema = z.object({
  stateInvariants: z.array(z.string().min(1)).min(1),
  requiredObjectIds: z.array(z.string().min(1)).default([]),
  requiredFlags: z.record(z.string(), z.boolean()).default({}),
  requiredCollected: z.array(z.string().min(1)).default([]),
  terminalCell: z
    .object({ cellX: z.number().int(), cellZ: z.number().int() })
    .optional(),
  reflectionQuestion: z.string().min(1).optional(),
});
export type CompletionContractSchema = z.infer<typeof completionContractSchema>;

export const syntaxRuleSchema = z.object({
  ruleKey: z.string().min(1),
  kind: z.enum(['functionDeclared', 'functionCalledWithArgs', 'forLoop', 'whileLoop', 'conditionalBranch', 'arrayIndexed', 'variableUpdate']),
  threshold: z.number().int().nonnegative().default(1),
});
export type SyntaxRuleSchema = z.infer<typeof syntaxRuleSchema>;

export const traceRuleSchema = z.object({
  ruleKey: z.string().min(1),
  expectedSequence: z.array(z.string().min(1)).min(1),
});
export type TraceRuleSchema = z.infer<typeof traceRuleSchema>;

export const conceptEvidenceSchema = z.array(
  z.union([syntaxRuleSchema, traceRuleSchema]),
);
export type ConceptEvidenceSchema = z.infer<typeof conceptEvidenceSchema>;

export const knownSolutionSchema = z.object({
  solutionId: z.string().min(1),
  source: z.string().min(1),
  expectedCommandCount: z.number().int().nonnegative(),
  expectedStepCount: z.number().int().nonnegative(),
  notes: z.string().optional(),
});
export type KnownSolutionSchema = z.infer<typeof knownSolutionSchema>;

export const failureFixtureSchema = z.object({
  fixtureId: z.string().min(1),
  source: z.string().min(1),
  expectedFault: z.enum([
    'syntax',
      'timeout',
      'blockedMove',
      'wrongFacing',
      'outOfRange',
      'emptyCollect',
      'closedGate',
      'runawayLoop',
      'staleVariable',
      'outOfBounds',
    ]),
  reasonKey: z.string().min(1),
  notes: z.string().optional(),
});
export type FailureFixtureSchema = z.infer<typeof failureFixtureSchema>;

export const accessibilityNotesSchema = z.object({
  keyboard: z.string().min(1),
  touch: z.string().min(1).optional(),
  captions: z.string().optional(),
  textScale: z.string().optional(),
  reducedMotion: z.string().min(1),
  screenReader: z.string().min(1),
});
export type AccessibilityNotesSchema = z.infer<typeof accessibilityNotesSchema>;

export const missionBudgetsSchema = z.object({
  maxCommands: z.number().int().positive(),
  maxStepCount: z.number().int().positive(),
  maxMissionObjects: z.number().int().positive().default(30),
  maxTriangles: z.number().int().positive().default(12000),
  estimatedActiveMinutes: z.number().int().positive().max(15),
});
export type MissionBudgetsSchema = z.infer<typeof missionBudgetsSchema>;

export const missionIdentitySchema = z.object({
  levelId: levelIdSchema,
  zoneId: zoneIdSchema,
  apiVersion: apiVersionSchema,
  contentVersion: z.string().min(1),
  ordinal: z.number().int().positive(),
  title: z.string().min(1),
  isCheckpoint: z.boolean().default(false),
  prerequisiteLevelIds: z.array(levelIdSchema).default([]),
});
export type MissionIdentitySchema = z.infer<typeof missionIdentitySchema>;

export const learningContractSchema = z.object({
  primaryConcept: z.string().min(1),
  newConcepts: z.array(z.string().min(1)).default([]),
  priorConcepts: z.array(z.string().min(1)).default([]),
  transferPrompt: z.string().optional(),
});
export type LearningContractSchema = z.infer<typeof learningContractSchema>;

export const missionRewardSchema = z.object({
  rewardId: rewardIdSchema,
  assetId: assetIdSchema,
  label: z.string().min(1),
  cosmetic: z.boolean().default(true),
});
export type MissionRewardSchema = z.infer<typeof missionRewardSchema>;

export const missionPackageSchema = z.object({
  identity: missionIdentitySchema,
  zoneId: zoneIdSchema,
  curriculum: learningContractSchema,
  startState: simulationStateSchema,
  objects: z.array(missionObjectSchema).min(1),
  allowedApi: z.array(apiCapabilityRefSchema).min(1),
  briefing: briefingContentSchema,
  starterCode: z.string(),
  hints: z.tuple([hintSchema, hintSchema, hintSchema, hintSchema]),
  analogousExample: exampleMissionSchema,
  completion: completionContractSchema,
  conceptEvidence: conceptEvidenceSchema,
  knownSolutions: z.array(knownSolutionSchema).min(1),
  expectedFailures: z.array(failureFixtureSchema).default([]),
  accessibility: accessibilityNotesSchema,
  budgets: missionBudgetsSchema,
  rewards: z.array(missionRewardSchema).default([]),
});
export type MissionPackageSchema = z.infer<typeof missionPackageSchema>;