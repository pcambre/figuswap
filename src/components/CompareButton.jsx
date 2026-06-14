import { ArrowLeftRight } from 'lucide-react';

/**
 * CompareButton — Primary action button that triggers the matching computation.
 * Disabled when both text areas are empty.
 *
 * @param {Object} props
 * @param {function} props.onClick - Click handler
 * @param {boolean} props.disabled - Whether the button is disabled
 */
export default function CompareButton({ onClick, disabled }) {
  return (
    <button
      id="compare-button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full max-w-md mx-auto flex items-center justify-center gap-2.5
        px-8 py-3.5 rounded-xl text-sm font-bold tracking-wider uppercase font-display
        transition-all duration-300 cursor-pointer
        ${disabled
          ? 'bg-border/30 text-text-muted/30 cursor-not-allowed shadow-none border border-border/10'
          : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.35)] hover:shadow-[0_0_30px_rgba(139,92,246,0.55)] hover:scale-[1.02] active:scale-[0.98] border border-violet-500/20'
        }
      `}
    >
      <ArrowLeftRight
        size={20}
        strokeWidth={2.5}
        className={`transition-transform duration-300 ${!disabled ? 'group-hover:rotate-180' : ''}`}
      />
      Find Matching Trades
    </button>
  );
}
