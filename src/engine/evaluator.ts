// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Hand evaluation for every ranking system in the atlas — standard high, short-deck high
//          (flush beats a boat), ace-to-five low (Razz / 8-or-better), deuce-to-seven low, and Badugi.
// Reason: Variants differ mostly in *how a hand is scored*, so centralising all five ranking systems
//         here lets one generic game engine serve ~25 variants instead of one engine per variant.

import { type Card, RANK_WORD, combinations } from "./cards";

/* ------------------------------------------------------------------ high hands */

export const HI_CATEGORY = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIR: 2,
  TRIPS: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  QUADS: 7,
  STRAIGHT_FLUSH: 8,
} as const;

const HI_CATEGORY_NAME = [
  "high card",
  "a pair",
  "two pair",
  "three of a kind",
  "a straight",
  "a flush",
  "a full house",
  "four of a kind",
  "a straight flush",
];

export interface HandScore {
  /** Ordering key: compare `value` arrays lexicographically, higher wins. */
  value: number[];
  label: string;
  cards: Card[];
  /** False when the hand fails a qualifier (e.g. no 8-or-better low). */
  qualifies: boolean;
}

export type HiRuleset = "standard" | "shortdeck";

const NO_HAND: HandScore = { value: [-1], label: "no qualifying hand", cards: [], qualifies: false };

export function noHand(): HandScore {
  return NO_HAND;
}

export function compareScores(a: HandScore, b: HandScore): number {
  if (a.qualifies !== b.qualifies) return a.qualifies ? 1 : -1;
  const len = Math.max(a.value.length, b.value.length);
  for (let i = 0; i < len; i++) {
    const av = a.value[i] ?? 0;
    const bv = b.value[i] ?? 0;
    if (av !== bv) return av > bv ? 1 : -1;
  }
  return 0;
}

interface RankGroup {
  rank: number;
  count: number;
}

function groupByRank(cards: Card[]): RankGroup[] {
  const counts = new Map<number, number>();
  for (const card of cards) counts.set(card.rank, (counts.get(card.rank) ?? 0) + 1);
  return [...counts.entries()]
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || b.rank - a.rank);
}

/**
 * Highest card of a 5-card straight, or 0 if there isn't one.
 * Handles both wheels: A-2-3-4-5 (high card 5) in a full deck and A-6-7-8-9 (high card 9)
 * in a short deck, where the ace plays below the six.
 */
function straightHigh(ranks: number[], shortDeck: boolean): number {
  const unique = [...new Set(ranks)].sort((a, b) => b - a);
  if (unique.length < 5) return 0;
  for (let i = 0; i + 4 < unique.length; i++) {
    if (unique[i] - unique[i + 4] === 4) return unique[i];
  }
  const wheelLow = shortDeck ? [9, 8, 7, 6] : [5, 4, 3, 2];
  if (unique.includes(14) && wheelLow.every((r) => unique.includes(r))) return wheelLow[0];
  return 0;
}

/** Score exactly five cards under high-hand rules. */
export function scoreFiveHigh(cards: Card[], ruleset: HiRuleset = "standard"): HandScore {
  const shortDeck = ruleset === "shortdeck";
  const ranks = cards.map((c) => c.rank);
  const groups = groupByRank(cards);
  const isFlush = cards.every((c) => c.suit === cards[0].suit);
  const straight = straightHigh(ranks, shortDeck);

  let category: number;
  let kickers: number[];

  if (isFlush && straight) {
    category = HI_CATEGORY.STRAIGHT_FLUSH;
    kickers = [straight];
  } else if (groups[0].count === 4) {
    category = HI_CATEGORY.QUADS;
    kickers = [groups[0].rank, groups[1].rank];
  } else if (groups[0].count === 3 && groups[1]?.count === 2) {
    category = HI_CATEGORY.FULL_HOUSE;
    kickers = [groups[0].rank, groups[1].rank];
  } else if (isFlush) {
    category = HI_CATEGORY.FLUSH;
    kickers = [...ranks].sort((a, b) => b - a);
  } else if (straight) {
    category = HI_CATEGORY.STRAIGHT;
    kickers = [straight];
  } else if (groups[0].count === 3) {
    category = HI_CATEGORY.TRIPS;
    kickers = [groups[0].rank, ...groups.slice(1).map((g) => g.rank)];
  } else if (groups[0].count === 2 && groups[1]?.count === 2) {
    category = HI_CATEGORY.TWO_PAIR;
    kickers = [groups[0].rank, groups[1].rank, groups[2].rank];
  } else if (groups[0].count === 2) {
    category = HI_CATEGORY.PAIR;
    kickers = [groups[0].rank, ...groups.slice(1).map((g) => g.rank)];
  } else {
    category = HI_CATEGORY.HIGH_CARD;
    kickers = [...ranks].sort((a, b) => b - a);
  }

  // Short deck reorders the ladder: with 16 cards removed a flush is harder to make than a
  // full house, so the two swap places. Everything else keeps its normal rank.
  let ordered = category;
  if (shortDeck) {
    if (category === HI_CATEGORY.FLUSH) ordered = HI_CATEGORY.FULL_HOUSE;
    else if (category === HI_CATEGORY.FULL_HOUSE) ordered = HI_CATEGORY.FLUSH;
  }

  return {
    value: [ordered, ...kickers],
    label: describeHigh(category, kickers),
    cards: cards.slice(),
    qualifies: true,
  };
}

