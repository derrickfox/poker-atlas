// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: The shape of a poker variant, its street structure, its tutorial script and its drills.
// Reason: Every screen in the app (dashboard filters, animated tutorial, practice mode) reads from
//         this one declarative description, so a new variant is a data file rather than new code.

import type { DeckSize } from "./engine/cards";
import type { HiRankingId, LoRankingId, SelectionRule } from "./engine/evaluator";

export type FamilyId = "community" | "stud" | "draw" | "mixed" | "home" | "house";

export type BettingId =
  | "no-limit"
  | "pot-limit"
  | "fixed-limit"
  | "spread-limit"
  | "no-betting"
  /** Casino games where you wager against the house rather than into a pot. */
  | "house-wager";

export type ForcedBets =
  | "blinds"
  | "blinds-ante"
  | "antes-bringin"
  | "antes"
  | "ante-each"
  | "house-wager";

export type Venue = "casino" | "online" | "home" | "tournament" | "mixed-game";

export type PopularityId = "ubiquitous" | "common" | "niche" | "rare";

/** How the pot is decided — the single most useful filter for a beginner. */
export type PotTypeId = "high" | "split" | "lowball" | "other";

export type StreetKind =
  | "post"
  | "deal-hole"
  | "deal-board"
  | "draw"
  | "betting"
  | "showdown"
  | "custom";

export interface StreetDef {
  id: string;
  /** Display name used in the tutorial timeline, e.g. "The flop", "Fourth street". */
  name: string;
  kind: StreetKind;
  /** Cards added to the community board on this street. */
  boardCards?: number;
  /** Cards dealt to each player on this street. */
  holeCards?: number;
  /** Whether cards dealt to players this street land face up (stud) or face down. */
  faceUp?: boolean;
  /** How many of this street's cards are exposed, when only some are (stud third street). */
  faceUpCards?: number;
  /** Maximum cards a player may exchange on a draw street. */
  drawMax?: number;
  /** Whether a betting round follows the deal. */
  betting: boolean;
  /** Fixed-limit games double the bet size from this street onward. */
  bigBet?: boolean;
  /** One or two sentences of narration shown while this street animates. */
  note: string;
}

export interface Variant {
  id: string;
  name: string;
  aka?: string[];
  family: FamilyId;
  /** One line for the dashboard card. */
  tagline: string;
  /** Two or three sentences for the tutorial's opening beat. */
  summary: string;

  deck: DeckSize;
  /** Cards dealt to each player in total across all streets. */
  holeCards: number;
  /** Number of community boards. Only double-board variants use 2. */
  boards: number;
  /** How a finished hand is assembled from hole cards and the board. */
  selection: SelectionRule;

  hi: HiRankingId;
  lo: LoRankingId;
  potType: PotTypeId;

  betting: BettingId[];
  forced: ForcedBets;
  players: { min: number; max: number; typical: number };

  /** 1 = a first poker game, 5 = expert-only. */
  difficulty: 1 | 2 | 3 | 4 | 5;
  popularity: PopularityId;
  venues: Venue[];
  /** Rough time to learn the mechanics, in minutes. */
  learnMinutes: number;

  streets: StreetDef[];

  /** Three to five things you must understand to play the game at all. */
  keyIdeas: string[];
  /** Beginner traps specific to this variant. */
  mistakes: string[];
  /** First strategic footholds — not a full strategy course. */
  strategy: string[];
  origin?: string;
  /**
   * Appended to the generated showdown narration. Used by the two Badugi split games, where the
   * generic engine can only score one of the pot's two halves and must say so.
   */
  showdownCaveat?: string;

  /** True when the generic engine can deal and play this variant against bots. */
  playable: boolean;
  /** Hand-authored tutorial, used where the generated street walkthrough can't express the game. */
  customTutorial?: TutorialStep[];
  /** Extra variant-specific quiz questions layered on top of the generated drills. */
  quiz?: QuizQuestion[];
}

/* ---------------------------------------------------------------- tutorial script */

export type CardHome =
  | { where: "deck" }
  | { where: "seat"; seat: number; slot: number }
  | { where: "board"; board: number; slot: number }
  | { where: "muck" }
  | { where: "discard"; seat: number; slot: number };

export interface TableCard {
  id: string;
  rank: number;
  suit: string;
  home: CardHome;
  faceUp: boolean;
  /** Highlighted cards glow — used to show which five cards actually play. */
  emphasis?: "play" | "dim" | "none";
}

export interface TableSeat {
  index: number;
  name: string;
  stack: number;
  /** Chips committed on the current street, shown in front of the seat. */
  wager: number;
  folded: boolean;
  isHero: boolean;
  /** Action label bubble, e.g. "raises to 12". */
  say?: string;
  badge?: string;
  active?: boolean;
  won?: number;
}

export interface TableState {
  seats: TableSeat[];
  cards: TableCard[];
  boards: number;
  pot: number;
  buttonSeat: number | null;
  /** Free-form caption rendered under the board, e.g. "Fixed limit — bets are 4 then 8". */
  caption?: string;
  /** Labels for board slots, used by draw/stud games that have no board. */
  boardLabel?: string;
}

export type Action =
  /** `names` overrides the default player names — used to label the house dealer in casino games. */
  | { t: "seats"; count: number; hero: number; stack: number; names?: string[] }
  | { t: "button"; seat: number }
  /** `badge` pins a persistent marker to the seat plate, e.g. "SB" / "BB". */
  | { t: "post"; seat: number; amount: number; label: string; badge?: string }
  | { t: "deal"; to: "seat" | "board"; seat?: number; board?: number; card?: string; faceUp: boolean }
  | { t: "dealEach"; count: number; faceUp: boolean }
  | { t: "act"; seat: number; say: string; amount?: number }
  | { t: "fold"; seat: number }
  | { t: "collect" }
  | { t: "reveal"; seat?: number }
  /** `cards` names exactly which cards leave the hand; without it the last `count` are thrown. */
  | { t: "discard"; seat: number; count: number; cards?: string[] }
  | { t: "emphasize"; cards: string[] }
  | { t: "award"; seat: number; amount: number; note?: string }
  | { t: "caption"; text: string }
  | { t: "clearSays" }
  | { t: "reset" };

export interface TutorialStep {
  id: string;
  /** Short label for the step rail. */
  title: string;
  /** The narration paragraph. Supports **bold** and `code` spans. */
  text: string;
  actions: Action[];
  /** Optional callout under the narration. */
  tip?: string;
  /** Milliseconds this step holds when autoplay is on. */
  hold?: number;
}

/* ------------------------------------------------------------------------ drills */

export interface QuizQuestion {
  id: string;
  prompt: string;
  /** Cards to show above the question, e.g. ["As", "Kd"]. */
  showCards?: string[];
  showLabel?: string;
  /** Several labelled card rows, used by generated "which hand wins" drills. */
  strips?: { label: string; cards: string[] }[];
  choices: { text: string; correct?: boolean }[];
  explain: string;
}
