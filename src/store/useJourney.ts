import { create } from "zustand";
import { SECTION_COLORS } from "../types/graph";

export const SECTION_COLOR_KEY = "atlas:section-color";

export interface JourneyState {
  hoveredSlug: string | null;
  focusedSlug: string | null;
  activeSection: number | null;
  query: string;
  matchCount: number | null;
  matchSlugs: string[];
  searchActive: boolean;
  repackTick: number;
  sheetExpanded: boolean;
  searchResetTick: number;
  sectionColorOn: boolean;
  overviewSection: number | null;

  setHovered: (slug: string | null) => void;
  focusNode: (slug: string | null) => void;
  setActiveSection: (sec: number | null) => void;
  setQuery: (q: string) => void;
  setMatches: (slugs: string[] | null) => void;
  bumpRepack: () => void;
  setSheetExpanded: (exp: boolean) => void;
  resetSearch: () => void;
  setSectionColorOn: (on: boolean) => void;
  setOverviewSection: (sec: number | null) => void;
  toggleSectionColor: () => void;
}

export const useJourney = create<JourneyState>((set, get) => ({
  hoveredSlug: null,
  focusedSlug: null,
  activeSection: null,
  query: "",
  matchCount: null,
  matchSlugs: [],
  searchActive: false,
  repackTick: 0,
  sheetExpanded: false,
  searchResetTick: 0,
  sectionColorOn: false,
  overviewSection: null,

  setHovered: (slug) => {
    if (get().hoveredSlug !== slug) set({ hoveredSlug: slug });
  },
  focusNode: (slug) => {
    if (get().focusedSlug !== slug) set({ focusedSlug: slug });
  },
  setActiveSection: (sec) => set({ activeSection: sec }),
  setQuery: (q) => set({ query: q }),
  setMatches: (slugs) => {
    set({
      matchSlugs: slugs ?? [],
      matchCount: slugs ? slugs.length : null,
      searchActive: Boolean(slugs && slugs.length > 0),
    });
  },
  bumpRepack: () => set((state) => ({ repackTick: state.repackTick + 1 })),
  setSheetExpanded: (exp) => {
    if (get().sheetExpanded !== exp) set({ sheetExpanded: exp });
  },
  resetSearch: () => set((state) => ({ searchResetTick: state.searchResetTick + 1 })),
  setSectionColorOn: (on) => set({ sectionColorOn: on }),
  setOverviewSection: (sec) => set({ overviewSection: sec }),
  toggleSectionColor: () => {
    const nextOn = !get().sectionColorOn;
    const randomSec = nextOn ? Math.floor(Math.random() * SECTION_COLORS.length) : null;
    set({ sectionColorOn: nextOn, overviewSection: randomSec });
    try {
      localStorage.setItem(SECTION_COLOR_KEY, nextOn ? "1" : "0");
    } catch {}
  },
}));