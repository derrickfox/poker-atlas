// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Renders a TableState as an animated poker table — seats around an ellipse, cards that
//          slide from the dealer position to their home, flip on reveal, and glow when they play.
// Reason: Cards are positioned by CSS transform rather than by DOM order, so any state change
//         animates automatically; mounting new cards at the deck first is what makes dealing move.

import type React from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { TableCard, TableState } from "../types";
import { RANK_LABEL, SUIT_GLYPH } from "../engine/cards";
import { chipBreakdown, chipBreakdownLabel, type ChipGroup } from "../engine/chips";

const STAGE_W = 1000;
const STAGE_H = 664;
const TABLE_CX = 500;
const TABLE_CY = 296;
const SEAT_RX = 412;
const SEAT_RY = 236;
const DECK = { x: 500, y: 150 };

interface Point {
  x: number;
  y: number;
}

function seatPoint(index: number, count: number): Point {
  const theta = ((90 + (index * 360) / count) * Math.PI) / 180;
  return { x: TABLE_CX + SEAT_RX * Math.cos(theta), y: TABLE_CY + SEAT_RY * Math.sin(theta) };
}

/**
 * A point `distance` px from the seat heading toward the middle of the table, optionally pushed
 * `sideways` px along the perpendicular so markers can sit beside a seat without covering it.
 */
function towardCenter(from: Point, distance: number, sideways = 0): Point {
  const dx = TABLE_CX - from.x;
  const dy = TABLE_CY - from.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x: from.x + ux * distance - uy * sideways,
    y: from.y + uy * distance + ux * sideways,
  };
}

function cardStep(count: number, hero: boolean): number {
  if (hero) return count <= 5 ? 40 : count <= 8 ? 30 : 22;
  return count <= 4 ? 30 : count <= 7 ? 22 : 15;
}

interface Placement {
  x: number;
  y: number;
  rot: number;
  hero: boolean;
}

function layout(state: TableState): Map<string, Placement> {
  const places = new Map<string, Placement>();
  const seatCount = Math.max(state.seats.length, 1);

  const bySeat = new Map<number, TableCard[]>();
  const byBoard = new Map<number, TableCard[]>();
  for (const card of state.cards) {
    if (card.home.where === "seat") {
      bySeat.set(card.home.seat, [...(bySeat.get(card.home.seat) ?? []), card]);
    } else if (card.home.where === "board") {
      byBoard.set(card.home.board, [...(byBoard.get(card.home.board) ?? []), card]);
    }
  }

  for (const [seatIndex, cards] of bySeat) {
    const seat = state.seats[seatIndex];
    const hero = Boolean(seat?.isHero);
    const anchor = towardCenter(seatPoint(seatIndex, seatCount), hero ? 96 : 98);
    const ordered = [...cards].sort(
      (a, b) => (a.home as { slot: number }).slot - (b.home as { slot: number }).slot,
    );
    const step = cardStep(ordered.length, hero);
    const width = (ordered.length - 1) * step;
    ordered.forEach((card, i) => {
      places.set(card.id, {
        x: anchor.x - width / 2 + i * step,
        y: anchor.y,
        rot: hero ? 0 : (i - (ordered.length - 1) / 2) * 2.5,
        hero,
      });
    });
  }

  const boardCount = Math.max(state.boards, 1);
  for (const [boardIndex, cards] of byBoard) {
    const ordered = [...cards].sort(
      (a, b) => (a.home as { slot: number }).slot - (b.home as { slot: number }).slot,
    );
    const step = ordered.length <= 5 ? 66 : 50;
    const width = (ordered.length - 1) * step;
    // Boards sit above centre to leave the middle of the felt clear for the pot's chips.
    const y = TABLE_CY - 62 + (boardIndex - (boardCount - 1) / 2) * 100;
    ordered.forEach((card, i) => {
      places.set(card.id, { x: TABLE_CX - width / 2 + i * step, y, rot: 0, hero: false });
    });
  }

  return places;
}

