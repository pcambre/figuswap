import { useState } from 'react';
import {
  Bookmark, CheckCircle, XCircle, Clock, CheckSquare, Square,
  ChevronDown, ChevronUp, Trash2, AlertTriangle
} from 'lucide-react';

/**
 * Format a relative timestamp. e.g. "2 hours ago", "just now"
 */
function formatRelativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/**
 * StatusBadge — coloured pill indicating reservation status.
 */
function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
    confirmed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    cancelled: 'bg-red-500/10 text-red-400/80 border-red-500/20',
  };
  const labels = { pending: '🔖 Pending', confirmed: '✅ Confirmed', cancelled: '✗ Cancelled' };

  return (
    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border tracking-wider font-display uppercase ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

/**
 * StickerGroup — renders a code + sticker pills with optional selection.
 */
function StickerGroup({ code, nums, selected, onToggle, variant, readOnly }) {
  const pillColors = {
    give: {
      on:  'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30',
      off: 'bg-[#181824] text-text/50 ring-1 ring-dashed ring-text-muted/20 line-through',
    },
    get: {
      on:  'bg-indigo-500/15 text-indigo-300 ring-1 ring-indigo-400/30',
      off: 'bg-[#181824] text-text/50 ring-1 ring-dashed ring-text-muted/20 line-through',
    },
  };
  const c = pillColors[variant];

  return (
    <div className="flex items-start gap-3">
      <span className="text-[11px] font-bold text-text-muted w-10 pt-1.5 shrink-0 font-display tracking-widest">{code}</span>
      <div className="flex flex-wrap gap-1.5">
        {nums.map(num => {
          const isOn = !selected || selected.has(num);
          return (
            <button
              key={num}
              onClick={() => !readOnly && onToggle?.(code, num)}
              disabled={readOnly}
              className={`inline-flex items-center justify-center min-w-[34px] h-7 px-2.5 rounded-lg
                text-xs font-semibold tabular-nums transition-all duration-150
                ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-105'}
                ${isOn ? c.on : c.off}`}
              title={readOnly ? num : (isOn ? `Deselect ${code} ${num}` : `Restore ${code} ${num}`)}
            >
              {num}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * ReservationCard — displays a single reservation with full management controls.
 */
function ReservationCard({ reservation, onConfirm, onCancel, onPartialCancel }) {
  const isPending = reservation.status === 'pending';
  const [expanded, setExpanded] = useState(true);

  // Selection state for partial cancel (only used when pending)
  const [keepGive, setKeepGive] = useState(() => {
    const init = {};
    for (const [code, nums] of Object.entries(reservation.iGiveThem)) {
      init[code] = new Set(nums);
    }
    return init;
  });
  const [keepGet, setKeepGet] = useState(() => {
    const init = {};
    for (const [code, nums] of Object.entries(reservation.theyGiveMe)) {
      init[code] = new Set(nums);
    }
    return init;
  });

  const [confirmingAction, setConfirmingAction] = useState(null); // 'cancel' | 'partial' | 'confirm'

  const giveCount = Object.values(reservation.iGiveThem).reduce((s, a) => s + a.length, 0);
  const getCount  = Object.values(reservation.theyGiveMe).reduce((s, a) => s + a.length, 0);

  const keepGiveCount = Object.values(keepGive).reduce((s, set) => s + set.size, 0);
  const keepGetCount  = Object.values(keepGet).reduce((s, set) => s + set.size, 0);
  const totalKept = keepGiveCount + keepGetCount;
  const totalAll  = giveCount + getCount;
  const isPartialSelection = totalKept < totalAll && totalKept > 0;
  const nothingKept = totalKept === 0;

  function toggleGive(code, num) {
    setKeepGive(prev => {
      const next = { ...prev };
      const s = new Set(next[code] || []);
      if (s.has(num)) s.delete(num); else s.add(num);
      next[code] = s;
      return next;
    });
  }

  function toggleGet(code, num) {
    setKeepGet(prev => {
      const next = { ...prev };
      const s = new Set(next[code] || []);
      if (s.has(num)) s.delete(num); else s.add(num);
      next[code] = s;
      return next;
    });
  }

  function selectAll() {
    const g = {};
    for (const [code, nums] of Object.entries(reservation.iGiveThem)) g[code] = new Set(nums);
    const gt = {};
    for (const [code, nums] of Object.entries(reservation.theyGiveMe)) gt[code] = new Set(nums);
    setKeepGive(g);
    setKeepGet(gt);
  }

  function buildKeepObj(stateMap) {
    const result = {};
    for (const [code, set] of Object.entries(stateMap)) {
      if (set.size > 0) result[code] = [...set];
    }
    return result;
  }

  const handlePartialCancel = () => {
    onPartialCancel(reservation.id, buildKeepObj(keepGive), buildKeepObj(keepGet));
    setConfirmingAction(null);
  };

  const handleFullCancel = () => {
    onCancel(reservation.id);
    setConfirmingAction(null);
  };

  const giveCodesSorted = Object.keys(reservation.iGiveThem).sort();
  const getCodesSorted  = Object.keys(reservation.theyGiveMe).sort();

  return (
    <div className={`rounded-2xl border overflow-hidden backdrop-blur-sm transition-all duration-300
      shadow-[inset_0_1px_1px_rgba(255,255,255,0.01),0_8px_30px_rgba(0,0,0,0.4)]
      ${isPending
        ? 'border-amber-500/20 bg-[#101018]/70'
        : reservation.status === 'confirmed'
          ? 'border-emerald-500/15 bg-emerald-950/5 opacity-70'
          : 'border-red-500/10 bg-[#101018]/40 opacity-50'
      }`}
    >
      {/* ── Card Header ── */}
      <div className={`px-5 py-4 flex items-center justify-between border-b border-border/20
        ${isPending ? 'bg-gradient-to-r from-amber-500/8 to-transparent' : 'bg-[#0C0C14]/30'}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-lg border shrink-0
            ${isPending ? 'bg-amber-500/10 border-amber-500/20' : 'bg-surface/30 border-border/20'}`}
          >
            <Bookmark size={14} className={isPending ? 'text-amber-400' : 'text-text-muted/40'} />
          </div>
          <div className="min-w-0">
            {reservation.note && (
              <p className="text-xs font-bold text-text truncate">{reservation.note}</p>
            )}
            <p className="text-[10px] text-text-muted/50 font-display">
              {formatRelativeTime(reservation.createdAt)} · {giveCount} out · {getCount} in
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <StatusBadge status={reservation.status} />
          <button
            onClick={() => setExpanded(p => !p)}
            className="p-1.5 rounded-lg text-text-muted/40 hover:text-text-muted hover:bg-surface/30 cursor-pointer transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Card Body ── */}
      {expanded && (
        <div className="p-5">
          {/* Sticker columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            {/* You give */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-bold text-emerald-400/70 uppercase tracking-widest font-display">📤 You give</span>
                <span className="text-[10px] text-text-muted/40 tabular-nums">({giveCount})</span>
              </div>
              <div className="space-y-2">
                {giveCodesSorted.length === 0 ? (
                  <p className="text-xs text-text-muted/30">—</p>
                ) : giveCodesSorted.map(code => (
                  <StickerGroup
                    key={code}
                    code={code}
                    nums={reservation.iGiveThem[code]}
                    selected={isPending ? keepGive[code] : null}
                    onToggle={isPending ? toggleGive : undefined}
                    variant="give"
                    readOnly={!isPending}
                  />
                ))}
              </div>
            </div>

            {/* You receive */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest font-display">📥 You receive</span>
                <span className="text-[10px] text-text-muted/40 tabular-nums">({getCount})</span>
              </div>
              <div className="space-y-2">
                {getCodesSorted.length === 0 ? (
                  <p className="text-xs text-text-muted/30">—</p>
                ) : getCodesSorted.map(code => (
                  <StickerGroup
                    key={code}
                    code={code}
                    nums={reservation.theyGiveMe[code]}
                    selected={isPending ? keepGet[code] : null}
                    onToggle={isPending ? toggleGet : undefined}
                    variant="get"
                    readOnly={!isPending}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Actions (pending only) ── */}
          {isPending && (
            <>
              {/* Selection helpers */}
              {totalKept < totalAll && (
                <button
                  onClick={selectAll}
                  className="mb-3 flex items-center gap-1.5 text-[10px] text-violet-300/60 hover:text-violet-300
                    font-bold font-display uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <CheckSquare size={11} /> Restore All
                </button>
              )}

              {/* Confirmation dialogs */}
              {confirmingAction === 'confirm' && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/15 px-4 py-3 mb-3 animate-slide-down">
                  <p className="text-xs text-text-muted/70 mb-3">
                    Apply this trade to your collection?<br />
                    <span className="text-emerald-400/80">• Remove {giveCount} stickers from your duplicates</span><br />
                    <span className="text-indigo-400/80">• Remove {getCount} stickers from your needs</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { onConfirm(reservation.id); setConfirmingAction(null); }}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold font-display
                        uppercase tracking-wider bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white
                        hover:shadow-[0_0_15px_rgba(139,92,246,0.35)] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <CheckCircle size={12} /> Confirm
                    </button>
                    <button
                      onClick={() => setConfirmingAction(null)}
                      className="px-3 py-2 rounded-lg text-[11px] text-text-muted border border-border/30
                        hover:bg-surface/40 hover:text-text transition-colors cursor-pointer font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {(confirmingAction === 'cancel' || confirmingAction === 'partial') && (
                <div className="rounded-xl border border-red-500/15 bg-red-950/10 px-4 py-3 mb-3 animate-slide-down">
                  <div className="flex items-start gap-2 mb-3">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-text-muted/70">
                      {confirmingAction === 'partial' && isPartialSelection
                        ? `Cancel ${totalAll - totalKept} deselected sticker(s) and keep ${totalKept}?`
                        : nothingKept
                          ? 'Cancel all stickers in this reservation?'
                          : 'Cancel entire reservation?'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={confirmingAction === 'partial' && isPartialSelection
                        ? handlePartialCancel
                        : handleFullCancel}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-bold font-display
                        uppercase tracking-wider bg-red-600/20 text-red-300 border border-red-500/25
                        hover:bg-red-600/30 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <XCircle size={12} />
                      {confirmingAction === 'partial' && isPartialSelection ? 'Cancel Deselected' : 'Cancel All'}
                    </button>
                    <button
                      onClick={() => setConfirmingAction(null)}
                      className="px-3 py-2 rounded-lg text-[11px] text-text-muted border border-border/30
                        hover:bg-surface/40 hover:text-text transition-colors cursor-pointer font-bold"
                    >
                      Keep
                    </button>
                  </div>
                </div>
              )}

              {/* Primary action buttons */}
              {!confirmingAction && (
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/15">
                  <button
                    onClick={() => setConfirmingAction('confirm')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold font-display
                      uppercase tracking-wider bg-violet-600/12 text-violet-300 border border-violet-500/20
                      hover:bg-violet-600/20 hover:border-violet-500/35 transition-all cursor-pointer"
                  >
                    <CheckCircle size={13} /> Confirm Swap
                  </button>

                  {isPartialSelection ? (
                    <button
                      onClick={() => setConfirmingAction('partial')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold font-display
                        uppercase tracking-wider bg-amber-600/10 text-amber-300 border border-amber-500/20
                        hover:bg-amber-600/18 hover:border-amber-500/35 transition-all cursor-pointer"
                    >
                      <Square size={13} /> Cancel Deselected
                    </button>
                  ) : null}

                  <button
                    onClick={() => setConfirmingAction('cancel')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold font-display
                      uppercase tracking-wider text-text-muted/60 border border-border/25
                      hover:text-red-400 hover:border-red-500/20 hover:bg-red-500/5 transition-all cursor-pointer ml-auto"
                  >
                    <Trash2 size={12} /> Cancel All
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * ReservationsPanel — Lists all reservations with management controls.
 */
export default function ReservationsPanel({
  reservations,
  onConfirm,
  onCancel,
  onPartialCancel,
}) {
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'history'

  const filtered = reservations.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'history') return r.status !== 'pending';
    return true;
  });

  const pendingCount  = reservations.filter(r => r.status === 'pending').length;
  const historyCount  = reservations.filter(r => r.status !== 'pending').length;

  return (
    <div className="animate-fade-in-up">
      {/* Header stats */}
      <div className="glass-panel rounded-2xl p-5 mb-6 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-amber-600/8 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-violet-600/8 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-2.5 mb-4 relative z-10">
          <Bookmark size={16} className="text-amber-400" />
          <span className="text-[10px] font-bold text-amber-300/80 uppercase tracking-widest font-display">
            Trade Reservations
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center relative z-10">
          <div className="flex flex-col items-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-amber-400 font-display tabular-nums">
              {pendingCount}
            </div>
            <div className="text-[10px] text-text-muted font-semibold tracking-wider uppercase mt-1">Pending</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl sm:text-4xl font-extrabold text-text-muted/40 font-display tabular-nums">
              {historyCount}
            </div>
            <div className="text-[10px] text-text-muted/50 font-semibold tracking-wider uppercase mt-1">History</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      {reservations.length > 0 && (
        <div className="flex bg-[#08080C]/80 p-1 rounded-xl border border-border/40 gap-1 mb-5">
          {[
            { key: 'all',     label: 'All',     count: reservations.length },
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'history', label: 'History', count: historyCount },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold
                font-display uppercase tracking-wider transition-all cursor-pointer
                ${filter === opt.key
                  ? 'bg-violet-600 text-white shadow-[0_2px_8px_rgba(139,92,246,0.25)]'
                  : 'text-text-muted/60 hover:text-text hover:bg-surface/30'
                }`}
            >
              {opt.label}
              {opt.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full tabular-nums
                  ${filter === opt.key ? 'bg-white/20' : 'bg-surface/60'}`}>
                  {opt.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Reservation list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-surface/40 flex items-center justify-center mb-5 border border-border/60">
            <Bookmark size={24} className="text-amber-400/50" />
          </div>
          <h3 className="text-base font-bold text-text mb-2 font-display">
            {reservations.length === 0 ? 'No reservations yet' : 'Nothing to show here'}
          </h3>
          <p className="text-xs text-text-muted max-w-xs leading-relaxed">
            {reservations.length === 0
              ? 'After finding matching trades, hit "Reserve Trade" to save a trade for later without committing to it.'
              : 'Switch filter to see other reservations.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(r => (
            <ReservationCard
              key={r.id}
              reservation={r}
              onConfirm={onConfirm}
              onCancel={onCancel}
              onPartialCancel={onPartialCancel}
            />
          ))}
        </div>
      )}
    </div>
  );
}
