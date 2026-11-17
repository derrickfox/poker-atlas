// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-31T10:15:00-04:00
// Purpose: Isolated rules, payouts and animation frames for dealer-banked poker practice games.
// Reason: Three Card Poker and Caribbean Stud need accurate house qualification and payout rules,
//         but must not alter the shared street engine that already powers 22 peer-poker variants.

import type { TableCard, TableState } from "../types";
import {
  type Card,
  RANK_WORD,
  handText,
  makeDeck,
  makeRng,
  shuffle,
} from "./cards";
import { compareScores, scoreFiveHigh, type HandScore } from "./evaluator";

export type HouseGameId = "three-card-poker" | "caribbean-stud";
export type HouseAction = "play" | "fold";
export type HouseStage = "ante" | "decision" | "reveal" | "done";

const START_STACK = 200;
export const HOUSE_ANTE = 10;

export interface HouseOutcome {
  result: "win" | "loss" | "push" | "fold";
  dealerQualifies: boolean;
  heroLabel: string;
  dealerLabel: string;
  /** Profit or loss relative to the stack before the hand. */
  net: number;
  /** Total chips returned to the player's stack, including returned wagers. */
  returned: number;
  summary: string;
  winningCardIds: string[];
}

export interface HouseGame {
  id: HouseGameId;
  hero: Card[];
  dealer: Card[];
  stage: HouseStage;
  stack: number;
  wager: number;
  playBet: number;
  folded: boolean;
  lastAction?: string;
  outcome?: HouseOutcome;
  log: string[];
}

export type ThreeCardScore = HandScore;

function pluralRank(rank: number): string {
  if (rank === 6) return "sixes";
  return `${RANK_WORD[rank]}s`;
}

