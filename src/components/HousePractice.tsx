// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-31T10:15:00-04:00
// Purpose: Interactive practice surface for isolated dealer-banked poker rules engines.
// Reason: House games need their own decisions and payouts while retaining the same animated table,
//         card emphasis, chip accuracy and pacing learners already see in peer-poker practice.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Variant } from "../types";
import {
  type HouseAction,
  type HouseGame,
  houseActionFrames,
  houseGameToTable,
  isHousePracticeId,
  newHouseGame,
  newHouseGameFrames,
} from "../engine/house";
import { PokerTable } from "./PokerTable";

const ACTION_HOLD_MS = 1050;

export function HousePractice({ variant }: { variant: Variant }) {
  if (!isHousePracticeId(variant.id)) {
    throw new Error(`${variant.name} has no dealer-game practice engine`);
  }
  const gameId = variant.id;

  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const [openingFrames] = useState(() => newHouseGameFrames(gameId, seed));
  const [game, setGame] = useState<HouseGame>(
    () => openingFrames[0] ?? newHouseGame(gameId, seed),
  );
  const [animating, setAnimating] = useState(openingFrames.length > 1);
  const [tally, setTally] = useState({ hands: 0, net: 0 });
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const playFrames = useCallback((frames: HouseGame[], onFinish?: (final: HouseGame) => void) => {
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
    playFrames(newHouseGameFrames(gameId, Math.floor(Math.random() * 1e9)));
  }, [gameId, playFrames]);

  const act = (action: HouseAction) => {
    if (animating) return;
    const frames = houseActionFrames(game, action);
    playFrames(frames, (final) => {
      if (!final.outcome) return;
      setTally((current) => ({
        hands: current.hands + 1,
        net: current.net + final.outcome!.net,
      }));
    });
  };

  const table = useMemo(() => houseGameToTable(game), [game]);

  return (
    <div className="practice" data-animating={animating ? "true" : "false"}>
      <PokerTable state={table} feltMark={variant.name} />

      <div className="playbar">
        {animating ? (
          <span style={{ flex: 1 }}>Watch the dealer complete each step…</span>
        ) : game.stage === "decision" ? (
          <>
            <span className="striplabel" style={{ flex: 1 }}>
              Your only decision this hand:
            </span>
            <button className="btn" onClick={() => act("fold")}>Fold</button>
            <button className="btn primary" onClick={() => act("play")}>
              {game.id === "caribbean-stud" ? `Raise ${game.playBet}` : `Play ${game.playBet}`}
            </button>
          </>
        ) : game.stage === "done" ? (
          <>
            <span style={{ flex: 1 }}>{game.outcome?.summary}</span>
            <button className="btn primary" onClick={deal}>Deal next hand</button>
          </>
        ) : (
          <span style={{ flex: 1 }}>The dealer is revealing the hand…</span>
        )}
      </div>

      <div className="scoreline">
        <span>{tally.hands} hand{tally.hands === 1 ? "" : "s"} played</span>
        <span style={{ color: tally.net >= 0 ? "var(--jade)" : "var(--rose)" }}>
          {tally.net >= 0 ? "+" : ""}{tally.net} chips
        </span>
        <span>· Standard Ante/Play rules · optional side bets are excluded.</span>
      </div>

      <div className="log">
        {game.log.slice(-12).map((line, index) => (
          <div key={`${index}-${line}`} className={index === game.log.slice(-12).length - 1 ? "highlight" : ""}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
