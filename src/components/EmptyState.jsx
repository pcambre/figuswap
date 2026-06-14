import { SearchX } from 'lucide-react';

/**
 * EmptyState — Shown when parsing succeeds but there are zero matching stickers.
 */
export default function EmptyState() {
  return (
    <div
      id="empty-state"
      className="flex flex-col items-center justify-center py-16 px-6 text-center animate-fade-in"
    >
      <div className="w-16 h-16 rounded-2xl bg-surface/40 flex items-center justify-center mb-5 border border-border/60 shadow-[inset_0_1px_1px_rgba(255,255,255,0.02)]">
        <SearchX size={24} className="text-violet-400/80" />
      </div>
      <h3 className="text-base font-bold text-text mb-2 font-display">
        No matching trades found
      </h3>
      <p className="text-xs text-text-muted max-w-xs leading-relaxed">
        These lists don't have any overlapping stickers to swap.
        Try comparing with a different friend!
      </p>
    </div>
  );
}
