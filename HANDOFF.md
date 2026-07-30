# Poker Atlas — technical handoff

Everything needed to pick this project up cold. Written 2026-07-30.

---

## 1. What it is

A React web app for learning every kind of poker. Three surfaces:

1. **Dashboard** — 39 poker variants as cards, with faceted filters and sorting.
2. **Animated tutorial** — per variant, a real demo hand dealt from a seeded deck and played out
   step by step on an animated table.
3. **Practice** — per variant, generated drills plus (for 22 of them) a playable hand against bots.

Location `~/Desktop/REPOS/poker-atlas`. Dev server port **5194**, registered in the *repo-level*
`~/Desktop/REPOS/.claude/launch.json` as `poker-atlas` (not in the project folder — the preview tool
reads the launch config from the primary working directory).

```bash
npm run dev        # vite, port 5194, strictPort
npm test           # vitest, 23 tests
npm run typecheck  # tsc --noEmit
npm run build      # tsc --noEmit && vite build
```

Stack: React 18, Vite 5, TypeScript 5 (strict, `noUnusedLocals`, `noUnusedParameters`), Vitest 2.
No runtime dependencies beyond React. No router, no state library, no CSS framework, no chart or
animation library. `@/*` is aliased to `src/*` in both `tsconfig.json` and `vite.config.ts`, but
the code uses relative imports throughout.

**Convention:** `REPOS/AGENTS.md` requires an `AI_CHANGE` comment block on meaningful edits (Tool,
Model, Timestamp, Purpose, Reason). Every non-trivial file here has one at the top. Keep it up.

---

## 2. The one architectural idea

**A poker variant is data, not code.**

A `Variant` object declares its deck size, hole-card count, which cards must play, its high/low
ranking systems, its forced-bet structure and its list of streets. From that single description the
app derives:

- the dashboard card and every filter facet it matches
- a complete animated tutorial script, including a truthfully-evaluated showdown
- a set of practice drills
- a playable hand against bots

Adding a variant is appending an object to a data file. Roughly twenty variants differ *only* in
those numbers, which is why 39 games were feasible instead of four.

The escape hatch: games whose structure cannot be expressed as a list of betting streets (Chinese
Poker, Guts, the casino house games, the mixed rotations) carry a hand-written `customTutorial`
array and set `playable: false`. There are 11 of those.

---

## 3. File map

```
src/
  main.tsx                      React root
  App.tsx                       hash routing, filter/sort state
  types.ts                      Variant, StreetDef, TutorialStep, Action, TableState, QuizQuestion
  styles/global.css             the entire stylesheet (~1050 lines), design tokens at the top

  data/
    streets.ts                  communityStreets / studStreets / drawStreets builders
    variants.community.ts       14 variants
    variants.stud.ts            4
    variants.draw.ts            7
    variants.home.ts            8
    variants.mixed.ts           mixedVariants (2) + houseVariants (4)
    index.ts                    assembly, filter vocabulary, applyFilters, sortVariants

  engine/
    cards.ts                    Card, decks (52/36/20), seeded RNG, shuffle, combinations
    chips.ts                    exact $1/$5/$25/$100 denomination breakdowns
    evaluator.ts                five ranking systems + best-hand search
    tutorial.ts                 deals a demo hand, emits a TutorialStep[] script
    table.ts                    reduces script Actions into TableState
    game.ts                     the playable engine (deal, bet, draw, settle)
    drills.ts                   generates practice questions
    engine.test.ts              23 tests

  components/
    PokerTable.tsx              renders TableState — seats, cards, chips, pot
    TutorialPlayer.tsx          script playback, autoplay, step rail
    Practice.tsx                drills + live hand (contains gameToTable)
    Dashboard.tsx               catalog grid + filter rail
    VariantPage.tsx             header, tab strip, reference tab
    ErrorBoundary.tsx           per-tab crash isolation
    RichText.tsx                **bold** / *italic* / paragraph parser
```

