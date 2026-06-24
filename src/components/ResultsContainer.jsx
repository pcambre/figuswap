import { useState, useEffect, useMemo } from 'react';
import { Copy, Check, FileDown, ArrowRightLeft, CheckCircle, ShieldCheck, Bookmark } from 'lucide-react';
import TradeResultList from './TradeResultList';
import EmptyState from './EmptyState';
import {
  countTotal, countSelected, formatTradeSummary,
  initAllSelected, filterBySelection, isAllSelected,
  generateTradePDF, parseStickerList, getUpdatedList, formatStickerList
} from '../utils/matcherUtils';

// Custom, brand-specific connection icon for summary panel header
const ConnectionIcon = () => (
  <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <circle cx="4" cy="5" r="2" stroke="currentColor" strokeWidth="2" fill="currentColor" />
    <circle cx="20" cy="5" r="2" stroke="currentColor" strokeWidth="2" fill="currentColor" />
    <circle cx="12" cy="19" r="2" stroke="currentColor" strokeWidth="2" fill="currentColor" />
    <path d="M6 7L10 10M18 7L14 10M12 14V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Custom, brand-specific abstract network snapshot icon
const NetworkNodeIcon = () => (
  <svg className="w-5 h-5 text-violet-400/50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M12 5V19" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="#08080C" />
    <circle cx="5" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
    <circle cx="19" cy="12" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
    <circle cx="12" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
    <circle cx="12" cy="19" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" />
  </svg>
);

// Custom, brand-specific fair swap medallion icon
const SwapMedallionIcon = () => (
  <svg className="w-5 h-5 text-violet-400/50" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
    <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9.5 12L12 9.5L14.5 12L12 14.5L9.5 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </svg>
);

/**
 * ResultsContainer — Displays trade results with selectable stickers, clipboard copy, and PDF export.
 *
 * @param {Object} props
 * @param {{ iGiveThem: Object, theyGiveMe: Object }} props.matches
 * @param {string} props.myListRaw
 * @param {boolean} props.hasLocalCollection - Whether a local collection exists
 * @param {function} props.onConfirmSwap - Callback to confirm swap and update local collection
 * @param {function} props.onReserveSwap - Callback to reserve the trade for later
 * @param {Object} props.reservedGiveStickers - { code: Set<string> } stickers already reserved to give
 * @param {Object} props.reservedGetStickers  - { code: Set<string> } stickers already reserved to receive
 */
export default function ResultsContainer({
  matches, myListRaw, hasLocalCollection, onConfirmSwap, onReserveSwap,
  reservedGiveStickers = {}, reservedGetStickers = {}
}) {
  const [copied, setCopied] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('figuritas');
  const [copiedUpdated, setCopiedUpdated] = useState(false);
  const [showSwapConfirm, setShowSwapConfirm] = useState(false);
  const [swapConfirmed, setSwapConfirmed] = useState(false);
  // Reserve state
  const [showReserveForm, setShowReserveForm] = useState(false);
  const [reserveNote, setReserveNote] = useState('');
  const [tradeReserved, setTradeReserved] = useState(false);

  // ── Selection state ──
  const [selGive, setSelGive] = useState(() => initAllSelected(matches.iGiveThem));
  const [selGet, setSelGet] = useState(() => initAllSelected(matches.theyGiveMe));

  // Re-init selection when matches change
  useEffect(() => {
    setSelGive(initAllSelected(matches.iGiveThem));
    setSelGet(initAllSelected(matches.theyGiveMe));
  }, [matches]);

  // ── Totals ──
  const totalGive = countTotal(matches.iGiveThem);
  const totalGet = countTotal(matches.theyGiveMe);
  const totalAll = totalGive + totalGet;
  const selectedGiveCount = countSelected(selGive);
  const selectedGetCount = countSelected(selGet);
  const selectedTotal = selectedGiveCount + selectedGetCount;
  const fair = Math.min(selectedGiveCount, selectedGetCount);

  // ── Filtered data (only selected) ──
  const selectedData = useMemo(() => ({
    iGiveThem: filterBySelection(matches.iGiveThem, selGive),
    theyGiveMe: filterBySelection(matches.theyGiveMe, selGet),
  }), [matches, selGive, selGet]);

  // ── Updated inventory calculations ──
  const originalList = useMemo(() => parseStickerList(myListRaw), [myListRaw]);
  const updatedList = useMemo(() => {
    return getUpdatedList(originalList, selectedData);
  }, [originalList, selectedData]);

  if (totalAll === 0) {
    return <EmptyState />;
  }

  // ── Toggle individual sticker ──
  function toggleSticker(side, code, num) {
    const setter = side === 'give' ? setSelGive : setSelGet;
    setter(prev => {
      const next = { ...prev };
      const set = new Set(next[code] || []);
      if (set.has(num)) {
        set.delete(num);
      } else {
        set.add(num);
      }
      next[code] = set;
      return next;
    });
  }

  // ── Toggle all ──
  function toggleAll(side) {
    const data = side === 'give' ? matches.iGiveThem : matches.theyGiveMe;
    const selection = side === 'give' ? selGive : selGet;
    const setter = side === 'give' ? setSelGive : setSelGet;

    if (isAllSelected(data, selection)) {
      // Deselect all
      const empty = {};
      for (const code of Object.keys(data)) {
        empty[code] = new Set();
      }
      setter(empty);
    } else {
      // Select all
      setter(initAllSelected(data));
    }
  }

  // ── Copy to clipboard (selected only) ──
  const handleCopy = async () => {
    if (selectedTotal === 0) return;
    const text = formatTradeSummary(selectedData);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Copy updated sticker list ──
  const handleCopyUpdatedList = async () => {
    const text = formatStickerList(updatedList, originalList.headers || {}, exportFormat);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUpdated(true);
      setTimeout(() => setCopiedUpdated(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedUpdated(true);
      setTimeout(() => setCopiedUpdated(false), 2000);
    }
  };

  // ── Download updated sticker list file ──
  const handleDownloadUpdatedList = () => {
    const isJson = exportFormat === 'json';
    const text = formatStickerList(updatedList, originalList.headers || {}, exportFormat);
    const blob = new Blob([text], { type: isJson ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `updated-sticker-list.${isJson ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Export PDF (selected only) ──
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await generateTradePDF(selectedData);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setTimeout(() => setExporting(false), 1000);
    }
  };

  return (
    <div id="results-container" className="animate-fade-in-up">
      {/* Results header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-text flex items-center gap-2.5 font-display tracking-tight">
          <span className="text-xl">🔄</span>
          Trade Results
        </h2>
        <div className="flex items-center gap-2">
          {/* PDF Export button */}
          <button
            id="export-pdf"
            onClick={handleExportPDF}
            disabled={selectedTotal === 0 || exporting}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider
              transition-all duration-300 cursor-pointer border
              ${exporting
                ? 'bg-violet-950/40 text-violet-400 border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.1)]'
                : selectedTotal === 0
                  ? 'bg-border/20 text-text-muted/30 border-border/10 cursor-not-allowed'
                  : 'bg-violet-600/10 text-violet-300 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-600/20 hover:shadow-md'
              }`}
          >
            <FileDown size={14} strokeWidth={2.5} className={exporting ? 'animate-bounce' : ''} />
            {exporting ? 'Exporting…' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Summary bar — Floating frosted glass panel with soft violet glow */}
      <div className="glass-panel rounded-2xl p-5 mb-8 animate-scale-in relative overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.04)]">
        {/* Soft glow accent */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-fuchsia-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="flex items-center gap-2.5">
            <ConnectionIcon />
            <span className="text-[10px] font-bold text-violet-300/80 uppercase tracking-widest font-display">
              Trade Summary
            </span>
          </div>
          {selectedTotal < totalAll && (
            <span className="text-[9px] font-bold text-violet-300 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/10 uppercase tracking-wider">
              {selectedTotal} of {totalAll} selected
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <NetworkNodeIcon />
              <div className="text-3xl sm:text-5xl font-extrabold text-violet-400 font-display tabular-nums tracking-tight drop-shadow-[0_0_12px_rgba(139,92,246,0.25)]">
                {selectedGiveCount}
              </div>
            </div>
            <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase mt-2">You give</div>
          </div>
          <div className="flex flex-col items-center border-x border-border/20">
            <div className="flex items-center gap-2">
              <NetworkNodeIcon />
              <div className="text-3xl sm:text-5xl font-extrabold text-violet-400 font-display tabular-nums tracking-tight drop-shadow-[0_0_12px_rgba(139,92,246,0.25)]">
                {selectedGetCount}
              </div>
            </div>
            <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase mt-2">You receive</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <SwapMedallionIcon />
              <div className="text-3xl sm:text-5xl font-extrabold text-violet-400 font-display tabular-nums tracking-tight drop-shadow-[0_0_12px_rgba(139,92,246,0.25)]">
                {fair}
              </div>
            </div>
            <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase mt-2">Fair 1:1 swap</div>
          </div>
        </div>
      </div>

      {/* Trade lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {totalGive > 0 && (
          <TradeResultList
            title="You give them"
            emoji="📤"
            data={matches.iGiveThem}
            total={totalGive}
            selectedCount={selectedGiveCount}
            selection={selGive}
            onToggleSticker={(code, num) => toggleSticker('give', code, num)}
            onToggleAll={() => toggleAll('give')}
            variant="green"
            reservedStickers={reservedGiveStickers}
          />
        )}
        {totalGet > 0 && (
          <TradeResultList
            title="They give you"
            emoji="📥"
            data={matches.theyGiveMe}
            total={totalGet}
            selectedCount={selectedGetCount}
            selection={selGet}
            onToggleSticker={(code, num) => toggleSticker('get', code, num)}
            onToggleAll={() => toggleAll('get')}
            variant="blue"
            reservedStickers={reservedGetStickers}
          />
        )}
      </div>

      {/* Export Updated List Panel */}
      <div className="mt-8 border border-border/30 bg-[#101018]/50 rounded-2xl p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01),0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm animate-scale-in">
        <div className="flex items-center gap-2 mb-2">
          <ArrowRightLeft size={14} className="text-violet-400" />
          <h4 className="text-xs font-bold font-display tracking-widest text-violet-300 uppercase">
            Export Updated Inventory
          </h4>
        </div>
        <p className="text-xs text-text-muted/65 mb-4 max-w-lg leading-relaxed">
          Get your updated sticker list after applying this trade (removed duplicates you gave away and needs you received).
        </p>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          {/* Segmented control for formats */}
          <div className="flex bg-[#08080C]/80 p-1 rounded-xl border border-border/40 gap-1 flex-grow">
            {['figuritas', 'figuri', 'json'].map((fmt) => (
              <button
                key={fmt}
                onClick={() => setExportFormat(fmt)}
                className={`flex-1 text-center py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer
                  ${exportFormat === fmt
                    ? 'bg-violet-600 text-white shadow-[0_2px_8px_rgba(139,92,246,0.25)]'
                    : 'text-text-muted/60 hover:text-text hover:bg-surface/30'
                  }`}
              >
                {fmt === 'figuritas' ? 'Figuritas' : fmt === 'figuri' ? 'Figuri' : 'JSON'}
              </button>
            ))}
          </div>

          {/* Copy & Download action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleCopyUpdatedList}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer border shrink-0
                ${copiedUpdated
                  ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-violet-600/10 text-violet-300 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-600/20 hover:shadow-md'
                }`}
            >
              {copiedUpdated ? (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={2.5} />
                  Copy List
                </>
              )}
            </button>
            <button
              onClick={handleDownloadUpdatedList}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer border bg-violet-600/10 text-violet-300 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-600/20 hover:shadow-md shrink-0"
            >
              <FileDown size={14} strokeWidth={2.5} />
              Download File
            </button>
          </div>
        </div>
      </div>

      {/* ── Reserve Trade Panel ── */}
      {hasLocalCollection && onReserveSwap && (
        <div className={`mt-6 rounded-2xl border p-5 transition-all duration-500 backdrop-blur-sm animate-scale-in
          ${tradeReserved
            ? 'bg-amber-950/20 border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]'
            : 'bg-gradient-to-r from-amber-950/15 to-orange-950/10 border-amber-500/15 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
          }`}
        >
          {tradeReserved ? (
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/25 shrink-0">
                <Bookmark size={22} className="text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-300 font-display">Trade Reserved!</h4>
                <p className="text-xs text-amber-400/60 mt-1">Saved for later — confirm or cancel it anytime from the Reservations tab.</p>
              </div>
            </div>
          ) : !showReserveForm ? (
            <button
              onClick={() => setShowReserveForm(true)}
              disabled={selectedTotal === 0}
              className={`w-full flex items-center justify-between gap-4 cursor-pointer group
                ${selectedTotal === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-amber-500/12 border border-amber-500/18 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                  <Bookmark size={22} className="text-amber-400" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-text group-hover:text-amber-300 font-display transition-colors">Reserve Trade for Later</h4>
                  <p className="text-xs text-text-muted/50 mt-1">Save this trade without committing — confirm or cancel it anytime.</p>
                </div>
              </div>
              <div className="shrink-0 text-[10px] font-bold font-display tracking-wider uppercase px-4 py-2 rounded-xl
                bg-amber-500/10 border border-amber-500/20 text-amber-300 group-hover:bg-amber-500/18 transition-colors">
                Reserve
              </div>
            </button>
          ) : (
            <div className="animate-slide-down">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-amber-500/12 border border-amber-500/20 shrink-0">
                  <Bookmark size={22} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text font-display mb-2">Reserve this trade?</h4>
                  <input
                    type="text"
                    value={reserveNote}
                    onChange={e => setReserveNote(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (() => {
                      onReserveSwap(selectedData, reserveNote);
                      setTradeReserved(true);
                      setShowReserveForm(false);
                    })()}
                    placeholder="Optional note (e.g. with Matías)..."
                    className="w-full px-3 py-2 rounded-xl border border-amber-500/20 bg-[#0C0C14]/85 text-xs
                      text-text placeholder:text-text-muted/25
                      focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/30
                      transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 ml-[60px]">
                <button
                  onClick={() => {
                    onReserveSwap(selectedData, reserveNote);
                    setTradeReserved(true);
                    setShowReserveForm(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider
                    bg-gradient-to-r from-amber-500 to-orange-500 text-white border border-amber-500/30
                    hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] hover:scale-[1.02] active:scale-[0.98]
                    transition-all cursor-pointer"
                >
                  <Bookmark size={14} />
                  Yes, Reserve
                </button>
                <button
                  onClick={() => setShowReserveForm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider
                    text-text-muted border border-border/30 hover:bg-surface/40 hover:text-text
                    transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Confirm Swap Panel ── */}
      {hasLocalCollection && onConfirmSwap && (
        <div className={`mt-6 rounded-2xl border p-5 transition-all duration-500 backdrop-blur-sm animate-scale-in
          ${swapConfirmed
            ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]'
            : 'bg-gradient-to-r from-violet-950/25 to-fuchsia-950/15 border-violet-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
          }`}
        >
          {swapConfirmed ? (
            <div className="flex items-center gap-4 animate-fade-in">
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 shrink-0">
                <CheckCircle size={22} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-300 font-display">Swap Confirmed!</h4>
                <p className="text-xs text-emerald-400/60 mt-1">Your collection has been updated — given stickers removed from duplicates, received stickers removed from needs.</p>
              </div>
            </div>
          ) : !showSwapConfirm ? (
            <button
              onClick={() => setShowSwapConfirm(true)}
              disabled={selectedTotal === 0}
              className={`w-full flex items-center justify-between gap-4 cursor-pointer group
                ${selectedTotal === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/15 border border-violet-500/20 shrink-0 group-hover:bg-violet-500/25 transition-colors">
                  <ShieldCheck size={22} className="text-violet-400" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-text group-hover:text-violet-300 font-display transition-colors">Confirm Swap & Update Collection</h4>
                  <p className="text-xs text-text-muted/50 mt-1">Apply this trade to your saved collection — {selectedGiveCount} stickers out, {selectedGetCount} stickers in.</p>
                </div>
              </div>
              <div className="shrink-0 text-[10px] font-bold font-display tracking-wider uppercase px-4 py-2 rounded-xl
                bg-violet-500/10 border border-violet-500/25 text-violet-300 group-hover:bg-violet-500/20 transition-colors">
                Confirm
              </div>
            </button>
          ) : (
            <div className="animate-slide-down">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/25 shrink-0">
                  <ShieldCheck size={22} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text font-display">Confirm this swap?</h4>
                  <p className="text-xs text-text-muted/60 mt-1 leading-relaxed">
                    This will update your saved collection:<br />
                    <span className="text-emerald-400/80">• Remove {selectedGiveCount} stickers from your duplicates</span><br />
                    <span className="text-indigo-400/80">• Remove {selectedGetCount} stickers from your needs</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-[60px]">
                <button
                  onClick={() => {
                    onConfirmSwap(selectedData);
                    setSwapConfirmed(true);
                    setShowSwapConfirm(false);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider
                    bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border border-violet-500/20
                    hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:scale-[1.02] active:scale-[0.98]
                    transition-all cursor-pointer"
                >
                  <CheckCircle size={14} />
                  Yes, Confirm Swap
                </button>
                <button
                  onClick={() => setShowSwapConfirm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider
                    text-text-muted border border-border/30 hover:bg-surface/40 hover:text-text
                    transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Large glowing copy panel button at bottom */}
      <button
        onClick={handleCopy}
        disabled={selectedTotal === 0}
        className={`w-full group mt-6 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-left transition-all duration-300 border backdrop-blur-sm cursor-pointer
          ${copied
            ? 'bg-emerald-950/20 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)] text-emerald-300'
            : selectedTotal === 0
              ? 'bg-[#12121A]/20 border-border/10 text-text-muted/40 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-violet-950/20 to-fuchsia-950/10 border-violet-500/20 hover:border-violet-500/50 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:scale-[1.005] active:scale-[0.995]'
          }`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl border shrink-0 transition-colors duration-300
            ${copied 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : selectedTotal === 0
                ? 'bg-[#08080C] border-border/20 text-text-muted/20'
                : 'bg-violet-500/15 border-violet-500/20 text-violet-400 group-hover:bg-violet-500/25 group-hover:text-violet-300'
            }`}
          >
            {copied ? <Check size={20} strokeWidth={2.5} /> : <Copy size={20} strokeWidth={2} />}
          </div>
          <div>
            <h4 className={`text-sm font-bold font-display tracking-wide transition-colors
              ${copied
                ? 'text-emerald-300'
                : selectedTotal === 0
                  ? 'text-text-muted/40'
                  : 'text-text group-hover:text-violet-300'
              }`}
            >
              {copied ? 'Trade Summary Copied!' : 'Copy Trade Summary'}
            </h4>
            <p className="text-xs text-text-muted/50 mt-1 max-w-md">
              {copied
                ? 'The selected trade stickers have been copied to your clipboard in a clean format.'
                : 'Copy the list of selected stickers to send directly to your friend in a text message.'}
            </p>
          </div>
        </div>
        
        {/* Right side CTA detail */}
        {selectedTotal > 0 && (
          <div className={`shrink-0 flex items-center gap-2 text-[10px] font-bold font-display tracking-wider uppercase px-4 py-2 rounded-xl transition-all duration-300
            ${copied
              ? 'bg-emerald-500/15 border border-emerald-500/35 text-emerald-300'
              : 'bg-violet-500/10 border border-violet-500/25 text-violet-300 group-hover:bg-violet-500/20'
            }`}
          >
            {copied ? 'SUCCESS' : `COPY ${selectedTotal} STICKERS`}
          </div>
        )}
      </button>
    </div>
  );
}
