// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-31T12:00:00-04:00
// Purpose: Accurate Let It Ride dealing, withdrawals, paytable settlement and animation frames.
// Reason: This two-decision casino game has no opponent or pot, so isolating it prevents its wager
//         rules from changing the established peer-poker and dealer-versus-player engines.

import type { TableCard, TableState } from "../types";
import { type Card, handText, makeDeck, makeRng, shuffle } from "./cards";
import { HI_CATEGORY, scoreFiveHigh, type HandScore } from "./evaluator";

export type LetItRideAction = "ride" | "pull";
export type LetItRideStage =
  | "bets"
  | "first-decision"
  | "second-decision"
  | "reveal"
  | "done";

export const LET_IT_RIDE_BET = 10;
const START_STACK = 200;
const OPENING_WAGER = LET_IT_RIDE_BET * 3;

export interface LetItRideOutcome {
  qualifies: boolean;
  score: HandScore;
  odds: number;
  activeBets: number;
  /** Profit or loss relative to the stack before the three opening bets. */
  net: number;
  /** All returned chips, including stakes withdrawn during the two decisions. */
  returned: number;
  summary: string;
  winningCardIds: string[];
}

export interface LetItRideGame {
  hero: Card[];
  board: Card[];
  stage: LetItRideStage;
  stack: number;
  wager: number;
  pulled: number;
  lastAction?: string;
  outcome?: LetItRideOutcome;
  log: string[];
}

/** Standard main-wager paytable. Optional three-card and five-card bonus wagers are excluded. */
export function letItRideOdds(score: HandScore): number {
  const category = score.value[0];
  if (category === HI_CATEGORY.STRAIGHT_FLUSH) {
    return score.value[1] === 14 ? 1000 : 200;
  }
  if (category === HI_CATEGORY.QUADS) return 50;
  if (category === HI_CATEGORY.FULL_HOUSE) return 11;
  if (category === HI_CATEGORY.FLUSH) return 8;
  if (category === HI_CATEGORY.STRAIGHT) return 5;
  if (category === HI_CATEGORY.TRIPS) return 3;
  if (category === HI_CATEGORY.TWO_PAIR) return 2;
  if (category === HI_CATEGORY.PAIR && (score.value[1] ?? 0) >= 10) return 1;
  return 0;
}

/** Pure fixed-hand settlement shared by the practice UI and regression tests. */
export function resolveLetItRide(
  hero: Card[],
  board: Card[],
  pulled: number,
): LetItRideOutcome {
  if (hero.length !== 3 || board.length !== 2) {
    throw new Error("Let It Ride settles exactly three private and two community cards");
  }
  if (!Number.isInteger(pulled) || pulled < 0 || pulled > 2) {
    throw new Error("Let It Ride allows zero, one or two withdrawn bets");
  }

  const score = scoreFiveHigh([...hero, ...board]);
  const odds = letItRideOdds(score);
  const qualifies = odds > 0;
  const activeBets = 3 - pulled;
  const withdrawnReturn = pulled * LET_IT_RIDE_BET;
  const settledReturn = qualifies
    ? activeBets * LET_IT_RIDE_BET * (odds + 1)
    : 0;
  const returned = withdrawnReturn + settledReturn;
  const net = returned - OPENING_WAGER;
  const betWord = activeBets === 1 ? "bet" : "bets";
  const summary = qualifies
    ? `You finish with ${score.label}. Your ${activeBets} remaining ${betWord} pay ${odds} to 1 for ${activeBets * LET_IT_RIDE_BET * odds} chips profit.`
    : `You finish with ${score.label}, below a pair of tens. Your ${activeBets} remaining ${betWord} lose ${activeBets * LET_IT_RIDE_BET} chips.`;

  return {
    qualifies,
    score,
    odds,
    activeBets,
    net,
    returned,
    summary,
    winningCardIds: qualifies ? score.cards.map((card) => card.id) : [],
  };
}

function dealLetItRide(seed: number): { hero: Card[]; board: Card[] } {
  const deck = shuffle(makeDeck(52), makeRng(seed));
  return { hero: deck.slice(0, 3), board: deck.slice(3, 5) };
}

export function newLetItRideGame(seed: number): LetItRideGame {
  const { hero, board } = dealLetItRide(seed);
  return {
    hero,
    board,
    stage: "first-decision",
    stack: START_STACK - OPENING_WAGER,
    wager: OPENING_WAGER,
    pulled: 0,
    log: [
      `You place three equal bets of ${LET_IT_RIDE_BET}.`,
      `Your private cards are ${handText(hero)}.`,
    ],
  };
}

