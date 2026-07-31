// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-31T12:00:00-04:00
// Purpose: Interactive Let It Ride practice with two visibly paced withdrawal decisions.
// Reason: Learners need to see each wager return and each community card arrive before deciding
//         again, instead of having the whole casino round resolve as an instant state change.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Variant } from "../types";
import {
  LET_IT_RIDE_BET,
  type LetItRideAction,
  type LetItRideGame,
  letItRideActionFrames,
  letItRideToTable,
  newLetItRideFrames,
  newLetItRideGame,
} from "../engine/letItRide";
import { PokerTable } from "./PokerTable";

const ACTION_HOLD_MS = 1050;

export function LetItRidePractice({ variant }: { variant: Variant }) {
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const [openingFrames] = useState(() => newLetItRideFrames(seed));
  const [game, setGame] = useState<LetItRideGame>(
    () => openingFrames[0] ?? newLetItRideGame(seed),
  );
  const [animating, setAnimating] = useState(openingFrames.length > 1);
  const [tally, setTally] = useState({ hands: 0, net: 0 });
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const playFrames = useCallback((
    frames: LetItRideGame[],
    onFinish?: (final: LetItRideGame) => void,
  ) => {
    const final = frames[frames.length - 1];
    if (!final) return;
    clearTimers();
    setAnimating(frames.length > 1);
    setGame(frames[0]);

    const finish = () => {
      onFinish?.(final);
      setAnimating(false);
      timers.current = [];
    };

    if (frames.length === 1) {
      finish();
      return;
    }

    frames.slice(1).forEach((frame, index) => {
      const finalFrame = index === frames.length - 2;
      timers.current.push(window.setTimeout(() => {
        setGame(frame);
        if (finalFrame) finish();
      }, ACTION_HOLD_MS * (index + 1)));
    });
  }, [clearTimers]);

  useEffect(() => {
    playFrames(openingFrames);
  }, [openingFrames, playFrames]);

  const deal = useCallback(() => {
    playFrames(newLetItRideFrames(Math.floor(Math.random() * 1e9)));
  }, [playFrames]);

  const act = (action: LetItRideAction) => {
    if (animating) return;
    playFrames(letItRideActionFrames(game, action), (final) => {
      if (!final.outcome) return;
      setTally((current) => ({
        hands: current.hands + 1,
        net: current.net + final.outcome!.net,
      }));
    });
  };

  const table = useMemo(() => letItRideToTable(game), [game]);
  const firstDecision = game.stage === "first-decision";
  const secondDecision = game.stage === "second-decision";

  return (
    <div className="practice" data-animating={animating ? "true" : "false"}>
      <PokerTable state={table} feltMark={variant.name} />

      <div className="playbar">
        {animating ? (
          <span style={{ flex: 1 }}>Watch the wager and the next card move before deciding…</span>
        ) : firstDecision || secondDecision ? (
          <>
            <span className="striplabel" style={{ flex: 1 }}>
              {firstDecision
                ? "First decision — you know only your three cards:"
                : "Second decision — you now know four of your five cards:"}
            </span>
            <button className="btn" onClick={() => act("pull")}>
              Pull back {LET_IT_RIDE_BET}
            </button>
            <button className="btn primary" onClick={() => act("ride")}>
              Let it ride
            </button>
          </>
        ) : game.stage === "done" ? (
          <>
            <span style={{ flex: 1 }}>{game.outcome?.summary}</span>
            <button className="btn primary" onClick={deal}>Deal next hand</button>
          </>
        ) : (
          <span style={{ flex: 1 }}>The final community card is being revealed…</span>
        )}
      </div>

      <div className="scoreline">
        <span>{tally.hands} hand{tally.hands === 1 ? "" : "s"} played</span>
        <span style={{ color: tally.net >= 0 ? "var(--jade)" : "var(--rose)" }}>
          {tally.net >= 0 ? "+" : ""}{tally.net} chips
        </span>
        <span>· Standard three-bet paytable · optional bonus bets are excluded.</span>
      </div>

      <div className="log">
        {game.log.slice(-12).map((line, index) => (
          <div
            key={`${index}-${line}`}
            className={index === game.log.slice(-12).length - 1 ? "highlight" : ""}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
