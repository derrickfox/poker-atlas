// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Generates a complete animated tutorial script for any variant by dealing a real demo hand
//          from a seeded deck, scripting plausible betting, and evaluating the true showdown result.
// Reason: Hand-writing a walkthrough for every variant would not scale past a handful; deriving the
//         script from the variant's street structure means the showdown narration is always correct.

import type { Action, StreetDef, TutorialStep, Variant } from "../types";
import {
  type Card,
  cardText,
  handText,
  makeDeck,
  makeRng,
  shuffle,
} from "./cards";
import { bestHi, bestLo, compareScores, type HandScore } from "./evaluator";
import { seatName } from "./table";
import { FAMILY_LABEL } from "../data";

const MAX_DEMO_SEATS = 5;

function seedFor(id: string): number {
  let hash = 2166136261;
  for (let i = 0; i < id.length; i++) {
    hash ^= id.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seatCountFor(variant: Variant): number {
  return Math.min(MAX_DEMO_SEATS, Math.max(3, variant.players.typical));
}

/* --------------------------------------------------------- demo hand simulation */

interface DemoSeat {
  index: number;
  cards: Card[];
  folded: boolean;
}

interface Sim {
  deck: Card[];
  seats: DemoSeat[];
  board: Card[][];
  pot: number;
  /** Blind money already in front of a seat, so the first betting round tops it up rather than
   *  stacking a second full bet on top of it. */
  posted: Map<number, number>;
}

/** The button sits to the right of the blinds, so seat 0 posts the small blind. */
function buttonSeatFor(seatCount: number): number {
  return seatCount - 1;
}

function draw(sim: Sim): Card {
  const card = sim.deck.shift();
  if (!card) throw new Error("demo deck exhausted");
  return card;
}

/** Chooses which cards a seat throws away on a draw street, per the variant's ranking system. */
function cardsToDiscard(cards: Card[], variant: Variant, max: number): Card[] {
  const keep = new Set<string>();

  if (variant.lo === "badugi") {
    const seenRank = new Set<number>();
    const seenSuit = new Set<string>();
    for (const card of [...cards].sort((a, b) => a.rank - b.rank)) {
      if (seenRank.has(card.rank) || seenSuit.has(card.suit)) continue;
      seenRank.add(card.rank);
      seenSuit.add(card.suit);
      keep.add(card.id);
    }
  } else if (variant.lo !== "none") {
    // Lowball: keep the lowest distinct ranks. Aces are low unless this is a deuce-to-seven game.
    const value = (card: Card) =>
      variant.lo === "deuce-seven" ? card.rank : card.rank === 14 ? 1 : card.rank;
    const seen = new Set<number>();
    for (const card of [...cards].sort((a, b) => value(a) - value(b))) {
      if (seen.has(value(card))) continue;
      seen.add(value(card));
      keep.add(card.id);
    }
  } else {
    // High games: keep every card that is part of a pair or better, else four to a flush,
    // else the two highest cards.
    const byRank = new Map<number, Card[]>();
    for (const card of cards) byRank.set(card.rank, [...(byRank.get(card.rank) ?? []), card]);
    for (const group of byRank.values()) {
      if (group.length > 1) group.forEach((card) => keep.add(card.id));
    }
    if (keep.size === 0) {
      const bySuit = new Map<string, Card[]>();
      for (const card of cards) bySuit.set(card.suit, [...(bySuit.get(card.suit) ?? []), card]);
      const flushy = [...bySuit.values()].find((group) => group.length >= 4);
      if (flushy) flushy.forEach((card) => keep.add(card.id));
      else
        [...cards]
          .sort((a, b) => b.rank - a.rank)
          .slice(0, 2)
          .forEach((card) => keep.add(card.id));
    }
  }

  return cards.filter((card) => !keep.has(card.id)).slice(0, max);
}

/* ------------------------------------------------------------------ betting beats */

interface BettingBeat {
  actions: Action[];
  summary: string;
}

const BET_SIZES = [6, 12, 24, 24, 48];

/**
 * Scripts a believable betting round. The pattern is deterministic per street so the same variant
 * always produces the same tutorial, and one opponent folds early so the table thins out visibly.
 */
function bettingBeat(sim: Sim, streetIndex: number, isFirst: boolean): BettingBeat {
  const live = sim.seats.filter((seat) => !seat.folded);
  const size = BET_SIZES[Math.min(streetIndex, BET_SIZES.length - 1)];
  const actions: Action[] = [];
  const parts: string[] = [];

  const folder = live.length > 2 && streetIndex <= 1 ? live[live.length - 1] : null;
  const bettor = live.find((seat) => seat !== folder) ?? live[0];

  // The hero speaks in second person in the written summary; the bots in third.
  const describe = (index: number, action: string) =>
    index === 0
      ? `You ${action.replace(/^(\w+)s\b/, "$1")}`
      : `${seatName(index)} ${action}`;

  let added = 0;
  for (const seat of live) {
    // A blind is live money: it counts toward the bet, so these seats only top up the difference.
    const already = isFirst ? (sim.posted.get(seat.index) ?? 0) : 0;
    if (seat === folder) {
      actions.push({ t: "fold", seat: seat.index });
      seat.folded = true;
      added += already;
      parts.push(describe(seat.index, "folds"));
      continue;
    }
    const owed = Math.max(0, size - already);
    added += owed + already;
    // A seat with a blind out only adds the difference, so show what it actually costs them.
    const topUp = already > 0 ? ` (+${owed})` : "";
    if (seat === bettor) {
      const verb = isFirst ? `raises to ${size}` : `bets ${size}`;
      actions.push({ t: "act", seat: seat.index, say: verb + topUp, amount: owed });
      parts.push(describe(seat.index, verb));
    } else {
      actions.push({ t: "act", seat: seat.index, say: `calls ${size}${topUp}`, amount: owed });
      parts.push(describe(seat.index, "calls"));
    }
  }

  // No `collect` here on purpose. The bets stay in front of their players until the next card is
  // dealt, which is when a live dealer actually gathers them.
  sim.pot += added - (isFirst ? sumPosted(sim) : 0);
  return { actions, summary: parts.join(", ") };
}

/** Blinds were already counted into the pot when they were posted. */
function sumPosted(sim: Sim): number {
  let total = 0;
  for (const amount of sim.posted.values()) total += amount;
  return total;
}

/* ------------------------------------------------------------------ step builders */

function forcedBetActions(variant: Variant, seatCount: number, sim: Sim): Action[] {
  const actions: Action[] = [];
  switch (variant.forced) {
    case "blinds":
    case "blinds-ante": {
      const small = (buttonSeatFor(seatCount) + 1) % seatCount;
      const big = (buttonSeatFor(seatCount) + 2) % seatCount;
      actions.push({ t: "post", seat: small, amount: 1, label: "small blind", badge: "SB" });
      actions.push({ t: "post", seat: big, amount: 2, label: "big blind", badge: "BB" });
      actions.push({ t: "caption", text: "Button → small blind → big blind" });
      sim.posted.set(small, 1);
      sim.posted.set(big, 2);
      sim.pot += 3;
      // Deliberately no `collect`: the blinds stay in front of their seats so you can see money
      // committed before any card is dealt. They are swept in when the first betting round ends.
      break;
    }
    case "antes-bringin":
    case "antes":
    case "ante-each":
      for (let i = 0; i < seatCount; i++)
        actions.push({ t: "post", seat: i, amount: 1, label: "antes 1" });
      actions.push({ t: "caption", text: "Everyone contributes equally — no button, no blinds" });
      actions.push({ t: "collect" });
      sim.pot += seatCount;
      break;
    default:
      actions.push({ t: "collect" });
      break;
  }
  return actions;
}

function forcedBetText(variant: Variant, seatCount: number): string {
  switch (variant.forced) {
    case "blinds":
    case "blinds-ante": {
      const button = seatName(buttonSeatFor(seatCount));
      const small = seatName((buttonSeatFor(seatCount) + 1) % seatCount);
      const big = seatName((buttonSeatFor(seatCount) + 2) % seatCount);
      return `The white **dealer button** marks who would be dealing — here it is in front of **${button}**. The two seats to its left are forced to put money in before seeing a single card: **${small}** posts the **small blind** and **${big}** posts the **big blind**, twice the size.\n\nThat money stays in front of them, not in the pot, until the first betting round finishes. The button moves one seat after every hand, so everybody pays both blinds in turn.`;
    }
    case "antes-bringin":
      return "There are no blinds and no button. **Every player antes** the same small amount straight into the pot, and once the first cards are out, one player will be forced to make a **bring-in** bet based on their exposed card.";
    case "antes":
    case "ante-each":
      return "**Every player antes** before the deal. There is no button-relative blind structure — everyone contributes equally.";
    default:
      return "Money goes into the pot before the cards are dealt.";
  }
}

function dealStepFor(
  variant: Variant,
  street: StreetDef,
  sim: Sim,
  seatCount: number,
): { actions: Action[]; text: string } {
  const actions: Action[] = [{ t: "clearSays" }];
  const count = street.holeCards ?? 0;
  // Stud streets expose only the last card or two of the batch, so work out which rounds are up.
  const exposed = street.faceUpCards ?? (street.faceUp ? count : 0);

  // Deal a card at a time around the table, exactly as a live dealer would.
  for (let round = 0; round < count; round++) {
    const faceUp = round >= count - exposed;
    for (let seat = 0; seat < seatCount; seat++) {
      const demoSeat = sim.seats[seat];
      if (demoSeat.folded) continue;
      const card = draw(sim);
      demoSeat.cards.push(card);
      actions.push({ t: "deal", to: "seat", seat, card: card.id, faceUp });
    }
  }
  actions.push({ t: "reveal", seat: 0 });

  const hero = sim.seats[0];
  const shown = hero.cards.slice(-count);
  const text =
    `${street.note}\n\nYour cards: **${handText(shown)}**` +
    (count === variant.holeCards ? "" : `  ·  You now hold ${handText(hero.cards)}.`);
  return { actions, text };
}

function boardStepFor(street: StreetDef, sim: Sim, boards: number): { actions: Action[]; text: string } {
  const actions: Action[] = [{ t: "clearSays" }];
  for (let board = 0; board < boards; board++) {
    for (let i = 0; i < (street.boardCards ?? 0); i++) {
      const card = draw(sim);
      sim.board[board].push(card);
      actions.push({ t: "deal", to: "board", board, card: card.id, faceUp: true });
    }
  }
  const text = `${street.note}\n\nThe board is now **${handText(sim.board[0])}**.`;
  return { actions, text };
}

function drawStepFor(
  variant: Variant,
  street: StreetDef,
  sim: Sim,
): { actions: Action[]; text: string } {
  const actions: Action[] = [{ t: "clearSays" }];
  const replace = variant.family !== "community";
  const counts: number[] = [];

  for (const seat of sim.seats) {
    if (seat.folded) {
      counts.push(0);
      continue;
    }
    const toss = cardsToDiscard(seat.cards, variant, street.drawMax ?? seat.cards.length);
    counts.push(toss.length);
    if (toss.length === 0) {
      actions.push({ t: "act", seat: seat.index, say: "stands pat" });
      continue;
    }
    const tossIds = new Set(toss.map((card) => card.id));
    seat.cards = seat.cards.filter((card) => !tossIds.has(card.id));
    // Name the exact cards so the table throws away the same ones the narration says it did.
    actions.push({ t: "discard", seat: seat.index, count: toss.length, cards: [...tossIds] });
    actions.push({
      t: "act",
      seat: seat.index,
      say: `draws ${toss.length}`,
    });
    if (replace) {
      for (let i = 0; i < toss.length; i++) {
        const card = draw(sim);
        seat.cards.push(card);
        actions.push({ t: "deal", to: "seat", seat: seat.index, card: card.id, faceUp: false });
      }
    }
  }
  actions.push({ t: "reveal", seat: 0 });

  const hero = sim.seats[0];
  const heroCount = counts[0];
  const text =
    `${street.note}\n\n` +
    (replace
      ? `You discard **${heroCount}** and are dealt ${heroCount} replacement${heroCount === 1 ? "" : "s"}, leaving **${handText(hero.cards)}**.`
      : `You discard **${heroCount}**, leaving **${handText(hero.cards)}**.`) +
    "\n\nEvery draw count at the table is public information — note who took how many.";
  return { actions, text };
}

/* ------------------------------------------------------------------- the showdown */

interface Verdict {
  winnerHi: DemoSeat | null;
  hiScore: HandScore | null;
  winnerLo: DemoSeat | null;
  loScore: HandScore | null;
}

function judge(sim: Sim, variant: Variant): Verdict {
  const live = sim.seats.filter((seat) => !seat.folded);
  let winnerHi: DemoSeat | null = null;
  let hiScore: HandScore | null = null;
  let winnerLo: DemoSeat | null = null;
  let loScore: HandScore | null = null;

  for (const seat of live) {
    if (variant.hi !== "none") {
      const score = bestHi(seat.cards, sim.board[0], variant.hi, variant.selection);
      if (!hiScore || compareScores(score, hiScore) > 0) {
        hiScore = score;
        winnerHi = seat;
      }
    }
    if (variant.lo !== "none") {
      const score = bestLo(seat.cards, sim.board[0], variant.lo, variant.selection);
      if (score.qualifies && (!loScore || compareScores(score, loScore) > 0)) {
        loScore = score;
        winnerLo = seat;
      }
    }
  }
  return { winnerHi, hiScore, winnerLo, loScore };
}

function showdownStep(sim: Sim, variant: Variant, street: StreetDef): TutorialStep {
  const verdict = judge(sim, variant);
  const actions: Action[] = [{ t: "collect" }, { t: "reveal" }];

  const lines: string[] = [street.note];
  const splitting = Boolean(verdict.winnerHi && verdict.winnerLo);
  const potShare = splitting ? Math.floor(sim.pot / 2) : sim.pot;

  // One emphasize action for both halves, so a split pot lights up the winning five on each side.
  const playing = new Set<string>();
  for (const score of [verdict.hiScore, verdict.loScore]) {
    if (score?.qualifies) for (const card of score.cards) playing.add(card.id);
  }
  if (playing.size) actions.push({ t: "emphasize", cards: [...playing] });

  const winners: string[] = [];
  if (verdict.winnerHi && verdict.hiScore) {
    const who =
      verdict.winnerHi.index === 0
        ? `**You win**${splitting ? " the high half" : " the pot"}`
        : `**${seatName(verdict.winnerHi.index)}** wins${splitting ? " the high half" : " the pot"}`;
    winners.push(`${who} with **${verdict.hiScore.label}** — ${handText(verdict.hiScore.cards)}.`);
    actions.push({
      t: "award",
      seat: verdict.winnerHi.index,
      amount: potShare,
      note: splitting ? "wins high" : "wins the pot",
    });
  }
  if (verdict.winnerLo && verdict.loScore) {
    const half = splitting ? " the low half" : " the pot";
    const who =
      verdict.winnerLo.index === 0
        ? `**You win**${half}`
        : `**${seatName(verdict.winnerLo.index)}** wins${half}`;
    winners.push(`${who} with **${verdict.loScore.label}** — ${handText(verdict.loScore.cards)}.`);
    actions.push({
      t: "award",
      seat: verdict.winnerLo.index,
      amount: sim.pot - potShare,
      note: verdict.winnerHi ? "wins low" : "wins the pot",
    });
  }
  if (variant.potType === "split" && !verdict.winnerLo && verdict.winnerHi) {
    lines.push("No hand qualified for the low half, so the **entire pot goes to the high hand**.");
  }
  if (variant.showdownCaveat) winners.push(variant.showdownCaveat);

  return {
    id: "showdown",
    title: "Showdown",
    text: [...lines, "", ...winners].join("\n"),
    actions,
    hold: 6000,
  };
}

/* ------------------------------------------------------------------------ builder */

export function buildTutorial(variant: Variant): TutorialStep[] {
  if (variant.customTutorial?.length) return variant.customTutorial;

  // A split-pot game teaches nothing if the demo board happens to make no qualifying low, so try a
  // few seeds and keep the first deal where both halves are actually won.
  if (variant.potType === "split" && variant.lo !== "none") {
    for (let attempt = 0; attempt < 60; attempt++) {
      const built = buildWithSeed(variant, seedFor(variant.id) + attempt * 7919);
      if (built.splits) return built.steps;
    }
  }
  return buildWithSeed(variant, seedFor(variant.id)).steps;
}

function buildWithSeed(variant: Variant, seed: number): { steps: TutorialStep[]; splits: boolean } {
  const seatCount = seatCountFor(variant);
  const boards = Math.max(1, variant.boards);
  const rng = makeRng(seed);
  const sim: Sim = {
    deck: shuffle(makeDeck(variant.deck), rng),
    seats: Array.from({ length: seatCount }, (_, index) => ({ index, cards: [], folded: false })),
    board: Array.from({ length: boards }, () => []),
    pot: 0,
    posted: new Map(),
  };

  const steps: TutorialStep[] = [];
  const usesButton = variant.forced === "blinds" || variant.forced === "blinds-ante";

  steps.push({
    id: "intro",
    title: "The idea",
    text: variant.summary,
    actions: [
      { t: "seats", count: seatCount, hero: 0, stack: 200 },
      ...(usesButton ? ([{ t: "button", seat: buttonSeatFor(seatCount) }] as Action[]) : []),
      { t: "caption", text: `${FAMILY_LABEL[variant.family]} · ${variant.players.min}–${variant.players.max} players` },
    ],
    tip: variant.keyIdeas[0],
    hold: 5200,
  });

  let streetIndex = 0;
  let firstBettingRound = true;
  let splits = false;
  /** True once a betting round has left chips on the felt waiting to be gathered. */
  let sweepFirst = false;

  for (const street of variant.streets) {
    if (street.kind === "post") {
      steps.push({
        id: "forced",
        title: street.name,
        text: forcedBetText(variant, seatCount),
        actions: forcedBetActions(variant, seatCount, sim),
        tip: usesButton
          ? "Blinds are live. The big blind has already paid for the round, so when the action comes back they still get the option to raise."
          : undefined,
        hold: 5200,
      });
      continue;
    }

    if (street.kind === "showdown") {
      const verdict = judge(sim, variant);
      splits = Boolean(verdict.winnerHi && verdict.winnerLo);
      steps.push(showdownStep(sim, variant, street));
      continue;
    }

    let built: { actions: Action[]; text: string };
    if (street.kind === "deal-hole") built = dealStepFor(variant, street, sim, seatCount);
    else if (street.kind === "deal-board") built = boardStepFor(street, sim, boards);
    else if (street.kind === "draw") built = drawStepFor(variant, street, sim);
    else built = { actions: [{ t: "clearSays" }], text: street.note };

    steps.push({
      id: street.id,
      title: street.name,
      text: built.text,
      // Gather the previous round's bets as this street's cards arrive. Blinds alone are never
      // swept this way — they stay out until the preflop betting round they belong to is over.
      actions: sweepFirst ? [{ t: "collect" } as Action, ...built.actions] : built.actions,
      hold: 5000,
    });
    sweepFirst = false;

    if (street.betting) {
      const beat = bettingBeat(sim, streetIndex, firstBettingRound);
      steps.push({
        id: `${street.id}-betting`,
        title: `${street.name} — betting`,
        text: firstBettingRound
          ? `Now a **betting round**. In turn, each player may **fold** (give up the hand), **call** (match the current bet), **raise** (increase it) or, if nobody has bet yet, **check** (pass without betting).\n\nHere: ${beat.summary}.`
          : `Another betting round.${street.bigBet && variant.betting.includes("fixed-limit") ? " In a fixed-limit game the bet size **doubles** from this street onward." : ""}\n\nHere: ${beat.summary}.`,
        actions: beat.actions,
        tip: firstBettingRound
          ? "A round ends when every remaining player has either folded or put in the same amount."
          : undefined,
        hold: 5200,
      });
      firstBettingRound = false;
      sweepFirst = true;
      streetIndex += 1;
    }
  }

  steps.push({
    id: "recap",
    title: "What to remember",
    text: variant.keyIdeas.map((idea) => `• ${idea}`).join("\n"),
    actions: [{ t: "emphasize", cards: [] }, { t: "caption", text: "Ready to practise" }],
    hold: 7000,
  });

  return { steps, splits };
}

/** Formats a card list for narration outside this module (used by the practice screen). */
export { cardText };
