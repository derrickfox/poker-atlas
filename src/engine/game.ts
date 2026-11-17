// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: A generic playable engine for the community, stud and draw families — deals every street
//          from the variant's own structure, runs fixed-size betting rounds against heuristic bots,
//          handles draw/discard streets, and settles high, low and split pots at showdown.
// Reason: One engine driven by the variant config lets ~20 variants share a practice table; the
//         betting model is deliberately fixed-size so the same code is legal for every variant.

import type { Variant } from "../types";
import { type Card, handText, makeDeck, makeRng, shuffle } from "./cards";
import { bestHi, bestLo, compareScores, type HandScore } from "./evaluator";

export const SMALL_BET = 4;
export const BIG_BET = 8;
export const MAX_RAISES = 4;
const START_STACK = 500;

export interface Player {
  index: number;
  name: string;
  cards: Card[];
  /** Parallel to `cards`: whether each card is exposed to the table (stud). */
  faceUp: boolean[];
  folded: boolean;
  stack: number;
  wager: number;
  isHero: boolean;
  lastAction?: string;
  drewCount?: number;
}

export type Phase = "betting" | "draw" | "showdown" | "done";

export interface Settlement {
  hiWinners: number[];
  loWinners: number[];
  hiScore: HandScore | null;
  loScore: HandScore | null;
  perPlayer: { index: number; hi: HandScore | null; lo: HandScore | null }[];
  awards: { index: number; amount: number }[];
  summary: string;
}

/**
 * AI_CHANGE:
 * Tool: Codex
 * Model: GPT-5
 * Timestamp: 2026-07-31T09:00:00-04:00
 * Purpose: Returns every card used by a winning high or low hand at a contested showdown.
 * Reason: The practice table can now lift the evaluator-selected combination instead of making
 *         beginners infer which private and shared cards produced the winning hand.
 */
export function winningCardIds(settlement?: Settlement): Set<string> {
  const ids = new Set<string>();
  // When everyone else folds there is no winning card combination to teach.
  if (!settlement || settlement.perPlayer.length < 2) return ids;

  const hiWinners = new Set(settlement.hiWinners);
  const loWinners = new Set(settlement.loWinners);
  for (const entry of settlement.perPlayer) {
    if (hiWinners.has(entry.index) && entry.hi?.qualifies) {
      entry.hi.cards.forEach((card) => ids.add(card.id));
    }
    if (loWinners.has(entry.index) && entry.lo?.qualifies) {
      entry.lo.cards.forEach((card) => ids.add(card.id));
    }
  }
  return ids;
}

export interface Game {
  variant: Variant;
  deck: Card[];
  players: Player[];
  board: Card[];
  /** Cards moving out of play, retained so the UI can animate them toward the muck. */
  mucked: { card: Card; seat: number }[];
  pot: number;
  streetIndex: number;
  phase: Phase;
  /** Whose turn it is, or null when no one is being waited on. */
  toAct: number | null;
  betToMatch: number;
  raiseCount: number;
  /** Players who have acted since the last raise; the round closes when all live players have. */
  acted: Set<number>;
  log: string[];
  settlement?: Settlement;
  rng: () => number;
}

export type HeroAction =
  | { t: "fold" }
  | { t: "check" }
  | { t: "call" }
  | { t: "raise" }
  | { t: "draw"; discardIds: string[] };

const BOT_NAMES = ["Dana", "Mika", "Omar", "Rae", "Jules", "Kit"];

/**
 * Log lines read in second person for the hero and third person for the bots. Every action phrase
 * starts with a third-person verb ("calls 2", "raises to 8"), so dropping the trailing "s" is all
 * the conjugation this needs.
 */
function phrase(player: Player, action: string): string {
  if (!player.isHero) return `${player.name} ${action}.`;
  const [verb, ...rest] = action.split(" ");
  return `You ${verb.replace(/s$/, "")}${rest.length ? ` ${rest.join(" ")}` : ""}.`;
}

export function liveCount(game: Game): number {
  return game.players.filter((p) => !p.folded).length;
}

