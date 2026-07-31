// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Regression tests for the ranking systems, the generated tutorials and the practice engine.
// Reason: The catalog drives ~40 variants through shared code, so the cheapest guard against a bad
//         street definition is to build and play every variant automatically on every run.

import { describe, expect, it } from "vitest";
import { cardText, makeRng, parseCard, parseCards } from "./cards";
import { chipBreakdown, chipBreakdownTotal } from "./chips";
import {
  bestHi,
  bestLo,
  compareScores,
  scoreBadugi,
  scoreFiveHigh,
  scoreFiveLow27,
  scoreFiveLowA5,
} from "./evaluator";
import { buildTutorial } from "./tutorial";
import { stateAtStep } from "./table";
import { generateDrills } from "./drills";
import {
  type Game,
  type HeroAction,
  heroActionFrames,
  heroActs,
  legalActions,
  newGame,
  newGameFrames,
  winningCardIds,
} from "./game";
import {
  houseActionFrames,
  houseGameToTable,
  newHouseGame,
  resolveHouseRound,
  scoreThreeCard,
  threeCardDealerQualifies,
} from "./house";
import { variants } from "../data";

const FREE = { useHole: null, useBoard: null, handSize: 5 };

describe("high hands", () => {
  it("shows tens as 10 while accepting standard T notation internally", () => {
    expect(parseCard("Th").id).toBe("Th");
    expect(parseCard("10h").id).toBe("Th");
    expect(cardText(parseCard("Th"))).toBe("10♥");
  });

  it("ranks the standard ladder", () => {
    const straightFlush = scoreFiveHigh(parseCards("9h 8h 7h 6h 5h"));
    const quads = scoreFiveHigh(parseCards("9h 9s 9d 9c 5h"));
    const boat = scoreFiveHigh(parseCards("9h 9s 9d 5c 5h"));
    const flush = scoreFiveHigh(parseCards("Ah Jh 7h 6h 2h"));
    expect(compareScores(straightFlush, quads)).toBe(1);
    expect(compareScores(quads, boat)).toBe(1);
    expect(compareScores(boat, flush)).toBe(1);
  });

  it("reads the wheel as a five-high straight", () => {
    const wheel = scoreFiveHigh(parseCards("Ah 2s 3d 4c 5h"));
    const sixHigh = scoreFiveHigh(parseCards("2s 3d 4c 5h 6d"));
    expect(wheel.label).toBe("a straight, five high");
    expect(compareScores(sixHigh, wheel)).toBe(1);
  });

  it("puts a flush above a full house in short deck", () => {
    const flush = scoreFiveHigh(parseCards("Ah Jh 9h 8h 6h"), "shortdeck");
    const boat = scoreFiveHigh(parseCards("Ks Kh Kd 7c 7h"), "shortdeck");
    expect(compareScores(flush, boat)).toBe(1);
  });

  it("reads A-6-7-8-9 as the short deck wheel", () => {
    const wheel = scoreFiveHigh(parseCards("Ah 6s 7d 8c 9h"), "shortdeck");
    expect(wheel.label).toBe("a straight, nine high");
  });
});

describe("low hands", () => {
  it("qualifies an eight-or-better low and rejects a nine", () => {
    expect(scoreFiveLowA5(parseCards("8h 6s 4d 3c As"), true).qualifies).toBe(true);
    expect(scoreFiveLowA5(parseCards("9h 6s 4d 3c As"), true).qualifies).toBe(false);
    expect(scoreFiveLowA5(parseCards("8h 8s 4d 3c As"), true).qualifies).toBe(false);
  });

  it("makes the wheel the best ace-to-five low", () => {
    const wheel = scoreFiveLowA5(parseCards("5h 4s 3d 2c As"), false);
    const eight = scoreFiveLowA5(parseCards("8h 4s 3d 2c As"), false);
    const paired = scoreFiveLowA5(parseCards("6h 6s 3d 2c As"), false);
    expect(compareScores(wheel, eight)).toBe(1);
    expect(compareScores(eight, paired)).toBe(1);
  });

  it("counts aces high and straights against you in deuce-to-seven", () => {
    const nuts = scoreFiveLow27(parseCards("7h 5s 4d 3c 2s"));
    const straight = scoreFiveLow27(parseCards("7h 6s 5d 4c 3s"));
    const aceLow = scoreFiveLow27(parseCards("Ah 5s 4d 3c 2s"));
    expect(compareScores(nuts, straight)).toBe(1);
    expect(compareScores(nuts, aceLow)).toBe(1);
  });

  it("prefers any badugi to any three-card hand", () => {
    const badugi = scoreBadugi(parseCards("9s 8h 7d 6c"));
    const threeCard = scoreBadugi(parseCards("As 2s 3h 4d"));
    expect(badugi.value[0]).toBe(4);
    expect(threeCard.value[0]).toBe(3);
    expect(compareScores(badugi, threeCard)).toBe(1);
  });
});

