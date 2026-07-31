// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-31T13:00:00-04:00
// Purpose: Rules-accurate Ultimate Texas Hold'em decisions, qualification, payouts and table frames.
// Reason: Its single Play wager can be made at three different multiples, so an isolated engine
//         protects both ordinary Hold'em betting and the simpler one-decision casino games.

import type { TableCard, TableState } from "../types";
import { type Card, handText, makeDeck, makeRng, shuffle } from "./cards";
import {
  FREE_SELECTION,
  HI_CATEGORY,
  bestHi,
  compareScores,
  type HandScore,
} from "./evaluator";

export type UltimateHoldemStage =
  | "bets"
  | "preflop"
  | "flop"
  | "river"
  | "dealer-reveal"
  | "done";
export type UltimateHoldemAction =
  | "check"
  | "bet-3x"
  | "bet-4x"
  | "bet-2x"
  | "bet-1x"
  | "fold";

export const ULTIMATE_ANTE = 10;
export const ULTIMATE_BLIND = 10;
const START_STACK = 200;
const OPENING_WAGER = ULTIMATE_ANTE + ULTIMATE_BLIND;

export interface UltimateHoldemOutcome {
  result: "win" | "loss" | "push" | "fold";
  dealerQualifies: boolean;
  heroScore?: HandScore;
  dealerScore?: HandScore;
  playMultiple: number;
  blindOdds: number | null;
  net: number;
  returned: number;
  summary: string;
  winningCardIds: string[];
}

export interface UltimateHoldemGame {
  hero: Card[];
  dealer: Card[];
  board: Card[];
  stage: UltimateHoldemStage;
  stack: number;
  wager: number;
  playBet: number;
  playMultiple: number;
  folded: boolean;
  lastAction?: string;
  outcome?: UltimateHoldemOutcome;
  log: string[];
}

/** Paytable A for a winning Blind wager; null means the Blind pushes. */
export function ultimateBlindOdds(score: HandScore): number | null {
  const category = score.value[0];
  if (category === HI_CATEGORY.STRAIGHT_FLUSH) return score.value[1] === 14 ? 500 : 50;
  if (category === HI_CATEGORY.QUADS) return 10;
  if (category === HI_CATEGORY.FULL_HOUSE) return 3;
  if (category === HI_CATEGORY.FLUSH) return 1.5;
  if (category === HI_CATEGORY.STRAIGHT) return 1;
  return null;
}

function blindPayoutText(odds: number | null): string {
  if (odds == null) return "the Blind pushes";
  return `the Blind pays ${odds === 1.5 ? "3 to 2" : `${odds} to 1`}`;
}

/** Pure settlement for fixed-hand rule tests and the final animation frame. */
export function resolveUltimateHoldem(
  hero: Card[],
  dealer: Card[],
  board: Card[],
  playMultiple: number | null,
): UltimateHoldemOutcome {
  if (hero.length !== 2 || dealer.length !== 2 || board.length !== 5) {
    throw new Error("Ultimate Texas Hold'em settles two cards each against a five-card board");
  }
  if (playMultiple == null) {
    return {
      result: "fold",
      dealerQualifies: false,
      playMultiple: 0,
      blindOdds: null,
      net: -OPENING_WAGER,
      returned: 0,
      summary: `You fold and lose the ${ULTIMATE_ANTE}-chip Ante and ${ULTIMATE_BLIND}-chip Blind.`,
      winningCardIds: [],
    };
  }
  if (![1, 2, 3, 4].includes(playMultiple)) {
    throw new Error("The Play wager must be 1×, 2×, 3× or 4× the Ante");
  }

  const heroScore = bestHi(hero, board, "high", FREE_SELECTION);
  const dealerScore = bestHi(dealer, board, "high", FREE_SELECTION);
  const dealerQualifies = dealerScore.value[0] >= HI_CATEGORY.PAIR;
  const comparison = compareScores(heroScore, dealerScore);
  const playBet = playMultiple * ULTIMATE_ANTE;
  const totalWager = OPENING_WAGER + playBet;

  if (comparison === 0) {
    return {
      result: "push",
      dealerQualifies,
      heroScore,
      dealerScore,
      playMultiple,
      blindOdds: null,
      net: 0,
      returned: totalWager,
      summary: `Both hands play ${heroScore.label}. Ante, Blind and Play all push.`,
      winningCardIds: [],
    };
  }

  if (comparison < 0) {
    const returned = dealerQualifies ? 0 : ULTIMATE_ANTE;
    const qualification = dealerQualifies
      ? "The dealer qualifies"
      : "The dealer does not qualify, so your Ante returns";
    return {
      result: "loss",
      dealerQualifies,
      heroScore,
      dealerScore,
      playMultiple,
      blindOdds: null,
      net: returned - totalWager,
      returned,
      summary: `${qualification}, but still wins with ${dealerScore.label} against your hand (${heroScore.label}). You lose ${totalWager - returned} chips.`,
      winningCardIds: dealerScore.cards.map((card) => card.id),
    };
  }

  const blindOdds = ultimateBlindOdds(heroScore);
  const anteReturn = dealerQualifies ? ULTIMATE_ANTE * 2 : ULTIMATE_ANTE;
  const blindReturn = blindOdds == null
    ? ULTIMATE_BLIND
    : ULTIMATE_BLIND * (blindOdds + 1);
  const playReturn = playBet * 2;
  const returned = anteReturn + blindReturn + playReturn;
  const net = returned - totalWager;
  const qualification = dealerQualifies
    ? "The dealer qualifies, so the Ante pays 1 to 1"
    : "The dealer does not qualify, so the Ante pushes";

  return {
    result: "win",
    dealerQualifies,
    heroScore,
    dealerScore,
    playMultiple,
    blindOdds,
    net,
    returned,
    summary: `You win with ${heroScore.label} against the dealer's hand (${dealerScore.label}). ${qualification}; Play pays 1 to 1; ${blindPayoutText(blindOdds)}. Net ${net >= 0 ? "+" : ""}${net} chips.`,
    winningCardIds: heroScore.cards.map((card) => card.id),
  };
}