Import direction is one-way: `components → engine → data → types`. The two exceptions are
`engine/tutorial.ts` and `engine/drills.ts`, which import label maps from `data/index.ts`. There
are no cycles.

---

## 4. The data model

### `Variant` (src/types.ts)

| Field | Type | Notes |
|---|---|---|
| `id` | string | URL slug, used as `#/{id}` and as the tutorial RNG seed source |
| `name`, `aka?` | string, string[] | `aka` is searchable |
| `family` | `community \| stud \| draw \| mixed \| home \| house` | drives the street builder and the dashboard accent colour |
| `tagline` | string | one line on the dashboard card |
| `summary` | string | 2–3 sentences; becomes the tutorial's opening narration |
| `deck` | `52 \| 36 \| 20` | 36 = short deck (6+), 20 = royal (T+) |
| `holeCards` | number | **total** across all streets (stud = 7) |
| `boards` | number | 1 normally; 2 for Double Board PLO; 0 for stud/draw |
| `selection` | `SelectionRule` | `{useHole, useBoard, handSize}`; nulls = free choice |
| `hi` | `high \| shortdeck \| none` | |
| `lo` | `none \| a5-8ob \| a5-any \| deuce-seven \| badugi` | |
| `potType` | `high \| split \| lowball \| other` | the most useful beginner filter |
| `betting` | `BettingId[]` | first entry is treated as the canonical one |
| `forced` | `blinds \| blinds-ante \| antes-bringin \| antes \| ante-each \| house-wager` | |
| `players` | `{min, max, typical}` | `typical` sizes the demo table |
| `difficulty` | 1–5 | |
| `popularity` | `ubiquitous \| common \| niche \| rare` | |
| `venues` | `Venue[]` | casino / online / home / tournament / mixed-game |
| `learnMinutes` | number | |
| `streets` | `StreetDef[]` | empty for custom-tutorial games |
| `keyIdeas`, `mistakes`, `strategy` | string[] | reference tab + tutorial recap |
| `origin?` | string | |
| `showdownCaveat?` | string | appended to generated showdown narration (Badacey/Badeucey only) |
| `playable` | boolean | true ⇒ `game.ts` can deal it |
| `customTutorial?` | `TutorialStep[]` | bypasses generation entirely |
| `quiz?` | `QuizQuestion[]` | hand-written drills layered onto generated ones |

### `StreetDef`

```ts
{
  id, name,
  kind: "post" | "deal-hole" | "deal-board" | "draw" | "betting" | "showdown" | "custom",
  boardCards?, holeCards?,
  faceUp?,          // whole batch face up
  faceUpCards?,     // only the last N of the batch (stud third street: 3 cards, 1 up)
  drawMax?,
  betting: boolean, // does a betting round follow
  bigBet?,          // fixed-limit doubles from here
  note: string,     // narration for this street
}
```

`SelectionRule.handSize` is 5 everywhere except Badugi (4).

---

## 5. Hand evaluation (`src/engine/evaluator.ts`)

Five ranking systems, all producing a `HandScore`:

```ts
interface HandScore {
  value: number[];   // compare lexicographically, higher wins
  label: string;     // "two pair, jacks and tens"
  cards: Card[];     // the cards that actually play — used for the showdown glow
  qualifies: boolean;// false = no 8-or-better low, etc.
}
compareScores(a, b) // -1 | 0 | 1
```

| Function | Rules |
|---|---|
| `scoreFiveHigh(cards, "standard")` | normal ranking; `A-2-3-4-5` reads as a five-high straight |
| `scoreFiveHigh(cards, "shortdeck")` | same, but categories 5 (flush) and 6 (full house) are **swapped** in the ordering key, and the wheel is `A-6-7-8-9` |
| `scoreFiveLowA5(cards, eightOrBetter)` | aces low, straights/flushes ignored. Ranks the pairing pattern on the normal ladder then **negates everything**. `eightOrBetter=true` returns `qualifies:false` unless five distinct ranks all ≤ 8 |
| `scoreFiveLow27(cards)` | aces high, straights and flushes count against you. Literally `scoreFiveHigh(...).value.map(v => -v)` |
| `scoreBadugi(cards)` | largest subset with all-distinct ranks *and* suits; size dominates, then lowest cards, aces low |

