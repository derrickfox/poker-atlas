// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Catalog entries for the community-card family — Hold'em, the Omaha games, Pineapple
//          variants, Short Deck, Courchevel, Irish and Royal Hold'em.
// Reason: These share a board-and-blinds skeleton, so grouping them keeps the differences
//         (hole card count, "use exactly" rules, deck size, split pots) easy to compare.

import type { Variant } from "../types";
import { FREE_SELECTION } from "../engine/evaluator";
import { communityStreets } from "./streets";

const OMAHA_SELECTION = { useHole: 2, useBoard: 3, handSize: 5 };

export const communityVariants: Variant[] = [
  {
    id: "texas-holdem",
    name: "Texas Hold'em",
    aka: ["Hold'em", "NLHE"],
    family: "community",
    tagline: "Two private cards, five shared. The game the whole world plays.",
    summary:
      "Every player gets two cards face down. Five community cards are revealed in the middle over three stages, and you make the best five-card hand using any combination of your two and the board. Four betting rounds, no-limit stakes, and the simplest rule set in poker.",
    deck: 52,
    holeCards: 2,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["no-limit", "fixed-limit", "pot-limit", "spread-limit"],
    forced: "blinds",
    players: { min: 2, max: 10, typical: 9 },
    difficulty: 1,
    popularity: "ubiquitous",
    venues: ["casino", "online", "home", "tournament"],
    learnMinutes: 10,
    streets: communityStreets({ holeCards: 2 }),
    keyIdeas: [
      "Your two cards are yours alone; the five board cards belong to everybody.",
      "You may use both hole cards, one, or neither — whatever makes the best five.",
      "Position is fixed by the button, which moves one seat left every hand.",
      "No-limit means any bet from the minimum up to your entire stack is legal.",
    ],
    mistakes: [
      "Playing too many starting hands, especially weak aces and any two suited cards.",
      "Forgetting that a board like 9-9-9-9-A gives everyone the same hand, so the pot splits.",
      "Calling the river 'to see if they had it' without asking what worse hand could pay you.",
    ],
    strategy: [
      "Open fewer hands early in the betting order and more from the button.",
      "Betting does two jobs: it makes better hands fold and worse hands pay. If neither is happening, check.",
      "Count your outs on the flop and multiply by four to estimate your chance of getting there by the river.",
    ],
    origin: "Robstown, Texas in the early 1900s; carried to Las Vegas in 1967.",
    playable: true,
    quiz: [
      {
        id: "holdem-plays",
        prompt: "Board is K♦ Q♦ 7♣ 3♠ 2♥ and you hold A♦ 4♦. What is your hand?",
        showCards: ["Ad", "4d"],
        showLabel: "Your hand",
        choices: [
          { text: "A flush — I have two diamonds" },
          { text: "Ace high", correct: true },
          { text: "A pair of fours" },
        ],
        explain:
          "A flush needs five cards of the same suit in the finished hand. There are only two diamonds on the board, so you have four in total — one short. Your best five is A-K-Q-7-4: ace high.",
      },
    ],
  },

  {
    id: "short-deck",
    name: "Short Deck Hold'em",
    aka: ["Six Plus Hold'em", "6+"],
    family: "community",
    tagline: "Hold'em with the deuces through fives stripped out. Everything hits harder.",
    summary:
      "Identical to Hold'em except the 2s through 5s are removed, leaving a 36-card deck. Big hands appear far more often, so the hand ranking changes: a flush beats a full house, and the ace plays low to make A-6-7-8-9 the smallest straight. Most games use antes from everyone plus a button blind.",
    deck: 36,
    holeCards: 2,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "shortdeck",
    lo: "none",
    potType: "high",
    betting: ["no-limit", "pot-limit"],
    forced: "ante-each",
    players: { min: 2, max: 9, typical: 7 },
    difficulty: 3,
    popularity: "common",
    venues: ["casino", "online", "tournament"],
    learnMinutes: 12,
    streets: communityStreets({
      holeCards: 2,
      flopNote:
        "The flop. With sixteen cards removed you connect with the board much more often, so a single pair is worth far less than in Hold'em.",
    }),
    keyIdeas: [
      "The deck is 36 cards: 6 through ace in every suit.",
      "A flush beats a full house, because flushes are harder to make with only nine cards per suit.",
      "The ace plays both high and low: A-6-7-8-9 is the wheel straight.",
      "Instead of blinds, every player antes and the button posts an extra ante that acts as the opening bet.",
    ],
    mistakes: [
      "Valuing top pair the way you would in Hold'em — it is close to a bluff-catcher here.",
      "Forgetting the flush-over-boat reordering at showdown.",
      "Chasing open-ended straight draws too cheaply; they hit more often but so does everyone else's.",
    ],
    strategy: [
      "Suited connectors and pocket pairs go up in value; offsuit big cards go down.",
      "Sets are the workhorse hand — you flop one roughly once in six tries instead of once in eight.",
      "Because antes come from everyone, the pot is already worth fighting for preflop.",
    ],
    origin: "Popularised in Asian high-stakes cash games around 2014, then by the Triton series.",
    playable: true,
    quiz: [
      {
        id: "shortdeck-ranking",
        prompt: "In Short Deck, which of these two hands wins?",
        choices: [
          { text: "A club flush", correct: true },
          { text: "Kings full of sevens" },
          { text: "They tie" },
        ],
        explain:
          "With only 36 cards there are nine cards per suit instead of thirteen, so flushes become rarer than full houses. The ranking is adjusted to match: flush beats full house.",
      },
    ],
  },

  {
    id: "omaha",
    name: "Pot-Limit Omaha",
    aka: ["PLO", "Omaha High"],
    family: "community",
    tagline: "Four cards instead of two — and you must use exactly two of them.",
    summary:
      "Omaha looks like Hold'em with a bigger hand, but the defining rule is that your finished hand uses exactly two hole cards and exactly three board cards. No more, no less. The extra cards make huge hands routine, and the pot-limit betting cap keeps stacks from disappearing in one shove.",
    deck: 52,
    holeCards: 4,
    boards: 1,
    selection: OMAHA_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["pot-limit", "fixed-limit", "no-limit"],
    forced: "blinds",
    players: { min: 2, max: 10, typical: 9 },
    difficulty: 3,
    popularity: "ubiquitous",
    venues: ["casino", "online", "home", "tournament"],
    learnMinutes: 15,
    streets: communityStreets({
      holeCards: 4,
      holeNote:
        "Four private cards each. Think of them as six two-card Hold'em hands rolled into one.",
      showdownNote:
        "Showdown. Remember: exactly two from your hand, exactly three from the board — always.",
    }),
    keyIdeas: [
      "Exactly two hole cards and exactly three board cards. This is the rule beginners break.",
      "Four aces on the board does not give you quads unless two of your own cards play too.",
      "A pot-limit bet is capped at the size of the pot after your call, so pots grow geometrically.",
      "Because everyone has more cards, the winning hand at showdown is much stronger than in Hold'em.",
    ],
    mistakes: [
      "Playing one hole card for a flush — you need two of your own suited cards.",
      "Overvaluing top set on a coordinated board; someone often has a wrap or a made straight.",
      "Treating a hand like A-A-8-2 rainbow as premium. Omaha rewards four cards that work together.",
    ],
    strategy: [
      "Value hands where all four cards connect: double-suited rundowns like J-10-9-8 are gold.",
      "Draws are frequently favourites over made hands, so 'the nuts right now' is often not enough.",
      "Learn the nut rule: with this many cards out, second-best flushes and straights are expensive.",
    ],
    origin: "Devised in the 1980s; Robert Turner is generally credited with bringing it to Vegas.",
    playable: true,
    quiz: [
      {
        id: "omaha-two-cards",
        prompt: "Board: A♠ K♠ 9♠ 4♦ 2♣. You hold Q♠ J♥ 7♥ 6♦. Do you have a flush?",
        showCards: ["Qs", "Jh", "7h", "6d"],
        showLabel: "Your hand",
        choices: [
          { text: "No — only one of my cards is a spade", correct: true },
          { text: "Yes — the board has three spades and I have one" },
          { text: "Yes, and it is the second nuts" },
        ],
        explain:
          "Omaha forces exactly two hole cards into the hand. With one spade in hand you can only ever reach four spades. You would need two spades in your hand to make the flush.",
      },
    ],
  },

  {
    id: "omaha-hi-lo",
    name: "Omaha Hi-Lo",
    aka: ["Omaha 8", "O8", "Omaha Eight-or-Better"],
    family: "community",
    tagline: "Omaha where the pot splits between the best high hand and the best low.",
    summary:
      "Omaha rules exactly, but the pot is cut in two at showdown. Half goes to the best high hand and half to the best low hand — provided a low exists at all. A qualifying low needs five unpaired cards all ranked eight or lower, with the ace counting as a one. Straights and flushes do not spoil a low.",
    deck: 52,
    holeCards: 4,
    boards: 1,
    selection: OMAHA_SELECTION,
    hi: "high",
    lo: "a5-8ob",
    potType: "split",
    betting: ["pot-limit", "fixed-limit"],
    forced: "blinds",
    players: { min: 2, max: 10, typical: 9 },
    difficulty: 4,
    popularity: "common",
    venues: ["casino", "online", "mixed-game", "tournament"],
    learnMinutes: 20,
    streets: communityStreets({
      holeCards: 4,
      holeNote:
        "Four cards each. You will build two separate hands out of them — one aiming high, one aiming low.",
      flopNote:
        "The flop. Look for three cards of eight or lower: without them, no low is possible and the whole pot plays high.",
      showdownNote:
        "The high hand and the low hand are read separately. You may use a different pair of hole cards for each.",
    }),
    keyIdeas: [
      "A low needs five distinct ranks, all eight or lower, ace counting as one.",
      "The board must contain at least three cards of eight or lower or there is no low at all.",
      "You can win both halves with the same four cards — that is called scooping.",
      "The two-and-three rule applies independently to each half, so different hole cards can play for each.",
    ],
    mistakes: [
      "Chasing a low with 8-7 in hand — you will often make the second-best low and get quartered.",
      "Forgetting that a paired board card can kill your low.",
      "Playing high-only hands like K-K-Q-J in a game where half the money is earmarked elsewhere.",
    ],
    strategy: [
      "A-2 with a high-hand backup is the engine of this game. A-2-3-4 double suited is close to the best hand.",
      "Aim to scoop. Splitting a pot you contributed a quarter of is how bankrolls leak away.",
      "Getting 'quartered' — tying the low and losing the high — is the most common losing pattern.",
    ],
    playable: true,
    quiz: [
      {
        id: "o8-qualify",
        prompt: "Board: 9♦ 9♠ K♣ 5♥ 2♦. Is a low possible?",
        choices: [
          { text: "No — only two board cards are eight or lower", correct: true },
          { text: "Yes — the 9-9-2 makes it" },
          { text: "Yes, any board can make a low in Omaha Hi-Lo" },
        ],
        explain:
          "You must use exactly three board cards. Only the 5 and the 2 qualify as low cards, so no five-card eight-or-better low can be assembled. The entire pot goes to the best high hand.",
      },
    ],
  },

  {
    id: "big-o",
    name: "Big O",
    aka: ["Five Card Omaha Hi-Lo"],
    family: "community",
    tagline: "Omaha Hi-Lo with a fifth hole card. Nut hands or nothing.",
    summary:
      "Five hole cards instead of four, still using exactly two, with the same eight-or-better split. The extra card raises the bar dramatically: lows get counterfeited less often, and second-nut hands lose money relentlessly. A staple of Southern California card rooms.",
    deck: 52,
    holeCards: 5,
    boards: 1,
    selection: OMAHA_SELECTION,
    hi: "high",
    lo: "a5-8ob",
    potType: "split",
    betting: ["pot-limit", "fixed-limit"],
    players: { min: 2, max: 9, typical: 8 },
    forced: "blinds",
    difficulty: 4,
    popularity: "niche",
    venues: ["casino", "home", "mixed-game"],
    learnMinutes: 20,
    streets: communityStreets({
      holeCards: 5,
      holeNote: "Five private cards. Still exactly two of them play in each finished hand.",
    }),
    keyIdeas: [
      "Five hole cards, use exactly two, eight-or-better low split.",
      "Ten two-card combinations per player means showdowns are much stronger than in four-card Omaha.",
      "Because lows are so common, scooping matters even more than in Omaha Hi-Lo.",
    ],
    mistakes: [
      "Playing any five random low cards — you need the ace-deuce class of low, not just low cards.",
      "Calling down with the second-nut flush.",
    ],
    strategy: [
      "A-2 plus a strong high component is the hand class you are hunting.",
      "Fold more preflop than instinct suggests; the extra card makes everyone's range stronger.",
    ],
    playable: true,
  },

  {
    id: "plo5",
    name: "Five Card PLO",
    aka: ["PLO5"],
    family: "community",
    tagline: "Pot-Limit Omaha with a fifth card and no low half.",
    summary:
      "Straight high-only Omaha with five hole cards. Everything you know about PLO holds, only more so — equities run closer together, draws get bigger, and the nuts change hands more often. It has become the default high-stakes online action game.",
    deck: 52,
    holeCards: 5,
    boards: 1,
    selection: OMAHA_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 8, typical: 6 },
    difficulty: 4,
    popularity: "common",
    venues: ["online", "casino"],
    learnMinutes: 15,
    streets: communityStreets({ holeCards: 5 }),
    keyIdeas: [
      "Five hole cards, exactly two play, pot-limit betting.",
      "Preflop equities are compressed — even the best hand is rarely a big favourite.",
      "Nut-flush and nut-straight draws are close to mandatory to continue on wet boards.",
    ],
    mistakes: [
      "Overplaying two pair; with five cards out, someone usually has better.",
      "Building the pot preflop with hands that flop draws but never the nuts.",
    ],
    strategy: [
      "Connectivity beats raw high cards. Five cards that all work together is the ideal.",
      "Play smaller pots preflop and let your postflop nut potential do the work.",
    ],
    playable: true,
  },

  {
    id: "plo6",
    name: "Six Card PLO",
    aka: ["PLO6"],
    family: "community",
    tagline: "Six hole cards. Fifteen two-card combinations. Chaos, capped at pot size.",
    summary:
      "The largest of the Omaha family in common circulation. With six hole cards each, most flops give several players a strong hand, and the nuts on the river is often the minimum needed to call. Played almost exclusively online and short-handed.",
    deck: 52,
    holeCards: 6,
    boards: 1,
    selection: OMAHA_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 5 },
    difficulty: 5,
    popularity: "niche",
    venues: ["online"],
    learnMinutes: 15,
    streets: communityStreets({ holeCards: 6 }),
    keyIdeas: [
      "Six hole cards, exactly two play. The deck runs short with more than six players.",
      "Nearly every hand has a draw; 'having equity' is not a reason to put money in.",
      "Blockers matter enormously — holding the ace of a suit says a lot about who can have the nuts.",
    ],
    mistakes: [
      "Treating a big draw as a favourite; against a made hand plus redraws it often is not.",
      "Playing full-ring — the deck barely supports it.",
    ],
    strategy: [
      "Fold aggressively without nut potential in at least two directions.",
      "Pay attention to what your own cards remove from opponents' possible hands.",
    ],
    playable: true,
  },

  {
    id: "courchevel",
    name: "Courchevel",
    family: "community",
    tagline: "Five-card Omaha where the first flop card is exposed before the betting starts.",
    summary:
      "Deal five hole cards, then turn one community card face up before the opening betting round. The flop is completed with two more cards later. Knowing one board card before you act changes preflop hand values completely — a game usually spread as a high-only or hi-lo pot-limit variant in European card rooms.",
    deck: 52,
    holeCards: 5,
    boards: 1,
    selection: OMAHA_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 8, typical: 6 },
    difficulty: 5,
    popularity: "rare",
    venues: ["casino", "online", "mixed-game"],
    learnMinutes: 15,
    streets: communityStreets({
      holeCards: 5,
      preflopBoard: 1,
      flopNote:
        "Two more community cards complete the flop. The card everyone already saw stays in place.",
    }),
    keyIdeas: [
      "Five hole cards, exactly two play, Omaha rules throughout.",
      "One board card is exposed before the first betting round, so preflop decisions use partial board information.",
      "Hands that connect with the exposed card jump enormously in value.",
    ],
    mistakes: [
      "Ignoring the exposed card when deciding whether to enter the pot.",
      "Assuming the exposed card is 'just one of five' — it is the single most known card in poker.",
    ],
    strategy: [
      "Pair the exposed card or hold cards of its suit and your hand plays far better postflop.",
      "Everyone else can see it too, so a hand that only makes second-best with it is a trap.",
    ],
    origin: "Named after the French ski resort where it was reportedly first dealt.",
    playable: true,
  },

  {
    id: "pineapple",
    name: "Pineapple",
    family: "community",
    tagline: "Hold'em with three hole cards — discard one before the flop.",
    summary:
      "Each player is dealt three cards and throws one away before the first betting round is complete. From there it is ordinary Hold'em with two cards. A gentle step up from Hold'em: stronger starting hands, identical mechanics, one extra decision.",
    deck: 52,
    holeCards: 3,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["no-limit", "pot-limit", "fixed-limit"],
    forced: "blinds",
    players: { min: 2, max: 10, typical: 8 },
    difficulty: 2,
    popularity: "niche",
    venues: ["home", "casino", "mixed-game"],
    learnMinutes: 10,
    streets: communityStreets({
      holeCards: 3,
      holeNote: "Three cards each — one of which you will not keep.",
      extra: [
        {
          after: "deal",
          street: {
            id: "discard",
            name: "The discard",
            kind: "draw",
            drawMax: 1,
            betting: false,
            note: "Before the flop, every player discards one of their three cards face down.",
          },
        },
      ],
    }),
    keyIdeas: [
      "Three cards dealt, one discarded before the flop, then standard Hold'em.",
      "Everyone's starting hand is stronger, so the winning hand at showdown is stronger too.",
      "Once the discard is made you can never use that card.",
    ],
    mistakes: [
      "Keeping three-card 'potential' in mind after the discard — only two cards exist.",
      "Discarding a duplicate suit and destroying your flush potential.",
    ],
    strategy: [
      "Keep the two cards that work together, not the two highest cards.",
      "Big pairs are more likely to be up against another big pair than in Hold'em.",
    ],
    playable: true,
  },

  {
    id: "crazy-pineapple",
    name: "Crazy Pineapple",
    family: "community",
    tagline: "Three hole cards, but the discard waits until after the flop.",
    summary:
      "Identical to Pineapple except you keep all three cards through the flop and the first two betting rounds, discarding only after the flop betting is complete. Seeing three board cards before choosing which card to keep makes this substantially sharper than its parent game.",
    deck: 52,
    holeCards: 3,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["no-limit", "pot-limit", "fixed-limit"],
    forced: "blinds",
    players: { min: 2, max: 10, typical: 8 },
    difficulty: 3,
    popularity: "niche",
    venues: ["home", "casino", "mixed-game"],
    learnMinutes: 12,
    streets: communityStreets({
      holeCards: 3,
      holeNote: "Three cards each. You keep all three through the flop.",
      extra: [
        {
          after: "flop",
          street: {
            id: "discard",
            name: "The discard",
            kind: "draw",
            drawMax: 1,
            betting: false,
            note: "After the flop betting round, everyone still in the hand discards one card.",
          },
        },
      ],
    }),
    keyIdeas: [
      "The discard happens after the flop betting round, not before.",
      "You effectively see a three-card hand against the flop, which is a big information edge.",
      "The turn and river play out as normal Hold'em with two cards.",
    ],
    mistakes: [
      "Discarding before the betting is finished — check your house rules on timing.",
      "Keeping a backdoor draw over a made pair without counting the actual outs.",
    ],
    strategy: [
      "Three cards means you flop sets, two pair and big draws far more often. Adjust your calling standards upward.",
      "The discard choice is often between a pair and a draw; the pot odds you are being offered decide it.",
    ],
    playable: true,
  },

  {
    id: "lazy-pineapple",
    name: "Lazy Pineapple",
    aka: ["Tahoe Pineapple"],
    family: "community",
    tagline: "Keep all three cards to showdown — but still play only two.",
    summary:
      "No discard at all. You hold three cards all the way to showdown and make your best five-card hand using any two of them plus the board. The extra card never has to be given up, which makes it the most action-heavy member of the Pineapple family.",
    deck: 52,
    holeCards: 3,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["no-limit", "pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 10, typical: 8 },
    difficulty: 2,
    popularity: "rare",
    venues: ["home", "mixed-game"],
    learnMinutes: 8,
    streets: communityStreets({
      holeCards: 3,
      holeNote: "Three cards each, kept all the way to showdown.",
    }),
    keyIdeas: [
      "No discard — all three cards stay live through the river.",
      "Unlike Omaha there is no 'use exactly two' obligation from the board side; you simply have an extra card.",
      "Showdown hands run stronger than Hold'em but weaker than Omaha.",
    ],
    mistakes: [
      "Mixing it up with Omaha rules and thinking two hole cards are compulsory.",
      "Ignoring how much more often opponents make straights and flushes here.",
    ],
    strategy: [
      "Three connected or suited cards are worth much more than three scattered high cards.",
      "Top pair loses value; draws gain it.",
    ],
    playable: true,
  },

  {
    id: "irish",
    name: "Irish Poker",
    family: "community",
    tagline: "Start with four cards like Omaha, discard two after the flop, finish like Hold'em.",
    summary:
      "A hybrid: four hole cards are dealt Omaha-style, but after the flop betting round every player throws two away and the hand finishes under Hold'em rules with the remaining two. Popular as a home-game and charity-tournament variant.",
    deck: 52,
    holeCards: 4,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["no-limit", "pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 9, typical: 8 },
    difficulty: 2,
    popularity: "rare",
    venues: ["home", "tournament"],
    learnMinutes: 10,
    streets: communityStreets({
      holeCards: 4,
      holeNote: "Four cards each, as in Omaha.",
      extra: [
        {
          after: "flop",
          street: {
            id: "discard",
            name: "Discard two",
            kind: "draw",
            drawMax: 2,
            betting: false,
            note: "After the flop betting, each remaining player discards two cards. Hold'em rules from here.",
          },
        },
      ],
    }),
    keyIdeas: [
      "Four cards preflop, two cards from the turn onward.",
      "Before the discard you are playing Hold'em rules, not Omaha — one hole card can play.",
      "The discard is where the game is won or lost.",
    ],
    mistakes: [
      "Applying the Omaha 'exactly two' rule to the flop. Irish never uses it.",
      "Keeping two cards for a draw when a made hand was available.",
    ],
    strategy: [
      "Four cards mean you see good flops often; the discipline is in folding when the flop misses all four.",
      "Keep the pair over the flush draw when the pot is small, the draw when the pot is large.",
    ],
    playable: true,
  },

  {
    id: "royal-holdem",
    name: "Royal Hold'em",
    family: "community",
    tagline: "Hold'em with a twenty-card deck: tens through aces only.",
    summary:
      "Standard Hold'em played with only the tens, jacks, queens, kings and aces. Every hand is enormous — full houses are routine and a flush is nearly always the nuts or nothing. Limited to six players because the deck runs out.",
    deck: 20,
    holeCards: 2,
    boards: 1,
    selection: FREE_SELECTION,
    hi: "high",
    lo: "none",
    potType: "high",
    betting: ["fixed-limit", "pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 6, typical: 5 },
    difficulty: 2,
    popularity: "rare",
    venues: ["home", "online"],
    learnMinutes: 8,
    streets: communityStreets({
      holeCards: 2,
      flopNote:
        "The flop. With a twenty-card deck, pairs on board and made straights are extremely common.",
    }),
    keyIdeas: [
      "Only 10, J, Q, K and A are in the deck — twenty cards total.",
      "Hand rankings are unchanged, but the hands themselves are far bigger.",
      "The only possible straight is 10-J-Q-K-A, the royal.",
    ],
    mistakes: [
      "Getting excited about two pair. It is close to worthless here.",
      "Playing more than six-handed and running out of cards.",
    ],
    strategy: [
      "Pocket pairs are the premium holding; they make trips and quads at a startling rate.",
      "The nuts is usually quads or a royal flush, so pot control with a full house is real.",
    ],
    playable: true,
  },

  {
    id: "double-board-plo",
    name: "Double Board PLO",
    aka: ["Double Board Omaha"],
    family: "community",
    tagline: "Two complete boards, two half pots, one set of hole cards.",
    summary:
      "Pot-Limit Omaha dealt with two separate five-card boards. Each board is worth half the pot, and the same four hole cards play against both. Scooping both boards is the goal; splitting them is common. Frequently dealt as a 'bomb pot' where everyone antes and the flop comes with no preflop betting.",
    deck: 52,
    holeCards: 4,
    boards: 2,
    selection: OMAHA_SELECTION,
    hi: "high",
    lo: "none",
    potType: "split",
    betting: ["pot-limit"],
    forced: "blinds",
    players: { min: 2, max: 8, typical: 6 },
    difficulty: 4,
    popularity: "niche",
    venues: ["home", "casino", "online"],
    learnMinutes: 12,
    streets: communityStreets({
      holeCards: 4,
      flopNote: "Two flops are dealt side by side. Each board will be worth half the pot.",
      turnNote: "A turn card for each board.",
      riverNote: "A river card for each board, then the final betting round.",
      showdownNote:
        "Each board is settled separately, Omaha rules on both. Winning one and losing one returns your money.",
    }),
    keyIdeas: [
      "Two independent boards, each awarding half the pot.",
      "Your same four cards play on both boards under normal Omaha rules.",
      "Winning one board and losing the other is a break-even outcome — you are hunting scoops.",
    ],
    mistakes: [
      "Betting large with a hand that is only strong on one board.",
      "Treating a nut hand on one board as a licence to build the pot.",
    ],
    strategy: [
      "Hands with nut potential in more than one direction scoop far more often.",
      "Draws are worth more here because you get two chances to hit.",
    ],
    playable: false,
  },
];