function dealUltimateHoldem(seed: number): { hero: Card[]; dealer: Card[]; board: Card[] } {
  const deck = shuffle(makeDeck(52), makeRng(seed));
  // Two cards each, burn, flop, burn, then the final two community cards.
  return {
    hero: [deck[0], deck[2]],
    dealer: [deck[1], deck[3]],
    board: [deck[5], deck[6], deck[7], deck[9], deck[10]],
  };
}

export function newUltimateHoldemGame(seed: number): UltimateHoldemGame {
  const { hero, dealer, board } = dealUltimateHoldem(seed);
  return {
    hero,
    dealer,
    board,
    stage: "preflop",
    stack: START_STACK - OPENING_WAGER,
    wager: OPENING_WAGER,
    playBet: 0,
    playMultiple: 0,
    folded: false,
    log: [
      `You post an Ante of ${ULTIMATE_ANTE} and a Blind of ${ULTIMATE_BLIND}.`,
      `Your private cards are ${handText(hero)}.`,
    ],
  };
}

function cloneUltimateHoldem(game: UltimateHoldemGame): UltimateHoldemGame {
  return {
    ...game,
    hero: game.hero.map((card) => ({ ...card })),
    dealer: game.dealer.map((card) => ({ ...card })),
    board: game.board.map((card) => ({ ...card })),
    outcome: game.outcome
      ? {
          ...game.outcome,
          heroScore: game.outcome.heroScore
            ? {
                ...game.outcome.heroScore,
                cards: game.outcome.heroScore.cards.map((card) => ({ ...card })),
              }
            : undefined,
          dealerScore: game.outcome.dealerScore
            ? {
                ...game.outcome.dealerScore,
                cards: game.outcome.dealerScore.cards.map((card) => ({ ...card })),
              }
            : undefined,
          winningCardIds: [...game.outcome.winningCardIds],
        }
      : undefined,
    log: [...game.log],
  };
}

export function newUltimateHoldemFrames(seed: number): UltimateHoldemGame[] {
  const dealt = newUltimateHoldemGame(seed);
  const bets = cloneUltimateHoldem(dealt);
  bets.stage = "bets";
  bets.log = [bets.log[0]];
  return [bets, dealt];
}

export function ultimateHoldemLegalActions(game: UltimateHoldemGame): UltimateHoldemAction[] {
  if (game.playBet > 0 || game.folded) return [];
  if (game.stage === "preflop") return ["check", "bet-3x", "bet-4x"];
  if (game.stage === "flop") return ["check", "bet-2x"];
  if (game.stage === "river") return ["fold", "bet-1x"];
  return [];
}

function revealFlop(game: UltimateHoldemGame): UltimateHoldemGame {
  const flop = cloneUltimateHoldem(game);
  flop.stage = "flop";
  flop.lastAction = undefined;
  flop.log.push(`The flop is ${handText(flop.board.slice(0, 3))}.`);
  return flop;
}

function revealRiver(game: UltimateHoldemGame): UltimateHoldemGame {
  const river = cloneUltimateHoldem(game);
  river.stage = "river";
  river.lastAction = undefined;
  river.log.push(`The final two community cards are ${handText(river.board.slice(3))}.`);
  return river;
}

function finishPlayedHand(game: UltimateHoldemGame): UltimateHoldemGame[] {
  const reveal = cloneUltimateHoldem(game);
  reveal.stage = "dealer-reveal";
  reveal.lastAction = undefined;
  reveal.log.push(`The dealer reveals ${handText(reveal.dealer)}.`);

  const done = cloneUltimateHoldem(reveal);
  done.stage = "done";
  done.outcome = resolveUltimateHoldem(done.hero, done.dealer, done.board, done.playMultiple);
  done.stack += done.outcome.returned;
  done.wager = 0;
  done.lastAction = done.outcome.result === "win"
    ? "wins"
    : done.outcome.result === "push"
      ? "pushes"
      : undefined;
  done.log.push(done.outcome.summary);
  return [reveal, done];
}

