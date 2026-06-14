import { useState, useCallback } from 'react';
import { Repeat2, Github } from 'lucide-react';
import TextAreaInput from './components/TextAreaInput';
import CompareButton from './components/CompareButton';
import ResultsContainer from './components/ResultsContainer';
import { parseStickerList, calculateMatches } from './utils/matcherUtils';

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
  const [myListRaw, setMyListRaw] = useState('');
  const [theirListRaw, setTheirListRaw] = useState('');
  const [matches, setMatches] = useState(null);
  const [errors, setErrors] = useState([]);

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

  return (
    <div className="min-h-screen bg-network-pattern text-text flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="border-b border-border/80 bg-bg/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
            <img src="/panini-logo.png" alt="Panini" className="h-7 sm:h-8 object-contain rounded border border-yellow-500/15" />
            <div className="h-6 w-px bg-border/40 hidden xs:block" />
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
      </header>

      {/* ── Main Content ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-grow">
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
        <div className="sticky bottom-4 z-10 py-3">
          <CompareButton onClick={handleCompare} disabled={bothEmpty} />
        </div>

        {/* ── Results ── */}
        {matches && (
          <section id="results-section" className="mt-10 pb-16">
            <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mb-10" />
            <ResultsContainer matches={matches} myListRaw={myListRaw} />
          </section>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/60 bg-bg/40 backdrop-blur-sm mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 text-center flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-text-muted/50 tracking-wider">
            Panini FIFA World Cup 2026 StickerSwap Matcher · Works with Figuritas App & Figuri formats
          </p>
          <p className="text-[10px] text-text-muted/40 font-bold tracking-widest font-display uppercase">
            World Cup 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
