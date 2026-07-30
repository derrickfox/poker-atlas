// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: The practice screen — generated drills with instant feedback, plus a playable hand
//          against heuristic bots rendered on the same animated table as the tutorial.
// Reason: Reusing PokerTable for live play means practice looks identical to what the tutorial just
//         taught, which is the whole point of putting them behind one tab strip.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QuizQuestion, TableCard, TableState, Variant } from "../types";
import { RANK_LABEL, SUIT_GLYPH, parseCard } from "../engine/cards";
import { generateDrills } from "../engine/drills";
import {
  type Game,
  type HeroAction,
  betSizeFor,
  heroActionFrames,
  legalActions,
  newGame,
  newGameFrames,
} from "../engine/game";
import { PokerTable } from "./PokerTable";

/* -------------------------------------------------------------------- minicards */

function MiniCard({
  code,
  selected,
  onClick,
}: {
  code: string;
  selected?: boolean;
  onClick?: () => void;
}) {
  const card = parseCard(code);
  const red = card.suit === "h" || card.suit === "d";
  return (
    <button
      type="button"
      className={`minicard${red ? " red" : ""}`}
      onClick={onClick}
      disabled={!onClick}
      style={
        onClick
          ? {
              cursor: "pointer",
              transform: selected ? "translateY(-10px)" : undefined,
              outline: selected ? "2px solid var(--rose)" : "none",
              transition: "0.15s",
            }
          : undefined
      }
    >
      <span>{RANK_LABEL[card.rank]}</span>
      <span className="big">{SUIT_GLYPH[card.suit]}</span>
    </button>
  );
}

