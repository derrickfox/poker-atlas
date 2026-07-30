// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Generates practice drills for a variant — structure recall, hand reading, and real
//          "which hand wins" showdowns evaluated under that variant's own ranking rules.
// Reason: Drills built from live evaluation are always correct and never repeat, which is a far
//         better teaching tool than a fixed question bank, and it works for every variant at once.

import type { QuizQuestion, Variant } from "../types";
import { type Card, handText, makeDeck, makeRng, shuffle } from "./cards";
import { bestHi, bestLo, compareScores, scoreFiveHigh } from "./evaluator";
import { BETTING_LABEL, POT_TYPE_LABEL } from "../data";

function ids(cards: Card[]): string[] {
  return cards.map((card) => card.id);
}

function shuffleChoices<T>(items: T[], rng: () => number): T[] {
  return shuffle(items, rng);
}

/* ------------------------------------------------------------- structure recall */

function structureQuestions(variant: Variant, rng: () => number): QuizQuestion[] {
  const out: QuizQuestion[] = [];

  if (variant.holeCards > 0 && variant.family !== "mixed") {
    const wrong = [variant.holeCards + 1, Math.max(1, variant.holeCards - 1)].filter(
      (n) => n !== variant.holeCards,
    );
    out.push({
      id: "structure-hole",
      prompt: `How many cards does each player receive in ${variant.name}?`,
      choices: shuffleChoices(
        [
          { text: `${variant.holeCards}`, correct: true },
          ...wrong.slice(0, 2).map((n) => ({ text: `${n}` })),
        ],
        rng,
      ),
      explain: `${variant.name} deals ${variant.holeCards} card${variant.holeCards === 1 ? "" : "s"} to each player${
        variant.family === "stud" ? ", spread across five streets" : ""
      }.`,
    });
  }

  if (variant.selection.useHole != null) {
    out.push({
      id: "structure-selection",
      prompt: `In ${variant.name}, how many of your own cards must play in your final hand?`,
      choices: shuffleChoices(
        [
          { text: `Exactly ${variant.selection.useHole}`, correct: true },
          { text: "Any number — use whatever makes the best hand" },
          { text: "At least one" },
        ],
        rng,
      ),
      explain: `This is the rule that separates the Omaha family from Hold'em: exactly ${variant.selection.useHole} hole cards and exactly ${variant.selection.useBoard} board cards, no exceptions.`,
    });
  } else if (variant.family === "community" && variant.boards === 1) {
    out.push({
      id: "structure-selection",
      prompt: `In ${variant.name}, how many of your own cards must play in your final hand?`,
      choices: shuffleChoices(
        [
          { text: "Any number — use whatever makes the best hand", correct: true },
          { text: "Exactly two" },
          { text: "At least one" },
        ],
        rng,
      ),
      explain:
        "Unlike Omaha, there is no 'use exactly two' rule here. You may play both cards, one, or neither and let the board play.",
    });
  }

  out.push({
    id: "structure-pot",
    prompt: `How is the pot decided in ${variant.name}?`,
    choices: shuffleChoices(
      [
        { text: POT_TYPE_LABEL[variant.potType], correct: true },
        ...(["high", "split", "lowball", "other"] as const)
          .filter((key) => key !== variant.potType)
          .slice(0, 2)
          .map((key) => ({ text: POT_TYPE_LABEL[key] })),
      ],
      rng,
    ),
    explain:
      variant.potType === "split"
        ? "The pot is cut in two: one half for the best high hand, one for the best qualifying low."
        : variant.potType === "lowball"
          ? "This is a lowball game — the worst hand by the game's own ranking takes the pot."
          : variant.potType === "high"
            ? "Standard high poker: the best five-card hand takes the whole pot."
            : "This game is scored by its own rules rather than by a straight best-hand comparison.",
  });

  if (variant.forced !== "house-wager") {
    const answer =
      variant.forced === "blinds" || variant.forced === "blinds-ante"
        ? "Small and big blinds"
        : "Antes from every player";
    out.push({
      id: "structure-forced",
      prompt: `What goes into the pot before the cards are dealt in ${variant.name}?`,
      choices: shuffleChoices(
        [
          { text: answer, correct: true },
          { text: answer.startsWith("Small") ? "Antes from every player" : "Small and big blinds" },
          { text: "Nothing — the first player chooses whether to open" },
        ],
        rng,
      ),
      explain:
        variant.forced === "blinds" || variant.forced === "blinds-ante"
          ? "Blinds rotate with the button, so the cost of playing moves around the table."
          : "Every player antes, and in the stud games one player is then forced to make a bring-in bet.",
    });
  }

  if (variant.betting.length) {
    out.push({
      id: "structure-betting",
      prompt: `${variant.name} is most often spread with which betting structure?`,
      choices: shuffleChoices(
        [
          { text: BETTING_LABEL[variant.betting[0]], correct: true },
          ...(["no-limit", "pot-limit", "fixed-limit"] as const)
            .filter((key) => key !== variant.betting[0])
            .slice(0, 2)
            .map((key) => ({ text: BETTING_LABEL[key] })),
        ],
        rng,
      ),
      explain: `The usual structure is ${BETTING_LABEL[variant.betting[0]].toLowerCase()}${
        variant.betting.length > 1
          ? `, though you will also see ${variant.betting
              .slice(1)
              .map((key) => BETTING_LABEL[key].toLowerCase())
              .join(" and ")}.`
          : "."
      }`,
    });
  }

  return out;
}