export function betSizeFor(game: Game): number {
  const street = game.variant.streets[game.streetIndex];
  return street?.bigBet ? BIG_BET : SMALL_BET;
}

/* ------------------------------------------------------------------------ setup */

/**
 * AI_CHANGE:
 * Tool: Codex
 * Model: GPT-5
 * Timestamp: 2026-07-30T17:53:54-04:00
 * Purpose: The practice engine can emit visual frames for setup, actions, collection, streets,
 *          discards, showdown reveal and awards while keeping `newGame`/`heroActs` synchronous.
 * Reason: Resolving several poker events inside one returned state made valid engine behavior look
 *         like unexplained jumps in the teaching UI.
 */
function createGame(variant: Variant, seatCount: number, seed: number, capture?: FrameSink): Game {
  const rng = makeRng(seed);
  const players: Player[] = Array.from({ length: seatCount }, (_, index) => ({
    index,
    name: index === 0 ? "You" : BOT_NAMES[(index - 1) % BOT_NAMES.length],
    cards: [],
    faceUp: [],
    folded: false,
    stack: START_STACK,
    wager: 0,
    isHero: index === 0,
  }));

  const game: Game = {
    variant,
    deck: shuffle(makeDeck(variant.deck), rng),
    players,
    board: [],
    mucked: [],
    pot: 0,
    streetIndex: 0,
    phase: "betting",
    toAct: null,
    betToMatch: 0,
    raiseCount: 0,
    acted: new Set(),
    log: [],
    rng,
  };

  postForcedBets(game);
  capture?.(game);
  game.streetIndex = variant.streets.findIndex((s) => s.kind !== "post");
  enterStreet(game, capture);
  return game;
}

export function newGame(variant: Variant, seatCount: number, seed: number): Game {
  return createGame(variant, seatCount, seed);
}

/** Visual setup frames: forced bets, deal, then each bot action before the hero's first turn. */
export function newGameFrames(variant: Variant, seatCount: number, seed: number): Game[] {
  const frames: Game[] = [];
  createGame(variant, seatCount, seed, (frame) => frames.push(cloneGame(frame)));
  return frames;
}

function postForcedBets(game: Game) {
  const { variant, players } = game;
  if (variant.forced === "blinds" || variant.forced === "blinds-ante") {
    const sb = players[0 % players.length];
    const bb = players[1 % players.length];
    sb.wager = Math.floor(SMALL_BET / 2);
    bb.wager = SMALL_BET;
    sb.stack -= sb.wager;
    bb.stack -= bb.wager;
    game.betToMatch = SMALL_BET;
    game.log.push(phrase(sb, "posts the small blind"), phrase(bb, "posts the big blind"));
  } else {
    for (const player of players) {
      player.stack -= 1;
      game.pot += 1;
    }
    game.log.push(`Everyone antes 1. Pot is ${game.pot}.`);
  }
}

/* ------------------------------------------------------------------ street flow */

function dealCard(game: Game): Card {
  const card = game.deck.shift();
  if (!card) throw new Error("deck exhausted");
  return card;
}

/** Deals whatever the current street calls for, then opens betting or waits for draws. */
function enterStreet(game: Game, capture?: FrameSink) {
  const street = game.variant.streets[game.streetIndex];
  if (!street) {
    settle(game, capture);
    return;
  }

  if (street.kind === "showdown") {
    settle(game, capture);
    return;
  }

  if (street.kind === "deal-hole") {
    const count = street.holeCards ?? 0;
    const exposed = street.faceUpCards ?? (street.faceUp ? count : 0);
    for (let round = 0; round < count; round++) {
      const faceUp = round >= count - exposed;
      for (const player of game.players) {
        if (player.folded) continue;
        player.cards.push(dealCard(game));
        player.faceUp.push(faceUp);
      }
    }
    game.log.push(`${street.name}: your hand is ${handText(game.players[0].cards)}.`);
  } else if (street.kind === "deal-board") {
    for (let i = 0; i < (street.boardCards ?? 0); i++) game.board.push(dealCard(game));
    game.log.push(`${street.name}: board is ${handText(game.board)}.`);
  } else if (street.kind === "draw") {
    game.phase = "draw";
    game.toAct = 0;
    capture?.(game);
    return;
  }

  if (street.betting) openBetting(game, capture);
  else advanceStreet(game, capture);
}

