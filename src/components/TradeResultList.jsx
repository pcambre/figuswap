import { CheckSquare, Square } from 'lucide-react';
import { isAllSelected } from '../utils/matcherUtils';

// Custom, brand-specific specialized give symbol (node connection outflow)
const OutflowIcon = () => (
  <svg className="w-5 h-5 text-emerald-400 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="M8 16L16 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
    <circle cx="18" cy="6" r="2.5" stroke="currentColor" strokeWidth="2" fill="currentColor" />
    <path d="M13 6H18V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Custom, brand-specific specialized receive symbol (node connection inflow)
const InflowIcon = () => (
  <svg className="w-5 h-5 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="2" />
    <path d="M8 8L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 2" />
    <circle cx="18" cy="18" r="2.5" stroke="currentColor" strokeWidth="2" fill="currentColor" />
    <path d="M18 13V18H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/**
 * TradeResultList — Renders grouped stickers with selectable pill-shaped number badges.
 * reservedStickers: { [countryCode]: Set<string> } — stickers already in a pending reservation
 */
export default function TradeResultList({
  title, emoji, data, total, selectedCount, selection,
  onToggleSticker, onToggleAll, variant = 'blue',
  reservedStickers = {}
}) {
  const codes = Object.keys(data).sort();
  const allSelected = isAllSelected(data, selection);

  const colors = {
    green: {
      border: 'border-emerald-500/10',
      bg: 'bg-emerald-950/5 hover:bg-emerald-950/10 transition-colors',
      headerBg: 'bg-gradient-to-r from-emerald-500/10 to-transparent border-l-4 border-emerald-400 border-b border-border/20',
      pillSelected: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/30 font-semibold shadow-[0_2px_8px_rgba(16,185,129,0.08)]',
      pillUnselected: 'bg-[#181824] text-text/80 hover:text-text hover:bg-[#242436] ring-1 ring-dashed ring-text-muted/30',
      badge: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
      checkColor: 'text-emerald-400',
      headerIcon: <OutflowIcon />
    },
    blue: {
      border: 'border-indigo-500/10',
      bg: 'bg-indigo-950/5 hover:bg-indigo-950/10 transition-colors',
      headerBg: 'bg-gradient-to-r from-indigo-500/10 to-transparent border-l-4 border-indigo-400 border-b border-border/20',
      pillSelected: 'bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-400/30 font-semibold shadow-[0_2px_8px_rgba(99,102,241,0.08)]',
      pillUnselected: 'bg-[#181824] text-text/80 hover:text-text hover:bg-[#242436] ring-1 ring-dashed ring-text-muted/30',
      badge: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
      checkColor: 'text-indigo-400',
      headerIcon: <InflowIcon />
    },
  };

  const c = colors[variant];

  return (
    <div
      className={`rounded-2xl border ${c.border} bg-[#101018]/50 overflow-hidden animate-scale-in shadow-[inset_0_1px_1px_rgba(255,255,255,0.01),0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-sm`}
    >
      {/* Header */}
      <div className={`px-5 py-4 ${c.headerBg} flex items-center justify-between`}>
        <h3 className="text-sm font-bold text-text flex items-center gap-2.5 font-display">
          {c.headerIcon}
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {/* Selected count badge */}
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${c.badge} tabular-nums tracking-wider`}>
            {selectedCount}/{total}
          </span>
          {/* Select All / Deselect All toggle */}
          <button
            onClick={onToggleAll}
            className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5
              rounded-lg transition-all duration-200 cursor-pointer
              bg-surface/30 border border-border/30 hover:border-border/80 hover:bg-surface/60
              ${allSelected
                ? 'text-text-muted hover:text-red-400 hover:border-red-500/20'
                : `${c.checkColor} hover:text-white`
              }`}
            title={allSelected ? 'Deselect all' : 'Select all'}
          >
            {allSelected ? (
              <>
                <CheckSquare size={12} strokeWidth={2.5} />
                <span className="hidden sm:inline">Deselect All</span>
              </>
            ) : (
              <>
                <Square size={12} strokeWidth={2.5} />
                <span className="hidden sm:inline">Select All</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Country rows */}
      <div className="divide-y divide-border/20">
        {codes.map((code, idx) => {
          const codeSelection = selection[code] || new Set();
          return (
            <div
              key={code}
              className={`flex items-start gap-4 px-5 py-3.5 ${c.bg} animate-fade-in-up`}
              style={{ animationDelay: `${idx * 0.03}s` }}
            >
              {/* Country code */}
              <span className="text-[11px] font-bold text-text-muted w-10 pt-1 tracking-widest tabular-nums shrink-0 font-display">
                {code}
              </span>

              {/* Sticker number pills — clickable */}
              <div className="flex flex-wrap gap-1.5">
                {data[code].map(num => {
                  const isSelected = codeSelection.has(num);
                  const isReserved = !!reservedStickers[code]?.has(num);
                  return (
                    <button
                      key={num}
                      onClick={() => onToggleSticker(code, num)}
                      className={`inline-flex items-center justify-center relative
                        min-w-[36px] h-8 px-3 rounded-lg text-xs font-semibold
                        transition-all duration-150 cursor-pointer tabular-nums
                        ${isSelected ? c.pillSelected : c.pillUnselected}
                        ${isReserved ? 'ring-2 ring-amber-400/60 shadow-[0_0_8px_rgba(251,146,60,0.25)]' : ''}
                      `}
                      title={isReserved
                        ? `${code} ${num} — already in a pending reservation`
                        : isSelected ? `Deselect ${code} ${num}` : `Select ${code} ${num}`}
                    >
                      {num}
                      {isReserved && (
                        <span
                          className="absolute -top-1.5 -right-1.5 text-[9px] leading-none pointer-events-none select-none"
                          aria-label="Already reserved"
                        >
                          🔖
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