/* ----------------------------------------------------------------- hand reading */

function readingQuestion(rng: () => number, index: number): QuizQuestion {
  const deck = shuffle(makeDeck(52), rng);
  const cards = deck.slice(0, 5);
  const score = scoreFiveHigh(cards, "standard");
  const allLabels = [
    "a straight flush",
    "four of a kind",
    "a full house",
    "a flush",
    "a straight",
    "three of a kind",
    "two pair",
    "a pair",
    "high card",
  ];
  const category = [
    "high card",
    "a pair",
    "two pair",
    "three of a kind",
    "a straight",
    "a flush",
    "a full house",
    "four of a kind",
    "a straight flush",
  ][score.value[0]];
  const distractors = shuffle(
    allLabels.filter((label) => label !== category),
    rng,
  ).slice(0, 2);

  return {
    id: `reading-${index}`,
    prompt: "What is the best hand here?",
    strips: [{ label: "Five cards", cards: ids(cards) }],
    choices: shuffleChoices(
      [{ text: category, correct: true }, ...distractors.map((text) => ({ text }))],
      rng,
    ),
    explain: `${handText(cards)} is ${score.label}.`,
  };
}

/* ----------------------------------------------------------- real showdown drill */

function showdownQuestion(variant: Variant, rng: () => number, index: number): QuizQuestion | null {
  if (variant.holeCards === 0 || variant.family === "mixed" || variant.family === "house") return null;

  const deck = shuffle(makeDeck(variant.deck), rng);
  const perHand = variant.family === "community" ? variant.holeCards : variant.holeCards;
  const boardSize = variant.family === "community" ? 5 : 0;
  if (deck.length < perHand * 2 + boardSize) return null;

  const handA = deck.slice(0, perHand);
  const handB = deck.slice(perHand, perHand * 2);
  const board = deck.slice(perHand * 2, perHand * 2 + boardSize);

  const scoreOf = (hand: Card[]) =>
    variant.hi !== "none"
      ? bestHi(hand, board, variant.hi, variant.selection)
      : bestLo(hand, board, variant.lo, variant.selection);

  const a = scoreOf(handA);
  const b = scoreOf(handB);
  if (!a.qualifies && !b.qualifies) return null;
  const cmp = compareScores(a, b);
  const answer = cmp > 0 ? "Hand A" : cmp < 0 ? "Hand B" : "They split the pot";

  const strips = [
    { label: "Hand A", cards: ids(handA) },
    { label: "Hand B", cards: ids(handB) },
  ];
  if (board.length) strips.push({ label: "Board", cards: ids(board) });

  const rule =
    variant.selection.useHole != null
      ? ` Remember: exactly ${variant.selection.useHole} hole cards and ${variant.selection.useBoard} board cards.`
      : "";

  return {
    id: `showdown-${index}`,
    prompt:
      variant.potType === "lowball"
        ? "Which hand wins the pot? (Lowest hand wins.)"
        : "Which hand wins the pot?",
    strips,
    choices: shuffleChoices(
      [
        { text: "Hand A", correct: answer === "Hand A" },
        { text: "Hand B", correct: answer === "Hand B" },
        { text: "They split the pot", correct: answer === "They split the pot" },
      ],
      rng,
    ),
    explain: `Hand A makes ${a.qualifies ? a.label : "no qualifying hand"}. Hand B makes ${
      b.qualifies ? b.label : "no qualifying hand"
    }. ${answer === "They split the pot" ? "They are equal." : `${answer} wins.`}${rule}`,
  };
}

/* ------------------------------------------------------------- low qualification */

function lowQualifyQuestion(variant: Variant, rng: () => number): QuizQuestion | null {
  if (variant.lo !== "a5-8ob") return null;
  const deck = shuffle(makeDeck(52), rng);
  const cards = deck.slice(0, 5);
  const score = bestLo(cards, [], "a5-8ob", { useHole: null, useBoard: null, handSize: 5 });
  return {
    id: "low-qualify",
    prompt: "Does this five-card hand qualify for the low half?",
    strips: [{ label: "Five cards", cards: ids(cards) }],
    choices: shuffleChoices(
      [
        { text: "Yes — it is an eight-or-better low", correct: score.qualifies },
        { text: "No — it does not qualify", correct: !score.qualifies },
      ],
      rng,
    ),
    explain: score.qualifies
      ? `${handText(cards)} is five different ranks, all eight or lower, so it qualifies: ${score.label}.`
      : `${handText(cards)} does not qualify. A low needs five distinct ranks all eight or lower, with the ace counting as one.`,
  };
}

/* ------------------------------------------------------------------------ build */

export function generateDrills(variant: Variant, seed: number): QuizQuestion[] {
  const rng = makeRng(seed);
  const out: QuizQuestion[] = [];

  out.push(...structureQuestions(variant, rng));
  const showdownA = showdownQuestion(variant, rng, 1);
  if (showdownA) out.push(showdownA);
  const low = lowQualifyQuestion(variant, rng);
  if (low) out.push(low);
  out.push(readingQuestion(rng, 1));
  const showdownB = showdownQuestion(variant, rng, 2);
  if (showdownB) out.push(showdownB);
  out.push(...(variant.quiz ?? []));

  return shuffle(out, rng).slice(0, 8);
}