function Stack({
  tier,
  denomination,
  height,
  size,
}: {
  tier: number;
  denomination: number;
  height: number;
  size: number;
}) {
  const lift = Math.max(2, Math.round(size * 0.22));
  return (
    <span
      className={`chips tier-${tier}`}
      style={{ width: size, height: size }}
    >
      {Array.from({ length: height }, (_, i) => (
        <span
          key={i}
          className="chip-disc"
          style={{
            width: size,
            height: size,
            bottom: i * lift,
            left: 0,
          }}
        >
          {i === height - 1 ? (
            <span className="chip-value" style={{ fontSize: size <= 14 ? 5 : size <= 18 ? 6 : 7 }}>
              {denomination}
            </span>
          ) : null}
        </span>
      ))}
    </span>
  );
}

/** Split a denomination into table-sized stacks without changing its exact chip count. */
function stackGroups(group: ChipGroup, maxHeight = 5): number[] {
  const stacks: number[] = [];
  for (let left = group.count; left > 0; left -= maxHeight) {
    stacks.push(Math.min(maxHeight, left));
  }
  return stacks;
}

/** Every rendered disc represents one real chip; colour and top label identify its value. */
function ChipStack({
  amount,
  size = 17,
  row = false,
}: {
  amount: number;
  size?: number;
  row?: boolean;
}) {
  const groups = chipBreakdown(amount);
  return (
    <span
      className={`chip-breakdown${row ? " compact" : ""}`}
      title={chipBreakdownLabel(groups)}
      aria-label={`${amount} chips: ${chipBreakdownLabel(groups)}`}
    >
      {groups.flatMap((group) =>
        stackGroups(group).map((height, index) => (
          <Stack
            key={`${group.denomination}-${index}`}
            tier={group.tier}
            denomination={group.denomination}
            height={height}
            size={size}
          />
        )),
      )}
    </span>
  );
}

function ChipPile({ amount }: { amount: number }) {
  const groups = chipBreakdown(amount);
  return (
    <div
      className="pile"
      title={chipBreakdownLabel(groups)}
      aria-label={`Pot ${amount}: ${chipBreakdownLabel(groups)}`}
    >
      {groups.flatMap((group) =>
        stackGroups(group).map((height, index) => (
          <Stack
            key={`${group.denomination}-${index}`}
            tier={group.tier}
            denomination={group.denomination}
            height={height}
            size={22}
          />
        )),
      )}
    </div>
  );
}

function CardFace({ card }: { card: TableCard }) {
  const red = card.suit === "h" || card.suit === "d";
  const label = RANK_LABEL[card.rank] ?? "?";
  const glyph = SUIT_GLYPH[card.suit as "s"] ?? "♠";
  return (
    <div className={`face${red ? " red" : ""}`}>
      <span className="corner">
        <span>{label}</span>
        <span>{glyph}</span>
      </span>
      <span className="pipbig">{glyph}</span>
      <span className="corner flip">
        <span>{label}</span>
        <span>{glyph}</span>
      </span>
    </div>
  );
}

