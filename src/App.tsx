/**
 * Dictionary of AI Coding - 3D Force-Directed Knowledge Graph
 * Fully RTL & Persian Localized with Markdown AST Hyperlink Parser
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Search, Info, Palette, Volume2, VolumeX, Sparkles, FileCode2, Upload } from 'lucide-react';
import { GraphStore } from './store/GraphStore';
import { useJourney } from './store/useJourney';
import { getFullDictionaryDataset, DictionaryNode } from './data/dictionaryData';
import { GraphCanvasEditorial } from './components/GraphCanvasEditorial';
import { DictionaryArticlePanel } from './components/DictionaryArticlePanel';
import { SearchModal } from './components/SearchModal';
import { InfoModal } from './components/InfoModal';
import { CompleteGraphData } from './utils/markdownGraphBuilder';

export default function App() {
  // Initial dataset
  const initialDataset = useMemo(() => getFullDictionaryDataset(), []);
  const [currentDataset, setCurrentDataset] = useState(initialDataset);

  // Ordered terms index
  const orderedTerms = useMemo(() => {
    const list: { node: DictionaryNode; index: number }[] = [];
    let idx = 0;
    for (const sec of currentDataset.sections) {
      const secNodes = sec.slugs
        .map((s) => currentDataset.nodes.find((n) => n.slug === s))
        .filter((n): n is DictionaryNode => !!n);
      for (const n of secNodes) {
        list.push({ node: n, index: idx++ });
      }
    }
    // Fallback for any unmapped nodes
    if (list.length === 0) {
      currentDataset.nodes.forEach((n, i) => list.push({ node: n, index: i }));
    }
    return list;
  }, [currentDataset]);

  // Graph Store Ref
  const storeRef = useRef<GraphStore>(
    new GraphStore(currentDataset.nodes, currentDataset.edges, currentDataset.sections)
  );
  const store = storeRef.current;

  // Render Trigger
  const [, setRenderTrigger] = useState(0);
  const forceUpdate = useCallback(() => setRenderTrigger((prev) => prev + 1), []);

  // Selection & Hover State (Defaults to 'turn')
  const [selectedSlug, setSelectedSlug] = useState<string | null>('turn');
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  // Modals & UI Toggles
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [sectionColorOn, setSectionColorOn] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Handle Graph Update from Markdown Import
  const handleApplyImportedGraph = useCallback((graphData: CompleteGraphData) => {
    const nodes: DictionaryNode[] = graphData.nodes.map((n) => ({
      slug: n.slug,
      title: n.persianTitle || n.title,
      description: n.persianDescription || n.description,
      body: n.persianBody || n.body,
      prose: n.persianProse || n.prose || '',
      aliases: n.aliases || [],
      links: n.links || [],
      usage: n.usage || [],
      avoid: n.avoid || '',
      heardInTheWild: n.heardInTheWild,
      section: n.section || 0,
      inDegree: n.inDegree || 0,
      layout: n.layout || [0, 0, 0],
    }));

    const edges = graphData.edges;
    const sections = graphData.sections.map((s) => ({
      index: s.index,
      title: s.persianTitle || s.title,
      slugs: s.slugs,
      centroid: s.centroid,
      radius: s.radius,
      paperColor: s.paperColor,
    }));

    setCurrentDataset({ nodes, edges, sections });
    store.setGraph(nodes, edges, sections);
    if (nodes.length > 0) {
      setSelectedSlug(nodes[0].slug);
    }
    forceUpdate();
  }, [store, forceUpdate]);

  // Active Node Object & Index
  const activeTermItem = useMemo(() => {
    if (!selectedSlug) return null;
    return orderedTerms.find((item) => item.node.slug === selectedSlug) || null;
  }, [selectedSlug, orderedTerms]);

  const activeNode =
    activeTermItem?.node ||
    (selectedSlug ? store.nodes.find((n) => n.slug === selectedSlug) : null);

  const termIndex =
    activeTermItem?.index ??
    (selectedSlug ? store.nodes.findIndex((n) => n.slug === selectedSlug) : 0);

  const totalTerms = orderedTerms.length || store.nodes.length;

  const activeSection = useMemo(() => {
    if (!activeNode) return currentDataset.sections[1] || currentDataset.sections[0];
    return currentDataset.sections[activeNode.section % currentDataset.sections.length] || currentDataset.sections[0];
  }, [activeNode, currentDataset.sections]);

  // Next / Prev Nodes in RTL Order
  const prevTermItem = useMemo(() => {
    if (termIndex <= 0) return orderedTerms[orderedTerms.length - 1];
    return orderedTerms[termIndex - 1];
  }, [termIndex, orderedTerms]);

  const nextTermItem = useMemo(() => {
    if (termIndex >= orderedTerms.length - 1) return orderedTerms[0];
    return orderedTerms[termIndex + 1];
  }, [termIndex, orderedTerms]);

  // Handle Hover with Neighbor Attraction Interaction (Hover-Nudge effect)
  const handleHoverNode = useCallback(
    (slug: string | null) => {
      setHoveredSlug(slug);
      useJourney.getState().setHovered(slug);

      // The nudge animation should only happen when there is NO currently selected node
      if (!selectedSlug) {
        if (slug) {
          // Apply pure Hover-Nudge: anchor locked, subtle neighbor pull, no camera movement
          store.applyHoverNudge(slug);
        } else {
          // Unhover / Mouse Leave: Reset repackOffset to zero and restore baseline
          store.applyHoverNudge(null);
        }
        forceUpdate();
      }
    },
    [selectedSlug, store, forceUpdate]
  );

  const handleSelectNode = useCallback(
    (slug: string | null) => {
      setSelectedSlug(slug);
      useJourney.getState().focusNode(slug);

      if (slug) {
        const neighbors = store.neighborsOf(slug);
        const activeCluster = [slug, ...Array.from(neighbors)];
        store.solveRepack(activeCluster);
      } else {
        store.applyMatches(null);
        store.solveRepack([]);
      }
      forceUpdate();
    },
    [store, forceUpdate]
  );

  // Audio Speech Synthesis
  const toggleSpeech = () => {
    if (!window.speechSynthesis) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!activeNode) return;

    const utterance = new SpeechSynthesisUtterance(
      `${activeNode.title}. ${activeNode.description}. ${activeNode.body}`
    );
    utterance.lang = 'fa-IR';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Keyboard Shortcuts (Cmd+K, Escape, Arrow Navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        else if (isInfoOpen) setIsInfoOpen(false);
        else setSelectedSlug(null);
      } else if (e.key === '/' && !isSearchOpen) {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'ArrowRight' && !isSearchOpen && prevTermItem) {
        setSelectedSlug(prevTermItem.node.slug);
      } else if (e.key === 'ArrowLeft' && !isSearchOpen && nextTermItem) {
        setSelectedSlug(nextTermItem.node.slug);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isInfoOpen, nextTermItem, prevTermItem]);

  return (
    <div
      id="app-root"
      dir="rtl"
      className="w-screen h-screen flex flex-col md:flex-row bg-[#f2f2f0] text-neutral-900 overflow-hidden font-sans select-none"
    >
      {/* 3D Knowledge Graph Viewport */}
      <main id="graph-stage-container" className="relative flex-1 h-full overflow-hidden">
        {/* 3D WebGL Canvas */}
        <GraphCanvasEditorial
          store={store}
          selectedSlug={selectedSlug}
          hoveredSlug={hoveredSlug}
          onSelectNode={handleSelectNode}
          onHoverNode={handleHoverNode}
          sectionColorOn={sectionColorOn}
        />

        {/* Top Controls in RTL: Right Side = Search */}
        <div className="absolute top-6 right-6 z-10 flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-10 h-10 rounded-full border border-neutral-300 bg-white/85 backdrop-blur-md flex items-center justify-center text-neutral-700 hover:text-neutral-950 hover:bg-white shadow-xs transition-all cursor-pointer"
            title="جستجو در دانشنامه (کلید /)"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Top Controls in RTL: Left Side = Info & Markdown Parser Tool */}
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2">          
          {/* Info Modal Button */}
          <button
            onClick={() => setIsInfoOpen(true)}
            className="w-10 h-10 rounded-full border border-neutral-300 bg-white/85 backdrop-blur-md flex items-center justify-center text-neutral-700 hover:text-neutral-950 hover:bg-white shadow-xs transition-all cursor-pointer font-serif italic text-sm font-bold"
            title="درباره این گراف دانش"
            aria-label="Info"
          >
            i
          </button>
        </div>

        {/* Bottom Controls in RTL: Left Side = Color Palette & Speech */}
        <div className="absolute bottom-6 left-6 z-10 flex items-center gap-2">
          {/* Palette Color Toggle */}
          <button
            onClick={() => setSectionColorOn(!sectionColorOn)}
            className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-xs transition-all cursor-pointer ${
              sectionColorOn
                ? 'bg-neutral-900 border-neutral-900 text-white'
                : 'border-neutral-300 bg-white/85 backdrop-blur-md text-neutral-700 hover:text-neutral-950 hover:bg-white'
            }`}
            title="تغییر تم رنگی بخش‌ها"
            aria-label="Toggle section colors"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Text-to-Speech Audio Button */}
          <button
            onClick={toggleSpeech}
            className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-xs transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-neutral-900 border-neutral-900 text-white animate-pulse'
                : 'border-neutral-300 bg-white/85 backdrop-blur-md text-neutral-700 hover:text-neutral-950 hover:bg-white'
            }`}
            title={isSpeaking ? 'توقف خواندن صوتی' : 'خواندن صوتی تعریف'}
            aria-label="Read definition"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </main>

      {/* RTL Dictionary Article Panel */}
      {activeNode && (
        <DictionaryArticlePanel
          node={activeNode}
          store={store}
          section={activeSection}
          termIndex={termIndex}
          totalTerms={totalTerms}
          onClose={() => handleSelectNode(null)}
          onSelectSlug={handleSelectNode}
          onPrev={() => prevTermItem && handleSelectNode(prevTermItem.node.slug)}
          onNext={() => nextTermItem && handleSelectNode(nextTermItem.node.slug)}
          prevTitle={prevTermItem ? prevTermItem.node.title : 'قبلی'}
          nextTitle={nextTermItem ? nextTermItem.node.title : 'بعدی'}
        />
      )}

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        nodes={currentDataset.nodes}
        sections={currentDataset.sections}
        onSelectSlug={handleSelectNode}
      />

      {/* Information Modal */}
      <InfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