Best-hand search:

```ts
candidateHands(hole, board, rule)  // respects useHole/useBoard, else all combos of handSize
bestHi(hole, board, ranking, rule)
bestLo(hole, board, ranking, rule) // "badugi" bypasses selection and scores hole+board directly
```

`combinations()` is only ever called on tiny inputs — C(7,5)=21 is the worst case for high hands,
C(6,2)×C(5,3)=150 for six-card Omaha.

Card identity and display deliberately differ for tens: `RANK_CODE[10]` is `"T"` so existing ids
and authored card strings remain compact (`"Th"`), while `RANK_LABEL[10]` is `"10"` everywhere a
learner sees it. `parseCard` accepts both `"Th"` and `"10h"` and normalizes either to the same card.

**Verified by tests:** the standard ladder, both wheels, short-deck flush-over-boat, 8-or-better
qualification, the A-5 wheel beating an eight-low beating a paired hand, 2-7 nuts vs a straight vs
an ace-low, and badugi-beats-three-card.

---

## 6. The tutorial pipeline

This is the most intricate part. Three stages: **simulate → script → replay**.

### Stage 1 — simulate (`engine/tutorial.ts`)

`buildTutorial(variant)`:

1. If `variant.customTutorial` exists, return it verbatim.
2. If the variant is a split-pot game with a low ranking, try up to **60 seeds** (`seedFor(id) +
   n*7919`) and keep the first deal where *both* halves are won. Without this, the Omaha Hi-Lo demo
   landed on a board with no qualifying low — which teaches the wrong lesson. Falls back to the base
   seed if no split is found.
3. Otherwise build with `seedFor(variant.id)` (FNV-1a hash of the id).

`buildWithSeed` walks `variant.streets`, maintaining a `Sim`:

```ts
interface Sim {
  deck: Card[];            // shuffled with makeRng(seed)
  seats: DemoSeat[];       // min(5, max(3, players.typical))
  board: Card[][];
  pot: number;
  posted: Map<number, number>;  // blind money already out per seat
}
```

Per street kind:

- **post** — blinds or antes. Button is at `seatCount - 1`, so SB is seat 0 (the hero) and BB is
  seat 1. Antes `collect` immediately; **blinds deliberately do not** (see §7).
- **deal-hole** — deals one card at a time *around the table* so the animation cascades. Honours
  `faceUpCards` for stud.
- **deal-board** — appends to `sim.board[n]` for each board.
- **draw** — `cardsToDiscard()` picks throwaways per the variant's ranking system (badugi keeps a
  rank/suit-distinct subset; lowball keeps lowest distinct ranks; high games keep pairs, else four
  to a flush, else the two highest). Community-family draws (Pineapple, Irish) discard **without**
  replacement; everything else redraws.
- **showdown** — `judge()` runs the real evaluator over the simulated hands and produces the
  narration and the award actions.

After each street with `betting: true`, `bettingBeat()` scripts a deterministic round: the last live
seat folds on the first two streets, the first non-folder bets/raises, everyone else calls. Bet
sizes are `[6, 12, 24, 24, 48]` by street index.

### Stage 2 — the script

Output is `TutorialStep[]`:

```ts
{ id, title, text, actions: Action[], tip?, hold? }
```

`Action` is the whole vocabulary the table understands:

```
seats {count, hero, stack, names?}   button {seat}
post {seat, amount, label, badge?}   deal {to, seat?, board?, card?, faceUp}
dealEach {count, faceUp}             act {seat, say, amount?}
fold {seat}                          collect
reveal {seat?}                       discard {seat, count, cards?}
emphasize {cards}                    award {seat, amount, note?}
caption {text}                       clearSays        reset
```

