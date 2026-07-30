// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Catalog entries for the stud family — Seven-Card Stud, Stud Hi-Lo, Razz and Five-Card Stud.
// Reason: Stud games have no board and no blinds, so they need their own street builder and their own
//         teaching emphasis (reading exposed cards, the bring-in, and card-dead situations).

import type { Variant } from "../types";
import { FREE_SELECTION } from "../engine/evaluator";
import { studStreets } from "./streets";

export const studVariants: Variant[] = [
  {
    id: "seven-card-stud",
    name: "Seven-Card Stud",
    aka: ["Stud", "Seven Stud"],
    family: "stud",
    tagline: "No board, no blinds. Seven cards each, four of them face up for everyone to see.",
    summary:
      "The game that ruled American poker before Hold'em. Everyone antes, then receives seven cards across five streets — three face down and four face up — and makes the best five-card hand. Because most of each hand is visible, memory and card-reading matter more here than anywhere else.",
    deck: 52,
    holeCards: 7,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["fixed-limit", "spread-limit", "pot-limit"],
    forced: "antes-bringin",
    players: { min: 2, max: 8, typical: 8 },
    difficulty: 3,
    popularity: "common",
    venues: ["casino", "online", "home", "mixed-game"],
    learnMinutes: 18,
    streets: studStreets({ cards: 7 }),
    keyIdeas: [
      "There is no community board. Every player builds a hand from their own seven cards.",
      "Everyone antes, and on third street the lowest exposed card is forced to bring it in.",
      "From fourth street onward, the best exposed hand acts first — the opposite of Hold'em.",
      "Four of your seven cards are visible to the table by the end of the hand.",
    ],
    mistakes: [
      "Not looking at the exposed cards before deciding to continue. Your outs may already be dead.",
      "Playing small pairs with a bad kicker; they make second-best hands over and over.",
      "Forgetting the bet size doubles on fifth street, which makes fourth-street calls expensive.",
    ],
    strategy: [
      "Before you call, count how many of your outs are showing in other players' hands.",
      "Three cards to a flush on third street needs live suits to be worth playing.",
      "Rolled-up trips — three of a kind on third street — is the best hand in the game and comes once in 425 deals.",
    ],
    origin: "American Civil War era; the dominant casino poker game until the 1980s.",
    playable: true,
    quiz: [
      {
        id: "stud-live-cards",
        prompt:
          "You hold three hearts on third street, but four hearts are showing in other players' upcards. What should that change?",
        choices: [
          { text: "Nothing — flush draws are flush draws" },
          {
            text: "Your flush is close to dead; fold unless the hand has other value",
            correct: true,
          },
          { text: "Raise, because opponents cannot have the same hearts" },
        ],
        explain:
          "There are thirteen hearts. With three in your hand and four visible elsewhere, only six remain for the four cards you will still receive. That is a badly under-priced draw.",
      },
    ],
  },

  {
    id: "stud-hi-lo",
    name: "Seven-Card Stud Hi-Lo",
    aka: ["Stud 8", "Stud Eight-or-Better"],
    family: "stud",
    tagline: "Seven-Card Stud with the pot split between the best high and the best qualifying low.",
    summary:
      "Stud rules with an eight-or-better low half. Half the pot goes to the best five-card high hand and half to the best low of five unpaired cards ranked eight or lower. If nobody qualifies for low, the high hand takes everything. A cornerstone of mixed-game rotations.",
    deck: 52,
    holeCards: 7,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "a5-8ob",
    potType: "split",
    betting: ["fixed-limit"],
    forced: "antes-bringin",
    players: { min: 2, max: 8, typical: 8 },
    difficulty: 4,
    popularity: "niche",
    venues: ["casino", "online", "mixed-game"],
    learnMinutes: 22,
    streets: studStreets({
      cards: 7,
      showdownNote:
        "High and low are read separately from the same seven cards. A hand like 6-5-4-3-2 can win both halves at once.",
    }),
    keyIdeas: [
      "Low needs five distinct ranks, eight or lower, ace playing as one.",
      "Straights and flushes do not disqualify a low, so a wheel is both a great low and a straight.",
      "Exposed low cards tell you which opponents are drawing at your half of the pot.",
      "If no low qualifies the high hand scoops the entire pot.",
    ],
    mistakes: [
      "Starting with three high cards in a game where half the money goes low.",
      "Continuing with a low draw after two of your low cards pair.",
      "Ignoring that the bring-in is decided by the highest exposed card in this game, not the lowest.",
    ],
    strategy: [
      "Three low cards including an ace is the premium start — it can win both ways.",
      "Scooping is everything. A hand that can only win one half needs a large field to be profitable.",
      "Watch which low cards are dead; a 2 and 3 in other players' hands can gut your draw.",
    ],
    playable: true,
  },

  {
    id: "razz",
    name: "Razz",
    aka: ["Seven-Card Stud Low"],
    family: "stud",
    tagline: "Seven-Card Stud upside down: the worst hand wins.",
    summary:
      "Stud mechanics with only a low hand. Aces are low, straights and flushes are ignored entirely, and the best possible hand is 5-4-3-2-A — the wheel. There is no qualifier, so somebody always wins the pot, no matter how ugly the hands are.",
    deck: 52,
    holeCards: 7,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "none",
    lo: "a5-any",
    potType: "lowball",
    betting: ["fixed-limit"],
    forced: "antes-bringin",
    players: { min: 2, max: 8, typical: 8 },
    difficulty: 3,
    popularity: "niche",
    venues: ["casino", "online", "mixed-game", "tournament"],
    learnMinutes: 15,
    streets: studStreets({
      cards: 7,
      bringInNote:
        "Two down and one up, as in Stud — but here the *highest* exposed card is forced to bring it in, because high is bad.",
      showdownNote: "Lowest five-card hand wins. Pairs are what hurt you; straights and flushes are irrelevant.",
    }),
    keyIdeas: [
      "Lowest hand wins. Aces are always low and 5-4-3-2-A is the nuts.",
      "Straights and flushes do not count against you at all.",
      "The highest exposed card brings in the betting, and the lowest board acts first after that.",
      "Pairing a card is the main way a Razz hand goes wrong.",
    ],
    mistakes: [
      "Playing three cards where one is a nine or higher — you are already behind.",
      "Continuing after catching two big cards in a row 'because the pot is big'.",
      "Not reading opponents' exposed boards; in Razz the boards tell you almost the whole story.",
    ],
    strategy: [
      "Three cards to an eight or better, with no pairs, is the entry requirement.",
      "A bad card face up is a bluffing licence — opponents can see you caught badly, so they can also be bluffed by a good-looking board.",
      "Position rotates with the best board, so a strong-looking board acts first and can bet every street.",
    ],
    playable: true,
    quiz: [
      {
        id: "razz-best",
        prompt: "Which is the best possible hand in Razz?",
        choices: [
          { text: "5-4-3-2-A", correct: true },
          { text: "A-2-3-4-5 of the same suit — a straight flush" },
          { text: "2-3-4-5-6" },
        ],
        explain:
          "Straights and flushes are ignored in Razz, so the wheel 5-4-3-2-A is simply five low cards with no pair — the smallest possible hand. Suits never matter.",
      },
    ],
  },

  {
    id: "five-card-stud",
    name: "Five-Card Stud",
    family: "stud",
    tagline: "The oldest stud game: one card down, four face up.",
    summary:
      "Each player gets one hole card and four exposed cards, with a betting round after each. With only one hidden card the game is almost entirely about reading boards, and it is nearly impossible to disguise a hand. Rarely spread today but historically central — it is the game in most poker scenes on film.",
    deck: 52,
    holeCards: 5,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["fixed-limit", "spread-limit"],
    forced: "antes-bringin",
    players: { min: 2, max: 10, typical: 6 },
    difficulty: 2,
    popularity: "rare",
    venues: ["home", "mixed-game"],
    learnMinutes: 10,
    streets: studStreets({
      cards: 5,
      lastCardDown: false,
      showdownNote: "The single hole card is revealed. Best five-card hand wins.",
    }),
    keyIdeas: [
      "Only one card is ever hidden, so opponents can see four fifths of your hand.",
      "A pair is a strong hand; two pair usually wins the pot.",
      "The best exposed hand acts first on every street after the first.",
    ],
    mistakes: [
      "Playing a hand whose best case is already beaten by a visible board.",
      "Bluffing into a board that clearly has you beaten — everyone can see it too.",
    ],
    strategy: [
      "Your hole card's value is mostly in whether it pairs your highest upcard.",
      "Fold early and often; there is very little to draw at with only four more cards in the deal.",
    ],
    origin: "Documented in America by the 1860s — the classic riverboat game.",
    playable: true,
  },
];