function advanceStreet(game: Game, capture?: FrameSink) {
  collectWagers(game);
  capture?.(game);
  game.streetIndex += 1;
  if (game.streetIndex >= game.variant.streets.length) {
    settle(game, capture);
    return;
  }
  enterStreet(game, capture);
}

function collectWagers(game: Game) {
  for (const player of game.players) {
    game.pot += player.wager;
    player.wager = 0;
    player.lastAction = undefined;
  }
  game.betToMatch = 0;
  game.raiseCount = 0;
  game.acted.clear();
}

/* ---------------------------------------------------------------------- betting */

/**
 * First to act. Community and draw games use position relative to the blinds; stud games use the
 * exposed cards, with the bring-in on the opening street and the best board thereafter.
 */
function firstToAct(game: Game): number {
  const live = game.players.filter((p) => !p.folded);
  if (live.length === 0) return 0;

  if (game.variant.family === "stud") {
    const openingStreet = game.variant.streets.findIndex((s) => s.kind === "deal-hole");
    const wantsLowest = game.streetIndex === openingStreet && game.variant.lo !== "a5-any";
    const scored = live.map((player) => {
      const up = player.cards.filter((_, i) => player.faceUp[i]);
      const top = up.length ? Math.max(...up.map((card) => card.rank)) : 0;
      return { index: player.index, top };
    });
    const pick = wantsLowest
      ? scored.reduce((a, b) => (b.top < a.top ? b : a))
      : scored.reduce((a, b) => (b.top > a.top ? b : a));
    return pick.index;
  }

  const blindsInPlay = game.streetIndex === game.variant.streets.findIndex((s) => s.kind === "deal-hole");
  const start = blindsInPlay ? 2 % game.players.length : 0;
  for (let offset = 0; offset < game.players.length; offset++) {
    const index = (start + offset) % game.players.length;
    if (!game.players[index].folded) return index;
  }
  return live[0].index;
}

function openBetting(game: Game, capture?: FrameSink) {
  game.phase = "betting";
  game.acted = new Set();
  game.toAct = firstToAct(game);
  capture?.(game);
  runBots(game, capture);
}

function nextToAct(game: Game, from: number): number | null {
  for (let offset = 1; offset <= game.players.length; offset++) {
    const index = (from + offset) % game.players.length;
    const player = game.players[index];
    if (player.folded) continue;
    if (game.acted.has(index) && player.wager === game.betToMatch) continue;
    return index;
  }
  return null;
}

function roundClosed(game: Game): boolean {
  const live = game.players.filter((p) => !p.folded);
  if (live.length <= 1) return true;
  return live.every((p) => game.acted.has(p.index) && p.wager === game.betToMatch);
}

function applyBet(game: Game, player: Player, action: HeroAction) {
  const size = betSizeFor(game);
  switch (action.t) {
    case "fold":
      player.folded = true;
      player.lastAction = "folds";
      break;
    case "check":
      player.lastAction = "checks";
      break;
    case "call": {
      const owed = Math.min(game.betToMatch - player.wager, player.stack);
      player.stack -= owed;
      player.wager += owed;
      player.lastAction = owed > 0 ? `calls ${owed}` : "checks";
      break;
    }
    case "raise": {
      const isRaise = game.betToMatch > 0;
      const target = game.betToMatch + size;
      const owed = Math.min(target - player.wager, player.stack);
      player.stack -= owed;
      player.wager += owed;
      game.betToMatch = player.wager;
      game.raiseCount += 1;
      // AI_CHANGE: Codex / GPT-5 / 2026-07-30T17:40:57-04:00 — Use "raises" whenever a
      // wager already exists (including live blinds); calling a preflop raise a "bet" teaches the
      // wrong action even when the chip movement itself is correct.
      player.lastAction = isRaise ? `raises to ${game.betToMatch}` : `bets ${size}`;
      // A raise reopens the action for everyone else.
      game.acted = new Set([player.index]);
      break;
    }
    default:
      break;
  }
  game.acted.add(player.index);
  game.log.push(phrase(player, player.lastAction ?? "acts"));
}

