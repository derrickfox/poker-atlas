// AI_CHANGE:
// Tool: Claude Code
// Model: Opus 5
// Timestamp: 2026-07-30T00:00:00-04:00
// Purpose: Assembles the full variant catalog and defines the dashboard's filter vocabulary.
// Reason: The dashboard needs one flat list plus a description of every filter facet; deriving the
//         facets from the catalog here keeps the filter UI generic instead of hard-coding options.

import type { BettingId, FamilyId, PopularityId, PotTypeId, Variant, Venue } from "../types";
import { communityVariants } from "./variants.community";
import { studVariants } from "./variants.stud";
import { drawVariants } from "./variants.draw";
import { homeVariants } from "./variants.home";
import { mixedVariants, houseVariants } from "./variants.mixed";

export const variants: Variant[] = [
  ...communityVariants,
  ...studVariants,
  ...drawVariants,
  ...homeVariants,
  ...mixedVariants,
  ...houseVariants,
];

export function getVariant(id: string): Variant | undefined {
  return variants.find((v) => v.id === id);
}

/* ------------------------------------------------------------------ filter facets */

export const FAMILY_LABEL: Record<FamilyId, string> = {
  community: "Community card",
  stud: "Stud",
  draw: "Draw",
  mixed: "Mixed rotation",
  home: "Home / dealer's choice",
  house: "Against the house",
};

export const FAMILY_BLURB: Record<FamilyId, string> = {
  community: "Private cards plus a shared board everyone uses.",
  stud: "No board. Cards arrive one at a time, mostly face up.",
  draw: "Everything hidden. You exchange cards to improve.",
  mixed: "A rotation of several games in one session.",
  home: "Kitchen-table games with wild cards and unusual structures.",
  house: "Casino table games played against the dealer, not other players.",
};

export const POT_TYPE_LABEL: Record<PotTypeId, string> = {
  high: "Best hand wins",
  split: "Split pot",
  lowball: "Lowest hand wins",
  other: "Scored differently",
};

export const BETTING_LABEL: Record<BettingId, string> = {
  "no-limit": "No limit",
  "pot-limit": "Pot limit",
  "fixed-limit": "Fixed limit",
  "spread-limit": "Spread limit",
  "no-betting": "No betting rounds",
  "house-wager": "House wager",
};

export const VENUE_LABEL: Record<Venue, string> = {
  casino: "Card room",
  online: "Online",
  home: "Home game",
  tournament: "Tournament",
  "mixed-game": "Mixed games",
};

export const POPULARITY_LABEL: Record<PopularityId, string> = {
  ubiquitous: "Everywhere",
  common: "Widely spread",
  niche: "Niche",
  rare: "Rare",
};

export const DIFFICULTY_LABEL: Record<number, string> = {
  1: "First game",
  2: "Easy",
  3: "Moderate",
  4: "Hard",
  5: "Expert",
};

export interface Filters {
  search: string;
  families: FamilyId[];
  potTypes: PotTypeId[];
  betting: BettingId[];
  venues: Venue[];
  difficulty: number[];
  popularity: PopularityId[];
  playableOnly: boolean;
}

export const EMPTY_FILTERS: Filters = {
  search: "",
  families: [],
  potTypes: [],
  betting: [],
  venues: [],
  difficulty: [],
  popularity: [],
  playableOnly: false,
};

export function filterCount(filters: Filters): number {
  return (
    filters.families.length +
    filters.potTypes.length +
    filters.betting.length +
    filters.venues.length +
    filters.difficulty.length +
    filters.popularity.length +
    (filters.playableOnly ? 1 : 0) +
    (filters.search.trim() ? 1 : 0)
  );
}

function matchesSearch(variant: Variant, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  const haystack = [
    variant.name,
    variant.tagline,
    variant.summary,
    ...(variant.aka ?? []),
    FAMILY_LABEL[variant.family],
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function applyFilters(list: Variant[], filters: Filters): Variant[] {
  return list.filter((variant) => {
    if (!matchesSearch(variant, filters.search)) return false;
    if (filters.families.length && !filters.families.includes(variant.family)) return false;
    if (filters.potTypes.length && !filters.potTypes.includes(variant.potType)) return false;
    if (filters.betting.length && !filters.betting.some((b) => variant.betting.includes(b)))
      return false;
    if (filters.venues.length && !filters.venues.some((v) => variant.venues.includes(v)))
      return false;
    if (filters.difficulty.length && !filters.difficulty.includes(variant.difficulty)) return false;
    if (filters.popularity.length && !filters.popularity.includes(variant.popularity)) return false;
    if (filters.playableOnly && !variant.playable) return false;
    return true;
  });
}

export type SortId = "recommended" | "difficulty" | "name" | "time";

export const SORT_LABEL: Record<SortId, string> = {
  recommended: "Recommended order",
  difficulty: "Easiest first",
  name: "A to Z",
  time: "Quickest to learn",
};

const POPULARITY_WEIGHT: Record<PopularityId, number> = {
  ubiquitous: 0,
  common: 1,
  niche: 2,
  rare: 3,
};

// "Recommended" should lead with the games people mean when they say poker, so the house games and
// the kitchen-table curiosities sit behind the player-versus-player families at equal popularity.
const FAMILY_WEIGHT: Record<FamilyId, number> = {
  community: 0,
  stud: 0.2,
  draw: 0.3,
  mixed: 0.5,
  home: 0.6,
  house: 0.8,
};

export function sortVariants(list: Variant[], sort: SortId): Variant[] {
  const out = list.slice();
  switch (sort) {
    case "difficulty":
      return out.sort((a, b) => a.difficulty - b.difficulty || a.name.localeCompare(b.name));
    case "name":
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case "time":
      return out.sort((a, b) => a.learnMinutes - b.learnMinutes || a.name.localeCompare(b.name));
    default:
      return out.sort(
        (a, b) =>
          POPULARITY_WEIGHT[a.popularity] +
            FAMILY_WEIGHT[a.family] -
            (POPULARITY_WEIGHT[b.popularity] + FAMILY_WEIGHT[b.family]) ||
          a.difficulty - b.difficulty ||
          a.name.localeCompare(b.name),
      );
  }
}
