// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Core card primitives — rank/suit encoding, deck construction (52 / 36 / 20 card),
//          shuffling, parsing and display helpers used by every other engine module.
// Reason: Every variant in the atlas draws from a different deck and needs one shared card
//         representation so the evaluator, the bots and the animation layer agree on identity.

export type Suit = "s" | "h" | "d" | "c";

/** Rank is stored as its numeric value: 2..14 where 11=J, 12=Q, 13=K, 14=A. */
export type Rank = number;

export interface Card {
  /** Stable identity, e.g. "As". Used as the React key so the DOM node survives moves. */
  id: string;
  rank: Rank;
  suit: Suit;
}

export const SUITS: Suit[] = ["s", "h", "d", "c"];

export const SUIT_GLYPH: Record<Suit, string> = {
  s: "♠",
  h: "♥",
  d: "♦",
  c: "♣",
};

export const SUIT_NAME: Record<Suit, string> = {
  s: "spades",
  h: "hearts",
  d: "diamonds",
  c: "clubs",
};

/** Internal one-character codes keep card ids compatible with poker notation and authored scripts. */
export const RANK_CODE: Record<number, string> = {
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "T",
  11: "J",
  12: "Q",
  13: "K",
  14: "A",
};

// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-30T18:22:06-04:00
// Purpose: Displays the ten rank as "10" while preserving "T" in internal card ids and scripts.
// Reason: "T" is expert shorthand; a rules trainer for beginners should show the numeral printed
//         on a real playing card without breaking seeded deals or hand-authored tutorial data.
export const RANK_LABEL: Record<number, string> = {
  ...RANK_CODE,
  10: "10",
};

export const RANK_WORD: Record<number, string> = {
  2: "deuce",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "jack",
  12: "queen",
  13: "king",
  14: "ace",
};

/** Deck sizes the atlas supports. 36 = short deck (6+), 20 = royal deck (10+). */
export type DeckSize = 52 | 36 | 20;

export function lowestRankFor(size: DeckSize): Rank {
  if (size === 36) return 6;
  if (size === 20) return 10;
  return 2;
}

export function makeCard(rank: Rank, suit: Suit): Card {
  return { id: `${RANK_CODE[rank]}${suit}`, rank, suit };
}

export function makeDeck(size: DeckSize = 52): Card[] {
  const low = lowestRankFor(size);
  const deck: Card[] = [];
  for (let rank = 14; rank >= low; rank--) {
    for (const suit of SUITS) deck.push(makeCard(rank, suit));
  }
  return deck;
}

/** Parse "As" / "Th" / "10h" / "7d". Internal ids continue to use the compact "T" form. */
export function parseCard(text: string): Card {
  const raw = text.trim();
  const rankChar = raw.slice(0, raw.length - 1).toUpperCase();
  const suit = raw.slice(-1).toLowerCase() as Suit;
  const rank = Number(
    Object.keys(RANK_CODE).find(
      (key) => RANK_CODE[Number(key)] === rankChar || RANK_LABEL[Number(key)] === rankChar,
    ),
  );
  if (!rank || !SUITS.includes(suit)) throw new Error(`Unparseable card: "${text}"`);
  return makeCard(rank, suit);
}

export function parseCards(text: string | string[]): Card[] {
  const list = Array.isArray(text) ? text : text.split(/[\s,]+/).filter(Boolean);
  return list.map(parseCard);
}

export function cardText(card: Card): string {
  return `${RANK_LABEL[card.rank]}${SUIT_GLYPH[card.suit]}`;
}

export function handText(cards: Card[]): string {
  return cards.map(cardText).join(" ");
}

/** Mulberry32 — small deterministic PRNG so practice hands can be replayed from a seed. */
export function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** All k-sized combinations of `items`. Only ever called with tiny inputs (<= C(7,5)=21). */
export function combinations<T>(items: T[], k: number): T[][] {
  const out: T[][] = [];
  const current: T[] = [];
  const walk = (start: number) => {
    if (current.length === k) {
      out.push(current.slice());
      return;
    }
    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      walk(i + 1);
      current.pop();
    }
  };
  if (k >= 0 && k <= items.length) walk(0);
  return out;
}