export function legalActions(game: Game): HeroAction["t"][] {
  const hero = game.players[0];
  const out: HeroAction["t"][] = [];
  if (game.betToMatch > hero.wager) {
    out.push("fold", "call");
  } else {
    out.push("check");
  }
  if (game.raiseCount < MAX_RAISES) out.push("raise");
  return out;
}

/* --------------------------------------------------------------------- the bots */

/** Rough 0–1 strength of a player's hand right now, under the variant's own ranking system. */
function strengthOf(game: Game, player: Player): number {
  const { variant } = game;
  if (variant.hi !== "none") {
    const score = bestHi(player.cards, game.board, variant.hi, variant.selection);
    if (!score.qualifies) return 0.15;
    const category = score.value[0];
    const kicker = (score.value[1] ?? 0) / 14;
    return Math.min(1, category / 8 + kicker * 0.08);
  }
  const score = bestLo(player.cards, game.board, variant.lo, variant.selection);
  if (!score.qualifies) return 0.15;
  if (variant.lo === "badugi") {
    const size = score.value[0] ?? 0;
    const low = -(score.value[1] ?? -14);
    return Math.min(1, size / 4 - low / 40);
  }
  const worst = -(score.value[1] ?? -14);
  return Math.max(0, Math.min(1, (12 - worst) / 9));
}

function botAction(game: Game, player: Player): HeroAction {
  const strength = strengthOf(game, player);
  const facing = game.betToMatch > player.wager;
  const noise = game.rng();

  if (!facing) {
    if (strength > 0.45 && game.raiseCount < MAX_RAISES && noise > 0.35) return { t: "raise" };
    return { t: "check" };
  }
  if (strength > 0.62 && game.raiseCount < MAX_RAISES && noise > 0.55) return { t: "raise" };
  if (strength > 0.3 || noise > 0.78) return { t: "call" };
  return { t: "fold" };
}

type FrameSink = (game: Game) => void;

/** Runs every bot in turn until the hero must act or the round closes. */
function runBots(game: Game, capture?: FrameSink) {
  let guard = 0;
  while (guard++ < 200) {
    if (roundClosed(game)) break;
    const index = game.toAct;
    if (index == null) break;
    if (index === 0) return; // Waiting on the hero.
    const player = game.players[index];
    applyBet(game, player, botAction(game, player));
    // Capture before advancing `toAct` so the rendered table highlights the player who just acted.
    capture?.(game);
    if (game.players.filter((p) => !p.folded).length <= 1) break;
    const next = nextToAct(game, index);
    if (next == null) break;
    game.toAct = next;
    if (next === 0) {
      // The previous capture still highlights the bot who acted. Capture the handoff as its own
      // frame so the controls return only after the gold active-seat ring reaches the hero.
      capture?.(game);
      return;
    }
  }
  closeRound(game, capture);
}

function closeRound(game: Game, capture?: FrameSink) {
  game.toAct = null;
  if (game.players.filter((p) => !p.folded).length <= 1) {
    settle(game, capture);
    return;
  }
  advanceStreet(game, capture);
}

/* ------------------------------------------------------------------ hero input */

/**
 * AI_CHANGE:
 * Tool: Codex
 * Model: GPT-5
 * Timestamp: 2026-07-30T17:40:57-04:00
 * Purpose: Optionally captures the hero action, each bot response and the completed betting round
 *          as separate immutable frames while preserving the original synchronous engine result.
 * Reason: Practice previously jumped directly to the resolved round, so a raise could be collected
 *         before React ever rendered its wager chips and learners never saw the betting sequence.
 */