export function ultimateHoldemActionFrames(
  game: UltimateHoldemGame,
  action: UltimateHoldemAction,
): UltimateHoldemGame[] {
  if (!ultimateHoldemLegalActions(game).includes(action)) return [cloneUltimateHoldem(game)];
  const acted = cloneUltimateHoldem(game);

  if (action === "check") {
    acted.lastAction = "checks";
    acted.log.push("You check and wait for more information.");
    return game.stage === "preflop"
      ? [acted, revealFlop(acted)]
      : [acted, revealRiver(acted)];
  }

  if (action === "fold") {
    acted.folded = true;
    acted.lastAction = "folds";
    acted.log.push("You fold instead of making the 1× Play wager.");
    const done = cloneUltimateHoldem(acted);
    done.stage = "done";
    done.wager = 0;
    done.outcome = resolveUltimateHoldem(done.hero, done.dealer, done.board, null);
    done.log.push(done.outcome.summary);
    return [acted, done];
  }

  const multiple = Number(action.match(/(\d)/)?.[1]);
  acted.playMultiple = multiple;
  acted.playBet = multiple * ULTIMATE_ANTE;
  acted.stack -= acted.playBet;
  acted.wager += acted.playBet;
  acted.lastAction = `bets ${multiple}×`;
  acted.log.push(`You make a ${multiple}× Play wager of ${acted.playBet}.`);

  const frames: UltimateHoldemGame[] = [acted];
  let current = acted;
  if (game.stage === "preflop") {
    current = revealFlop(current);
    frames.push(current);
  }
  if (game.stage !== "river") {
    current = revealRiver(current);
    frames.push(current);
  }
  frames.push(...finishPlayedHand(current));
  return frames;
}

export function ultimateHoldemToTable(game: UltimateHoldemGame): TableState {
  const cards: TableCard[] = [];
  const showCards = game.stage !== "bets";
  const boardCount = game.stage === "flop"
    ? 3
    : game.stage === "river" || game.stage === "dealer-reveal" || game.stage === "done"
      ? 5
      : 0;
  const revealDealer = (game.stage === "dealer-reveal" || game.stage === "done") && !game.folded;
  const winning = new Set(game.outcome?.winningCardIds ?? []);
  const hasWinner = winning.size > 0;

  if (showCards) {
    game.hero.forEach((card, slot) => cards.push({
      id: card.id,
      rank: card.rank,
      suit: card.suit,
      home: game.folded ? { where: "muck" } : { where: "seat", seat: 0, slot },
      faceUp: true,
      emphasis: game.folded ? "dim" : hasWinner ? (winning.has(card.id) ? "play" : "dim") : "none",
    }));
    game.dealer.forEach((card, slot) => cards.push({
      id: card.id,
      rank: card.rank,
      suit: card.suit,
      home: { where: "seat", seat: 1, slot },
      faceUp: revealDealer,
      emphasis: hasWinner ? (winning.has(card.id) ? "play" : "dim") : "none",
    }));
  }
  game.board.slice(0, boardCount).forEach((card, slot) => cards.push({
    id: card.id,
    rank: card.rank,
    suit: card.suit,
    home: { where: "board", board: 0, slot },
    faceUp: true,
    emphasis: hasWinner ? (winning.has(card.id) ? "play" : "dim") : "none",
  }));

  const isBetFrame = Boolean(game.lastAction?.startsWith("bets "));
  const shownWager = isBetFrame ? game.wager - game.playBet : game.wager;
  const caption = game.stage === "bets"
    ? `Ante ${ULTIMATE_ANTE} + Blind ${ULTIMATE_BLIND}`
    : game.stage === "preflop"
      ? "Preflop — Play 3× or 4×, or check"
      : game.stage === "flop"
        ? game.playBet ? "Flop — Play wager locked" : "Flop — Play 2× or check"
        : game.stage === "river"
          ? game.playBet ? "Final board — Play wager locked" : "Final board — Play 1× or fold"
          : game.stage === "dealer-reveal"
            ? "Dealer qualification"
            : "Result";

  return {
    boards: 1,
    pot: 0,
    buttonSeat: null,
    caption,
    seats: [
      {
        index: 0,
        name: "You",
        stack: game.stack,
        wager: shownWager,
        wagerKey: "ultimate-holdem-wager",
        added: isBetFrame ? game.playBet : undefined,
        folded: game.folded,
        isHero: true,
        active: ultimateHoldemLegalActions(game).length > 0,
        say: game.lastAction,
        won: (game.outcome?.net ?? 0) > 0 ? game.outcome?.net : undefined,
      },
      {
        index: 1,
        name: "Dealer",
        stack: 0,
        wager: 0,
        folded: false,
        isHero: false,
        hideStack: true,
        say: game.outcome?.result === "loss"
          ? game.outcome.dealerQualifies ? "wins" : "wins · no qualify"
          : game.outcome && !game.outcome.dealerQualifies && !game.folded
            ? "does not qualify"
            : undefined,
      },
    ],
    cards,
  };
}
