# Poker Atlas

An animated tutorial app for learning every kind of poker. Browse a filterable catalog of 39
variants, watch any one of them played out card by card, then practise it with drills and a hand
against bots.

```bash
npm install
npm run dev      # http://localhost:5194
```

Other scripts: `npm test` (Vitest), `npm run typecheck`, `npm run build`.

## What's in it

**Dashboard** — every variant as a card, with faceted filters for game family, how the pot is won,
betting structure, where it's played, difficulty and how often you'll actually see it. Sorting by
recommended order, difficulty, name, or time-to-learn.

**Animated tutorial** — a real demo hand dealt from a seeded deck and played out step by step on an
animated table. Cards deal from the dealer position, flip on reveal, and the five that actually play
glow at showdown. The narration is generated from the variant's own street structure, and the
showdown result is computed by the evaluator rather than written by hand, so it is always right.

**Practice** — two modes:
- *Drills*: freshly generated each round. Structure recall, hand reading, "does this qualify for the
  low half", and real "which hand wins" showdowns evaluated under that variant's ranking rules.
- *Play a hand*: a live hand against heuristic bots, with draw/discard interaction for the draw games
  and correct split-pot settlement. Deliberately a rules trainer — fixed-size betting, simple bots.

**Reference** — spec table, key ideas, common beginner mistakes, first strategy footholds, and the
full street-by-street structure.

## Architecture

For the full technical description — data model, tutorial pipeline, animation mechanics, engine
internals, limitations and gotchas — see [HANDOFF.md](HANDOFF.md).

The whole app is driven by one declarative description of each variant.

```
src/
  types.ts                  Variant, StreetDef, TutorialStep, Action, TableState
  data/
    streets.ts              communityStreets / studStreets / drawStreets builders
    variants.*.ts           the catalog, grouped by family
    index.ts                assembly, filter vocabulary, sorting
  engine/
    cards.ts                ranks, suits, 52/36/20-card decks, seeded shuffle
    evaluator.ts            high · short-deck high · A-5 low · 2-7 low · Badugi
    tutorial.ts             deals a demo hand and emits a tutorial script
    table.ts                reduces script actions into TableState
    game.ts                 the playable engine (deal, bet, draw, settle)
    house.ts                isolated dealer-game rules and payout engine
    letItRide.ts            isolated withdrawals and main-wager paytable
    drills.ts               generates practice questions
  components/
    PokerTable.tsx          renders TableState; cards animate via CSS transforms
    TutorialPlayer.tsx      script playback with autoplay and a step rail
    Practice.tsx            drills + practice-mode routing
    HousePractice.tsx       animated dealer-game practice
    LetItRidePractice.tsx   animated two-decision Let It Ride practice
    Dashboard.tsx           catalog and filters
```

Two ideas carry most of the weight:

1. **A variant is data.** `Variant` describes the deck, hole cards, which cards must play, the
   ranking systems, the forced bets and the list of streets. Twenty-odd variants differ only in
   those numbers, so they share one tutorial generator and one practice engine.
2. **The table is a pure function of state.** Every tutorial step is a list of `Action`s reduced into
   a `TableState`; `PokerTable` positions each card by CSS transform keyed on card identity. Moving
   a card between states animates for free, and jumping to any step just replays from zero.

## Coverage

39 variants across six families:

- **Community** — Hold'em, Short Deck, PLO, Omaha Hi-Lo, Big O, PLO5, PLO6, Courchevel, Pineapple,
  Crazy Pineapple, Lazy Pineapple, Irish, Royal Hold'em, Double Board PLO
- **Stud** — Seven-Card Stud, Stud Hi-Lo, Razz, Five-Card Stud
- **Draw** — Five-Card Draw, 2-7 Triple Draw, 2-7 Single Draw, A-5 Triple Draw, Badugi, Badacey,
  Badeucey
- **Home / dealer's choice** — Baseball, Follow the Queen, 7/27, Anaconda, Guts, Blind Man's Bluff,
  Chinese Poker, Open-Face Chinese
- **Mixed rotations** — HORSE, 8-Game
- **Against the house** — Three Card Poker, Ultimate Texas Hold'em, Caribbean Stud, Let It Ride

Every variant has an animated tutorial and drills. The 22 that fit the deal-and-bet model are
playable against bots; Three Card Poker and Caribbean Stud have isolated dealer-game practice, and
Let It Ride has an isolated two-decision practice mode. The remaining variants say so and lean on
the walkthrough.

## Caveats

- The practice bots are hand-strength heuristics, not solvers, and betting is fixed-size for every
  variant so one engine stays legal across all of them. Use it to learn rules and hand reading.
- Short Deck implements flush-beats-full-house. Some rooms also rank trips above a straight; the
  tutorial mentions it but the evaluator uses the more common ruleset.
- Home-game rules vary by table. Where they do — Baseball's penalty for a face-up three, Anaconda's
  pass direction — the tutorial says to settle it before the deal rather than asserting one answer.
