import { z } from 'zod';

const idPattern = /^[a-zA-Z0-9._:-]+$/;

const brandedId = z.string().min(1).regex(idPattern, 'id must be non-empty identifier');

export const levelIdSchema = brandedId;
export const zoneIdSchema = brandedId;
export const missionObjectIdSchema = brandedId;
export const hintIdSchema = brandedId;
export const rewardIdSchema = brandedId;
export const assetIdSchema = brandedId;
export const apiCapabilityIdSchema = brandedId;
export const apiVersionSchema = brandedId;
export const contentVersionSchema = brandedId;
export const schemaVersionSchema = brandedId;
export const runIdSchema = brandedId;

export const missionObjectKindSchema = brandedId;

const localePattern = /^[a-z]{2}-[A-Z]{2}$/;
export const localeCodeSchema = z
  .string()
  .regex(localePattern, 'locale must look like en-US');

export type LocaleCodeSchema = z.infer<typeof localeCodeSchema>;