export function PokerTable({ state, feltMark }: { state: TableState; feltMark?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const known = useRef(new Set<string>());
  /** Per-card transition delay, assigned once so the deal cascades instead of arriving all at once. */
  const delays = useRef(new Map<string, number>());
  const [, bump] = useState(0);

  useLayoutEffect(() => {
    const element = wrapRef.current;
    if (!element) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setScale(Math.min(1, width / STAGE_W));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const places = layout(state);

  // Cards the reducer added this beat have never been positioned. Paint them at the deck first,
  // then re-render one frame later so the CSS transform transition carries them to their seat.
  const fresh: string[] = [];
  for (const card of state.cards) {
    if (known.current.has(card.id)) continue;
    delays.current.set(card.id, Math.min(fresh.length, 11) * 55);
    fresh.push(card.id);
  }

  useEffect(() => {
    if (fresh.length === 0) return;
    const frame = requestAnimationFrame(() => {
      fresh.forEach((id) => known.current.add(id));
      bump((n) => n + 1);
    });
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    // Cards removed from the table (folded or discarded) should be dealable again later.
    const live = new Set(state.cards.map((card) => card.id));
    for (const id of known.current) {
      if (!live.has(id)) {
        known.current.delete(id);
        delays.current.delete(id);
      }
    }
  }, [state.cards]);

  const seatCount = Math.max(state.seats.length, 1);

  // Chips are pushed past the seat's own card row toward the pot and offset to one side, so they
  // read as "this player's bet" no matter how wide the hand is.
  const cardsPerSeat = new Map<number, number>();
  for (const card of state.cards) {
    if (card.home.where !== "seat") continue;
    cardsPerSeat.set(card.home.seat, (cardsPerSeat.get(card.home.seat) ?? 0) + 1);
  }

  return (
    <div className="stage-wrap" ref={wrapRef} style={{ height: STAGE_H * scale }}>
      <div
        className="stage"
        data-pot={state.pot}
        data-wagers={state.seats.filter((seat) => seat.wager > 0).length}
        style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
      >
        <div className="felt">{feltMark ? <div className="felt-mark">{feltMark}</div> : null}</div>

        {state.pot > 0 ? (
          <div className="pot" key={state.pot}>
            <ChipPile amount={state.pot} />
            <div className="amount">{state.pot}</div>
            <div className="label">pot</div>
          </div>
        ) : null}

        {state.buttonSeat != null && state.seats[state.buttonSeat] ? (
          (() => {
            const point = towardCenter(seatPoint(state.buttonSeat, seatCount), 108, 62);
            return (
              <div className="button-disc" style={{ left: point.x, top: point.y }}>
                D
              </div>
            );
          })()
        ) : null}

        {state.seats.map((seat) => {
          const point = seatPoint(seat.index, seatCount);
          const held = cardsPerSeat.get(seat.index) ?? 0;
          const rowHalf = held > 1 ? ((held - 1) * cardStep(held, seat.isHero)) / 2 : 0;
          const chip = towardCenter(point, (seat.isHero ? 96 : 98) + 28, rowHalf + 58);
          const isFold = seat.say === "folds";
          // Seats below the middle carry their plate underneath; seats above carry it on top, and
          // the clamp keeps a plate from sliding off the stage at the very top of the ellipse.
          const plateTop = Math.max(4, point.y + (point.y > TABLE_CY ? 30 : -96));
          // A plate pushed against the top of the stage has no room for a bubble above it.
          const sayBelow = plateTop < 40;
          return (
            <div key={seat.index}>
              <div
                className={`seat${seat.folded ? " folded" : ""}${seat.isHero ? " hero" : ""}${seat.active ? " active" : ""}${sayBelow ? " say-below" : ""}`}
                style={{ left: point.x, top: plateTop }}
              >
                <div className="plate">
                  <span className="who">
                    {seat.name}
                    {seat.badge ? <em className="badge">{seat.badge}</em> : null}
                  </span>
                  {!seat.hideStack ? (
                    <span className="stack" key={seat.stack}>
                      <ChipStack amount={seat.stack} size={14} row />
                      {seat.stack}
                    </span>
                  ) : null}
                </div>
                {seat.won ? (
                  <span className="won">+{seat.won}</span>
                ) : seat.say ? (
                  <span className={`say${isFold ? " fold" : ""}`}>{seat.say}</span>
                ) : null}
              </div>
              {seat.wager > 0 ? (
                // Keyed on the amount so every fresh bet remounts and replays the slide-in.
                <div
                  key={seat.wagerKey ?? `${seat.index}-${seat.wager}`}
                  className="wager"
                  style={
                    {
                      left: chip.x,
                      top: chip.y,
                      "--fx": `${point.x - chip.x}px`,
                      "--fy": `${point.y - chip.y}px`,
                    } as React.CSSProperties
                  }
                >
                  <ChipStack amount={seat.wager} />
                  {seat.wager}
                </div>
              ) : null}
              {seat.returned ? (
                // AI_CHANGE:
                // Tool: Codex
                // Model: GPT-5
                // Timestamp: 2026-07-31T12:20:00-04:00
                // Purpose: Shows withdrawn chips travelling from the wager back to the player.
                // Reason: Let It Ride teaches withdrawal as a physical table action; reversing the
                //         chip motion makes the reduced wager and increased stack intuitive.
                <div
                  key={`${seat.index}-return-${seat.returned}`}
                  className="wager returning"
                  style={
                    {
                      left: chip.x,
                      top: chip.y,
                      "--tx": `${point.x - chip.x}px`,
                      "--ty": `${point.y - chip.y}px`,
                    } as React.CSSProperties
                  }
                >
                  <ChipStack amount={seat.returned} />
                  {seat.returned}
                </div>
              ) : null}
              {seat.added ? (
                // AI_CHANGE:
                // Tool: Codex
                // Model: GPT-5
                // Timestamp: 2026-07-31T13:00:00-04:00
                // Purpose: Animates only newly committed chips while earlier wagers remain still.
                // Reason: Ultimate Texas Hold'em starts with Ante and Blind already on the felt;
                //         the later Play wager must visibly join them rather than re-deal the pile.
                <div
                  key={`${seat.index}-added-${seat.added}`}
                  className="wager adding"
                  style={
                    {
                      left: chip.x,
                      top: chip.y,
                      "--fx": `${point.x - chip.x}px`,
                      "--fy": `${point.y - chip.y}px`,
                    } as React.CSSProperties
                  }
                >
                  <ChipStack amount={seat.added} />
                  {seat.added}
                </div>
              ) : null}
            </div>
          );
        })}

        {state.cards.map((card, index) => {
          const place = places.get(card.id);
          const isFresh = !known.current.has(card.id);
          const x = isFresh ? DECK.x : (place?.x ?? DECK.x);
          // AI_CHANGE:
          // Tool: Codex
          // Model: GPT-5
          // Timestamp: 2026-07-31T09:00:00-04:00
          // Purpose: Winning cards move upward as the evaluator marks them for emphasis.
          // Reason: A physical lift plus the existing glow makes the exact winning combination
          //         readable at a glance, especially when Omaha leaves two private cards unused.
          const winningLift = card.emphasis === "play" && !isFresh ? 18 : 0;
          const y = isFresh ? DECK.y : (place?.y ?? DECK.y) - winningLift;
          const rot = isFresh ? 0 : (place?.rot ?? 0);
          const emphasis = card.emphasis === "play" ? " play" : card.emphasis === "dim" ? " dim" : "";
          const halfW = place?.hero ? 31 : 27;
          const halfH = place?.hero ? 43 : 38;
          const delay = delays.current.get(card.id) ?? 0;
          const leaving = card.home.where === "muck" || card.home.where === "discard";
          return (
            <div
              key={card.id}
              className={`pcard${card.faceUp && !isFresh ? " up" : ""}${place?.hero ? " hero" : ""}${emphasis}${leaving ? " muck" : ""}`}
              style={{
                left: 0,
                top: 0,
                zIndex: (card.emphasis === "play" ? 110 : 10) + index,
                transform: `translate(${x - halfW}px, ${y - halfH}px) rotate(${rot}deg)`,
                transitionDelay: isFresh ? "0ms" : `${delay}ms`,
              }}
            >
              <div className="inner">
                <div className="back" />
                <CardFace card={card} />
              </div>
            </div>
          );
        })}

        {state.caption ? <div className="caption" key={state.caption}>{state.caption}</div> : null}
      </div>
    </div>
  );
}
