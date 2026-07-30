// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Reduces tutorial script actions into a TableState snapshot — the single source of truth
//          the animated table renders from.
// Reason: Making every tutorial a list of declarative actions applied by one reducer means the
//         animation layer only ever diffs two states, so cards move and flip for free via CSS.

import type { Action, TableCard, TableState } from "../types";
import { makeDeck, makeRng, parseCard, shuffle } from "./cards";

const SEAT_NAMES = ["You", "Dana", "Mika", "Omar", "Rae", "Jules", "Kit", "Nils", "Pia", "Sam"];

/** The display name a seat index will be given, so narration can refer to players by name. */
export function seatName(index: number, heroIndex = 0): string {
  return index === heroIndex ? "You" : SEAT_NAMES[(index % (SEAT_NAMES.length - 1)) + 1];
}

// Hand-authored tutorials say "deal a card" without naming one. Drawing from a fixed shuffled deck
// keeps those scripts visually real and identical on every replay.
const DEMO_DECK = shuffle(makeDeck(52), makeRng(20260730));

function demoCard(index: number) {
  return DEMO_DECK[index % DEMO_DECK.length];
}

export function emptyTable(boards = 1): TableState {
  return { seats: [], cards: [], boards, pot: 0, buttonSeat: null };
}

function nextSlot(cards: TableCard[], predicate: (home: TableCard["home"]) => boolean): number {
  return cards.filter((card) => predicate(card.home)).length;
}

/** Applies one action, returning a fresh state so React sees a new object every beat. */
export function applyAction(state: TableState, action: Action): TableState {
  const next: TableState = {
    ...state,
    seats: state.seats.map((seat) => ({ ...seat })),
    cards: state.cards.map((card) => ({ ...card })),
  };

  switch (action.t) {
    case "seats": {
      next.seats = Array.from({ length: action.count }, (_, index) => ({
        index,
        name: action.names?.[index] ?? seatName(index, action.hero),
        stack: action.stack,
        wager: 0,
        folded: false,
        isHero: index === action.hero,
      }));
      next.cards = [];
      next.pot = 0;
      return next;
    }

    case "button":
      next.buttonSeat = action.seat;
      return next;

    case "post": {
      const seat = next.seats[action.seat];
      if (seat) {
        seat.stack -= action.amount;
        seat.wager += action.amount;
        seat.say = action.label;
        // Unlike `act`, posting does not steal focus from other seats — antes light up the whole
        // table at once, and the two blinds light up together.
        seat.active = true;
        if (action.badge) seat.badge = action.badge;
      }
      return next;
    }

    case "deal": {
      const card = action.card ? parseCard(action.card) : demoCard(next.cards.length);
      if (action.to === "seat") {
        const seat = action.seat ?? 0;
        next.cards.push({
          id: card.id,
          rank: card.rank,
          suit: card.suit,
          home: {
            where: "seat",
            seat,
            slot: nextSlot(next.cards, (h) => h.where === "seat" && h.seat === seat),
          },
          faceUp: action.faceUp,
        });
      } else {
        const board = action.board ?? 0;
        next.cards.push({
          id: card.id,
          rank: card.rank,
          suit: card.suit,
          home: {
            where: "board",
            board,
            slot: nextSlot(next.cards, (h) => h.where === "board" && h.board === board),
          },
          faceUp: action.faceUp,
        });
      }
      return next;
    }

    case "dealEach": {
      // Deal one card to each seat in turn, the way a live dealer does, so the animation cascades.
      for (let round = 0; round < action.count; round++) {
        for (const seat of next.seats) {
          const card = demoCard(next.cards.length);
          next.cards.push({
            id: card.id,
            rank: card.rank,
            suit: card.suit,
            home: {
              where: "seat",
              seat: seat.index,
              slot: nextSlot(next.cards, (h) => h.where === "seat" && h.seat === seat.index),
            },
            faceUp: action.faceUp,
          });
        }
      }
      return next;
    }

    case "act": {
      const seat = next.seats[action.seat];
      if (seat) {
        seat.say = action.say;
        if (action.amount) {
          seat.stack -= action.amount;
          seat.wager += action.amount;
        }
      }
      next.seats.forEach((s) => {
        s.active = s.index === action.seat;
      });
      return next;
    }

    case "fold": {
      const seat = next.seats[action.seat];
      if (seat) {
        seat.folded = true;
        seat.say = "folds";
      }
      next.cards = next.cards.filter(
        (card) => !(card.home.where === "seat" && card.home.seat === action.seat),
      );
      return next;
    }

    case "collect": {
      for (const seat of next.seats) {
        next.pot += seat.wager;
        seat.wager = 0;
        seat.say = undefined;
        seat.active = false;
      }
      return next;
    }

    case "clearSays":
      next.seats.forEach((seat) => {
        seat.say = undefined;
        seat.active = false;
      });
      return next;

    case "reveal": {
      next.cards = next.cards.map((card) => {
        if (card.home.where !== "seat") return card;
        if (action.seat != null && card.home.seat !== action.seat) return card;
        const seat = next.seats[card.home.seat];
        if (seat?.folded) return card;
        return { ...card, faceUp: true };
      });
      return next;
    }

    case "discard": {
      const held = next.cards.filter(
        (card) => card.home.where === "seat" && card.home.seat === action.seat,
      );
      const ids = new Set(
        action.cards?.length
          ? action.cards
          : held.slice(-action.count).map((card) => card.id),
      );
      next.cards = next.cards.filter((card) => !ids.has(card.id));
      // Re-pack the remaining slots so the hand closes up rather than leaving gaps.
      let slot = 0;
      next.cards = next.cards.map((card) =>
        card.home.where === "seat" && card.home.seat === action.seat
          ? { ...card, home: { where: "seat", seat: action.seat, slot: slot++ } }
          : card,
      );
      return next;
    }

    case "emphasize": {
      const wanted = new Set(action.cards);
      next.cards = next.cards.map((card) => ({
        ...card,
        emphasis: wanted.size === 0 ? "none" : wanted.has(card.id) ? "play" : "dim",
      }));
      return next;
    }

    case "award": {
      const seat = next.seats[action.seat];
      if (seat) {
        seat.stack += action.amount;
        seat.won = (seat.won ?? 0) + action.amount;
        seat.say = action.note ?? "wins";
      }
      next.pot = Math.max(0, next.pot - action.amount);
      return next;
    }

    case "caption":
      next.caption = action.text;
      return next;

    case "reset":
      return emptyTable(state.boards);

    default:
      return next;
  }
}

/** Replays a script from the beginning through `stepIndex` inclusive. */
export function stateAtStep(
  steps: { actions: Action[] }[],
  stepIndex: number,
  boards: number,
): TableState {
  let state = emptyTable(boards);
  for (let i = 0; i <= stepIndex && i < steps.length; i++) {
    for (const action of steps[i].actions) state = applyAction(state, action);
  }
  return state;
}
