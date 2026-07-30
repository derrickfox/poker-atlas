// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Catalog entries for the draw family — Five-Card Draw, the lowball triple-draw games,
//          Badugi and the Badugi/lowball split hybrids.
// Reason: Draw games hide every card, so their teaching hinges on draw counts as public information;
//         grouping them makes that shared idea easy to present across the family.

import type { Variant } from "../types";
import { FREE_SELECTION } from "../engine/evaluator";
import { drawStreets } from "./streets";

const BADUGI_SELECTION = { useHole: null, useBoard: null, handSize: 4 };

export const drawVariants: Variant[] = [
  {
    id: "five-card-draw",
    name: "Five-Card Draw",
    aka: ["Draw Poker"],
    family: "draw",
    tagline: "Five cards, one chance to swap. The kitchen-table classic.",
    summary:
      "Everybody gets five cards face down, there is a betting round, then each player may exchange any number of cards for replacements. A second betting round follows and the best five-card hand wins. No cards are ever exposed, which makes it the purest test of betting patterns in poker.",
    deck: 52,
    holeCards: 5,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["fixed-limit", "no-limit", "pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 6 },
    difficulty: 1,
    popularity: "common",
    venues: ["home", "online", "mixed-game"],
    learnMinutes: 8,
    streets: drawStreets({ draws: 1 }),
    keyIdeas: [
      "Nothing is ever face up. The only public information is how many cards each player draws.",
      "Drawing three means you kept a pair; drawing one usually means two pair or a draw; standing pat means a made hand.",
      "The deck supports at most six players once everyone draws.",
      "Hand rankings are the standard ones with no twists.",
    ],
    mistakes: [
      "Drawing four to an ace. You are burning money to make one pair.",
      "Ignoring what an opponent's draw count says about their hand.",
      "Playing every hand because 'you can always improve'.",
    ],
    strategy: [
      "Open with a pair of jacks or better in a full game — the classic 'jacks or better' standard.",
      "Drawing one card to a flush or open-ended straight is roughly a one-in-five shot; price it accordingly.",
      "Occasionally standing pat with nothing is the game's most effective bluff.",
    ],
    origin: "Mid-1800s America; the standard poker game for a century.",
    playable: true,
    quiz: [
      {
        id: "draw-count-read",
        prompt: "An opponent draws exactly one card. What is the most likely holding?",
        choices: [
          { text: "Two pair, or a four-card straight or flush draw", correct: true },
          { text: "A single high card" },
          { text: "Three of a kind" },
        ],
        explain:
          "Drawing one means keeping four. That is two pair (drawing for the boat), or four to a straight or flush. Trips normally draw two, and one high card draws four.",
      },
    ],
  },

  {
    id: "deuce-seven-triple-draw",
    name: "2-7 Triple Draw",
    aka: ["Deuce-to-Seven Triple Draw", "27TD"],
    family: "draw",
    tagline: "Lowball with three draws, where straights and flushes ruin your hand.",
    summary:
      "The best hand is 7-5-4-3-2 with no flush — hence the name. Aces are always high, so they are bad cards, and making a straight or a flush counts against you. Three separate draws with a betting round after each make this the most action-heavy lowball game and a fixture of high-stakes mixed rotations.",
    deck: 52,
    holeCards: 5,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "none",
    lo: "deuce-seven",
    potType: "lowball",
    betting: ["fixed-limit", "no-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 6 },
    difficulty: 4,
    popularity: "niche",
    venues: ["casino", "online", "mixed-game", "tournament"],
    learnMinutes: 18,
    streets: drawStreets({
      draws: 3,
      showdownNote:
        "Lowest hand wins. Remember: aces are high, and straights and flushes count against you.",
    }),
    keyIdeas: [
      "The nuts is 7-5-4-3-2 without a flush. 7-6-5-4-3 is a straight and is therefore a terrible hand.",
      "Aces count high, so an ace is one of the worst cards you can hold.",
      "Three draws means three betting rounds after the first — pots get large.",
      "Standing pat and drawing are both public; the pattern across three draws is the whole game.",
    ],
    mistakes: [
      "Treating an ace as a low card. It is not — that is ace-to-five lowball.",
      "Drawing to a hand that will make a straight if it hits.",
      "Standing pat on a ten-low against an opponent who has drawn one every time.",
    ],
    strategy: [
      "A pat 8 is a genuinely strong hand; a pat 9 is marginal in a big pot.",
      "Watch the draw counts in order: pat-pat-pat is very different from one-one-pat.",
      "Position is enormous because you get to see whether opponents drew before you decide.",
    ],
    playable: true,
    quiz: [
      {
        id: "27-nuts",
        prompt: "Which is the best possible 2-7 Triple Draw hand?",
        choices: [
          { text: "7-5-4-3-2 of mixed suits", correct: true },
          { text: "A-2-3-4-5 of mixed suits" },
          { text: "7-6-5-4-3 of mixed suits" },
        ],
        explain:
          "Aces are high in 2-7, so A-2-3-4-5 is ace-high. And 7-6-5-4-3 is a straight, which counts against you. That leaves 7-5-4-3-2, unsuited — the wheel of this game.",
      },
    ],
  },

  {
    id: "deuce-seven-single-draw",
    name: "2-7 Single Draw",
    aka: ["No-Limit Deuce"],
    family: "draw",
    tagline: "One draw, one decision, usually no-limit. Brutal and fast.",
    summary:
      "Same ranking system as Triple Draw — aces high, straights and flushes bad, 7-5-4-3-2 the nuts — but with a single draw and typically no-limit betting. Two betting rounds and one card exchange makes it the most bluff-heavy game in the mix, and a long-running World Series event.",
    deck: 52,
    holeCards: 5,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "none",
    lo: "deuce-seven",
    potType: "lowball",
    betting: ["no-limit", "fixed-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 6 },
    difficulty: 4,
    popularity: "niche",
    venues: ["casino", "mixed-game", "tournament"],
    learnMinutes: 12,
    streets: drawStreets({
      draws: 1,
      showdownNote: "Lowest hand wins, aces high, straights and flushes count against you.",
    }),
    keyIdeas: [
      "Identical ranking to 2-7 Triple Draw, but only one draw.",
      "Usually played no-limit, which turns the single draw into a very large decision.",
      "Standing pat is both the strongest play and the most common bluff.",
    ],
    mistakes: [
      "Drawing two cards. In a one-draw game that is nearly always too far behind.",
      "Never bluffing pat — opponents will stop paying your real hands.",
    ],
    strategy: [
      "A pat 9 is often good enough to raise with; a pat 8 is a monster.",
      "Because there is one draw, your opponent's stand-pat is either the hand or a total bluff. Price accordingly.",
    ],
    playable: true,
  },

  {
    id: "ace-five-triple-draw",
    name: "A-5 Triple Draw",
    aka: ["California Lowball", "Ace-to-Five Triple Draw"],
    family: "draw",
    tagline: "Lowball where the ace is your friend and straights don't matter.",
    summary:
      "Three draws at the lowest hand, but under ace-to-five rules: aces count as ones, and straights and flushes are ignored completely. That makes 5-4-3-2-A — the wheel — the perfect hand. Historically the signature game of California card rooms, where stud and hold'em were once illegal.",
    deck: 52,
    holeCards: 5,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "none",
    lo: "a5-any",
    potType: "lowball",
    betting: ["fixed-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 6 },
    difficulty: 3,
    popularity: "rare",
    venues: ["casino", "mixed-game"],
    learnMinutes: 12,
    streets: drawStreets({
      draws: 3,
      showdownNote: "Lowest hand wins with aces low; straights and flushes are ignored.",
    }),
    keyIdeas: [
      "Aces are low. 5-4-3-2-A is the best hand in the game.",
      "Straights and flushes do not count against you, unlike 2-7.",
      "The only thing that can hurt a low hand is pairing.",
    ],
    mistakes: [
      "Carrying 2-7 instincts over and discarding aces.",
      "Breaking a pat 8 to draw at a 7 — the improvement is rarely worth the risk.",
    ],
    strategy: [
      "A pat 7 is a big hand; a pat 8 is playable in position.",
      "Drawing one to a wheel with three low cards and an ace is the standard profitable draw.",
    ],
    origin: "Gardena, California in the 1930s–70s, where it was the only legal poker game.",
    playable: true,
  },

  {
    id: "badugi",
    name: "Badugi",
    family: "draw",
    tagline: "A four-card game where you need all four suits and all four ranks.",
    summary:
      "Each player holds four cards and draws three times, hunting the lowest hand made of four cards with no repeated rank and no repeated suit — a 'badugi'. If you cannot make four, your best three-card hand plays, and any four-card badugi beats any three-card hand. Aces are low.",
    deck: 52,
    holeCards: 4,
    boards: 0,
    selection: BADUGI_SELECTION,
    hi: "none",
    lo: "badugi",
    potType: "lowball",
    betting: ["fixed-limit", "pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 6 },
    difficulty: 4,
    popularity: "niche",
    venues: ["online", "mixed-game", "casino"],
    learnMinutes: 15,
    streets: drawStreets({
      holeCards: 4,
      draws: 3,
      drawNote:
        "Discard any number of your four cards. Most hands draw one, hunting the missing suit or a lower card.",
      showdownNote:
        "Best badugi wins: four cards, all different suits, all different ranks, as low as possible. A-2-3-4 rainbow is the nuts.",
    }),
    keyIdeas: [
      "Four cards, and a complete hand needs four different ranks and four different suits.",
      "Any four-card badugi beats any three-card hand, no matter how low the three cards are.",
      "Duplicated suits or ranks are simply ignored, shrinking your hand.",
      "Aces are low, so A-2-3-4 in four suits is the best hand possible.",
    ],
    mistakes: [
      "Comparing a 3-card 2-3-4 against a 4-card K-Q-J-10 and thinking the low cards win. They do not.",
      "Drawing to a fourth suit while holding three high cards.",
      "Breaking a made badugi to draw at a lower one without counting how strong the current one already is.",
    ],
    strategy: [
      "A made badugi of 8 or lower will win a lot of pots at a full table.",
      "Three-card hands with two low cards and a live suit are the standard drawing hand.",
      "The draw counts tell you almost everything: a player who stands pat has a badugi.",
    ],
    origin: "Likely Korean in origin; spread online in the 2000s.",
    playable: true,
    quiz: [
      {
        id: "badugi-compare",
        prompt: "Which hand wins: A♠ 2♠ 3♥ 4♦ or 9♠ 8♥ 7♦ 6♣?",
        choices: [
          { text: "9-8-7-6 — it is a four-card badugi", correct: true },
          { text: "A-2-3-4 — it is much lower" },
          { text: "They split the pot" },
        ],
        explain:
          "A♠ 2♠ has two spades, so only three of those cards can play: a 4-3-A three-card hand. The 9-8-7-6 has four ranks in four suits — a genuine badugi — and any badugi beats any three-card hand.",
      },
    ],
  },

  {
    id: "badacey",
    name: "Badacey",
    family: "draw",
    tagline: "Split pot: half for the best badugi, half for the best ace-to-five low.",
    summary:
      "A five-card triple-draw game where the pot splits between the best Badugi hand and the best ace-to-five lowball hand, both made from the same five cards. Reading both halves at once takes practice, which is exactly why it appears in dealer's-choice mixes.",
    deck: 52,
    holeCards: 5,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "none",
    lo: "a5-any",
    potType: "split",
    betting: ["fixed-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 5 },
    difficulty: 5,
    popularity: "rare",
    venues: ["home", "mixed-game", "online"],
    learnMinutes: 20,
    streets: drawStreets({
      draws: 3,
      showdownNote:
        "The pot splits: best badugi takes half, best A-5 low takes the other half. Both come from the same five cards.",
    }),
    keyIdeas: [
      "Five cards, three draws, and two completely different ranking systems applied at once.",
      "Badugi half: four cards, all different ranks and suits, lowest wins.",
      "Lowball half: best ace-to-five low, straights and flushes ignored.",
      "A hand like A-2-3-4 rainbow plus a low fifth card can scoop.",
    ],
    mistakes: [
      "Drawing purely for one half and getting quartered when someone scoops.",
      "Losing track of which four of your five cards form the badugi.",
    ],
    strategy: [
      "Rainbow low cards are the hands that scoop; suited duplicates cripple the badugi half.",
      "As with all split games, half a pot you invested equally in is not a win.",
    ],
    showdownCaveat:
      "This walkthrough scores only the **ace-to-five half**. The other half goes to the best **badugi** made from the same five cards — work through the Badugi tutorial and then read both halves together.",
    playable: false,
  },

  {
    id: "badeucey",
    name: "Badeucey",
    family: "draw",
    tagline: "Badacey's meaner cousin: badugi split with 2-7 lowball.",
    summary:
      "The same five-card triple-draw split structure as Badacey, but the lowball half uses deuce-to-seven rules — aces high, straights and flushes counting against you — while the badugi half still plays aces low. The two halves disagree about the ace, which is the whole difficulty of the game.",
    deck: 52,
    holeCards: 5,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "none",
    lo: "deuce-seven",
    potType: "split",
    betting: ["fixed-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 5 },
    difficulty: 5,
    popularity: "rare",
    venues: ["home", "mixed-game"],
    learnMinutes: 20,
    streets: drawStreets({
      draws: 3,
      showdownNote:
        "Half the pot to the best badugi (aces low), half to the best 2-7 low (aces high). The same ace can be great for one half and terrible for the other.",
    }),
    keyIdeas: [
      "Badugi half plays aces low; the 2-7 half plays aces high. The same card means opposite things.",
      "2-7 half: straights and flushes count against you; badugi half: suits must all differ anyway.",
      "2-3-4-5 rainbow plus a seven is the shape you want.",
    ],
    mistakes: [
      "Holding an ace and expecting it to help both halves.",
      "Making a straight and losing the lowball half you thought you had locked.",
    ],
    strategy: [
      "Deuces through sevens in four different suits is the scooping shape.",
      "Because the halves fight each other, scoops are rarer and pot control matters more.",
    ],
    showdownCaveat:
      "This walkthrough scores only the **deuce-to-seven half**. The other half goes to the best **badugi** made from the same five cards, where the ace plays low again.",
    playable: false,
  },
];
