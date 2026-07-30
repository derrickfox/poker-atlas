// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Minimal inline formatter for narration text — **bold**, *italic* and paragraph breaks.
// Reason: Tutorial copy needs light emphasis to highlight rules, and a tiny parser avoids pulling a
//         markdown dependency into an app whose only formatting needs are two markers.

import { Fragment, type ReactNode } from "react";

function inline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let cursor = 0;
  let match: RegExpExecArray | null;
  let n = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > cursor) out.push(text.slice(cursor, match.index));
    if (match[1]) out.push(<strong key={`${keyPrefix}-b${n++}`}>{match[1]}</strong>);
    else out.push(<em key={`${keyPrefix}-i${n++}`}>{match[2]}</em>);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}

export function RichText({ text }: { text: string }) {
  const blocks = text.split("\n").filter((line) => line.trim().length > 0);
  return (
    <>
      {blocks.map((line, index) => (
        <Fragment key={index}>
          <p>{inline(line, `l${index}`)}</p>
        </Fragment>
      ))}
    </>
  );
}
