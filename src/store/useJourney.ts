import { create } from 'zustand';

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
  sectionColorOn: boolean;
  overviewSection: number | null;
  
  setHovered: (slug: string | null) => void;
  focusNode: (slug: string | null) => void;
  setActiveSection: (section: number | null) => void;
  setQuery: (q: string) => void;
  setMatches: (matches: string[] | null) => void;
  bumpRepack: () => void;
  setSheetExpanded: (expanded: boolean) => void;
  toggleSectionColor: () => void;
  setOverviewSection: (section: number | null) => void;
}

export const useJourney = create<JourneyState>((set) => ({
  hoveredSlug: null,
  focusedSlug: null,
  activeSection: null,
  query: '',
  matchCount: null,
  matchSlugs: [],
  searchActive: false,
  repackTick: 0,
  sheetExpanded: false,
  sectionColorOn: true,
  overviewSection: null,

  setHovered: (slug) => set({ hoveredSlug: slug }),
  focusNode: (slug) =>
    set((state) => ({
      focusedSlug: slug,
      sheetExpanded: !!slug,
      // If we focus a node, clear search active if needed or keep query
      repackTick: state.repackTick + 1,
    })),
  setActiveSection: (section) => set({ activeSection: section }),
  setQuery: (query) => set({ query, searchActive: query.trim().length > 0 }),
  setMatches: (matches) =>
    set((state) => ({
      matchSlugs: matches || [],
      matchCount: matches ? matches.length : null,
      repackTick: state.repackTick + 1,
    })),
  bumpRepack: () => set((state) => ({ repackTick: state.repackTick + 1 })),
  setSheetExpanded: (expanded) => set({ sheetExpanded: expanded }),
  toggleSectionColor: () => set((state) => ({ sectionColorOn: !state.sectionColorOn })),
  setOverviewSection: (section) => set({ overviewSection: section }),
}));
