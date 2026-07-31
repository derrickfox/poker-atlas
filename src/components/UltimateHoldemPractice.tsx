// AI_CHANGE:
// Tool: Codex
// Model: GPT-5
// Timestamp: 2026-07-31T13:00:00-04:00
// Purpose: Interactive Ultimate Texas Hold'em practice across all three legal betting windows.
// Reason: The shrinking 4×/3×, 2× and 1× choices are the game's central lesson and must be shown
//         as paced chip commitments followed by the exact board information that choice buys.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Variant } from "../types";
import {
  ULTIMATE_ANTE,
  type UltimateHoldemAction,
  type UltimateHoldemGame,
  newUltimateHoldemFrames,
  newUltimateHoldemGame,
  ultimateHoldemActionFrames,
  ultimateHoldemToTable,
} from "../engine/ultimateHoldem";
import { PokerTable } from "./PokerTable";

const ACTION_HOLD_MS = 1050;

export function UltimateHoldemPractice({ variant }: { variant: Variant }) {
  const [seed] = useState(() => Math.floor(Math.random() * 1e9));
  const [openingFrames] = useState(() => newUltimateHoldemFrames(seed));
  const [game, setGame] = useState<UltimateHoldemGame>(
    () => openingFrames[0] ?? newUltimateHoldemGame(seed),
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
    frames: UltimateHoldemGame[],
    onFinish?: (final: UltimateHoldemGame) => void,
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
    playFrames(newUltimateHoldemFrames(Math.floor(Math.random() * 1e9)));
  }, [playFrames]);

  const act = (action: UltimateHoldemAction) => {
    if (animating) return;
    playFrames(ultimateHoldemActionFrames(game, action), (final) => {
      if (!final.outcome) return;
      setTally((current) => ({
        hands: current.hands + 1,
        net: current.net + final.outcome!.net,
      }));
    });
  };

  const table = useMemo(() => ultimateHoldemToTable(game), [game]);

  return (
    <div className="practice" data-animating={animating ? "true" : "false"}>
      <PokerTable state={table} feltMark={variant.name} />

      <div className="playbar">
        {animating ? (
          <span style={{ flex: 1 }}>Watch each wager, board reveal and dealer reveal in order…</span>
        ) : game.stage === "preflop" ? (
          <>
            <span className="striplabel" style={{ flex: 1 }}>Preflop — only your two cards are known:</span>
            <button className="btn" onClick={() => act("check")}>Check</button>
            <button className="btn" onClick={() => act("bet-3x")}>Play 3× ({ULTIMATE_ANTE * 3})</button>
            <button className="btn primary" onClick={() => act("bet-4x")}>Play 4× ({ULTIMATE_ANTE * 4})</button>
          </>
        ) : game.stage === "flop" && game.playBet === 0 ? (
          <>
            <span className="striplabel" style={{ flex: 1 }}>After the flop — this is the only 2× window:</span>
            <button className="btn" onClick={() => act("check")}>Check</button>
            <button className="btn primary" onClick={() => act("bet-2x")}>Play 2× ({ULTIMATE_ANTE * 2})</button>
          </>
        ) : game.stage === "river" && game.playBet === 0 ? (
          <>
            <span className="striplabel" style={{ flex: 1 }}>Final decision — make the 1× Play wager or fold:</span>
            <button className="btn" onClick={() => act("fold")}>Fold</button>
            <button className="btn primary" onClick={() => act("bet-1x")}>Play 1× ({ULTIMATE_ANTE})</button>
          </>
        ) : game.stage === "done" ? (
          <>
            <span style={{ flex: 1 }}>{game.outcome?.summary}</span>
            <button className="btn primary" onClick={deal}>Deal next hand</button>
          </>
        ) : (
          <span style={{ flex: 1 }}>The dealer is completing the hand…</span>
        )}
      </div>

      <div className="scoreline">
        <span>{tally.hands} hand{tally.hands === 1 ? "" : "s"} played</span>
        <span style={{ color: tally.net >= 0 ? "var(--jade)" : "var(--rose)" }}>
          {tally.net >= 0 ? "+" : ""}{tally.net} chips
        </span>
        <span>· Standard Ante, Blind and Play rules · optional side bets are excluded.</span>
      </div>

      <div className="log">
        {game.log.slice(-14).map((line, index) => (
          <div
            key={`${index}-${line}`}
            className={index === game.log.slice(-14).length - 1 ? "highlight" : ""}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