describe("hand selection", () => {
  it("forces exactly two hole cards in Omaha", () => {
    const board = parseCards("As Ks 9s 4d 2c");
    const oneSpade = parseCards("Qs Jh 7h 6d");
    const twoSpades = parseCards("Qs Js 7h 6d");
    const omaha = { useHole: 2, useBoard: 3, handSize: 5 };
    expect(bestHi(oneSpade, board, "high", omaha).value[0]).toBeLessThan(5);
    expect(bestHi(twoSpades, board, "high", omaha).value[0]).toBe(5);
  });

  it("identifies the exact private and shared cards in an Omaha winning combination", () => {
    const board = parseCards("As Ks 9s 7d 2c");
    const winnerCards = parseCards("Qs Js 8h 6d");
    const loserCards = parseCards("Ah Kd 4c 3c");
    const omaha = { useHole: 2, useBoard: 3, handSize: 5 };
    const winner = bestHi(winnerCards, board, "high", omaha);
    const loser = bestHi(loserCards, board, "high", omaha);
    const ids = winningCardIds({
      hiWinners: [0],
      loWinners: [],
      hiScore: winner,
      loScore: null,
      perPlayer: [
        { index: 0, hi: winner, lo: null },
        { index: 1, hi: loser, lo: null },
      ],
      awards: [{ index: 0, amount: 16 }],
      summary: "You win with a flush.",
    });

    expect(ids).toEqual(new Set(winner.cards.map((card) => card.id)));
    expect(winner.cards.filter((card) => winnerCards.some((hole) => hole.id === card.id))).toHaveLength(2);
    expect(winner.cards.filter((card) => board.some((shared) => shared.id === card.id))).toHaveLength(3);
  });

  it("lets a single hole card play in Hold'em", () => {
    const board = parseCards("As Ks 9s 4s 2c");
    const oneSpade = parseCards("Qs Jh");
    expect(bestHi(oneSpade, board, "high", FREE).value[0]).toBe(5);
  });

  it("finds no low when the board has too few low cards", () => {
    const board = parseCards("9d 9s Kc 5h 2d");
    const hand = parseCards("As 2s 3h 4d");
    const omaha = { useHole: 2, useBoard: 3, handSize: 5 };
    expect(bestLo(hand, board, "a5-8ob", omaha).qualifies).toBe(false);
  });
});

describe("dealer-banked practice", () => {
  it("uses the official Three Card Poker ranking order and queen-high qualification", () => {
    const straightFlush = scoreThreeCard(parseCards("Qs Js Ts"));
    const trips = scoreThreeCard(parseCards("9s 9h 9d"));
    const straight = scoreThreeCard(parseCards("8s 7h 6d"));
    const flush = scoreThreeCard(parseCards("As 8s 4s"));
    const pair = scoreThreeCard(parseCards("Ks Kh 2d"));
    expect(compareScores(straightFlush, trips)).toBe(1);
    expect(compareScores(trips, straight)).toBe(1);
    expect(compareScores(straight, flush)).toBe(1);
    expect(compareScores(flush, pair)).toBe(1);
    expect(threeCardDealerQualifies(scoreThreeCard(parseCards("Qs 6h 4d")))).toBe(true);
    expect(threeCardDealerQualifies(scoreThreeCard(parseCards("Js Th 8d")))).toBe(false);
  });

  it("settles Three Card Poker qualification, wins, folds and ante bonuses exactly", () => {
    const pairWin = resolveHouseRound(
      "three-card-poker",
      parseCards("As Ah 2d"),
      parseCards("Ks Qh 9d"),
      "play",
    );
    const straightBonus = resolveHouseRound(
      "three-card-poker",
      parseCards("6s 5h 4d"),
      parseCards("Ks Qh 9d"),
      "play",
    );
    const dealerMisses = resolveHouseRound(
      "three-card-poker",
      parseCards("7s 5h 2d"),
      parseCards("Js Th 8d"),
      "play",
    );
    const folded = resolveHouseRound(
      "three-card-poker",
      parseCards("7s 5h 2d"),
      parseCards("As Ah 8d"),
      "fold",
    );
    expect(pairWin.net).toBe(20);
    expect(straightBonus.net).toBe(30);
    expect(dealerMisses.net).toBe(10);
    expect(folded.net).toBe(-10);
  });

  it("settles Caribbean Stud qualification and the raise payout ladder", () => {
    const pairWin = resolveHouseRound(
      "caribbean-stud",
      parseCards("As Ah 9d 5c 2s"),
      parseCards("Ad Kh Qs 8c 3d"),
      "play",
    );
    const royalWin = resolveHouseRound(
      "caribbean-stud",
      parseCards("As Ks Qs Js Ts"),
      parseCards("9d 9c 8s 5h 2d"),
      "play",
    );
    const dealerMisses = resolveHouseRound(
      "caribbean-stud",
      parseCards("7s 6h 5d 3c 2s"),
      parseCards("Ad Qh Js 8c 3d"),
      "play",
    );
    expect(pairWin.net).toBe(30);
    expect(royalWin.net).toBe(2010);
    expect(dealerMisses.net).toBe(10);
  });

  it("separates the house-game wager, reveal and award into visible frames", () => {
    for (const id of ["three-card-poker", "caribbean-stud"] as const) {
      const game = newHouseGame(id, 71);
      const frames = houseActionFrames(game, "play");
      expect(frames.map((frame) => frame.stage)).toEqual(["decision", "reveal", "done"]);
      expect(frames[0].wager).toBeGreaterThan(game.wager);
      expect(frames[1].outcome).toBeUndefined();
      expect(frames[2].outcome).toBeTruthy();
      const table = houseGameToTable(frames[2]);
      const emphasized = table.cards.filter((card) => card.emphasis === "play");
      expect(emphasized.length === 0 || emphasized.length === game.hero.length).toBe(true);
    }
  });
});