`deal` without a `card` and `dealEach` pull from a module-level shuffled deck in `table.ts`
(`DEMO_DECK`, seeded 20260730) so hand-written scripts still show real cards.

### Stage 3 — replay (`engine/table.ts`)

`applyAction(state, action) → TableState` is a pure reducer. `stateAtStep(steps, i, boards)` replays
from step 0 every time. That is why the step rail's random access needs no rewind logic — jumping to
step 9 just replays 0..9.

`TableState` is `{ seats, cards, boards, pot, buttonSeat, caption }`. Each `TableCard` has a stable
`id` (`"As"`, `"Td"`) and a `home` of `{where:"seat", seat, slot}` or `{where:"board", board, slot}`.

---

## 7. Chip and pot timing (get this right or the app teaches wrong poker)

Three rules, each of which was a bug first:

1. **Blinds are not collected when posted.** They sit in front of their seats through the deal, so
   you can see money committed before a card is dealt. The forced-bet step for `blinds` emits no
   `collect`. Antes *do* collect immediately, because that's what happens in stud.

2. **Bets are swept at the start of the next street, not at the end of the round.** `bettingBeat()`
   emits no `collect`; instead `buildWithSeed` tracks a `sweepFirst` flag and prepends `{t:"collect"}`
   to the next street's actions. `showdownStep` always prepends one. This is what a live dealer does
   and it costs zero extra steps.

3. **Blinds are live money.** On the first betting round, a seat that already posted only tops up
   the difference — `sim.posted` holds the amounts, and the label reads `calls 6 (+4)`. Before this,
   the small blind ended the round showing 7 against everyone else's 6.

Resulting Hold'em sequence (verified):

| Step | chips on felt | pot |
|---|---|---|
| Blinds | 1, 2 | 0 |
| Hole cards | 1, 2 | 0 |
| Preflop betting | 6, 6, 6, 6 | 0 |
| The flop | — | 24 |
| Flop betting | 12, 12, 12 | 24 |

---

## 8. How the animation actually works

`PokerTable.tsx`. There is no animation library; everything falls out of CSS transitions on
transform, keyed on card identity.

**Stage.** A fixed 1000 × 664 `.stage` scaled by a `ResizeObserver` (`scale = min(1, width/1000)`).
Both the width/height and the `transform: scale()` are set inline — a stale fixed height in the CSS
caused a layout bug once already.

**Geometry.**

```
TABLE_CX, TABLE_CY = 500, 296        felt: left 90, top 96, 820×400
SEAT_RX, SEAT_RY   = 412, 236        seat i: θ = 90 + i*(360/n) degrees
DECK               = (500, 150)      where new cards are born
towardCenter(p, distance, sideways)  // sideways moves along the perpendicular
```

- Seat cards: anchored `towardCenter(seat, 96 hero / 98 other)`, laid in a row whose step shrinks as
  the hand grows (`cardStep`) so a 13-card Chinese Poker hand still fits.
- Seat plate: `point.y + (below ? 30 : -96)`, clamped to ≥ 4. If the clamp fires the seat gets
  `.say-below` and its action bubble flips underneath.
- Chips: `towardCenter(seat, cardForward + 28, rowHalf + 58)` — past that seat's own card row toward
  the pot, offset sideways. Scales automatically from a 2-card to a 13-card hand.
- Board: `TABLE_CY - 62`, multiple boards stacked 100px apart.
- Pot: absolutely positioned at `top: 286px`.

**Dealing.** The trick: a newly mounted card has no previous transform, so a transition can't
animate it. `PokerTable` keeps `known: Set<cardId>` in a ref. Cards not in the set render **at the
deck position**, and a `requestAnimationFrame` then adds them to the set and forces a re-render — so
the second frame carries them to their seat with a CSS transition. Per-card `transitionDelay` is
stored in a separate `delays` ref map (deriving it from the current "fresh" list breaks, because
that list is empty by the time the delay is needed). A cleanup effect drops ids that leave the
table, so a discarded card can be dealt again later.