function describeHigh(category: number, kickers: number[]): string {
  const word = (r: number) => RANK_WORD[r];
  const plural = (r: number) => (r === 6 ? "sixes" : `${word(r)}s`);
  switch (category) {
    case HI_CATEGORY.STRAIGHT_FLUSH:
      return kickers[0] === 14 ? "a royal flush" : `a straight flush, ${word(kickers[0])} high`;
    case HI_CATEGORY.QUADS:
      return `four ${plural(kickers[0])}`;
    case HI_CATEGORY.FULL_HOUSE:
      return `a full house, ${plural(kickers[0])} full of ${plural(kickers[1])}`;
    case HI_CATEGORY.FLUSH:
      return `a flush, ${word(kickers[0])} high`;
    case HI_CATEGORY.STRAIGHT:
      return `a straight, ${word(kickers[0])} high`;
    case HI_CATEGORY.TRIPS:
      return `three ${plural(kickers[0])}`;
    case HI_CATEGORY.TWO_PAIR:
      return `two pair, ${plural(kickers[0])} and ${plural(kickers[1])}`;
    case HI_CATEGORY.PAIR:
      return `a pair of ${plural(kickers[0])}`;
    default:
      return `${word(kickers[0])} high`;
  }
}

export function categoryName(score: HandScore): string {
  return HI_CATEGORY_NAME[score.value[0]] ?? "no hand";
}

/* ------------------------------------------------------------------- low hands */

/** Ace-to-five: aces are low, straights and flushes are ignored. Used by Razz and 8-or-better. */
export function scoreFiveLowA5(cards: Card[], eightOrBetter: boolean): HandScore {
  const ranks = cards.map((c) => (c.rank === 14 ? 1 : c.rank));
  const counts = new Map<number, number>();
  for (const rank of ranks) counts.set(rank, (counts.get(rank) ?? 0) + 1);
  const paired = counts.size < 5;
  const sortedDesc = [...ranks].sort((a, b) => b - a);

  if (eightOrBetter && (paired || sortedDesc[0] > 8)) {
    return { value: [-1], label: "no low", cards: [], qualifies: false };
  }

  // Straights and flushes are ignored, so the only thing that can hurt an A-5 low is pairing.
  // Rank the pairing pattern with the normal high-hand ladder, then invert everything: lower
  // category wins, and within a category the lower ranks win.
  const groups = [...counts.entries()]
    .map(([rank, count]) => ({ rank, count }))
    .sort((a, b) => b.count - a.count || a.rank - b.rank);
  const category =
    groups[0].count === 4
      ? HI_CATEGORY.QUADS
      : groups[0].count === 3 && groups[1]?.count === 2
        ? HI_CATEGORY.FULL_HOUSE
        : groups[0].count === 3
          ? HI_CATEGORY.TRIPS
          : groups[0].count === 2 && groups[1]?.count === 2
            ? HI_CATEGORY.TWO_PAIR
            : groups[0].count === 2
              ? HI_CATEGORY.PAIR
              : HI_CATEGORY.HIGH_CARD;

  // Duplicated ranks lead (lowest pair wins), then loose cards from the top down.
  const ordered: number[] = [];
  for (const group of groups.filter((g) => g.count > 1)) {
    for (let i = 0; i < group.count; i++) ordered.push(group.rank);
  }
  ordered.push(
    ...groups
      .filter((g) => g.count === 1)
      .map((g) => g.rank)
      .sort((a, b) => b - a),
  );

  return {
    value: [-category, ...ordered.map((r) => -r)],
    label: paired
      ? `${describeLowPaired(category)} — a rough low`
      : `${sortedDesc[0]}-low (${sortedDesc.join("-")})`,
    cards: cards.slice(),
    qualifies: true,
  };
}

