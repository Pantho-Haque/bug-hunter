import { describe, expect, it } from 'vitest';

import { listAllMissions } from './registry';
import { gradeLevel, looksLikeCode } from './reading-level';

// DR-04: Grade 3 to Grade 5 English baseline for children aged 8 to 12.
const GRADE_CEILING = 5;

interface CopyEntry {
  readonly where: string;
  readonly text: string;
}

const childFacingCopy = (): readonly CopyEntry[] => {
  const entries: CopyEntry[] = [];
  for (const mission of listAllMissions()) {
    const id = mission.identity.levelId;
    const add = (field: string, value: string | undefined) => {
      if (value && value.trim() && !looksLikeCode(value)) {
        entries.push({ where: `${id}.${field}`, text: value });
      }
    };
    add('briefing.storySentence', mission.briefing.storySentence);
    add('briefing.goal', mission.briefing.goal);
    add('briefing.readAloud', mission.briefing.readAloud);
    mission.briefing.checklist.forEach((line, i) => add(`briefing.checklist[${i}]`, line));
    for (const hint of mission.hints) {
      add(`hints.${hint.hintId}.prompt`, hint.prompt);
      add(`hints.${hint.hintId}.reveal`, hint.reveal);
    }
    add('completion.reflectionQuestion', mission.completion.reflectionQuestion);
    // analogousExample is shown to the child (Phase 8 briefing); transferPrompt
    // is authoring metadata for the curriculum owner and is never rendered.
    add('analogousExample.problem', mission.analogousExample.problem);
  }
  return entries;
};

describe('gradeLevel', () => {
  it('scores plain child copy low and dense prose high', () => {
    expect(gradeLevel('The cat sat on the mat.')).toBeLessThan(3);
    expect(
      gradeLevel(
        'Subsequently, the participants demonstrated considerable difficulty comprehending the instructional material presented.',
      ),
    ).toBeGreaterThan(12);
  });

  it('returns null rather than a score for text with no words', () => {
    expect(gradeLevel('   ')).toBeNull();
  });

  it('recognises code so it is never scored as prose', () => {
    expect(looksLikeCode('moveForward();')).toBe(true);
    expect(looksLikeCode('Walk three steps east to reach the beacon.')).toBe(false);
  });
});

describe('authored mission copy', () => {
  it(`reads at or below grade ${GRADE_CEILING}`, () => {
    const tooHard = childFacingCopy()
      .map((entry) => ({ ...entry, grade: gradeLevel(entry.text) ?? 0 }))
      .filter((entry) => entry.grade > GRADE_CEILING)
      .map((entry) => `${entry.where} (grade ${entry.grade}): ${entry.text}`);
    expect(tooHard).toEqual([]);
  });

  it('gives every mission a read-aloud line and a goal', () => {
    for (const mission of listAllMissions()) {
      expect(mission.briefing.goal.trim().length).toBeGreaterThan(0);
      expect(mission.briefing.readAloud?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });
});
