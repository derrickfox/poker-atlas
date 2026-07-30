// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: A single variant's page — header, tab strip, animated tutorial, practice, and a reference
//          tab with the spec table, key ideas, common mistakes and first strategy footholds.
// Reason: Keeping tutorial and practice behind one header means the rules context stays on screen
//         while a learner moves between watching and doing.

import { useEffect, useState } from "react";
import type { Variant } from "../types";
import {
  BETTING_LABEL,
  DIFFICULTY_LABEL,
  FAMILY_LABEL,
  POPULARITY_LABEL,
  POT_TYPE_LABEL,
  VENUE_LABEL,
} from "../data";
import { TutorialPlayer } from "./TutorialPlayer";
import { Practice } from "./Practice";
import { ErrorBoundary } from "./ErrorBoundary";

type Tab = "tutorial" | "practice" | "reference";

function Spec({ variant }: { variant: Variant }) {
  const rows: [string, string][] = [
    ["Family", FAMILY_LABEL[variant.family]],
    ["Deck", variant.deck === 52 ? "Standard 52" : variant.deck === 36 ? "36 cards (6 to A)" : "20 cards (10 to A)"],
    ...(variant.holeCards
      ? ([["Cards per player", String(variant.holeCards)]] as [string, string][])
      : []),
    ...(variant.selection.useHole != null
      ? ([
          [
            "Cards that must play",
            `Exactly ${variant.selection.useHole} of yours + ${variant.selection.useBoard} from the board`,
          ],
        ] as [string, string][])
      : []),
    ["Pot", POT_TYPE_LABEL[variant.potType]],
    ["Betting", variant.betting.map((key) => BETTING_LABEL[key]).join(", ")],
    [
      "Forced bets",
      variant.forced === "blinds" || variant.forced === "blinds-ante"
        ? "Blinds"
        : variant.forced === "house-wager"
          ? "Ante against the house"
          : variant.forced === "antes-bringin"
            ? "Antes plus a bring-in"
            : "Antes",
    ],
    ["Players", `${variant.players.min}–${variant.players.max}`],
    ["Difficulty", DIFFICULTY_LABEL[variant.difficulty]],
    ["How common", POPULARITY_LABEL[variant.popularity]],
    ["Played at", variant.venues.map((key) => VENUE_LABEL[key]).join(", ")],
    ["Time to learn", `About ${variant.learnMinutes} minutes`],
    ...(variant.origin ? ([["Origin", variant.origin]] as [string, string][]) : []),
  ];

  return (
    <div className="panel">
      <h3>At a glance</h3>
      <dl className="speclist">
        {rows.map(([label, value]) => (
          <div className="specrow" key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function VariantPage({ variant, onBack }: { variant: Variant; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("tutorial");

  useEffect(() => {
    setTab("tutorial");
    window.scrollTo({ top: 0 });
  }, [variant.id]);

  return (
    <>
      <button className="back-link" onClick={onBack}>
        ← All poker types
      </button>

      <div className="vhead">
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1>{variant.name}</h1>
          <p>{variant.tagline}</p>
        </div>
      </div>

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "tutorial"} onClick={() => setTab("tutorial")}>
          Animated tutorial
        </button>
        <button role="tab" aria-selected={tab === "practice"} onClick={() => setTab("practice")}>
          Practice
        </button>
        <button role="tab" aria-selected={tab === "reference"} onClick={() => setTab("reference")}>
          Reference
        </button>
      </div>

      {tab === "tutorial" ? (
        <ErrorBoundary label={`The ${variant.name} tutorial`}>
          <TutorialPlayer variant={variant} onPractice={() => setTab("practice")} />
        </ErrorBoundary>
      ) : null}

      {tab === "practice" ? (
        <ErrorBoundary label={`${variant.name} practice`}>
          <Practice variant={variant} />
        </ErrorBoundary>
      ) : null}

      {tab === "reference" ? (
        <div className="ref-grid">
          <Spec variant={variant} />
          <div className="panel">
            <h3>What you must know</h3>
            <ul>
              {variant.keyIdeas.map((idea) => (
                <li key={idea}>{idea}</li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3>Common beginner mistakes</h3>
            <ul>
              {variant.mistakes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h3>First strategy footholds</h3>
            <ul>
              {variant.strategy.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel" style={{ gridColumn: "1 / -1" }}>
            <h3>How the hand runs</h3>
            {variant.streets.length ? (
              <ol style={{ margin: 0, paddingLeft: 20, color: "var(--ink-dim)", fontSize: 14 }}>
                {variant.streets.map((street) => (
                  <li key={street.id} style={{ marginBottom: 8 }}>
                    <strong style={{ color: "var(--ink)" }}>{street.name}</strong> — {street.note}
                  </li>
                ))}
              </ol>
            ) : (
              <p style={{ color: "var(--ink-dim)", margin: 0 }}>
                {variant.name} does not run on standard betting streets — the animated tutorial walks
                through its structure step by step.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
