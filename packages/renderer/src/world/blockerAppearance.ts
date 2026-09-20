/** Visual height only; collision and unlocking remain owned by the simulation. */
export const blockerAppearance = (object: {
  readonly reasonKey: string;
  readonly unlockedByFlag?: string;
}): 'water' | 'gap' | 'solid' => {
  if (object.unlockedByFlag) return 'solid';
  if (object.reasonKey === 'water.blocks' || object.reasonKey === 'pond.blocks') return 'water';
  if (['ravine.blocks', 'gorge.edge', 'ledge.broken'].includes(object.reasonKey)) return 'gap';
  return 'solid';
};
