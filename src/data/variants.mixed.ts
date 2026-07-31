// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Catalog entries for mixed-game rotations (HORSE, 8-Game) and for the casino games played
//          against the house rather than against other players (Three Card Poker, Ultimate Texas
//          Hold'em, Caribbean Stud, Let It Ride).
// Reason: Both groups belong in a "types of poker" atlas but neither fits the dealt-street model, so
//         each carries a short hand-authored tutorial instead of a generated one.

import type { Variant } from "../types";
import { FREE_SELECTION } from "../engine/evaluator";

export const mixedVariants: Variant[] = [
  {
    id: "horse",
    name: "HORSE",
    family: "mixed",
    tagline: "Five games in rotation: Hold'em, Omaha Hi-Lo, Razz, Stud, Stud Hi-Lo.",
    summary:
      "Not a variant but a rotation. The table switches games every orbit or every set number of hands, cycling through Hold'em, Omaha Hi-Lo, Razz, Seven-Card Stud and Stud Hi-Lo — the initials spell HORSE. Every game is played fixed-limit, which keeps any single game from dominating the session.",
    deck: 52,
    holeCards: 0,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "a5-8ob",
    potType: "other",
    betting: ["fixed-limit"],
    forced: "blinds",
    players: { min: 2, max: 8, typical: 8 },
    difficulty: 5,
    popularity: "niche",
    venues: ["casino", "online", "tournament", "mixed-game"],
    learnMinutes: 25,
    streets: [],
    keyIdeas: [
      "H = Hold'em, O = Omaha Hi-Lo, R = Razz, S = Stud, E = Eight-or-better Stud.",
      "Every game in the rotation is played fixed-limit.",
      "Games change on a fixed schedule — usually every full orbit of the button.",
      "The blinds-versus-antes structure changes with the game, so the button is only used for H and O.",
    ],
    mistakes: [
      "Playing your best game well and your worst game badly. The rotation punishes narrow skill.",
      "Losing track of which game is being dealt and misreading your hand.",
    ],
    strategy: [
      "Your profit comes from the games your opponents are weakest at, not the one you like most.",
      "Fixed-limit means fewer huge pots and more small edges; patience compounds.",
    ],
    origin: "A high-stakes mixed rotation formalised in the 1990s; a WSOP championship event since 2006.",
    playable: false,
    customTutorial: [
      {
        id: "intro",
        title: "What HORSE is",
        text: "**HORSE** is not a poker variant — it is a *rotation* of five of them. The table plays one game for a while, then switches to the next, cycling forever. All five are played **fixed-limit**.",
        actions: [
          { t: "seats", count: 8, hero: 0, stack: 400 },
          { t: "caption", text: "H · O · R · S · E" },
        ],
        hold: 3800,
      },
      {
        id: "h",
        title: "H — Hold'em",
        text: "**Limit Hold'em.** Two hole cards, five community cards, four betting rounds, with the bet size fixed and doubling on the turn. Blinds are used and the button rotates.",
        actions: [
          { t: "dealEach", count: 2, faceUp: false },
          { t: "caption", text: "Limit Hold'em — blinds, button, fixed bets" },
        ],
        hold: 4200,
      },
      {
        id: "o",
        title: "O — Omaha Hi-Lo",
        text: "**Limit Omaha Eight-or-Better.** Four hole cards, use exactly two, and the pot splits with the best qualifying low. Still blinds and a button.",
        actions: [
          { t: "reset" },
          { t: "seats", count: 8, hero: 0, stack: 400 },
          { t: "dealEach", count: 4, faceUp: false },
          { t: "caption", text: "Omaha Hi-Lo — split pot, use exactly two" },
        ],
        hold: 4200,
      },
      {
        id: "r",
        title: "R — Razz",
        text: "**Razz.** Now the structure changes: antes and a bring-in replace blinds, and there is no button. Lowest hand wins, aces low, straights and flushes ignored.",
        actions: [
          { t: "reset" },
          { t: "seats", count: 8, hero: 0, stack: 400 },
          { t: "dealEach", count: 3, faceUp: false },
          { t: "caption", text: "Razz — antes and bring-in, no button" },
        ],
        tip: "The switch from blinds to antes is the part people forget. Position is decided by exposed cards from here on.",
        hold: 4500,
      },
      {
        id: "s",
        title: "S — Seven-Card Stud",
        text: "**Stud high.** Same ante-and-bring-in structure as Razz, but now the best high hand wins. Four of your seven cards are exposed.",
        actions: [{ t: "caption", text: "Stud high — best hand wins" }],
        hold: 3800,
      },
      {
        id: "e",
        title: "E — Stud Eight-or-Better",
        text: "**Stud Hi-Lo.** The same stud deal, with the pot split between the best high hand and the best eight-or-better low. Then the rotation returns to Hold'em and starts again.",
        actions: [{ t: "caption", text: "Stud Hi-Lo — then back to H" }],
        hold: 4200,
      },
      {
        id: "close",
        title: "How to approach it",
        text: "The rotation rewards **breadth, not depth**. A player who is excellent at Hold'em and helpless at Razz will lose to a player who is merely competent at all five. Learn each game in the atlas separately, then come back.",
        actions: [{ t: "caption", text: "Every game, every orbit" }],
        hold: 4000,
      },
    ],
  },

  {
    id: "eight-game",
    name: "8-Game Mix",
    family: "mixed",
    tagline: "HORSE plus the draw games and a no-limit round. The full mixed-game test.",
    summary:
      "An eight-game rotation: 2-7 Triple Draw, Limit Hold'em, Omaha Hi-Lo, Razz, Stud, Stud Hi-Lo, No-Limit Hold'em and Pot-Limit Omaha. It mixes limit and big-bet structures in the same session, which makes it the broadest test of poker skill regularly spread.",
    deck: 52,
    holeCards: 0,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "a5-8ob",
    potType: "other",
    betting: ["fixed-limit", "no-limit", "pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 8, typical: 6 },
    difficulty: 5,
    popularity: "niche",
    venues: ["casino", "online", "tournament", "mixed-game"],
    learnMinutes: 30,
    streets: [],
    keyIdeas: [
      "Eight games: 2-7 Triple Draw, Limit Hold'em, Omaha Hi-Lo, Razz, Stud, Stud Hi-Lo, No-Limit Hold'em, Pot-Limit Omaha.",
      "Six of the eight are fixed-limit; the last two are big-bet games.",
      "The bet structure changes mid-session, which is the hardest adjustment.",
      "The rotation typically changes every six hands or every orbit.",
    ],
    mistakes: [
      "Carrying big-bet aggression into the limit rounds, where it costs a fixed amount every street.",
      "Skipping study of the draw games because they come up only one round in eight.",
    ],
    strategy: [
      "Treat the two no-limit rounds as a separate discipline; that is where stacks actually move.",
      "In the limit rounds, small persistent edges matter far more than any single pot.",
    ],
    playable: false,
    customTutorial: [
      {
        id: "intro",
        title: "What 8-Game is",
        text: "**8-Game** is the widest rotation in common circulation. It takes the five HORSE games, adds **2-7 Triple Draw**, and finishes with two **big-bet** rounds: No-Limit Hold'em and Pot-Limit Omaha.",
        actions: [
          { t: "seats", count: 6, hero: 0, stack: 500 },
          { t: "caption", text: "Eight games, one seat, one session" },
        ],
        hold: 4000,
      },
      {
        id: "limit",
        title: "The six limit rounds",
        text: "Six of the eight games are **fixed-limit**: 2-7 Triple Draw, Hold'em, Omaha Hi-Lo, Razz, Stud and Stud Hi-Lo. Bets are a fixed size, doubling on the later streets. Nobody's stack disappears in one hand.",
        actions: [{ t: "caption", text: "Fixed-limit: 2-7 TD · H · O · R · S · E" }],
        hold: 4200,
      },
      {
        id: "bigbet",
        title: "The two big-bet rounds",
        text: "Then the structure flips. **No-Limit Hold'em** and **Pot-Limit Omaha** allow bets up to your whole stack or the size of the pot. These two rounds contain most of the session's variance.",
        actions: [{ t: "caption", text: "Big bet: NLHE · PLO" }],
        tip: "Many strong limit players lose their whole edge in the two big-bet rounds. Know which rounds are yours.",
        hold: 4500,
      },
      {
        id: "rotate",
        title: "Rotating",
        text: "The dealer announces the change, typically **every six hands** or every full orbit. The forced-bet structure changes with it — blinds for the community and draw games, antes and a bring-in for the stud games.",
        actions: [{ t: "caption", text: "Announce · change · adjust" }],
        hold: 4000,
      },
      {
        id: "close",
        title: "How to learn it",
        text: "Work through the atlas one game at a time. When you can play all eight competently — not brilliantly — you are ready to sit in an 8-Game. The rotation punishes gaps far more than it rewards peaks.",
        actions: [{ t: "caption", text: "Breadth beats depth" }],
        hold: 4000,
      },
    ],
  },
];

// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-31T10:15:00-04:00
// Purpose: Enables isolated practice engines for Three Card Poker and Caribbean Stud.
// Reason: These one-decision dealer games are the safest first increment toward playable coverage
//         for all variants because they do not modify the established street-game engine.
export const houseVariants: Variant[] = [
  {
    id: "three-card-poker",
    name: "Three Card Poker",
    family: "house",
    tagline: "Three cards each against the dealer. Fast, simple, and the rankings are reshuffled.",
    summary:
      "You and the dealer each receive three cards. You ante, look at your hand, and either fold or make a Play wager equal to the ante. The dealer needs queen-high or better to qualify. Because only three cards are used, a straight beats a flush and three of a kind beats both.",
    deck: 52,
    holeCards: 3,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "other",
    betting: ["house-wager"],
    forced: "house-wager",
    players: { min: 1, max: 7, typical: 5 },
    difficulty: 1,
    popularity: "common",
    venues: ["casino"],
    learnMinutes: 6,
    streets: [],
    keyIdeas: [
      "You play against the dealer, not against other players.",
      "With only three cards the rankings change: straight beats flush, and three of a kind beats a straight.",
      "The dealer must have queen-high or better to qualify. If not, your ante pays and the Play wager pushes.",
      "The Pair Plus side bet pays on your own hand regardless of what the dealer holds.",
    ],
    mistakes: [
      "Applying five-card rankings and folding a straight because it 'lost to a flush'.",
      "Playing every hand. Folding below Q-6-4 costs you money over time.",
    ],
    strategy: [
      "The complete optimal strategy is one line: play Q-6-4 or better, fold everything else.",
      "The house edge is roughly 3.4% on the ante-play bet — treat it as entertainment, not income.",
    ],
    playable: true,
    practiceMode: "house",
    customTutorial: [
      {
        id: "intro",
        title: "You versus the dealer",
        text: "**Three Card Poker** is a casino table game, not a game against other players. You are trying to beat the **dealer's three-card hand**, and everyone at the table plays their own independent contest.",
        actions: [
          { t: "seats", count: 2, hero: 0, stack: 200, names: ["You", "Dealer"] },
          { t: "caption", text: "You vs the dealer" },
        ],
        hold: 3500,
      },
      {
        id: "ante",
        title: "The ante",
        text: "You place an **ante**. Optionally you also place a **Pair Plus** side bet, which pays on your own hand's strength no matter what the dealer has.",
        actions: [
          { t: "post", seat: 0, amount: 10, label: "ante" },
          { t: "caption", text: "Ante · optional Pair Plus" },
        ],
        hold: 3800,
      },
      {
        id: "deal",
        title: "Three cards each",
        text: "You and the dealer each receive **three cards**. Yours are face up to you; the dealer's stay face down for now.",
        actions: [
          { t: "dealEach", count: 3, faceUp: false },
          { t: "reveal", seat: 0 },
        ],
        hold: 4000,
      },
      {
        id: "rankings",
        title: "The rankings are different",
        text: "With three cards, straights and flushes swap places. From the top: **three of a kind**, **straight**, **flush**, **pair**, **high card**. A straight is harder to make than a flush when you only hold three cards.",
        actions: [{ t: "caption", text: "Trips > Straight > Flush > Pair > High card" }],
        hold: 4500,
      },
      {
        id: "decide",
        title: "Play or fold",
        text: "Now you decide: **fold** and forfeit the ante, or make a **Play wager** equal to the ante. The complete correct strategy is a single rule — play **Q-6-4 or better**, fold everything worse.",
        actions: [{ t: "act", seat: 0, say: "Play", amount: 10 }, { t: "collect" }],
        tip: "Q-6-4 is the exact break-even hand. Anything above it, play; anything below, fold.",
        hold: 5000,
      },
      {
        id: "qualify",
        title: "The dealer qualifies — or doesn't",
        text: "The dealer reveals. They need **queen-high or better to qualify**. If they do not, your ante pays even money and your Play wager is returned. If they do qualify, the higher hand wins both bets.",
        actions: [{ t: "reveal" }, { t: "award", seat: 0, amount: 0, note: "Dealer qualified" }],
        hold: 4500,
      },
    ],
  },

  {
    id: "ultimate-texas-holdem",
    name: "Ultimate Texas Hold'em",
    family: "house",
    tagline: "Hold'em against the dealer, where betting earlier wins you more.",
    summary:
      "You get two cards, the dealer gets two, and a normal five-card board is dealt. The twist is that you may make your Play bet at one of three moments — before the flop at 4×, after the flop at 2×, or after the river at 1× — and the earlier you commit, the larger the wager you are allowed.",
    deck: 52,
    holeCards: 2,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "other",
    betting: ["house-wager"],
    forced: "house-wager",
    players: { min: 1, max: 6, typical: 5 },
    difficulty: 2,
    popularity: "common",
    venues: ["casino"],
    learnMinutes: 10,
    streets: [],
    keyIdeas: [
      "Ante and Blind are both required and equal. A separate Trips side bet is optional.",
      "You bet Play once only: 4× preflop, 2× after the flop, or 1× after the river.",
      "The dealer needs at least a pair to qualify; if they do not, the Ante pushes.",
      "The Blind bet only pays when you win with a straight or better — otherwise it pushes.",
    ],
    mistakes: [
      "Waiting for more information every time. The 4× preflop bet with a big hand is where the value is.",
      "Expecting the Blind to pay on a winning pair. It does not.",
    ],
    strategy: [
      "Bet 4× preflop with any pair of threes or better, any ace, and big suited cards.",
      "Check to the river with marginal holdings and make the 1× bet only if you beat the board.",
    ],
    playable: false,
    customTutorial: [
      {
        id: "intro",
        title: "Hold'em, but against the house",
        text: "**Ultimate Texas Hold'em** deals a normal Hold'em hand — two cards each and a five-card board — but you are playing only against the **dealer**, and the betting works completely differently.",
        actions: [
          { t: "seats", count: 2, hero: 0, stack: 200, names: ["You", "Dealer"] },
          { t: "caption", text: "You vs the dealer" },
        ],
        hold: 3500,
      },
      {
        id: "ante",
        title: "Ante and Blind",
        text: "Before anything is dealt you post **two equal bets**: the Ante and the Blind. Many tables also offer a **Trips** side bet that pays on your final hand regardless of the result.",
        actions: [
          { t: "post", seat: 0, amount: 10, label: "ante" },
          { t: "post", seat: 0, amount: 10, label: "blind" },
        ],
        hold: 4000,
      },
      {
        id: "preflop",
        title: "The 4× decision",
        text: "You receive two cards. Right now — before any board card — you may make your **Play bet at four times the ante**. This is the only moment the 4× option exists, and it is where the game's value lives.",
        actions: [{ t: "dealEach", count: 2, faceUp: false }, { t: "reveal", seat: 0 }],
        tip: "Bet 4× with any pair of 3s or better, any ace, and strong suited cards. Otherwise check.",
        hold: 5000,
      },
      {
        id: "flop",
        title: "The 2× decision",
        text: "If you checked, the **flop** comes. You may now bet **twice the ante** — or check again and wait. Every time you wait, the maximum bet shrinks.",
        actions: [
          { t: "deal", to: "board", faceUp: true },
          { t: "deal", to: "board", faceUp: true },
          { t: "deal", to: "board", faceUp: true },
          { t: "caption", text: "Bet 2× or check" },
        ],
        hold: 4500,
      },
      {
        id: "river",
        title: "The 1× decision",
        text: "The turn and river are dealt together. Your last chance to bet is **one times the ante** — and if you check here, you **fold** and lose both the Ante and the Blind.",
        actions: [
          { t: "deal", to: "board", faceUp: true },
          { t: "deal", to: "board", faceUp: true },
          { t: "act", seat: 0, say: "Play 1×", amount: 10 },
        ],
        hold: 4800,
      },
      {
        id: "settle",
        title: "Settling three bets",
        text: "The dealer reveals. They **qualify with a pair or better** — if not, your Ante pushes. The Play bet pays even money on a win. The **Blind pays only for a straight or better**, on a sliding scale up to 500 to 1 for a royal flush.",
        actions: [{ t: "reveal" }, { t: "award", seat: 0, amount: 0, note: "Settle Ante · Blind · Play" }],
        hold: 5000,
      },
    ],
  },

  {
    id: "caribbean-stud",
    name: "Caribbean Stud",
    family: "house",
    tagline: "Five cards against the dealer, one decision, and a progressive jackpot.",
    summary:
      "You ante, receive five cards, and see one of the dealer's five. Then you either fold or raise exactly double the ante. The dealer qualifies with ace-king or better. There is no drawing and no bluffing — it is a single decision made with one card of information.",
    deck: 52,
    holeCards: 5,
    boards: 0,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "other",
    betting: ["house-wager"],
    forced: "house-wager",
    players: { min: 1, max: 7, typical: 5 },
    difficulty: 1,
    popularity: "common",
    venues: ["casino"],
    learnMinutes: 6,
    streets: [],
    keyIdeas: [
      "Five cards each, standard poker rankings, one betting decision.",
      "One dealer card is exposed before you decide.",
      "The dealer qualifies only with ace-king high or better; otherwise the ante pays and the raise pushes.",
      "Payouts on the raise scale with your hand, up to 100 to 1 for a royal flush.",
    ],
    mistakes: [
      "Folding hands that beat the dealer's likely holding — the correct play is to raise more often than instinct suggests.",
      "Playing the progressive side bet expecting value; it usually carries a very large house edge.",
    ],
    strategy: [
      "Raise with any pair or better; fold anything below ace-king high.",
      "With exactly ace-king, raise if the dealer's upcard matches one of your cards or is lower than your fourth-highest card.",
    ],
    playable: true,
    practiceMode: "house",
    customTutorial: [
      {
        id: "intro",
        title: "One decision, five cards",
        text: "**Caribbean Stud** is the simplest poker game in the casino. Five cards, one decision, no drawing, no bluffing. Standard poker rankings apply throughout.",
        actions: [
          { t: "seats", count: 2, hero: 0, stack: 200, names: ["You", "Dealer"] },
          { t: "caption", text: "You vs the dealer" },
        ],
        hold: 3500,
      },
      {
        id: "ante",
        title: "Ante up",
        text: "You place an **ante**, and optionally a **progressive side bet** that pays on your own hand — usually flush or better.",
        actions: [{ t: "post", seat: 0, amount: 10, label: "ante" }],
        hold: 3500,
      },
      {
        id: "deal",
        title: "Five each, one exposed",
        text: "You get **five cards face up to you**. The dealer gets five too, with **exactly one turned face up**. That single card is all the information you get.",
        actions: [
          { t: "dealEach", count: 5, faceUp: false },
          { t: "reveal", seat: 0 },
          { t: "deal", to: "seat", seat: 1, faceUp: true },
        ],
        hold: 4500,
      },
      {
        id: "decide",
        title: "Fold or raise",
        text: "Fold and lose the ante, or **raise exactly twice the ante**. There is no other option, no third amount, and no second decision. The simple rule: **raise with any pair or better, fold below ace-king**.",
        actions: [{ t: "act", seat: 0, say: "Raise 2×", amount: 20 }, { t: "collect" }],
        hold: 4800,
      },
      {
        id: "qualify",
        title: "Ace-king or better",
        text: "The dealer turns over the other four cards. They **qualify with ace-king high or better**. If they do not qualify, your ante pays even money and your raise is returned — which happens about **44%** of the time.",
        actions: [{ t: "reveal" }],
        hold: 4500,
      },
      {
        id: "pay",
        title: "The payout ladder",
        text: "If the dealer qualifies and you win, the ante pays even money and the **raise pays on a ladder**: 1 to 1 for a pair, up to **100 to 1 for a royal flush**. That ladder is the reason to play strong hands aggressively.",
        actions: [{ t: "award", seat: 0, amount: 0, note: "Ante 1:1 · Raise on the ladder" }],
        hold: 4500,
      },
    ],
  },

  {
    id: "let-it-ride",
    name: "Let It Ride",
    family: "house",
    tagline: "You are not beating a dealer — you are just trying to make a pair of tens or better.",
    summary:
      "Place three equal bets, receive three cards, and share two community cards with the table. Twice during the hand you may pull one of your bets back. There is no opponent: you are simply paid on the strength of your final five-card hand, starting at a pair of tens.",
    deck: 52,
    holeCards: 3,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "other",
    betting: ["house-wager"],
    forced: "house-wager",
    players: { min: 1, max: 7, typical: 6 },
    difficulty: 1,
    popularity: "niche",
    venues: ["casino"],
    learnMinutes: 6,
    streets: [],
    keyIdeas: [
      "Three equal bets are placed up front; two of them can be withdrawn later.",
      "You get three private cards and two community cards, for five in total.",
      "There is no dealer hand and no opponent. Only your own hand matters.",
      "Payouts start at a pair of tens; anything weaker loses whatever is still on the table.",
    ],
    mistakes: [
      "Letting bets ride on hands that cannot reach a pair of tens.",
      "Pulling back a bet on a made paying hand.",
    ],
    strategy: [
      "Let the first bet ride only with a paying hand already, three to a royal, or three suited connectors.",
      "Let the second ride with any made paying hand or four to a flush or open-ended straight.",
    ],
    playable: false,
    customTutorial: [
      {
        id: "intro",
        title: "No opponent at all",
        text: "**Let It Ride** has no dealer hand and no other players to beat. You are paid purely on how strong your own five-card hand ends up. The minimum paying hand is a **pair of tens**.",
        actions: [
          { t: "seats", count: 1, hero: 0, stack: 200 },
          { t: "caption", text: "Just you and your hand" },
        ],
        hold: 3500,
      },
      {
        id: "bets",
        title: "Three equal bets",
        text: "You place **three bets of the same size** before the deal. Two of them you will be allowed to take back; the third always stays.",
        actions: [
          { t: "post", seat: 0, amount: 10, label: "bet 1" },
          { t: "post", seat: 0, amount: 10, label: "bet 2" },
          { t: "post", seat: 0, amount: 10, label: "bet 3" },
        ],
        hold: 4200,
      },
      {
        id: "deal",
        title: "Three cards, two more coming",
        text: "You receive **three cards**. Two **community cards** are placed face down in the middle — they will complete everyone's five-card hand.",
        actions: [
          { t: "dealEach", count: 3, faceUp: false },
          { t: "reveal", seat: 0 },
          { t: "deal", to: "board", faceUp: false },
          { t: "deal", to: "board", faceUp: false },
        ],
        hold: 4500,
      },
      {
        id: "first",
        title: "First decision",
        text: "Looking at your three cards only, you may **pull back your first bet** or **let it ride**. Let it ride with a paying hand already, three to a royal flush, or three suited cards in sequence.",
        actions: [{ t: "act", seat: 0, say: "Let it ride" }],
        hold: 4500,
      },
      {
        id: "second",
        title: "Second decision",
        text: "The **first community card** is turned over. Now you decide about the second bet with four cards of information. Let it ride with any made paying hand, four to a flush, or four to an open-ended straight.",
        actions: [{ t: "deal", to: "board", faceUp: true }, { t: "act", seat: 0, say: "Pull it back" }],
        tip: "Four to an inside straight is not enough. Pull that bet back.",
        hold: 4800,
      },
      {
        id: "pay",
        title: "The final card",
        text: "The **last community card** is revealed and every bet still on the table is paid on the same scale — from **1 to 1 for a pair of tens** up to **1000 to 1 for a royal flush**. Anything below a pair of tens loses what remains.",
        actions: [
          { t: "deal", to: "board", faceUp: true },
          { t: "award", seat: 0, amount: 0, note: "Paid on the ladder" },
        ],
        hold: 4800,
      },
    ],
  },
];
