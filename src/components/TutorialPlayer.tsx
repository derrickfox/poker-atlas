// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Plays a tutorial script — replays the table state up to the current step, renders the
//          narration, and offers step / autoplay / jump controls.
// Reason: Replaying from step zero on every change keeps the player stateless and makes the step
//         rail's random access work without any special-case rewind logic.

import { useEffect, useMemo, useState } from "react";
import type { Variant } from "../types";
import { buildTutorial } from "../engine/tutorial";
import { stateAtStep } from "../engine/table";
import { PokerTable } from "./PokerTable";
import { RichText } from "./RichText";

export function TutorialPlayer({ variant, onPractice }: { variant: Variant; onPractice: () => void }) {
  const steps = useMemo(() => buildTutorial(variant), [variant]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [variant.id]);

  useEffect(() => {
    if (!playing) return;
    if (index >= steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setIndex((i) => Math.min(i + 1, steps.length - 1)), steps[index]?.hold ?? 5000);
    return () => clearTimeout(timer);
  }, [playing, index, steps]);

  const state = useMemo(
    () => stateAtStep(steps, index, Math.max(1, variant.boards)),
    [steps, index, variant.boards],
  );
  const step = steps[index];
  const atEnd = index === steps.length - 1;

  return (
    <div className="tut">
      <div>
        <PokerTable state={state} feltMark={variant.name} />
      </div>

      <div className="tut-side">
        <div className="narration">
          <div className="eyebrow">
            Step {index + 1} of {steps.length}
          </div>
          <h2>{step.title}</h2>
          <RichText text={step.text} />
          {step.tip ? <div className="tipbox">{step.tip}</div> : null}
          <div className="progress">
            <span style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        <div className="controls">
          <button className="btn" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
            ← Back
          </button>
          <button
            className="btn primary"
            onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
            disabled={atEnd}
          >
            Next →
          </button>
          <button className="btn" onClick={() => setPlaying((p) => !p)} disabled={atEnd}>
            {playing ? "Pause" : "Autoplay"}
          </button>
          <button
            className="btn"
            onClick={() => {
              setIndex(0);
              setPlaying(false);
            }}
          >
            Restart
          </button>
          {atEnd ? (
            <button className="btn primary" onClick={onPractice}>
              Practise this →
            </button>
          ) : null}
        </div>

        <div className="steprail">
          {steps.map((entry, i) => (
            <button
              key={entry.id + i}
              aria-current={i === index}
              onClick={() => {
                setIndex(i);
                setPlaying(false);
              }}
            >
              <span className="num">{i + 1}</span>
              {entry.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
