// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: The catalog dashboard — a faceted filter rail plus a card grid of every poker variant.
// Reason: The whole app hangs off narrowing ~40 variants down to the handful a person cares about,
//         so the filters are driven by the catalog itself and every facet shows a live match count.

import { useMemo } from "react";
import type { BettingId, FamilyId, PopularityId, PotTypeId, Variant, Venue } from "../types";
import {
  BETTING_LABEL,
  DIFFICULTY_LABEL,
  EMPTY_FILTERS,
  FAMILY_BLURB,
  FAMILY_LABEL,
  POPULARITY_LABEL,
  POT_TYPE_LABEL,
  SORT_LABEL,
  type Filters,
  type SortId,
  VENUE_LABEL,
  applyFilters,
  filterCount,
  sortVariants,
  variants,
} from "../data";

const FAMILY_ACCENT: Record<FamilyId, string> = {
  community: "var(--gold)",
  stud: "var(--sky)",
  draw: "var(--jade)",
  mixed: "var(--violet)",
  home: "var(--rose)",
  house: "#8b9aa4",
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function Facet<T extends string | number>({
  title,
  options,
  selected,
  counts,
  onToggle,
}: {
  title: string;
  options: { value: T; label: string }[];
  selected: T[];
  counts: Map<T, number>;
  onToggle: (value: T) => void;
}) {
  return (
    <>
      <h3>{title}</h3>
      <div>
        {options.map((option) => (
          <button
            key={String(option.value)}
            className="chip"
            aria-pressed={selected.includes(option.value)}
            onClick={() => onToggle(option.value)}
          >
            {option.label}
            <span className="count">{counts.get(option.value) ?? 0}</span>
          </button>
        ))}
      </div>
    </>
  );
}

function countBy<T>(list: Variant[], pick: (variant: Variant) => T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const variant of list) {
    for (const key of pick(variant)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

export function VariantCard({ variant, onOpen }: { variant: Variant; onOpen: () => void }) {
  return (
    <button
      className="vcard"
      style={{ ["--accent" as string]: FAMILY_ACCENT[variant.family] }}
      onClick={onOpen}
    >
      <div>
        <h3>{variant.name}</h3>
        {variant.aka?.length ? <div className="aka">also called {variant.aka.join(", ")}</div> : null}
      </div>
      <div className="tagline">{variant.tagline}</div>
      <div className="meta">
        <span className="tag accent">{FAMILY_LABEL[variant.family]}</span>
        <span className="tag">{POT_TYPE_LABEL[variant.potType]}</span>
        <span className="tag">{BETTING_LABEL[variant.betting[0]]}</span>
      </div>
      <div className="meta" style={{ justifyContent: "space-between" }}>
        <span className="tag" title={`Difficulty: ${DIFFICULTY_LABEL[variant.difficulty]}`}>
          <span className="pips">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={`pip${n <= variant.difficulty ? " on" : ""}`} />
            ))}
          </span>{" "}
          {DIFFICULTY_LABEL[variant.difficulty]}
        </span>
        <span className="tag">{variant.learnMinutes} min</span>
      </div>
    </button>
  );
}