function resolveHeroAction(game: Game, action: HeroAction, capture?: FrameSink): Game {
  const next = cloneGame(game);
  if (action.t === "draw") {
    applyHeroDraw(next, action.discardIds, capture);
    return next;
  }
  applyBet(next, next.players[0], action);
  capture?.(next);
  if (next.players.filter((p) => !p.folded).length <= 1) {
    settle(next, capture);
    return next;
  }
  const following = nextToAct(next, 0);
  if (following == null || roundClosed(next)) {
    closeRound(next, capture);
    return next;
  }
  next.toAct = following;
  runBots(next, capture);
  return next;
}

export function heroActs(game: Game, action: HeroAction): Game {
  return resolveHeroAction(game, action);
}

/** Returns the visual frames for a hero action, ending with the same state as `heroActs`. */
export function heroActionFrames(game: Game, action: HeroAction): Game[] {
  const frames: Game[] = [];
  resolveHeroAction(game, action, (frame) => frames.push(cloneGame(frame)));
  return frames;
}

function applyHeroDraw(game: Game, discardIds: string[], capture?: FrameSink) {
  const street = game.variant.streets[game.streetIndex];
  const replace = game.variant.family !== "community";
  const ids = new Set(discardIds);
  const draws: { player: Player; toss: Card[] }[] = [];

  for (const player of game.players) {
    if (player.folded) continue;
    const toss = player.isHero
      ? player.cards.filter((card) => ids.has(card.id))
      : botDiscards(game, player, street?.drawMax ?? player.cards.length);
    draws.push({ player, toss });
  }

  for (const { player, toss } of draws) {
    const tossIds = new Set(toss.map((card) => card.id));
    toss.forEach((card) => game.mucked.push({ card, seat: player.index }));
    const keptFaceUp = player.faceUp.filter((_, i) => !tossIds.has(player.cards[i].id));
    player.cards = player.cards.filter((card) => !tossIds.has(card.id));
    player.faceUp = keptFaceUp;
    player.drewCount = toss.length;
    player.lastAction = toss.length === 0 ? "stands pat" : `draws ${toss.length}`;
    game.log.push(phrase(player, player.lastAction));
  }

  // AI_CHANGE: Codex / GPT-5 / 2026-07-30T17:53:54-04:00 — Hold the discard state as its own
  // visual beat so old cards can slide to the muck before replacements leave the deck.
  capture?.(game);

  if (replace) {
    for (const { player, toss } of draws) {
      for (let i = 0; i < toss.length; i++) {
        player.cards.push(dealCard(game));
        player.faceUp.push(false);
      }
    }
  }

  if (street?.betting) openBetting(game, capture);
  else advanceStreet(game, capture);
}

function botDiscards(game: Game, player: Player, max: number): Card[] {
  const { variant } = game;
  const keep = new Set<string>();

  if (variant.lo === "badugi") {
    const seenRank = new Set<number>();
    const seenSuit = new Set<string>();
    for (const card of [...player.cards].sort((a, b) => a.rank - b.rank)) {
      if (seenRank.has(card.rank) || seenSuit.has(card.suit)) continue;
      seenRank.add(card.rank);
      seenSuit.add(card.suit);
      keep.add(card.id);
    }
  } else if (variant.lo !== "none") {
    const value = (card: Card) =>
      variant.lo === "deuce-seven" ? card.rank : card.rank === 14 ? 1 : card.rank;
    const seen = new Set<number>();
    for (const card of [...player.cards].sort((a, b) => value(a) - value(b))) {
      if (seen.has(value(card))) continue;
      seen.add(value(card));
      keep.add(card.id);
    }
  } else {
    const byRank = new Map<number, Card[]>();
    for (const card of player.cards) byRank.set(card.rank, [...(byRank.get(card.rank) ?? []), card]);
    for (const group of byRank.values()) if (group.length > 1) group.forEach((c) => keep.add(c.id));
    if (keep.size === 0) {
      [...player.cards]
        .sort((a, b) => b.rank - a.rank)
        .slice(0, 2)
        .forEach((card) => keep.add(card.id));
    }
  }
  return player.cards.filter((card) => !keep.has(card.id)).slice(0, max);
}