describe("catalog", () => {
  it("has unique ids and complete copy", () => {
    const ids = variants.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const variant of variants) {
      expect(variant.keyIdeas.length).toBeGreaterThan(1);
      expect(variant.mistakes.length).toBeGreaterThan(0);
      expect(variant.strategy.length).toBeGreaterThan(0);
      expect(variant.betting.length).toBeGreaterThan(0);
    }
  });
});

describe("chip denominations", () => {
  it("renders an exact value for every pot and stack amount", () => {
    for (let amount = 0; amount <= 2500; amount++) {
      expect(chipBreakdownTotal(chipBreakdown(amount)), `${amount} chips`).toBe(amount);
    }
  });

  it("uses the expected casino colours for a mixed pot", () => {
    expect(chipBreakdown(132)).toEqual([
      { denomination: 100, tier: 3, count: 1 },
      { denomination: 25, tier: 2, count: 1 },
      { denomination: 5, tier: 1, count: 1 },
      { denomination: 1, tier: 0, count: 2 },
    ]);
  });
});

describe("tutorials", () => {
  it("builds and replays a script for every variant", () => {
    for (const variant of variants) {
      const steps = buildTutorial(variant);
      expect(steps.length, variant.id).toBeGreaterThan(3);
      for (let i = 0; i < steps.length; i++) {
        const state = stateAtStep(steps, i, Math.max(1, variant.boards));
        const cardIds = state.cards.map((card) => card.id);
        expect(new Set(cardIds).size, `${variant.id} step ${i}`).toBe(cardIds.length);
      }
    }
  });

  it("never deals a card twice within one demo hand", () => {
    for (const variant of variants) {
      const steps = buildTutorial(variant);
      const final = stateAtStep(steps, steps.length - 1, Math.max(1, variant.boards));
      const ids = final.cards.map((card) => card.id);
      expect(new Set(ids).size, variant.id).toBe(ids.length);
    }
  });
});

describe("drills", () => {
  it("produces answerable questions for every variant", () => {
    for (const variant of variants) {
      for (const seed of [1, 2, 3]) {
        const questions = generateDrills(variant, seed);
        expect(questions.length, variant.id).toBeGreaterThan(2);
        for (const question of questions) {
          expect(question.choices.some((choice) => choice.correct), `${variant.id}/${question.id}`).toBe(
            true,
          );
        }
      }
    }
  });
});