function Strip({ label, cards }: { label: string; cards: string[] }) {
  return (
    <div className="cardstrip">
      <span className="striplabel">{label}</span>
      {cards.map((code) => (
        <MiniCard key={code} code={code} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------------ drills */

function Drills({ variant }: { variant: Variant }) {
  const [round, setRound] = useState(0);
  const questions = useMemo(
    () => generateDrills(variant, 9001 + round * 7919),
    [variant, round],
  );
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState({ right: 0, total: 0 });

  const question: QuizQuestion | undefined = questions[index];
  const finished = index >= questions.length;

  const answer = (choice: number) => {
    if (picked != null || !question) return;
    setPicked(choice);
    setScore((s) => ({
      right: s.right + (question.choices[choice].correct ? 1 : 0),
      total: s.total + 1,
    }));
  };

  const next = () => {
    setPicked(null);
    setIndex((i) => i + 1);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setScore({ right: 0, total: 0 });
  };

  if (finished) {
    return (
      <div className="quiz">
        <div className="qnum">Drill complete</div>
        <p className="prompt">
          You scored {score.right} out of {score.total}.
        </p>
        <p style={{ color: "var(--ink-dim)" }}>
          {score.right === score.total
            ? "Perfect. Try a hand against the bots."
            : "Run it again — the hands and boards are freshly dealt every round."}
        </p>
        <div className="controls" style={{ marginTop: 14 }}>
          <button className="btn primary" onClick={restart}>
            New set of drills
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;
  const strips = question.strips ?? (question.showCards
    ? [{ label: question.showLabel ?? "Cards", cards: question.showCards }]
    : []);

  return (
    <div className="quiz">
      <div className="qnum">
        Question {index + 1} of {questions.length}
      </div>
      <div className="prompt">{question.prompt}</div>

      {strips.map((strip) => (
        <Strip key={strip.label} label={strip.label} cards={strip.cards} />
      ))}

      <div className="choices">
        {question.choices.map((choice, i) => {
          const revealed = picked != null;
          const cls = !revealed
            ? ""
            : choice.correct
              ? " right"
              : i === picked
                ? " wrong"
                : "";
          return (
            <button
              key={choice.text}
              className={`choice${cls}`}
              onClick={() => answer(i)}
              disabled={revealed}
            >
              {choice.text}
            </button>
          );
        })}
      </div>

      {picked != null ? (
        <>
          <div className="explain">{question.explain}</div>
          <div className="controls" style={{ marginTop: 14 }}>
            <button className="btn primary" onClick={next}>
              {index === questions.length - 1 ? "See score" : "Next question"}
            </button>
            <span className="scoreline">
              {score.right}/{score.total} correct
            </span>
          </div>
        </>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------- live hand */

function gameToTable(game: Game): TableState {
  const showAll = game.phase === "showdown" || game.phase === "done";
  const cards: TableCard[] = [];
  // The engine posts blinds from seats 0 and 1, so mark them the same way the tutorial does.
  const blinds = game.variant.forced === "blinds" || game.variant.forced === "blinds-ante";

  game.players.forEach((player) => {
    player.cards.forEach((card, slot) => {
      cards.push({
        id: card.id,
        rank: card.rank,
        suit: card.suit,
        home: player.folded
          ? { where: "muck" }
          : { where: "seat", seat: player.index, slot },
        faceUp: player.isHero || player.faceUp[slot] || showAll,
        emphasis: player.folded ? "dim" : "none",
      });
    });
  });

  game.mucked.forEach(({ card, seat }) => {
    cards.push({
      id: card.id,
      rank: card.rank,
      suit: card.suit,
      home: { where: "discard", seat, slot: 0 },
      faceUp: false,
      emphasis: "dim",
    });
  });

  game.board.forEach((card, slot) => {
    cards.push({
      id: card.id,
      rank: card.rank,
      suit: card.suit,
      home: { where: "board", board: 0, slot },
      faceUp: true,
      emphasis: "none",
    });
  });

  return {
    boards: 1,
    // Chips still in front of players are drawn at their seats, so the pot shows only what has
    // actually been swept in — the same way a real table looks mid-street.
    pot: game.pot,
    buttonSeat: game.variant.forced === "blinds" ? game.players.length - 1 : null,
    caption: game.variant.streets[game.streetIndex]?.name,
    seats: game.players.map((player) => ({
      index: player.index,
      name: player.name,
      stack: player.stack,
      wager: player.wager,
      folded: player.folded,
      isHero: player.isHero,
      say: player.lastAction,
      active: game.toAct === player.index,
      badge: blinds && player.index < 2 ? (player.index === 0 ? "SB" : "BB") : undefined,
      won: game.settlement?.awards.find((award) => award.index === player.index)?.amount,
    })),
    cards,
  };
}

const ACTION_HOLD_MS = 1050;

function PlayHand({ variant }: { variant: Variant }) {
  const seatCount = Math.min(4, Math.max(2, variant.players.typical));
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const [openingFrames] = useState(() => newGameFrames(variant, seatCount, seed));
  const [game, setGame] = useState<Game>(
    () => openingFrames[0] ?? newGame(variant, seatCount, seed),
  );
  const [discards, setDiscards] = useState<string[]>([]);
  const [tally, setTally] = useState({ hands: 0, net: 0 });
  const [animating, setAnimating] = useState(openingFrames.length > 1);
  const timers = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const playFrames = useCallback((frames: Game[], onFinish?: (final: Game) => void) => {
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
      const isFinal = index === frames.length - 2;
      const timer = window.setTimeout(() => {
        setGame(frame);
        if (isFinal) finish();
      }, ACTION_HOLD_MS * (index + 1));
      timers.current.push(timer);
    });
  }, [clearTimers]);

  useEffect(() => {
    playFrames(openingFrames);
  }, [openingFrames, playFrames]);

  const deal = useCallback(() => {
    const nextSeed = Math.floor(Math.random() * 1e9);
    setSeed(nextSeed);
    setDiscards([]);
    playFrames(newGameFrames(variant, seatCount, nextSeed));
  }, [variant, seatCount, playFrames]);

  /**
   * AI_CHANGE:
   * Tool: Codex
   * Model: GPT-5
   * Timestamp: 2026-07-30T17:40:57-04:00
   * Purpose: Plays resolved betting as a sequence of visible table frames instead of one jump.
   * Reason: Learners need to see their raise travel to the felt, then watch each opponent respond,
   *         before the dealer sweeps the wagers into the pot.
   */
  const act = (action: HeroAction) => {
    if (animating) return;
    const before = game.players[0].stack - game.players[0].wager;
    const frames = heroActionFrames(game, action);
    const final = frames[frames.length - 1];
    if (!final) return;
    setDiscards([]);
    playFrames(frames, () => {
      if (final.phase === "done" && game.phase !== "done") {
        const after = final.players[0].stack;
        setTally((t) => ({ hands: t.hands + 1, net: t.net + (after - before) }));
      }
    });
  };

  const table = useMemo(() => gameToTable(game), [game]);
  const hero = game.players[0];
  const street = variant.streets[game.streetIndex];
  const size = betSizeFor(game);
  const actions = legalActions(game);

  return (
    <div className="practice" data-animating={animating ? "true" : "false"}>
      <PokerTable state={table} feltMark={variant.name} />

      <div className="playbar">
        {animating ? (
          <span style={{ flex: 1 }}>Watch the action move around the table…</span>
        ) : game.phase === "draw" ? (
          <>
            <span className="striplabel">
              Tap the cards you want to throw away, then draw
              {street?.drawMax ? ` (up to ${street.drawMax})` : ""}:
            </span>
            <div className="cardstrip" style={{ marginBottom: 0 }}>
              {hero.cards.map((card) => (
                <MiniCard
                  key={card.id}
                  code={card.id}
                  selected={discards.includes(card.id)}
                  onClick={() =>
                    setDiscards((current) =>
                      current.includes(card.id)
                        ? current.filter((id) => id !== card.id)
                        : [...current, card.id],
                    )
                  }
                />
              ))}
            </div>
            <button className="btn primary" onClick={() => act({ t: "draw", discardIds: discards })}>
              {discards.length === 0 ? "Stand pat" : `Draw ${discards.length}`}
            </button>
          </>
        ) : game.phase === "done" ? (
          <>
            <span style={{ flex: 1 }}>{game.settlement?.summary}</span>
            <button className="btn primary" onClick={deal}>
              Deal next hand
            </button>
          </>
        ) : game.toAct === 0 ? (
          <>
            <span className="striplabel">Your action — bet size is {size}:</span>
            {actions.includes("fold") ? (
              <button className="btn" onClick={() => act({ t: "fold" })}>
                Fold
              </button>
            ) : null}
            {actions.includes("check") ? (
              <button className="btn" onClick={() => act({ t: "check" })}>
                Check
              </button>
            ) : null}
            {actions.includes("call") ? (
              <button className="btn" onClick={() => act({ t: "call" })}>
                Call {game.betToMatch - hero.wager}
              </button>
            ) : null}
            {actions.includes("raise") ? (
              <button className="btn primary" onClick={() => act({ t: "raise" })}>
                {game.betToMatch > 0 ? `Raise to ${game.betToMatch + size}` : `Bet ${size}`}
              </button>
            ) : null}
          </>
        ) : (
          <>
            <span style={{ flex: 1 }}>Waiting…</span>
            <button className="btn" onClick={deal}>
              New hand
            </button>
          </>
        )}
      </div>

      <div className="scoreline">
        <span>
          {tally.hands} hand{tally.hands === 1 ? "" : "s"} played
        </span>
        <span style={{ color: tally.net >= 0 ? "var(--jade)" : "var(--rose)" }}>
          {tally.net >= 0 ? "+" : ""}
          {tally.net} chips
        </span>
        <span>· Fixed-size betting, simple bots — this is a rules trainer, not a solver.</span>
      </div>

      <div className="log">
        {game.log.slice(-14).map((line, i) => (
          <div key={i} className={i === game.log.slice(-14).length - 1 ? "highlight" : ""}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------ shell */

export function Practice({ variant }: { variant: Variant }) {
  // AI_CHANGE:
  // Tool: Codex
  // Model: GPT-5
  // Timestamp: 2026-07-30T18:28:11-04:00
  // Purpose: Makes live play the first and default practice surface whenever the engine supports it.
  // Reason: Learners should land in the simulation immediately; drills remain the safe default for
  //         custom/non-street games that cannot be played against bots.
  const [mode, setMode] = useState<"drills" | "play">(
    () => (variant.playable ? "play" : "drills"),
  );

  return (
    <div className="practice">
      <div className="mode-switch">
        <button
          aria-selected={mode === "play"}
          onClick={() => setMode("play")}
          disabled={!variant.playable}
          style={variant.playable ? undefined : { opacity: 0.4, cursor: "default" }}
        >
          Play a hand
        </button>
        <button aria-selected={mode === "drills"} onClick={() => setMode("drills")}>
          Drills
        </button>
      </div>

      {mode === "drills" ? (
        <Drills variant={variant} />
      ) : variant.playable ? (
        <PlayHand key={variant.id} variant={variant} />
      ) : (
        <div className="notice">
          {variant.name} has a structure the practice engine does not deal — the drills above still
          cover its rules and scoring.
        </div>
      )}

      {!variant.playable && mode === "drills" ? (
        <div className="notice">
          Playable hands against bots are available for the community, stud and draw games.{" "}
          {variant.name} is taught through its animated walkthrough and these drills.
        </div>
      ) : null}
    </div>
  );
}
