import { useState, useCallback } from 'react';
import { Github, ArrowLeftRight, Package, Database, Bookmark } from 'lucide-react';
import TextAreaInput from './components/TextAreaInput';
import CompareButton from './components/CompareButton';
import ResultsContainer from './components/ResultsContainer';
import CollectionManager from './components/CollectionManager';
import ReservationsPanel from './components/ReservationsPanel';
import { parseStickerList, calculateMatches } from './utils/matcherUtils';
import useLocalCollection from './hooks/useLocalCollection';
import useReservations from './hooks/useReservations';

const PLACEHOLDER_MY = `Paste your list here...

Example (Figuritas App format):
I need
MEX 🇲🇽: 3, 5, 7, 15
BRA 🇧🇷: 7, 10, 19

Swaps
MEX 🇲🇽: 9, 10, 19
BRA 🇧🇷: 1, 8, 12`;

const PLACEHOLDER_FRIEND = `Paste your friend's list here...

Example (Figuri format):
❌ Me faltan (42):
🇲🇽 MEX: 1, 7, 9, 10
🇧🇷 BRA: 10, 11, 19

🔁 Repetidas (15):
🇲🇽 MEX: 5, 6, 15
🇧🇷 BRA: 7, 9, 18`;

export default function App() {
  // ── Tab navigation ──
  const [activeTab, setActiveTab] = useState('compare');

  // ── Compare state ──
  const [myListRaw, setMyListRaw] = useState('');
  const [theirListRaw, setTheirListRaw] = useState('');
  const [matches, setMatches] = useState(null);
  const [errors, setErrors] = useState([]);

  // ── Local collection hook ──
  const localCollection = useLocalCollection();

  // ── Reservations hook (shares confirmSwap with collection) ──
  const reservations = useReservations({ onConfirmSwap: localCollection.confirmSwap });

  const bothEmpty = !myListRaw.trim() && !theirListRaw.trim();

  const handleCompare = useCallback(() => {
    const errs = [];

    if (!myListRaw.trim()) {
      errs.push('Your list is empty.');
    }
    if (!theirListRaw.trim()) {
      errs.push("Your friend's list is empty.");
    }
    if (errs.length > 0) {
      setErrors(errs);
      setMatches(null);
      return;
    }

    const parsedMe = parseStickerList(myListRaw);
    const parsedThem = parseStickerList(theirListRaw);

    // Validate parsed output
    const meHasData = Object.keys(parsedMe.needs).length > 0 || Object.keys(parsedMe.swaps).length > 0;
    const themHasData = Object.keys(parsedThem.needs).length > 0 || Object.keys(parsedThem.swaps).length > 0;

    if (!meHasData) {
      errs.push('Could not parse any data from your list. Make sure it has section headers like "I need" / "Swaps" or "❌ Me faltan" / "🔁 Repetidas".');
    }
    if (!themHasData) {
      errs.push("Could not parse any data from your friend's list. Make sure it has section headers like \"I need\" / \"Swaps\" or \"❌ Me faltan\" / \"🔁 Repetidas\".");
    }

    if (errs.length > 0) {
      setErrors(errs);
      setMatches(null);
      return;
    }

    const result = calculateMatches(parsedMe, parsedThem);
    setMatches(result);
    setErrors([]);

    // Scroll to results
    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  }, [myListRaw, theirListRaw]);

  const handleClearResults = () => {
    setMatches(null);
    setErrors([]);
  };

  // ── Load collection into "My List" textarea ──
  const handleLoadCollection = () => {
    const text = localCollection.toText();
    if (text.trim()) {
      setMyListRaw(text);
      handleClearResults();
    }
  };

  return (
    <div className="min-h-screen bg-network-pattern text-text flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="border-b border-border/80 bg-bg/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <img src="/panini-logo.png" alt="Panini" className="h-7 sm:h-8 object-contain rounded border border-yellow-500/15" />
            <div className="h-6 w-px bg-border/40 hidden sm:block" />
            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-text tracking-tight font-display">
                FIFA World Cup 2026 StickerSwap Matcher
              </h1>
              <p className="text-[9px] text-primary-light font-bold tracking-wider uppercase">
                World Cup 2026
              </p>
            </div>
          </div>
          <img src="/world-cup-logo.png" alt="FIFA World Cup 2026" className="h-9 object-contain hidden md:block filter brightness-110" />
        </div>

        {/* ── Tab Navigation ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <nav className="flex gap-1" role="tablist">
            {[
              { key: 'compare',     label: 'Compare',     icon: <ArrowLeftRight size={14} />,  badge: null },
              { key: 'collection',  label: 'My Collection', icon: <Package size={14} />,
                badge: !localCollection.isEmpty ? localCollection.needsCount + localCollection.swapsCount : null },
              { key: 'reservations', label: 'Reservations', icon: <Bookmark size={14} />,
                badge: reservations.pendingCount > 0 ? reservations.pendingCount : null },
            ].map(tab => (
              <button
                key={tab.key}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-button flex items-center gap-2 px-4 py-2.5 text-xs font-bold font-display uppercase tracking-wider
                  transition-all cursor-pointer border-b-2 -mb-px
                  ${activeTab === tab.key
                    ? 'border-violet-500 text-violet-300 bg-violet-500/5'
                    : 'border-transparent text-text-muted/50 hover:text-text-muted hover:border-border/40'
                  }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge !== null && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-violet-500/20 text-violet-300 tabular-nums border border-violet-500/15">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-grow">

        {/* ══════ COMPARE TAB ══════ */}
        {activeTab === 'compare' && (
          <>
            {/* Instructions */}
            <div className="text-center mb-8 animate-fade-in flex flex-col items-center gap-4">
              <img src="/world-cup-logo.png" alt="FIFA World Cup 2026" className="h-20 sm:h-24 object-contain select-none filter brightness-110 drop-shadow-[0_0_15px_rgba(139,92,246,0.1)]" />
              <p className="text-sm text-text-muted max-w-lg mx-auto leading-relaxed">
                Paste your sticker list and your friend's list below, then hit{' '}
                <span className="font-semibold text-violet-400">Find Matching Trades</span>{' '}
                to see what you can swap.
              </p>
            </div>

            {/* ── Input Columns ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="flex flex-col gap-2">
                <TextAreaInput
                  id="my-list"
                  label="My List"
                  emoji="👤"
                  placeholder={PLACEHOLDER_MY}
                  value={myListRaw}
                  onChange={(val) => {
                    setMyListRaw(val);
                    handleClearResults();
                  }}
                  onClear={() => {
                    setMyListRaw('');
                    handleClearResults();
                  }}
                />
                {/* Load from Collection button */}
                {!localCollection.isEmpty && (
                  <button
                    id="load-collection-btn"
                    onClick={handleLoadCollection}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold font-display
                      uppercase tracking-wider transition-all cursor-pointer border
                      bg-violet-600/8 text-violet-300/70 border-violet-500/15
                      hover:bg-violet-600/15 hover:text-violet-300 hover:border-violet-500/30 hover:shadow-md
                      animate-fade-in"
                  >
                    <Database size={13} />
                    Load My Collection ({localCollection.needsCount + localCollection.swapsCount} stickers)
                  </button>
                )}
              </div>
              <TextAreaInput
                id="friend-list"
                label="Friend's List"
                emoji="🤝"
                placeholder={PLACEHOLDER_FRIEND}
                value={theirListRaw}
                onChange={(val) => {
                  setTheirListRaw(val);
                  handleClearResults();
                }}
                onClear={() => {
                  setTheirListRaw('');
                  handleClearResults();
                }}
              />
            </div>

            {/* ── Errors ── */}
            {errors.length > 0 && (
              <div className="max-w-md mx-auto mb-6 animate-slide-down">
                <div className="bg-red-950/40 border border-red-500/20 rounded-xl px-5 py-4 backdrop-blur-sm">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-300 font-semibold flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">⚠️</span>
                      {err}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* ── Compare Button (sticky on mobile) ── */}
            <div className="sticky bottom-0 left-0 right-0 z-10 py-4 bg-gradient-to-t from-[#08080C] via-[#08080C]/95 to-transparent backdrop-blur-[1.5px] -mx-4 px-4 sm:-mx-6 sm:px-6">
              <CompareButton onClick={handleCompare} disabled={bothEmpty} />
            </div>

            {/* ── Results ── */}
            {matches && (
              <section id="results-section" className="mt-10 pb-16">
                <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mb-10" />
                <ResultsContainer
                  matches={matches}
                  myListRaw={myListRaw}
                  hasLocalCollection={!localCollection.isEmpty}
                  onConfirmSwap={localCollection.confirmSwap}
                  onReserveSwap={reservations.reserveSwap}
                  reservedGiveStickers={reservations.reservedGiveStickers}
                  reservedGetStickers={reservations.reservedGetStickers}
                />
              </section>
            )}
          </>
        )}

        {/* ══════ COLLECTION TAB ══════ */}
        {activeTab === 'collection' && (
          <CollectionManager
            collection={localCollection.collection}
            onAddSticker={localCollection.addSticker}
            onRemoveSticker={localCollection.removeSticker}
            onSetSwapCount={localCollection.setSwapCount}
            onMergeList={localCollection.mergeList}
            onClearAll={localCollection.clearAll}
            needsCount={localCollection.needsCount}
            swapsCount={localCollection.swapsCount}
            isEmpty={localCollection.isEmpty}
            reservedGiveStickers={reservations.reservedGiveStickers}
            reservedGetStickers={reservations.reservedGetStickers}
          />
        )}

        {/* ╮╮╮╮╮╮ RESERVATIONS TAB ╮╮╮╮╮╮ */}
        {activeTab === 'reservations' && (
          <ReservationsPanel
            reservations={reservations.reservations}
            onConfirm={reservations.confirmReservation}
            onCancel={reservations.cancelReservation}
            onPartialCancel={reservations.partialCancel}
          />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-bg/40 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 text-center flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-text-muted/50 tracking-wider">
            Panini FIFA World Cup 2026 StickerSwap Matcher · Works with Figuritas App & Figuri formats
          </p>
          <div className="flex items-center gap-4 flex-wrap justify-center text-[10px] text-text-muted/40 font-semibold uppercase tracking-wider font-display">
            <a 
              href="https://github.com/pcambre/figuswap" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-violet-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Github size={12} />
              GitHub Repo
            </a>
            <span className="hidden sm:inline opacity-30">·</span>
            <span className="opacity-75 tracking-widest font-bold">World Cup 2026</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
