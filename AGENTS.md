# AI Collaboration and Change History

This project may be edited by several AI tools over time. To help future AI tools and human developers understand the history and intent of the codebase, every meaningful code change should be documented.

For meaningful changes, add a nearby `AI_CHANGE` comment explaining who/what made the change, when it was made, what the code does, and why the change was needed. Update the timestamp and details for the specific change being made.

Preferred comment format:

```js
// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-05-21T15:10:51-04:00
// Purpose: Adds filtering logic so selected guitar chord patterns update the fretboard display.
// Reason: This connects the pattern selector state to the visual neck renderer and helps future agents understand the data flow.
```

## Project-specific notes

**Read [HANDOFF.md](HANDOFF.md) first.** It is the full technical description of this codebase:
architecture, data model, the tutorial script/reducer pipeline, the animation mechanics, the
practice engine, known limitations, and the gotchas that have already cost time.

- **Adding a poker variant is a data change, not a code change.** Append a `Variant` object to the
  matching file in `src/data/variants.*.ts` and it appears in the dashboard, gets an animated
  tutorial and gets drills automatically. Only reach for new code when a game's structure cannot be
  expressed as a list of streets.
- **The street builders in `src/data/streets.ts`** (`communityStreets`, `studStreets`, `drawStreets`)
  cover the community, stud and draw families. Games that do not fit carry a hand-written
  `customTutorial`; leave `playable: false` unless an isolated `practiceMode` engine is registered.
- **`src/engine/engine.test.ts` builds and replays every tutorial and auto-plays every playable
  variant.** Run `npm test` after touching the catalog; a malformed street definition shows up there
  rather than as a blank screen in the browser.
- **Hand evaluation lives only in `src/engine/evaluator.ts`.** Five ranking systems share it: standard
  high, short-deck high, ace-to-five low, deuce-to-seven low and Badugi. Do not add a sixth ranking
  path anywhere else.
