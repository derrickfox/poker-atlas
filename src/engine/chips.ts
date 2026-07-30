// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-30T18:14:39-04:00
// Purpose: Converts every chip amount into an exact casino-colour denomination breakdown.
// Reason: Approximate chip piles can contradict the numeric pot and teach beginners the wrong
//         relationship between white, red, green and black chips.

export interface ChipGroup {
  denomination: 100 | 25 | 5 | 1;
  tier: 3 | 2 | 1 | 0;
  count: number;
}

export const CHIP_DENOMINATIONS: readonly Omit<ChipGroup, "count">[] = [
  { denomination: 100, tier: 3 },
  { denomination: 25, tier: 2 },
  { denomination: 5, tier: 1 },
  { denomination: 1, tier: 0 },
];

/** Greedy breakdown is exact for the app's standard $1/$5/$25/$100 casino chip set. */
export function chipBreakdown(amount: number): ChipGroup[] {
  let remainder = Math.max(0, Math.floor(amount));
  const groups: ChipGroup[] = [];

  for (const chip of CHIP_DENOMINATIONS) {
    const count = Math.floor(remainder / chip.denomination);
    if (count === 0) continue;
    groups.push({ ...chip, count });
    remainder -= count * chip.denomination;
  }

  return groups;
}

export function chipBreakdownTotal(groups: readonly ChipGroup[]): number {
  return groups.reduce((total, group) => total + group.denomination * group.count, 0);
}

export function chipBreakdownLabel(groups: readonly ChipGroup[]): string {
  return groups.map((group) => `$${group.denomination} × ${group.count}`).join(", ");
}