/** Three-card casino ranking: straight flush, trips, straight, flush, pair, high card. */
export function scoreThreeCard(cards: Card[]): ThreeCardScore {
  if (cards.length !== 3) throw new Error("Three Card Poker requires exactly three cards");
  const ranks = cards.map((card) => card.rank).sort((a, b) => b - a);
  const groups = new Map<number, number>();
  cards.forEach((card) => groups.set(card.rank, (groups.get(card.rank) ?? 0) + 1));
  const grouped = [...groups.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((card) => card.suit === cards[0].suit);
  const unique = [...new Set(ranks)];
  const wheel = unique.length === 3 && unique[0] === 14 && unique[1] === 3 && unique[2] === 2;
  const straight = unique.length === 3 && (unique[0] - unique[2] === 2 || wheel);
  const straightHigh = wheel ? 3 : unique[0];

  let category = 0;
  let kickers = ranks;
  let label = `${RANK_WORD[ranks[0]]} high`;

  if (straight && flush) {
    category = 5;
    kickers = [straightHigh];
    label = `a straight flush, ${RANK_WORD[straightHigh]} high`;
  } else if (grouped[0][1] === 3) {
    category = 4;
    kickers = [grouped[0][0]];
    label = `three ${pluralRank(grouped[0][0])}`;
  } else if (straight) {
    category = 3;
    kickers = [straightHigh];
    label = `a straight, ${RANK_WORD[straightHigh]} high`;
  } else if (flush) {
    category = 2;
    label = `a flush, ${RANK_WORD[ranks[0]]} high`;
  } else if (grouped[0][1] === 2) {
    category = 1;
    kickers = [grouped[0][0], grouped[1][0]];
    label = `a pair of ${pluralRank(grouped[0][0])}`;
  }

  return { value: [category, ...kickers], label, cards: [...cards], qualifies: true };
}

export function threeCardDealerQualifies(score: ThreeCardScore): boolean {
  return score.value[0] > 0 || (score.value[1] ?? 0) >= 12;
}

function caribbeanDealerQualifies(score: HandScore): boolean {
  return score.value[0] > 0 || (score.value[1] === 14 && score.value[2] === 13);
}

function threeCardAnteBonus(score: ThreeCardScore): number {
  if (score.value[0] === 5) return 5;
  if (score.value[0] === 4) return 4;
  if (score.value[0] === 3) return 1;
  return 0;
}

function caribbeanRaiseOdds(score: HandScore): number {
  const category = score.value[0];
  if (category === 8) {
    const ranks = new Set(score.cards.map((card) => card.rank));
    return [10, 11, 12, 13, 14].every((rank) => ranks.has(rank)) ? 100 : 50;
  }
  return ({ 7: 20, 6: 7, 5: 5, 4: 4, 3: 3, 2: 2, 1: 1, 0: 1 } as Record<number, number>)[category];
}

/** Pure settlement used by both the UI frames and fixed-hand rules tests. */
export function resolveHouseRound(
  id: HouseGameId,
  hero: Card[],
  dealer: Card[],
  action: HouseAction,
): HouseOutcome {
  const playBet = id === "caribbean-stud" ? HOUSE_ANTE * 2 : HOUSE_ANTE;
  const totalWager = HOUSE_ANTE + playBet;

  if (action === "fold") {
    return {
      result: "fold",
      dealerQualifies: false,
      heroLabel: id === "three-card-poker" ? scoreThreeCard(hero).label : scoreFiveHigh(hero).label,
      dealerLabel: "not revealed",
      net: -HOUSE_ANTE,
      returned: 0,
      summary: `You fold and lose the ${HOUSE_ANTE}-chip ante.`,
      winningCardIds: [],
    };
  }

  const heroScore = id === "three-card-poker" ? scoreThreeCard(hero) : scoreFiveHigh(hero);
  const dealerScore = id === "three-card-poker" ? scoreThreeCard(dealer) : scoreFiveHigh(dealer);
  const dealerQualifies = id === "three-card-poker"
    ? threeCardDealerQualifies(dealerScore)
    : caribbeanDealerQualifies(dealerScore);
  const comparison = compareScores(heroScore, dealerScore);
  const bonus = id === "three-card-poker" ? threeCardAnteBonus(heroScore) * HOUSE_ANTE : 0;

  if (!dealerQualifies) {
    const returned = HOUSE_ANTE * 2 + playBet + bonus;
    return {
      result: "win",
      dealerQualifies,
      heroLabel: heroScore.label,
      dealerLabel: dealerScore.label,
      net: returned - totalWager,
      returned,
      summary: `The dealer has ${dealerScore.label} and does not qualify. Your ante wins, your Play wager returns${bonus ? `, and the ante bonus pays ${bonus}` : ""}.`,
      winningCardIds: [],
    };
  }

  if (comparison === 0) {
    return {
      result: "push",
      dealerQualifies,
      heroLabel: heroScore.label,
      dealerLabel: dealerScore.label,
      net: bonus,
      returned: totalWager + bonus,
      summary: `Both hands have ${heroScore.label}. The wagers push${bonus ? ` and the ante bonus pays ${bonus}` : ""}.`,
      winningCardIds: [],
    };
  }

  if (comparison > 0) {
    const raiseProfit = id === "caribbean-stud"
      ? playBet * caribbeanRaiseOdds(heroScore)
      : playBet;
    const returned = totalWager + HOUSE_ANTE + raiseProfit + bonus;
    return {
      result: "win",
      dealerQualifies,
      heroLabel: heroScore.label,
      dealerLabel: dealerScore.label,
      net: returned - totalWager,
      returned,
      summary: `You win with ${heroScore.label} against the dealer's ${dealerScore.label} for ${returned - totalWager} chips${bonus ? `, including a ${bonus}-chip ante bonus` : ""}.`,
      winningCardIds: heroScore.cards.map((card) => card.id),
    };
  }

  return {
    result: "loss",
    dealerQualifies,
    heroLabel: heroScore.label,
    dealerLabel: dealerScore.label,
    net: -totalWager + bonus,
    returned: bonus,
    summary: `The dealer wins with ${dealerScore.label} against your ${heroScore.label}${bonus ? `; your ante bonus still pays ${bonus}` : ""}.`,
    winningCardIds: dealerScore.cards.map((card) => card.id),
  };
}

function dealHouseCards(id: HouseGameId, seed: number): { hero: Card[]; dealer: Card[] } {
  const count = id === "three-card-poker" ? 3 : 5;
  const deck = shuffle(makeDeck(52), makeRng(seed));
  const hero: Card[] = [];
  const dealer: Card[] = [];
  for (let round = 0; round < count; round++) {
    hero.push(deck[round * 2]);
    dealer.push(deck[round * 2 + 1]);
  }
  return { hero, dealer };
}

export function newHouseGame(id: HouseGameId, seed: number): HouseGame {
  const { hero, dealer } = dealHouseCards(id, seed);
  return {
    id,
    hero,
    dealer,
    stage: "decision",
    stack: START_STACK - HOUSE_ANTE,
    wager: HOUSE_ANTE,
    playBet: id === "caribbean-stud" ? HOUSE_ANTE * 2 : HOUSE_ANTE,
    folded: false,
    log: [
      `You post an ante of ${HOUSE_ANTE}.`,
      id === "three-card-poker"
        ? `Your hand is ${handText(hero)} — ${scoreThreeCard(hero).label}.`
        : `Your hand is ${handText(hero)} — ${scoreFiveHigh(hero).label}.`,
    ],
  };
}

function cloneHouseGame(game: HouseGame): HouseGame {
  return {
    ...game,
    hero: game.hero.map((card) => ({ ...card })),
    dealer: game.dealer.map((card) => ({ ...card })),
    outcome: game.outcome ? { ...game.outcome, winningCardIds: [...game.outcome.winningCardIds] } : undefined,
    log: [...game.log],
  };
}

export function newHouseGameFrames(id: HouseGameId, seed: number): HouseGame[] {
  const dealt = newHouseGame(id, seed);
  const ante = cloneHouseGame(dealt);
  ante.stage = "ante";
  ante.log = [ante.log[0]];
  return [ante, dealt];
}

export function houseActionFrames(game: HouseGame, action: HouseAction): HouseGame[] {
  if (game.stage !== "decision") return [cloneHouseGame(game)];
  const acted = cloneHouseGame(game);
  acted.lastAction = action === "fold" ? "folds" : acted.id === "caribbean-stud" ? "raises 2×" : "plays";
  acted.log.push(action === "fold" ? "You fold." : `You wager ${acted.playBet} to play.`);

  if (action === "fold") {
    acted.folded = true;
    const done = cloneHouseGame(acted);
    done.stage = "done";
    done.wager = 0;
    done.outcome = resolveHouseRound(done.id, done.hero, done.dealer, action);
    done.log.push(done.outcome.summary);
    return [acted, done];
  }

  acted.stack -= acted.playBet;
  acted.wager += acted.playBet;
  const reveal = cloneHouseGame(acted);
  reveal.stage = "reveal";
  reveal.lastAction = undefined;
  reveal.log.push(`The dealer reveals ${handText(reveal.dealer)}.`);

  const done = cloneHouseGame(reveal);
  done.stage = "done";
  done.outcome = resolveHouseRound(done.id, done.hero, done.dealer, action);
  done.stack += done.outcome.returned;
  done.wager = 0;
  done.lastAction = done.outcome.result === "win" ? "wins" : done.outcome.result === "push" ? "pushes" : undefined;
  done.log.push(done.outcome.summary);
  return [acted, reveal, done];
}

export function isHousePracticeId(id: string): id is HouseGameId {
  return id === "three-card-poker" || id === "caribbean-stud";
}

export function houseGameToTable(game: HouseGame): TableState {
  const cards: TableCard[] = [];
  const showCards = game.stage !== "ante";
  const revealDealer = (game.stage === "reveal" || game.stage === "done") && !game.folded;
  const winning = new Set(game.outcome?.winningCardIds ?? []);
  const hasWinner = winning.size > 0;

  if (showCards) {
    const count = Math.max(game.hero.length, game.dealer.length);
    for (let slot = 0; slot < count; slot++) {
      const hero = game.hero[slot];
      const dealer = game.dealer[slot];
      if (hero) {
        cards.push({
          id: hero.id,
          rank: hero.rank,
          suit: hero.suit,
          home: game.folded ? { where: "muck" } : { where: "seat", seat: 0, slot },
          faceUp: true,
          emphasis: game.folded ? "dim" : hasWinner ? (winning.has(hero.id) ? "play" : "dim") : "none",
        });
      }
      if (dealer) {
        cards.push({
          id: dealer.id,
          rank: dealer.rank,
          suit: dealer.suit,
          home: { where: "seat", seat: 1, slot },
          faceUp: revealDealer || slot === 0,
          emphasis: hasWinner ? (winning.has(dealer.id) ? "play" : "dim") : "none",
        });
      }
    }
  }

  const caption = game.stage === "ante"
    ? `Ante ${HOUSE_ANTE}`
    : game.stage === "decision"
      ? game.id === "three-card-poker" ? "Play or fold" : "Raise 2× or fold"
      : game.stage === "reveal"
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
        wager: game.wager,
        folded: game.folded,
        isHero: true,
        active: game.stage === "decision",
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
          ? "wins"
          : game.outcome && !game.outcome.dealerQualifies && !game.folded
            ? "does not qualify"
            : undefined,
      },
    ],
    cards,
  };
}