describe("practice engine", () => {
  /** Plays a hand to completion, choosing hero actions at random from the legal set. */
  function autoPlay(game: Game, rng: () => number): Game {
    let current = game;
    let guard = 0;
    while (current.phase !== "done" && guard++ < 200) {
      if (current.phase === "draw") {
        const hero = current.players[0];
        const max = current.variant.streets[current.streetIndex]?.drawMax ?? hero.cards.length;
        const count = Math.floor(rng() * (Math.min(max, hero.cards.length) + 1));
        const discardIds = hero.cards.slice(0, count).map((card) => card.id);
        current = heroActs(current, { t: "draw", discardIds });
        continue;
      }
      if (current.toAct !== 0) break;
      const legal = legalActions(current);
      const pick = legal[Math.floor(rng() * legal.length)];
      current = heroActs(current, { t: pick } as HeroAction);
    }
    return current;
  }

  it("plays every playable variant to a settled showdown", () => {
    const playable = variants.filter((v) => v.playable && v.practiceMode !== "house");
    expect(playable.length).toBeGreaterThan(15);

    for (const variant of playable) {
      for (let hand = 0; hand < 12; hand++) {
        const rng = makeRng(hand * 7919 + variant.id.length);
        const seats = Math.min(4, Math.max(2, variant.players.typical));
        const finished = autoPlay(newGame(variant, seats, hand * 1013 + 7), rng);
        expect(finished.phase, `${variant.id} hand ${hand}`).toBe("done");
        expect(finished.settlement, `${variant.id} hand ${hand}`).toBeTruthy();
        expect(finished.settlement?.summary.length, `${variant.id} hand ${hand}`).toBeGreaterThan(0);
      }
    }
  });

  it("never deals a duplicate card during a hand", () => {
    for (const variant of variants.filter((v) => v.playable && v.practiceMode !== "house")) {
      const rng = makeRng(42);
      const finished = autoPlay(newGame(variant, 4, 12345), rng);
      const dealt = [...finished.players.flatMap((p) => p.cards), ...finished.board].map((c) => c.id);
      expect(new Set(dealt).size, variant.id).toBe(dealt.length);
    }
  });

  it("exposes a hero raise before bot responses and pot collection", () => {
    const holdem = variants.find((variant) => variant.id === "texas-holdem");
    expect(holdem).toBeTruthy();
    if (!holdem) return;

    let game: Game | undefined;
    for (let seed = 1; seed <= 100; seed++) {
      const candidate = newGame(holdem, 4, seed);
      if (candidate.phase === "betting" && candidate.toAct === 0) {
        game = candidate;
        break;
      }
    }
    expect(game).toBeTruthy();
    if (!game) return;

    const wagerBefore = game.players[0].wager;
    const frames = heroActionFrames(game, { t: "raise" });
    expect(frames.length).toBeGreaterThan(1);
    expect(frames[0].players[0].wager).toBeGreaterThan(wagerBefore);
    expect(frames[0].players[0].lastAction).toMatch(/raises to/);
    expect(frames.at(-1)?.log).toContain(frames[0].log.at(-1));
  });

  it("breaks a fresh deal into forced-bet, deal and bot-action frames", () => {
    const holdem = variants.find((variant) => variant.id === "texas-holdem");
    expect(holdem).toBeTruthy();
    if (!holdem) return;

    const frames = newGameFrames(holdem, 4, 17);
    const resolved = newGame(holdem, 4, 17);
    expect(frames.length).toBeGreaterThan(2);
    expect(frames[0].players.every((player) => player.cards.length === 0)).toBe(true);
    expect(frames.some((frame) => frame.players.some((player) => player.cards.length > 0))).toBe(true);
    expect(
      frames.some((frame) => frame.players.some((player) => Boolean(player.lastAction))),
    ).toBe(true);
    expect(frames.at(-1)?.toAct).toBe(resolved.toAct);
    expect(frames.at(-1)?.phase).toBe(resolved.phase);
    expect(frames.at(-1)?.log).toEqual(resolved.log);
  });

  it("holds collected chips and showdown reveal before awarding the pot", () => {
    const holdem = variants.find((variant) => variant.id === "texas-holdem");
    expect(holdem).toBeTruthy();
    if (!holdem) return;

    let current = newGame(holdem, 2, 29);
    let sawCollection = false;
    let sawShowdown = false;
    let sawAward = false;
    let guard = 0;

    while (current.phase !== "done" && guard++ < 100) {
      if (current.toAct !== 0) break;
      const action = legalActions(current).includes("check") ? "check" : "call";
      const frames = heroActionFrames(current, { t: action } as HeroAction);
      for (let i = 1; i < frames.length; i++) {
        const previous = frames[i - 1];
        const frame = frames[i];
        if (
          previous.players.some((player) => player.wager > 0) &&
          frame.players.every((player) => player.wager === 0) &&
          frame.pot > previous.pot
        ) {
          sawCollection = true;
        }
        if (frame.phase === "showdown" && frame.pot > 0) sawShowdown = true;
        if (frame.phase === "done" && (frame.settlement?.awards.length ?? 0) > 0) sawAward = true;
      }
      current = frames.at(-1) ?? current;
    }

    expect(current.phase).toBe("done");
    expect(sawCollection).toBe(true);
    expect(sawShowdown).toBe(true);
    expect(sawAward).toBe(true);
  });
});
