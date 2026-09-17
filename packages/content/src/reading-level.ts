/**
 * Flesch–Kincaid grade level for authored child-facing copy.
 *
 * DR-04 sets the baseline at Grade 3 to Grade 5 English. This is a blunt
 * instrument — it counts syllables, not comprehension — but it catches the copy
 * that drifts obviously above the baseline, which is otherwise only found by
 * spending a child's session on it.
 */
const syllables = (word: string): number => {
  const clean = word.toLowerCase().replace(/[^a-z]/g, '');
  if (clean.length === 0) return 0;
  if (clean.length <= 3) return 1;
  const groups = clean
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '')
    .match(/[aeiouy]{1,2}/g);
  return groups ? groups.length : 1;
};

/** Returns null for text with no words, so callers can skip it rather than score it. */
export const gradeLevel = (text: string): number | null => {
  const sentences = text.split(/[.!?]+/).filter((part) => part.trim().length > 0).length || 1;
  const words = text.split(/\s+/).filter((word) => /[a-z]/i.test(word));
  if (words.length === 0) return null;
  const syllableCount = words.reduce((sum, word) => sum + syllables(word), 0);
  return (
    Math.round(
      (0.39 * (words.length / sentences) + 11.8 * (syllableCount / words.length) - 15.59) * 10,
    ) / 10
  );
};

/** Code samples are not prose and must never be scored for reading level. */
export const looksLikeCode = (text: string): boolean => /[;{}()]|=>|\bfunction\b/.test(text);
