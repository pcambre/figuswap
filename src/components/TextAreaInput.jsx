import { X } from 'lucide-react';

/**
 * TextAreaInput — Reusable large text input with label, placeholder, and clear button.
 *
 * @param {Object} props
 * @param {string} props.id - Unique ID for the textarea
 * @param {string} props.label - Display label
 * @param {string} props.emoji - Emoji prefix for the label
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.value - Controlled value
 * @param {function} props.onChange - Change handler
 * @param {function} props.onClear - Clear handler
 */
export default function TextAreaInput({ id, label, emoji, placeholder, value, onChange, onClear }) {
  return (
    <div className="flex flex-col gap-2 animate-fade-in-up">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-text/95 tracking-wide font-display flex items-center gap-1.5"
        >
          <span className="text-base">{emoji}</span>
          {label}
        </label>
        {value && (
          <button
            id={`${id}-clear`}
            onClick={onClear}
            className="flex items-center gap-1.5 text-xs font-semibold text-text-muted
              hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer
              px-2.5 py-1 rounded-lg border border-border/40 hover:border-red-500/20"
            aria-label={`Clear ${label}`}
          >
            <X size={12} strokeWidth={2.5} />
            Clear
          </button>
        )}
      </div>

      {/* Textarea */}
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={12}
        className="w-full px-4 py-3 rounded-xl border border-border/60 bg-[#0C0C14]/85 text-sm
          text-text leading-relaxed resize-y
          placeholder:text-text-muted/35
          focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
          transition-all duration-200
          shadow-inner focus:shadow-primary/5"
        spellCheck={false}
      />

      {/* Character count */}
      <div className="text-right text-[10px] text-text-muted/40 font-semibold tracking-wider tabular-nums">
        {value.length > 0 ? `${value.split('\n').filter(l => l.trim()).length} LINES` : ''}
      </div>
    </div>
  );
}