**Flipping.** `.pcard .inner` is a `preserve-3d` container; `.pcard.up .inner` gets
`rotateY(180deg)`. Face and back are `backface-visibility: hidden`.

**Chips.** `Stack` renders N absolutely-positioned discs, offset by `size*0.22` upward (stacked) or
`size*0.46` sideways (`row` — used in seat plates, because a vertical stack at 14px reads as a
smudge). Colours follow casino denominations via CSS custom properties: white 1s, red 5s, green 25s,
slate-grey 100s (lifted off pure black so they're visible on the dark plates).

`chipBreakdown()` in `engine/chips.ts` is the single source of truth for pots, wagers and player
stacks. It greedily decomposes every integer amount into exact standard casino denominations:
black $100, green $25, red $5 and white $1. A 132 pot therefore renders one black, one green, one
red and two white chips — exactly 132. Each denomination is split into stacks of at most five so
large amounts remain readable, and the top chip carries its printed value. The numeric label,
disc count and colours must always reconcile.

Bets animate in with a `chip-slide` keyframe driven by `--fx` / `--fy` custom properties (the delta
from the owner's seat), and the wager div is keyed on `${seatIndex}-${wager}` so every fresh bet
remounts and replays the slide. The travel lasts 0.9s so the chip movement is readable.

Practice actions use explicit engine frames rather than jumping directly to the resolved state:
forced bets → deal → each bot action → hero handoff → wager collection → next street → showdown
reveal → award. Each frame holds for 1.05s. Folded and discarded cards remain in the render state as
invisible muck cards long enough for their transform/opacity transition to carry them toward the
deck. Pot changes, stack changes, street captions, action bubbles and winner awards each have their
own 0.5–0.8s entrance animation.

`prefers-reduced-motion` collapses all of it to 0.01ms.

---

## 9. The practice engine (`src/engine/game.ts`)

Serves the community, stud and draw families — 22 of the 39 variants.

```ts
newGame(variant, seatCount, seed) → Game
legalActions(game) → ("fold"|"check"|"call"|"raise")[]
heroActs(game, action) → Game        // returns a clone; never mutates
```

`Game` holds deck, players, board, pot, `streetIndex` (into `variant.streets`), `phase`
(`betting | draw | showdown | done`), `toAct`, `betToMatch`, `raiseCount`, an `acted` set, a log and
a settlement.

**Flow.** `enterStreet` deals whatever the street declares, then either opens betting or advances.
`runBots` loops until the hero must act or the round closes. `closeRound` collects wagers and moves
to the next street. The engine remains synchronous for callers, while `newGameFrames` and
`heroActionFrames` optionally capture immutable intermediate states for the practice UI to play in
sequence.

**Betting model.** Deliberately **fixed-size for every variant** — `SMALL_BET 4`, `BIG_BET 8`
(streets with `bigBet` use the big bet), max 4 raises per street. One legal model across all
families beats four half-correct ones, and stacks start at 500 so all-ins never arise. This is
stated in the UI: *"Fixed-size betting, simple bots — this is a rules trainer, not a solver."*

**Action order.** Community/draw: seat 2 first preflop (after the blinds), seat 0 afterwards. Stud:
computed from exposed cards — lowest upcard brings in on the opening street (highest for Razz, via
the `lo === "a5-any"` check), best board acts first afterwards.

**Bots.** `strengthOf()` runs the variant's own evaluator on the player's current cards and maps the
category to 0–1; `botAction()` folds/calls/raises off that plus RNG noise. Draw decisions reuse the
same keep-heuristics as the tutorial.

**Settlement.** `settle()` evaluates every live hand for hi and lo, finds winners (ties supported),
splits the pot when both halves qualify, and writes a `Settlement` plus a summary sentence. The
hero's summary is second person ("You win"); bots are third ("Dana wins"). A `phrase()` helper
handles the same conjugation in the hand log by dropping the trailing "s" from the verb.

---

## 10. Drills (`src/engine/drills.ts`)

`generateDrills(variant, seed)` returns up to 8 shuffled questions from five sources:

1. **Structure recall** — card count, "how many of your own cards must play", pot type, forced bets,
   betting structure. All read off the `Variant`, so all correct by construction.
2. **Real showdowns** — deals two hands (plus a board for community games) from the variant's own
   deck, evaluates both with the variant's own ranking and selection rules, and asks which wins.
   The explanation quotes both hand labels.
3. **Low qualification** — 8-or-better games only.
4. **Hand reading** — five random cards, "what is this hand", distractors drawn from the other
   categories.
5. **Hand-written** — `variant.quiz`, appended.

Because they're generated, "New set of drills" re-rolls with a fresh seed and never repeats.

---

## 11. UI layer

**Routing** is `window.location.hash` (`#/texas-holdem`) with a `hashchange` listener in `App.tsx`.
No router dependency, deep links work, no server rewrite rules needed for static hosting.

**`Dashboard.tsx`** — filter facets are generated from the label maps in `data/index.ts` via a
generic `Facet<T>` component, with live counts computed against the whole catalog. `applyFilters`
is AND across facets, OR within a facet. `sortVariants("recommended")` weights popularity plus a
family weight, so the house games and kitchen-table curiosities sit behind the real games.

**`VariantPage.tsx`** — three tabs (Animated tutorial / Practice / Reference), each tutorial and
practice tab wrapped in an `ErrorBoundary` so one bad script can't blank the app.

**`Practice.tsx`** — orders *Play a hand* before *Drills* and selects live play by default for
playable variants. Custom/non-street games keep the play control disabled and default to drills.

**`TutorialPlayer.tsx`** — holds only `index` and `playing`. Autoplay uses each step's `hold`
(4–7s). State is derived, never stored.

**CSS** (`styles/global.css`) is one file with a token block at the top (`--felt-0`, `--gold`,
`--jade`, `--radius`, `--font-display`…). Dark only. Breakpoints at 1080px (tutorial goes
single-column) and 860px (dashboard filter rail unsticks). Page max-width is 1440px, which is
exactly wide enough that the 1000px stage renders 1:1 next to the 360px narration column.

---

## 12. Catalog (39 variants)

**Community (14)** — texas-holdem, short-deck, omaha, omaha-hi-lo, big-o, plo5, plo6, courchevel,
pineapple, crazy-pineapple, lazy-pineapple, irish, royal-holdem, double-board-plo

**Stud (4)** — seven-card-stud, stud-hi-lo, razz, five-card-stud

**Draw (7)** — five-card-draw, deuce-seven-triple-draw, deuce-seven-single-draw,
ace-five-triple-draw, badugi, badacey, badeucey

**Home (8)** — baseball, follow-the-queen, seven-twenty-seven, anaconda, guts, indian-poker,
chinese-poker, open-face-chinese

**Mixed (2)** — horse, eight-game

**House (4)** — three-card-poker, ultimate-texas-holdem, caribbean-stud, let-it-ride

22 are `playable`. 11 carry a `customTutorial`: anaconda, guts, indian-poker, chinese-poker,
open-face-chinese, horse, eight-game, three-card-poker, ultimate-texas-holdem, caribbean-stud,
let-it-ride.

---

## 13. Tests (`src/engine/engine.test.ts`, 23 tests)

The valuable ones are the sweeps:

- **tutorials** — builds a script for all 39 variants and replays *every step* of each, asserting no
  throw and no duplicate card ids on the table.
- **drills** — generates for all 39 across 3 seeds, asserting every question has a correct answer.
- **practice engine** — auto-plays **12 randomized hands of every playable variant** (264 hands),
  choosing hero actions at random from the legal set, asserting each terminates in `phase: "done"`
  with a settlement. Plus a no-duplicate-card check.
- **practice animation frames** — verifies a fresh hand separates forced bets, dealing, bot actions
  and the hero handoff; verifies a raise is visible before responses; and verifies collection,
  showdown reveal and award occur as distinct frames.
- **chip denominations** — exhaustively verifies every amount from 0 through 2,500 reconstructs
  exactly from its displayed denomination groups, plus a fixed mixed-colour assertion for 132.

A malformed street definition surfaces here rather than as a blank screen. Run `npm test` after any
catalog edit.

---

## 14. Deliberate limitations

- Bots are hand-strength heuristics, not solvers. Betting is fixed-size everywhere.
- Short Deck implements flush-beats-full-house. Some rooms also rank trips above a straight; the
  tutorial text mentions it, the evaluator uses the common ruleset.
- **Badacey / Badeucey** split between a badugi hand and a lowball hand. The engine models one low
  ranking per pot, so their tutorials score one half and say so via `showdownCaveat`. Fixing this
  properly means a second low ranking slot on `Variant` and in `judge()`/`settle()`.
- Double Board PLO renders two boards but isn't `playable`.
- Home-game rules genuinely vary; where they do (Baseball's face-up-three penalty, Anaconda's pass
  direction) the copy says to settle it before the deal rather than asserting one answer.
- The award is staged with a reveal frame, winner bubble and stack pulse, but the pot chips do not
  physically travel across the felt to the winning seat.

---

## 15. Gotchas that cost real time

- **Vite HMR serves stale modules.** Twice, a `ReferenceError` named a variable that plainly existed
  in the source and passed `tsc`. Hard-reload the page before debugging further.
- **Bash `cd X && cmd` does not persist.** Running `npx vitest` from `REPOS/` executes every
  project's tests in the whole repo. Always `cd /Users/derrickfox/Desktop/REPOS/poker-atlas && …`.
- **`.cardstrip` was scoped `.quiz .cardstrip`,** so in the practice action bar it was `display:
  block` and the hand stacked vertically. Watch for over-scoped selectors when reusing markup.
- **Absolutely positioned + `left: 50%` caps shrink-to-fit width at half the container.** Action
  bubbles truncated to "stands" instead of "stands pat". Fixed with `min-width: max-content`.
- **`.stage` had a hard-coded CSS height** that silently overrode the `STAGE_H` constant. Both width
  and height are now set inline from the constants.
- **`transitionDelay` derived from the current "fresh card" list evaluates to 0** on the frame that
  matters. It must be stored per-card in a ref.
- The preview tool reads `.claude/launch.json` from the **primary working directory**
  (`REPOS/`), not from the project folder.

---

## 16. Common tasks

**Add a variant** — append a `Variant` to the matching `src/data/variants.*.ts`. Use
`communityStreets` / `studStreets` / `drawStreets` for the street list. Run `npm test`. Nothing else
needs touching: dashboard, filters, tutorial, drills and (if `playable`) the practice table all
pick it up.

**Add a game that doesn't fit streets** — set `streets: []`, `playable: false`, and write a
`customTutorial: TutorialStep[]` using the `Action` vocabulary in §6.

**Add a ranking system** — add the scorer to `evaluator.ts`, extend `HiRankingId`/`LoRankingId`, and
wire it into `bestHi`/`bestLo`. Do not add ranking logic anywhere else; `tutorial.ts`, `game.ts` and
`drills.ts` all call through those two functions.

**Change table visuals** — geometry constants are at the top of `PokerTable.tsx`; everything else is
in `global.css`. The reducer and the script format don't need to know.

**Change betting sizes** — tutorial: `BET_SIZES` in `tutorial.ts`. Practice: `SMALL_BET` / `BIG_BET`
/ `MAX_RAISES` in `game.ts`.