/* -------------------------------------------------------------------- showdown */

function settle(game: Game, capture?: FrameSink) {
  collectWagers(game);
  game.phase = "showdown";
  game.toAct = null;
  // Give the collected pot and revealed hands a full visual beat before awarding chips.
  capture?.(game);
  const live = game.players.filter((p) => !p.folded);
  const { variant } = game;

  const perPlayer = live.map((player) => ({
    index: player.index,
    hi: variant.hi !== "none" ? bestHi(player.cards, game.board, variant.hi, variant.selection) : null,
    lo: variant.lo !== "none" ? bestLo(player.cards, game.board, variant.lo, variant.selection) : null,
  }));

  const bestOf = (key: "hi" | "lo") => {
    let best: HandScore | null = null;
    let winners: number[] = [];
    for (const entry of perPlayer) {
      const score = entry[key];
      if (!score || !score.qualifies) continue;
      const cmp = best ? compareScores(score, best) : 1;
      if (cmp > 0) {
        best = score;
        winners = [entry.index];
      } else if (cmp === 0) {
        winners.push(entry.index);
      }
    }
    return { best, winners };
  };

  const hi = bestOf("hi");
  const lo = bestOf("lo");
  const splitting = hi.winners.length > 0 && lo.winners.length > 0;
  const hiPot = splitting ? Math.floor(game.pot / 2) : hi.winners.length ? game.pot : 0;
  const loPot = game.pot - hiPot;

  const names = (indexes: number[]) => indexes.map((i) => game.players[i].name).join(" and ");
  // "You win" but "Dana wins" — the hero is second person, everyone else third.
  const verb = (indexes: number[]) => (indexes.length === 1 && indexes[0] === 0 ? "win" : "wins");
  const parts: string[] = [];
  const awards = new Map<number, number>();
  const award = (index: number, amount: number) => {
    game.players[index].stack += amount;
    awards.set(index, (awards.get(index) ?? 0) + amount);
  };

  if (hi.winners.length) {
    const share = Math.floor(hiPot / hi.winners.length);
    hi.winners.forEach((i) => award(i, share));
    parts.push(
      live.length === 1
        ? `${names(hi.winners)} ${verb(hi.winners)} ${hiPot} — everyone else folded.`
        : `${names(hi.winners)} ${verb(hi.winners)}${splitting ? " the high half" : ""} with ${hi.best?.label} for ${hiPot}.`,
    );
  }
  if (lo.winners.length) {
    const share = Math.floor(loPot / lo.winners.length);
    lo.winners.forEach((i) => award(i, share));
    parts.push(
      `${names(lo.winners)} ${verb(lo.winners)}${splitting ? " the low half" : ""} with ${lo.best?.label} for ${loPot}.`,
    );
  }
  if (!hi.winners.length && !lo.winners.length && live.length) {
    award(live[0].index, game.pot);
    parts.push(`${live[0].name} ${verb([live[0].index])} ${game.pot}.`);
  }
  if (variant.potType === "split" && !lo.winners.length && hi.winners.length && live.length > 1) {
    parts.push("No qualifying low, so the high hand scoops the whole pot.");
  }

  game.settlement = {
    hiWinners: hi.winners,
    loWinners: lo.winners,
    hiScore: hi.best,
    loScore: lo.best,
    perPlayer,
    awards: [...awards].map(([index, amount]) => ({ index, amount })),
    summary: parts.join(" "),
  };
  game.phase = "done";
  game.toAct = null;
  game.pot = 0;
  game.log.push(game.settlement.summary);
  capture?.(game);
}

/* ----------------------------------------------------------------------- utils */

function cloneGame(game: Game): Game {
  return {
    ...game,
    players: game.players.map((p) => ({ ...p, cards: [...p.cards], faceUp: [...p.faceUp] })),
    board: [...game.board],
    mucked: game.mucked.map((entry) => ({ ...entry, card: { ...entry.card } })),
    deck: [...game.deck],
    acted: new Set(game.acted),
    log: [...game.log],
  };
}