export function Dashboard({
  filters,
  setFilters,
  sort,
  setSort,
  onOpen,
}: {
  filters: Filters;
  setFilters: (next: Filters) => void;
  sort: SortId;
  setSort: (next: SortId) => void;
  onOpen: (id: string) => void;
}) {
  const results = useMemo(() => sortVariants(applyFilters(variants, filters), sort), [filters, sort]);

  // Counts are computed against everything, so a facet always shows how many exist in the catalog.
  const familyCounts = countBy(variants, (v) => [v.family]);
  const potCounts = countBy(variants, (v) => [v.potType]);
  const bettingCounts = countBy(variants, (v) => v.betting);
  const venueCounts = countBy(variants, (v) => v.venues);
  const difficultyCounts = countBy(variants, (v) => [v.difficulty]);
  const popularityCounts = countBy(variants, (v) => [v.popularity]);

  const active = filterCount(filters);

  return (
    <>
      <div className="hero">
        <h1>Every kind of poker, one deal at a time.</h1>
        <p>
          {variants.length} variants — from the game in every card room to the ones only dealt at
          kitchen tables. Filter down to what you want to learn, watch it played out card by card,
          then practise it.
        </p>
      </div>

      <div className="dash">
        <aside className="filters">
          <div className="filter-head">
            <h3 style={{ margin: 0 }}>Filters</h3>
            {active > 0 ? (
              <button className="clear-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear {active}
              </button>
            ) : null}
          </div>

          <h3>Search</h3>
          <input
            className="search-box"
            placeholder="Omaha, lowball, badugi…"
            value={filters.search}
            onChange={(event) => setFilters({ ...filters, search: event.target.value })}
          />

          <Facet<FamilyId>
            title="Game family"
            options={(Object.keys(FAMILY_LABEL) as FamilyId[]).map((value) => ({
              value,
              label: FAMILY_LABEL[value],
            }))}
            selected={filters.families}
            counts={familyCounts}
            onToggle={(value) => setFilters({ ...filters, families: toggle(filters.families, value) })}
          />

          <Facet<PotTypeId>
            title="How the pot is won"
            options={(Object.keys(POT_TYPE_LABEL) as PotTypeId[]).map((value) => ({
              value,
              label: POT_TYPE_LABEL[value],
            }))}
            selected={filters.potTypes}
            counts={potCounts}
            onToggle={(value) => setFilters({ ...filters, potTypes: toggle(filters.potTypes, value) })}
          />

          <Facet<BettingId>
            title="Betting structure"
            options={(Object.keys(BETTING_LABEL) as BettingId[]).map((value) => ({
              value,
              label: BETTING_LABEL[value],
            }))}
            selected={filters.betting}
            counts={bettingCounts}
            onToggle={(value) => setFilters({ ...filters, betting: toggle(filters.betting, value) })}
          />

          <Facet<Venue>
            title="Where it is played"
            options={(Object.keys(VENUE_LABEL) as Venue[]).map((value) => ({
              value,
              label: VENUE_LABEL[value],
            }))}
            selected={filters.venues}
            counts={venueCounts}
            onToggle={(value) => setFilters({ ...filters, venues: toggle(filters.venues, value) })}
          />

          <Facet<number>
            title="Difficulty"
            options={[1, 2, 3, 4, 5].map((value) => ({ value, label: DIFFICULTY_LABEL[value] }))}
            selected={filters.difficulty}
            counts={difficultyCounts}
            onToggle={(value) =>
              setFilters({ ...filters, difficulty: toggle(filters.difficulty, value) })
            }
          />

          <Facet<PopularityId>
            title="How often you'll see it"
            options={(Object.keys(POPULARITY_LABEL) as PopularityId[]).map((value) => ({
              value,
              label: POPULARITY_LABEL[value],
            }))}
            selected={filters.popularity}
            counts={popularityCounts}
            onToggle={(value) =>
              setFilters({ ...filters, popularity: toggle(filters.popularity, value) })
            }
          />

          <h3>Practice</h3>
          <button
            className="chip"
            aria-pressed={filters.playableOnly}
            onClick={() => setFilters({ ...filters, playableOnly: !filters.playableOnly })}
          >
            Playable against bots
            <span className="count">{variants.filter((v) => v.playable).length}</span>
          </button>
        </aside>

        <div>
          <div className="toolbar">
            <span className="result-count">
              {results.length} of {variants.length} variants
            </span>
            <span style={{ flex: 1 }} />
            <select
              className="select"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortId)}
            >
              {(Object.keys(SORT_LABEL) as SortId[]).map((value) => (
                <option key={value} value={value}>
                  {SORT_LABEL[value]}
                </option>
              ))}
            </select>
          </div>

          {filters.families.length === 1 ? (
            <p style={{ color: "var(--ink-faint)", marginTop: 0, fontSize: 13.5 }}>
              {FAMILY_BLURB[filters.families[0]]}
            </p>
          ) : null}

          {results.length === 0 ? (
            <div className="empty">
              Nothing matches those filters.
              <br />
              <button className="clear-btn" onClick={() => setFilters(EMPTY_FILTERS)}>
                Clear them
              </button>
            </div>
          ) : (
            <div className="grid">
              {results.map((variant) => (
                <VariantCard key={variant.id} variant={variant} onOpen={() => onOpen(variant.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