function cloneLetItRideGame(game: LetItRideGame): LetItRideGame {
  return {
    ...game,
    hero: game.hero.map((card) => ({ ...card })),
    board: game.board.map((card) => ({ ...card })),
    outcome: game.outcome
      ? {
          ...game.outcome,
          score: { ...game.outcome.score, cards: game.outcome.score.cards.map((card) => ({ ...card })) },
          winningCardIds: [...game.outcome.winningCardIds],
        }
      : undefined,
    log: [...game.log],
  };
}

export function newLetItRideFrames(seed: number): LetItRideGame[] {
  const dealt = newLetItRideGame(seed);
  const bets = cloneLetItRideGame(dealt);
  bets.stage = "bets";
  bets.log = [bets.log[0]];
  return [bets, dealt];
}

function applyDecision(game: LetItRideGame, action: LetItRideAction): void {
  if (action === "pull") {
    game.pulled += 1;
    game.wager -= LET_IT_RIDE_BET;
    game.stack += LET_IT_RIDE_BET;
    game.lastAction = "pulls one back";
    game.log.push(`You pull back one ${LET_IT_RIDE_BET}-chip bet.`);
  } else {
    game.lastAction = "lets it ride";
    game.log.push("You let the bet ride.");
  }
}

export function letItRideActionFrames(
  game: LetItRideGame,
  action: LetItRideAction,
): LetItRideGame[] {
  if (game.stage !== "first-decision" && game.stage !== "second-decision") {
    return [cloneLetItRideGame(game)];
  }

  const acted = cloneLetItRideGame(game);
  applyDecision(acted, action);

  if (game.stage === "first-decision") {
    const next = cloneLetItRideGame(acted);
    next.stage = "second-decision";
    next.lastAction = undefined;
    next.log.push(`The first community card is ${handText([next.board[0]])}.`);
    return [acted, next];
  }

  const reveal = cloneLetItRideGame(acted);
  reveal.stage = "reveal";
  reveal.lastAction = undefined;
  reveal.log.push(`The final community card is ${handText([reveal.board[1]])}.`);

  const done = cloneLetItRideGame(reveal);
  done.stage = "done";
  done.outcome = resolveLetItRide(done.hero, done.board, done.pulled);
  // Withdrawn wagers already returned during play, so only add the still-active settlement here.
  done.stack += done.outcome.returned - done.pulled * LET_IT_RIDE_BET;
  done.wager = 0;
  done.lastAction = done.outcome.qualifies ? "wins" : undefined;
  done.log.push(done.outcome.summary);
  return [acted, reveal, done];
}

export function letItRideToTable(game: LetItRideGame): TableState {
  const cards: TableCard[] = [];
  const privateCardsVisible = game.stage !== "bets";
  const visibleBoardCards = game.stage === "second-decision"
    ? 1
    : game.stage === "reveal" || game.stage === "done"
      ? 2
      : 0;
  const winning = new Set(game.outcome?.winningCardIds ?? []);
  const hasWinner = winning.size > 0;

  if (privateCardsVisible) {
    game.hero.forEach((card, slot) => {
      cards.push({
        id: card.id,
        rank: card.rank,
        suit: card.suit,
        home: { where: "seat", seat: 0, slot },
        faceUp: true,
        emphasis: hasWinner ? "play" : "none",
      });
    });
  }
  game.board.slice(0, visibleBoardCards).forEach((card, slot) => {
    cards.push({
      id: card.id,
      rank: card.rank,
      suit: card.suit,
      home: { where: "board", board: 0, slot },
      faceUp: true,
      emphasis: hasWinner ? "play" : "none",
    });
  });

  const caption = game.stage === "bets"
    ? `Three bets: ${LET_IT_RIDE_BET} + ${LET_IT_RIDE_BET} + ${LET_IT_RIDE_BET}`
    : game.stage === "first-decision"
      ? "First decision — three private cards"
      : game.stage === "second-decision"
        ? "Second decision — one community card"
        : game.stage === "reveal"
          ? "Final community card"
          : "Result";

  return {
    boards: 1,
    pot: 0,
    buttonSeat: null,
    boardLabel: "Community cards",
    caption,
    seats: [
      {
        index: 0,
        name: "You",
        stack: game.stack,
        wager: game.wager,
        wagerKey: "let-it-ride-wager",
        returned: game.lastAction === "pulls one back" ? LET_IT_RIDE_BET : undefined,
        folded: false,
        isHero: true,
        active: game.stage === "first-decision" || game.stage === "second-decision",
        say: game.lastAction,
        won: (game.outcome?.net ?? 0) > 0 ? game.outcome?.net : undefined,
      },
    ],
    cards,
  };
}
