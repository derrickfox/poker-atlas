// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Street-structure builders shared by the variant catalog — community, stud and draw skeletons.
// Reason: Roughly twenty variants differ only in card counts and street names, so building their
//         structures from a few parameterised helpers keeps the catalog readable and consistent.

import type { StreetDef } from "../types";

export function postStreet(note: string, name = "Forced bets"): StreetDef {
  return { id: "post", name, kind: "post", betting: false, note };
}

export function showdownStreet(note: string): StreetDef {
  return { id: "showdown", name: "Showdown", kind: "showdown", betting: false, note };
}

interface CommunityOptions {
  holeCards: number;
  /** Cards on the flop. Courchevel deals one of them before the preflop betting round. */
  flopCards?: number;
  /** Cards dealt face up before the first betting round (Courchevel). */
  preflopBoard?: number;
  holeNote?: string;
  flopNote?: string;
  turnNote?: string;
  riverNote?: string;
  showdownNote?: string;
  /** Extra streets spliced in after the flop — used by the Pineapple discard rules. */
  extra?: { after: string; street: StreetDef }[];
}

/** Hold'em-shaped games: private cards, then a shared board revealed over three streets. */
export function communityStreets(options: CommunityOptions): StreetDef[] {
  const {
    holeCards,
    flopCards = 3,
    preflopBoard = 0,
    holeNote = `Each player is dealt ${holeCards} private card${holeCards === 1 ? "" : "s"} face down.`,
    flopNote = "Three shared cards are turned face up at once. Everyone uses the same board.",
    turnNote = "A fourth shared card. In limit games the bet size doubles here.",
    riverNote = "The fifth and final shared card, then the last betting round.",
    showdownNote = "Remaining players turn their cards up. The best five-card hand takes the pot.",
    extra = [],
  } = options;

  const streets: StreetDef[] = [
    postStreet(
      "The two players left of the button post the small and big blind before any cards are dealt.",
      "Blinds",
    ),
    {
      id: "deal",
      name: "Hole cards",
      kind: "deal-hole",
      holeCards,
      faceUp: false,
      betting: true,
      note: holeNote,
    },
  ];

  if (preflopBoard > 0) {
    streets.splice(2, 0, {
      id: "early-board",
      name: "Opening board card",
      kind: "deal-board",
      boardCards: preflopBoard,
      betting: false,
      note: "One community card is exposed before the first betting round.",
    });
  }

  streets.push(
    {
      id: "flop",
      name: "The flop",
      kind: "deal-board",
      boardCards: flopCards - preflopBoard,
      betting: true,
      note: flopNote,
    },
    {
      id: "turn",
      name: "The turn",
      kind: "deal-board",
      boardCards: 1,
      betting: true,
      bigBet: true,
      note: turnNote,
    },
    {
      id: "river",
      name: "The river",
      kind: "deal-board",
      boardCards: 1,
      betting: true,
      bigBet: true,
      note: riverNote,
    },
    showdownStreet(showdownNote),
  );

  for (const { after, street } of extra) {
    const at = streets.findIndex((s) => s.id === after);
    if (at >= 0) streets.splice(at + 1, 0, street);
  }
  return streets;
}

interface StudOptions {
  /** Total cards each player receives, 5 or 7. */
  cards: 5 | 7;
  /** Whether the last card comes face down (seven-card stud) or up (five-card stud). */
  lastCardDown?: boolean;
  bringInNote?: string;
  showdownNote?: string;
}

/** Stud-shaped games: no board, cards arrive one at a time with most of them exposed. */
export function studStreets(options: StudOptions): StreetDef[] {
  const { cards, lastCardDown = cards === 7, bringInNote, showdownNote } = options;
  const names = ["Third street", "Fourth street", "Fifth street", "Sixth street", "Seventh street"];

  const streets: StreetDef[] = [
    postStreet("Everyone antes. There are no blinds — the ante seeds the pot instead.", "Antes"),
  ];

  if (cards === 7) {
    streets.push({
      id: "third",
      name: "Third street",
      kind: "deal-hole",
      holeCards: 3,
      faceUp: false,
      faceUpCards: 1,
      betting: true,
      note:
        bringInNote ??
        "Two cards face down and one face up. The exposed card decides who is forced to open the betting.",
    });
    const streetSpecs = [
      { id: "fourth", index: 1, big: false },
      { id: "fifth", index: 2, big: true },
      { id: "sixth", index: 3, big: true },
      { id: "seventh", index: 4, big: true },
    ];
    for (const spec of streetSpecs) {
      const isLast = spec.id === "seventh";
      streets.push({
        id: spec.id,
        name: names[spec.index],
        kind: "deal-hole",
        holeCards: 1,
        faceUp: !(isLast && lastCardDown),
        betting: true,
        bigBet: spec.big,
        note: isLast
          ? lastCardDown
            ? "The last card is dealt face down — the only card nobody else has seen since third street."
            : "The final card is dealt face up, then the last betting round."
          : `One more card face up${spec.id === "fifth" ? ". In limit games the bet size doubles from here." : ". The best exposed hand acts first."}`,
      });
    }
  } else {
    streets.push({
      id: "first",
      name: "First street",
      kind: "deal-hole",
      holeCards: 2,
      faceUp: false,
      faceUpCards: 1,
      betting: true,
      note:
        bringInNote ??
        "One card face down and one face up. The low card face up brings it in.",
    });
    for (let i = 1; i <= 3; i++) {
      streets.push({
        id: `street-${i + 2}`,
        name: names[i],
        kind: "deal-hole",
        holeCards: 1,
        faceUp: true,
        betting: true,
        bigBet: i >= 2,
        note: "Another card face up, then a betting round opened by the best exposed hand.",
      });
    }
  }

  streets.push(
    showdownStreet(
      showdownNote ??
        "Everyone still in shows their down cards. Best five of the seven wins.",
    ),
  );
  return streets;
}

interface DrawOptions {
  holeCards?: number;
  draws: 1 | 3;
  forced?: "blinds" | "antes";
  drawNote?: string;
  showdownNote?: string;
}

/** Draw-shaped games: a full private hand, then one or three chances to exchange cards. */
export function drawStreets(options: DrawOptions): StreetDef[] {
  const {
    holeCards = 5,
    draws,
    forced = "blinds",
    drawNote = "You may discard any number of cards and take replacements. Standing pat means taking none.",
    showdownNote = "Cards are turned face up after the final betting round.",
  } = options;

  const streets: StreetDef[] = [
    postStreet(
      forced === "blinds"
        ? "Small and big blind are posted to the left of the button."
        : "Everyone antes before the deal.",
      forced === "blinds" ? "Blinds" : "Antes",
    ),
    {
      id: "deal",
      name: "The deal",
      kind: "deal-hole",
      holeCards,
      faceUp: false,
      betting: true,
      note: `Each player receives ${holeCards} cards face down. Nobody sees anything but their own hand.`,
    },
  ];

  for (let i = 1; i <= draws; i++) {
    streets.push({
      id: `draw-${i}`,
      name: draws === 1 ? "The draw" : `Draw ${i}`,
      kind: "draw",
      drawMax: holeCards,
      betting: true,
      bigBet: i >= 2,
      note:
        i === 1
          ? drawNote
          : `Draw ${i}. Watch how many cards each opponent takes — it is the only public information in the game.`,
    });
  }

  streets.push(showdownStreet(showdownNote));
  return streets;
}