function describeLowPaired(category: number): string {
  if (category >= HI_CATEGORY.TRIPS) return "trips or better";
  return category === HI_CATEGORY.TWO_PAIR ? "two pair" : "a pair";
}

/** Deuce-to-seven: aces are always high, straights and flushes count against you. */
export function scoreFiveLow27(cards: Card[]): HandScore {
  const high = scoreFiveHigh(cards, "standard");
  const sorted = cards.map((c) => c.rank).sort((a, b) => b - a);
  return {
    value: high.value.map((v) => -v),
    label: `${sorted.join("-")} low`,
    cards: cards.slice(),
    qualifies: true,
  };
}

/**
 * Badugi: find the largest subset of cards with all-distinct ranks *and* all-distinct suits.
 * A four-card badugi beats any three-card hand; ties break on the lowest cards, ace low.
 */
export function scoreBadugi(cards: Card[]): HandScore {
  let best: { size: number; ranks: number[]; cards: Card[] } | null = null;
  for (let size = Math.min(4, cards.length); size >= 1; size--) {
    for (const combo of combinations(cards, size)) {
      const ranks = combo.map((c) => (c.rank === 14 ? 1 : c.rank));
      const suits = combo.map((c) => c.suit);
      if (new Set(ranks).size !== size || new Set(suits).size !== size) continue;
      const sorted = [...ranks].sort((a, b) => b - a);
      if (
        !best ||
        best.size < size ||
        (best.size === size && compareArrays(sorted, best.ranks) < 0)
      ) {
        best = { size, ranks: sorted, cards: combo };
      }
    }
    if (best) break; // Largest size always wins, so stop as soon as one exists.
  }
  if (!best) return noHand();
  const noun = best.size === 4 ? "badugi" : `${best.size}-card hand`;
  return {
    value: [best.size, ...best.ranks.map((r) => -r)],
    label: `${best.ranks.join("-")} ${noun}`,
    cards: best.cards,
    qualifies: true,
  };
}

function compareArrays(a: number[], b: number[]): number {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/* -------------------------------------------------------------- best-of-N search */

export type HiRankingId = "high" | "shortdeck" | "none";
export type LoRankingId = "none" | "a5-8ob" | "a5-any" | "deuce-seven" | "badugi";

export interface SelectionRule {
  /** Exact number of hole cards that must play (Omaha = 2). Null = free choice. */
  useHole: number | null;
  /** Exact number of board cards that must play (Omaha = 3). Null = free choice. */
  useBoard: number | null;
  /** Cards in the finished hand. 5 everywhere except Badugi (4). */
  handSize: number;
}

export const FREE_SELECTION: SelectionRule = { useHole: null, useBoard: null, handSize: 5 };

/** Every legal finished hand a player can assemble from their hole cards plus the board. */
export function candidateHands(
  hole: Card[],
  board: Card[],
  rule: SelectionRule = FREE_SELECTION,
): Card[][] {
  const { useHole, useBoard, handSize } = rule;
  if (useHole == null || useBoard == null) {
    const pool = [...hole, ...board];
    if (pool.length < handSize) return [];
    return combinations(pool, handSize);
  }
  const out: Card[][] = [];
  for (const h of combinations(hole, useHole)) {
    for (const b of combinations(board, useBoard)) out.push([...h, ...b]);
  }
  return out;
}

export function bestHi(
  hole: Card[],
  board: Card[],
  ranking: HiRankingId,
  rule: SelectionRule = FREE_SELECTION,
): HandScore {
  if (ranking === "none") return noHand();
  const ruleset: HiRuleset = ranking === "shortdeck" ? "shortdeck" : "standard";
  let best = noHand();
  for (const combo of candidateHands(hole, board, rule)) {
    const score = scoreFiveHigh(combo, ruleset);
    if (compareScores(score, best) > 0) best = score;
  }
  return best;
}

export function bestLo(
  hole: Card[],
  board: Card[],
  ranking: LoRankingId,
  rule: SelectionRule = FREE_SELECTION,
): HandScore {
  if (ranking === "none") return noHand();
  if (ranking === "badugi") return scoreBadugi([...hole, ...board]);
  let best = noHand();
  for (const combo of candidateHands(hole, board, rule)) {
    const score =
      ranking === "deuce-seven"
        ? scoreFiveLow27(combo)
        : scoreFiveLowA5(combo, ranking === "a5-8ob");
    if (score.qualifies && compareScores(score, best) > 0) best = score;
  }
  return best;
}
