import { useState, useRef } from 'react';
import { Plus, Trash2, Upload, X, Package, AlertTriangle, Search, ChevronDown, FileUp, Download, FileDown, Check, Copy } from 'lucide-react';
import { parseStickerList, countTotal } from '../utils/matcherUtils';
import { formatCollection } from '../utils/localStorageUtils';

/**
 * Predefined FIFA World Cup 2026 country codes with flag emojis.
 */
export const COUNTRY_OPTIONS = [
  { code: 'FWC', label: 'FWC 🏆', flag: '🏆' },
  { code: 'CC', label: 'CC 🥤', flag: '🥤' },
  { code: 'ALG', label: 'ALG 🇩🇿', flag: '🇩🇿' },
  { code: 'ARG', label: 'ARG 🇦🇷', flag: '🇦🇷' },
  { code: 'AUS', label: 'AUS 🇦🇺', flag: '🇦🇺' },
  { code: 'AUT', label: 'AUT 🇦🇹', flag: '🇦🇹' },
  { code: 'BEL', label: 'BEL 🇧🇪', flag: '🇧🇪' },
  { code: 'BIH', label: 'BIH 🇧🇦', flag: '🇧🇦' },
  { code: 'BRA', label: 'BRA 🇧🇷', flag: '🇧🇷' },
  { code: 'CAN', label: 'CAN 🇨🇦', flag: '🇨🇦' },
  { code: 'CIV', label: 'CIV 🇨🇮', flag: '🇨🇮' },
  { code: 'COD', label: 'COD 🇨🇩', flag: '🇨🇩' },
  { code: 'COL', label: 'COL 🇨🇴', flag: '🇨🇴' },
  { code: 'CPV', label: 'CPV 🇨🇻', flag: '🇨🇻' },
  { code: 'CRO', label: 'CRO 🇭🇷', flag: '🇭🇷' },
  { code: 'CUW', label: 'CUW 🇨🇼', flag: '🇨🇼' },
  { code: 'CZE', label: 'CZE 🇨🇿', flag: '🇨🇿' },
  { code: 'ECU', label: 'ECU 🇪🇨', flag: '🇪🇨' },
  { code: 'EGY', label: 'EGY 🇪🇬', flag: '🇪🇬' },
  { code: 'ENG', label: 'ENG 🏴󠁧󠁢󠁥󠁮󠁧󠁿', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  { code: 'ESP', label: 'ESP 🇪🇸', flag: '🇪🇸' },
  { code: 'FRA', label: 'FRA 🇫🇷', flag: '🇫🇷' },
  { code: 'GER', label: 'GER 🇩🇪', flag: '🇩🇪' },
  { code: 'GHA', label: 'GHA 🇬🇭', flag: '🇬🇭' },
  { code: 'HAI', label: 'HAI 🇭🇹', flag: '🇭🇹' },
  { code: 'IRN', label: 'IRN 🇮🇷', flag: '🇮🇷' },
  { code: 'IRQ', label: 'IRQ 🇮🇶', flag: '🇮🇶' },
  { code: 'JOR', label: 'JOR 🇯🇴', flag: '🇯🇴' },
  { code: 'JPN', label: 'JPN 🇯🇵', flag: '🇯🇵' },
  { code: 'KOR', label: 'KOR 🇰🇷', flag: '🇰🇷' },
  { code: 'KSA', label: 'KSA 🇸🇦', flag: '🇸🇦' },
  { code: 'MAR', label: 'MAR 🇲🇦', flag: '🇲🇦' },
  { code: 'MEX', label: 'MEX 🇲🇽', flag: '🇲🇽' },
  { code: 'NED', label: 'NED 🇳🇱', flag: '🇳🇱' },
  { code: 'NOR', label: 'NOR 🇳🇴', flag: '🇳🇴' },
  { code: 'NZL', label: 'NZL 🇳🇿', flag: '🇳🇿' },
  { code: 'PAN', label: 'PAN 🇵🇦', flag: '🇵🇦' },
  { code: 'PAR', label: 'PAR 🇵🇾', flag: '🇵🇾' },
  { code: 'POR', label: 'POR 🇵🇹', flag: '🇵🇹' },
  { code: 'QAT', label: 'QAT 🇶🇦', flag: '🇶🇦' },
  { code: 'RSA', label: 'RSA 🇿🇦', flag: '🇿🇦' },
  { code: 'SCO', label: 'SCO 🏴󠁧󠁢󠁳󠁣󠁴󠁿', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { code: 'SEN', label: 'SEN 🇸🇳', flag: '🇸🇳' },
  { code: 'SUI', label: 'SUI 🇨🇭', flag: '🇨🇭' },
  { code: 'SWE', label: 'SWE 🇸🇪', flag: '🇸🇪' },
  { code: 'TUN', label: 'TUN 🇹🇳', flag: '🇹🇳' },
  { code: 'TUR', label: 'TUR 🇹🇷', flag: '🇹🇷' },
  { code: 'URU', label: 'URU 🇺🇾', flag: '🇺🇾' },
  { code: 'USA', label: 'USA 🇺🇸', flag: '🇺🇸' },
  { code: 'UZB', label: 'UZB 🇺🇿', flag: '🇺🇿' },
];

/**
 * SearchableCountrySelect — Dropdown with search for country codes.
 */
function SearchableCountrySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  const filtered = COUNTRY_OPTIONS.filter(opt =>
    opt.code.toLowerCase().includes(search.toLowerCase()) ||
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const selected = COUNTRY_OPTIONS.find(o => o.code === value);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-border/60 bg-[#0C0C14]/85
          text-sm text-text cursor-pointer hover:border-primary/40 transition-colors"
      >
        <span className="flex-1 text-left truncate">
          {selected ? selected.label : 'Select country...'}
        </span>
        <ChevronDown size={14} className={`text-text-muted/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-[#12121A] border border-border/60
          rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.7)] overflow-hidden animate-slide-down">
          {/* Search input */}
          <div className="p-2 border-b border-border/30">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#08080C] rounded-lg border border-border/40">
              <Search size={12} className="text-text-muted/50 shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="bg-transparent text-xs text-text outline-none w-full placeholder:text-text-muted/30"
                autoFocus
              />
            </div>
          </div>
          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(opt => (
              <button
                key={opt.code}
                type="button"
                onClick={() => { onChange(opt.code); setOpen(false); setSearch(''); }}
                className={`w-full px-4 py-2 text-left text-xs font-medium cursor-pointer transition-colors
                  ${opt.code === value
                    ? 'bg-violet-600/15 text-violet-300'
                    : 'text-text/80 hover:bg-surface-hover hover:text-text'
                  }`}
              >
                {opt.label}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-xs text-text-muted/50 text-center">No matches</div>
            )}
          </div>
        </div>
      )}

      {/* Click-outside handler */}
      {open && (
        <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); setSearch(''); }} />
      )}
    </div>
  );
}

/**
 * StickerPill — badge with optional delete, count badge, and +/- for swaps.
 */
function StickerPill({ num, variant, onRemove, reservedType, count, onDecrement, onIncrement }) {
  const baseColors = variant === 'need'
    ? 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-400/25'
    : 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/25';

  const reservedRing = reservedType === 'give'
    ? 'ring-2 ring-orange-400/60 shadow-[0_0_8px_rgba(251,146,60,0.3)]'
    : reservedType === 'get'
      ? 'ring-2 ring-indigo-400/60 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
      : '';

  const showCount = count !== undefined && variant === 'swap';

  return (
    <span className={`collection-pill inline-flex items-center gap-0.5 h-8 px-1.5 rounded-lg text-xs font-semibold tabular-nums relative ${baseColors} ${reservedRing}`}>
      {reservedType && (
        <span
          className="absolute -top-1.5 -right-1.5 text-[9px] leading-none"
          title={reservedType === 'give' ? 'Reserved to give away' : 'Expected to receive'}
        >
          🔖
        </span>
      )}

      {/* Decrement button (swaps only) */}
      {onDecrement && (
        <button
          onClick={onDecrement}
          className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer opacity-60 hover:opacity-100"
          title="Remove one copy"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect y="4" width="10" height="2" rx="1"/></svg>
        </button>
      )}

      {/* Number */}
      <span className="px-1">{num}</span>

      {/* Count badge (only when > 1) */}
      {showCount && count > 1 && (
        <span className="text-[9px] font-bold bg-emerald-400/20 text-emerald-300 px-1 py-0.5 rounded-md leading-none">
          ×{count}
        </span>
      )}

      {/* Increment button (swaps only) */}
      {onIncrement && (
        <button
          onClick={onIncrement}
          className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer opacity-60 hover:opacity-100"
          title="Add one more copy"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><rect y="4" width="10" height="2" rx="1"/><rect x="4" width="2" height="10" rx="1"/></svg>
        </button>
      )}

      {/* Remove all copies */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 p-0.5 rounded-md hover:bg-white/10 transition-colors cursor-pointer text-current opacity-40 hover:opacity-100 hover:text-red-400"
          title={`Remove all copies of ${num}`}
        >
          <X size={10} strokeWidth={3} />
        </button>
      )}
    </span>
  );
}

/**
 * CollectionManager — Full panel for managing the user's sticker collection.
 */
export default function CollectionManager({
  collection,
  onAddSticker,
  onRemoveSticker,
  onSetSwapCount,
  onMergeList,
  onClearAll,
  needsCount,
  swapsCount,
  isEmpty,
  reservedGiveStickers = {},
  reservedGetStickers = {},
}) {
  // Add sticker form state
  const [addSection, setAddSection] = useState('needs');
  const [addCountry, setAddCountry] = useState('');
  const [addNumbers, setAddNumbers] = useState('');

  // Bulk import state
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importFeedback, setImportFeedback] = useState(null);

  // Clear confirmation
  const [confirmClear, setConfirmClear] = useState(false);

  // Bulk export state
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState('figuritas');
  const [copiedExport, setCopiedExport] = useState(false);

  const handleCopyCollection = async () => {
    const text = formatCollection(collection, exportFormat);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 2000);
    }
  };

  const handleDownloadCollection = () => {
    const isJson = exportFormat === 'json';
    const text = formatCollection(collection, exportFormat);
    const blob = new Blob([text], { type: isJson ? 'application/json' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-sticker-collection.${isJson ? 'json' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Search filter for viewing collection
  const [filterSearch, setFilterSearch] = useState('');

  const handleAddStickers = () => {
    if (!addCountry || !addNumbers.trim()) return;

    const nums = addNumbers.split(',').map(n => n.trim()).filter(Boolean);
    const option = COUNTRY_OPTIONS.find(o => o.code === addCountry);
    const header = option ? option.label : addCountry;

    for (const num of nums) {
      onAddSticker(addSection, addCountry, num, header);
    }
    setAddNumbers('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddStickers();
    }
  };

  const processImportText = (text) => {
    if (!text.trim()) return;

    let parsed;
    try {
      const jsonObj = JSON.parse(text);
      if (jsonObj && typeof jsonObj === 'object' && (jsonObj.needs || jsonObj.swaps)) {
        parsed = {
          needs: jsonObj.needs || {},
          swaps: jsonObj.swaps || {},
          headers: jsonObj.headers || {}
        };
      } else {
        throw new Error('Invalid JSON');
      }
    } catch {
      parsed = parseStickerList(text);
    }

    const needsN = countTotal(parsed.needs);
    const swapsN = countTotal(parsed.swaps);

    if (needsN === 0 && swapsN === 0) {
      setImportFeedback({ type: 'error', msg: 'Could not parse any stickers. Check the format.' });
      return;
    }

    onMergeList(parsed);
    setImportFeedback({ type: 'success', msg: `Imported ${needsN} needs + ${swapsN} swaps` });
    setImportText('');
    setTimeout(() => {
      setImportFeedback(null);
      setShowImport(false);
    }, 2000);
  };

  const handleBulkImport = () => {
    processImportText(importText);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      processImportText(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    onClearAll();
    setConfirmClear(false);
  };

  // Build section view data
  const renderSection = (title, emoji, sectionData, sectionKey, variant) => {
    const codes = Object.keys(sectionData).sort().filter(code => {
      if (!filterSearch.trim()) return true;
      return code.toLowerCase().includes(filterSearch.toLowerCase());
    });
    const total = codes.reduce((sum, c) => sum + (sectionData[c]?.length || 0), 0);

    return (
      <div className="rounded-2xl border border-border/20 bg-[#101018]/50 overflow-hidden backdrop-blur-sm
        shadow-[inset_0_1px_1px_rgba(255,255,255,0.01),0_12px_40px_rgba(0,0,0,0.5)]">
        {/* Section header */}
        <div className={`px-5 py-4 flex items-center justify-between border-b border-border/20
          ${variant === 'need'
            ? 'bg-gradient-to-r from-amber-500/8 to-transparent border-l-4 border-l-amber-400'
            : 'bg-gradient-to-r from-emerald-500/8 to-transparent border-l-4 border-l-emerald-400'
          }`}
        >
          <h3 className="text-sm font-bold text-text flex items-center gap-2 font-display">
            <span>{emoji}</span> {title}
          </h3>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full tabular-nums tracking-wider
            ${variant === 'need'
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {total} stickers
          </span>
        </div>

        {/* Country rows */}
        {codes.length === 0 ? (
          <div className="px-5 py-8 text-center text-xs text-text-muted/40">
            {filterSearch ? 'No matching countries' : 'No stickers yet — add some above!'}
          </div>
        ) : (
          <div className="divide-y divide-border/15">
            {codes.map((code, idx) => {
              const header = collection.headers[code] || code;
              return (
                <div
                  key={code}
                  className="flex items-start gap-4 px-5 py-3 hover:bg-white/[0.015] transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.02}s` }}
                >
                  <span className="text-[11px] font-bold text-text-muted w-14 pt-1.5 tracking-widest tabular-nums shrink-0 font-display"
                    title={header}
                  >
                    {code}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {sectionData[code].map(num => {
                      const isGiveReserved = sectionKey === 'swaps' && reservedGiveStickers[code]?.has(num);
                      const isGetReserved  = sectionKey === 'needs'  && reservedGetStickers[code]?.has(num);
                      const reservedType   = isGiveReserved ? 'give' : isGetReserved ? 'get' : null;
                      const count          = sectionKey === 'swaps'
                        ? (collection.swapCounts?.[code]?.[num] || 1)
                        : undefined;
                      return (
                        <StickerPill
                          key={num}
                          num={num}
                          variant={sectionKey === 'swaps' ? 'swap' : 'need'}
                          reservedType={reservedType}
                          count={count}
                          onDecrement={sectionKey === 'swaps'
                            ? () => onRemoveSticker('swaps', code, num)       // decrements by 1
                            : undefined}
                          onIncrement={sectionKey === 'swaps' && onSetSwapCount
                            ? () => onSetSwapCount(code, num, count + 1)
                            : undefined}
                          onRemove={() => onRemoveSticker(sectionKey, code, num, true)} // force remove all
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in-up">
      {/* Stats bar */}
      <div className="glass-panel rounded-2xl p-5 mb-6 relative overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.04)]">
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-fuchsia-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div className="flex items-center gap-2.5">
            <Package size={16} className="text-violet-400" />
            <span className="text-[10px] font-bold text-violet-300/80 uppercase tracking-widest font-display">
              My Collection
            </span>
          </div>
          {!isEmpty && (
            <div className="flex items-center gap-2">
              {!confirmClear && (
                <button
                  onClick={() => setShowExport(!showExport)}
                  className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5
                    rounded-lg transition-all cursor-pointer border
                    ${showExport
                      ? 'bg-violet-600/20 text-violet-300 border-violet-500/30'
                      : 'text-text-muted/50 hover:text-violet-300 hover:bg-violet-600/10 border-border/30 hover:border-violet-500/20'
                    }`}
                >
                  <Download size={11} />
                  <span>Export</span>
                </button>
              )}

              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5
                    rounded-lg transition-all cursor-pointer
                    text-text-muted/50 hover:text-red-400 hover:bg-red-500/10
                    border border-border/30 hover:border-red-500/20"
                >
                  <Trash2 size={11} />
                  <span className="hidden sm:inline">Clear All</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 animate-slide-down">
                  <span className="text-[10px] text-red-400 font-bold">Are you sure?</span>
                  <button
                    onClick={handleClearAll}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-red-600/20 text-red-300
                      border border-red-500/30 hover:bg-red-600/30 cursor-pointer transition-colors"
                  >
                    Yes, clear
                  </button>
                  <button
                    onClick={() => setConfirmClear(false)}
                    className="text-[10px] font-bold px-2 py-1 rounded-lg bg-surface/30 text-text-muted
                      border border-border/30 hover:bg-surface/60 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-display tabular-nums tracking-tight">
              {needsCount}
            </div>
            <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase mt-1">I Need</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-display tabular-nums tracking-tight">
              {swapsCount}
            </div>
            <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase mt-1">Duplicates</div>
          </div>
        </div>
      </div>

      {/* Export Panel */}
      {showExport && !isEmpty && (
        <div className="glass-panel rounded-2xl p-5 mb-6 border border-border/30 bg-[#101018]/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01),0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm animate-scale-in">
          <div className="flex items-center gap-2 mb-2">
            <FileDown size={14} className="text-violet-400" />
            <h4 className="text-xs font-bold font-display tracking-widest text-violet-300 uppercase">
              Export My Collection
            </h4>
          </div>
          <p className="text-xs text-text-muted/65 mb-4 max-w-lg leading-relaxed">
            Export your entire collection (needs and duplicates) in Figuritas format, Figuri format, or structured JSON.
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
                onClick={handleCopyCollection}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer border shrink-0
                  ${copiedExport
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-violet-600/10 text-violet-300 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-600/20 hover:shadow-md'
                  }`}
              >
                {copiedExport ? (
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
                onClick={handleDownloadCollection}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all duration-300 cursor-pointer border bg-violet-600/10 text-violet-300 border-violet-500/20 hover:border-violet-500/40 hover:bg-violet-600/20 hover:shadow-md shrink-0"
              >
                <FileDown size={14} strokeWidth={2.5} />
                Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add sticker form */}
      <div className="glass-panel rounded-2xl p-5 mb-6">
        <h3 className="text-xs font-bold text-text/80 uppercase tracking-widest font-display mb-4 flex items-center gap-2">
          <Plus size={14} className="text-violet-400" />
          Add Stickers
        </h3>

        {/* Section toggle */}
        <div className="flex bg-[#08080C]/80 p-1 rounded-xl border border-border/40 gap-1 mb-4">
          {[
            { key: 'needs', label: 'I Need', emoji: '❌' },
            { key: 'swaps', label: 'Duplicates', emoji: '🔁' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setAddSection(opt.key)}
              className={`flex-1 text-center py-2 rounded-lg text-xs font-bold font-display uppercase tracking-wider transition-all cursor-pointer
                ${addSection === opt.key
                  ? opt.key === 'needs'
                    ? 'bg-amber-600/20 text-amber-300 shadow-[0_2px_8px_rgba(245,158,11,0.15)]'
                    : 'bg-emerald-600/20 text-emerald-300 shadow-[0_2px_8px_rgba(16,185,129,0.15)]'
                  : 'text-text-muted/60 hover:text-text hover:bg-surface/30'
                }`}
            >
              {opt.emoji} {opt.label}
            </button>
          ))}
        </div>

        {/* Country + Numbers input row */}
        <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr_auto] gap-3 items-end">
          <div>
            <label className="text-[10px] text-text-muted/60 font-bold uppercase tracking-wider mb-1.5 block">Country</label>
            <SearchableCountrySelect value={addCountry} onChange={setAddCountry} />
          </div>
          <div>
            <label className="text-[10px] text-text-muted/60 font-bold uppercase tracking-wider mb-1.5 block">
              Sticker Numbers <span className="text-text-muted/30">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={addNumbers}
              onChange={(e) => setAddNumbers(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. 3, 5, 7, 15"
              className="w-full px-3 py-2.5 rounded-xl border border-border/60 bg-[#0C0C14]/85 text-sm
                text-text placeholder:text-text-muted/30
                focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                transition-all"
            />
          </div>
          <button
            onClick={handleAddStickers}
            disabled={!addCountry || !addNumbers.trim()}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold
              font-display uppercase tracking-wider transition-all cursor-pointer border
              ${!addCountry || !addNumbers.trim()
                ? 'bg-border/20 text-text-muted/30 border-border/10 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white border-violet-500/20 hover:shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:scale-[1.02] active:scale-[0.98]'
              }`}
          >
            <Plus size={14} strokeWidth={2.5} />
            Add
          </button>
        </div>

        {/* Bulk import toggle */}
        <div className="mt-4 pt-4 border-t border-border/20">
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center gap-2 text-[10px] font-bold text-violet-300/60 uppercase tracking-wider
              hover:text-violet-300 transition-colors cursor-pointer"
          >
            <Upload size={12} />
            {showImport ? 'Hide' : 'Bulk Import or Upload File'}
          </button>

          {showImport && (
            <div className="mt-3 animate-slide-down">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your full sticker list here (JSON, Figuritas, or Figuri format)..."
                className="w-full h-32 px-4 py-3 rounded-xl border border-border/60 bg-[#0C0C14]/85 text-sm
                  text-text leading-relaxed resize-y placeholder:text-text-muted/25
                  focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
                spellCheck={false}
              />
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <button
                  onClick={handleBulkImport}
                  disabled={!importText.trim()}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider
                    transition-all cursor-pointer border
                    ${!importText.trim()
                      ? 'bg-border/20 text-text-muted/30 border-border/10 cursor-not-allowed'
                      : 'bg-violet-600/15 text-violet-300 border-violet-500/20 hover:bg-violet-600/25 hover:border-violet-500/40'
                    }`}
                >
                  <Upload size={12} />
                  Import Text
                </button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json,.txt"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider
                      transition-all border bg-surface/40 text-text-muted border-border/40 hover:bg-surface/80 hover:text-text"
                  >
                    <FileUp size={12} />
                    Upload File
                  </button>
                </div>
                {importFeedback && (
                  <span className={`text-xs font-semibold animate-fade-in ${
                    importFeedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {importFeedback.type === 'success' ? '✓' : '⚠️'} {importFeedback.msg}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search filter for collection */}
      {!isEmpty && (
        <div className="mb-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0C0C14]/60 rounded-xl border border-border/40 max-w-xs">
            <Search size={13} className="text-text-muted/40 shrink-0" />
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Filter by country code..."
              className="bg-transparent text-xs text-text outline-none w-full placeholder:text-text-muted/25"
            />
            {filterSearch && (
              <button onClick={() => setFilterSearch('')} className="text-text-muted/40 hover:text-text cursor-pointer">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Collection sections */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-surface/40 flex items-center justify-center mb-5 border border-border/60">
            <Package size={24} className="text-violet-400/60" />
          </div>
          <h3 className="text-base font-bold text-text mb-2 font-display">Your collection is empty</h3>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            Start adding stickers manually above, or use Bulk Import to paste your full list from Figuritas or Figuri.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {renderSection('I Need', '❌', collection.needs, 'needs', 'need')}
          {renderSection('My Duplicates (Swaps)', '🔁', collection.swaps, 'swaps', 'swap')}
        </div>
      )}
    </div>
  );
}
