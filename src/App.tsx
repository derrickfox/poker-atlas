// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: App shell and hash routing between the dashboard and a variant page.
// Reason: Hash routing keeps deep links to a specific game working with no router dependency and no
//         server-side rewrite rules when this is deployed as a static site.

import { useEffect, useState } from "react";
import { EMPTY_FILTERS, type Filters, type SortId, getVariant } from "./data";
import { Dashboard } from "./components/Dashboard";
import { VariantPage } from "./components/VariantPage";

function currentId(): string | null {
  const hash = window.location.hash.replace(/^#\/?/, "");
  return hash ? hash : null;
}

export default function App() {
  const [route, setRoute] = useState<string | null>(currentId);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortId>("recommended");

  useEffect(() => {
    const onHash = () => setRoute(currentId());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const open = (id: string) => {
    window.location.hash = `/${id}`;
    window.scrollTo({ top: 0 });
  };

  const variant = route ? getVariant(route) : undefined;

  return (
    <div className="app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            window.location.hash = "";
          }}
        >
          <span className="suits">♠♥♦♣</span>
          <span>
            Poker <b>Atlas</b>
          </span>
        </button>
        <span className="spacer" />
        {variant ? (
          <button className="ghost-btn" onClick={() => (window.location.hash = "")}>
            Browse all types
          </button>
        ) : null}
      </header>

      <main className="page">
        {variant ? (
          <VariantPage variant={variant} onBack={() => (window.location.hash = "")} />
        ) : (
          <Dashboard
            filters={filters}
            setFilters={setFilters}
            sort={sort}
            setSort={setSort}
            onOpen={open}
          />
        )}
      </main>
    </div>
  );
}
