import { useState, useMemo } from 'react';
import { PieChart, TrendingUp, Award, Layers, Search, ArrowUpDown, HelpCircle } from 'lucide-react';
import { COUNTRY_OPTIONS } from './CollectionManager';

/**
 * DonutChart Component — Renders a beautiful SVG progress ring.
 */
function DonutChart({ value, total, color, label, size = 130 }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {/* Base circle background */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.02)"
            strokeWidth="7"
          />
          {/* Animated progress ring */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Text inside the ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold font-display text-text tabular-nums drop-shadow-[0_0_6px_rgba(255,255,255,0.1)]">
            {Math.round(percentage)}%
          </span>
          <span className="text-[9px] text-text-muted/50 font-bold uppercase tracking-wider mt-0.5">
            {value}/{total}
          </span>
        </div>
      </div>
      {label && (
        <span className="text-[10px] font-bold text-text-muted/80 mt-3 font-display uppercase tracking-widest text-center max-w-[140px] leading-relaxed">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * StatisticsPanel Component
 */
export default function StatisticsPanel({ collection }) {
  const [filterSearch, setFilterSearch] = useState('');
  const [sortBy, setSortBy] = useState('percent-desc'); // 'percent-desc' | 'percent-asc' | 'code-asc' | 'togo-desc'

  // 1. Calculate overall album progress
  const stats = useMemo(() => {
    let totalAlbumStickers = 0;
    let totalNeedsStickers = 0;

    // Calculate FWC sub-sections details
    const fwcNeedsList = collection.needs['FWC'] || [];
    const fwcSpecialsNeeds = fwcNeedsList.filter(n => ['00', '1', '2', '3', '4'].includes(n)).length;
    const fwcBallNeeds = fwcNeedsList.filter(n => ['5', '6', '7', '8'].includes(n)).length;
    const fwcHistoryNeeds = fwcNeedsList.filter(n => {
      const v = parseInt(n, 10);
      return !isNaN(v) && v >= 9 && v <= 19;
    }).length;

    // Calculate CC details
    const ccNeeds = (collection.needs['CC'] || []).length;

    const countriesData = COUNTRY_OPTIONS.map(opt => {
      let limit = 20;
      let needs = 0;

      if (opt.code === 'FWC') {
        limit = 20;
        needs = fwcNeedsList.length;
      } else if (opt.code === 'CC') {
        limit = 14;
        needs = (collection.needs['CC'] || []).length;
      } else {
        limit = 20;
        needs = (collection.needs[opt.code] || []).length;
      }

      totalAlbumStickers += limit;
      totalNeedsStickers += needs;

      const collected = limit - needs;
      const percent = (collected / limit) * 100;

      return {
        code: opt.code,
        label: opt.label,
        flag: opt.flag,
        total: limit,
        needs,
        collected,
        percent,
      };
    });

    const totalCollected = totalAlbumStickers - totalNeedsStickers;
    const overallPercent = totalAlbumStickers > 0 ? (totalCollected / totalAlbumStickers) * 100 : 0;

    // Calculate duplicates details
    let totalSwapsCount = 0;
    let uniqueSwapsCount = 0;
    const duplicatesList = [];

    for (const code of Object.keys(collection.swaps || {})) {
      const nums = collection.swaps[code] || [];
      const counts = collection.swapCounts?.[code] || {};
      let codeSwapsTotal = 0;

      for (const n of nums) {
        const qty = counts[n] || 1;
        totalSwapsCount += qty;
        codeSwapsTotal += qty;
        uniqueSwapsCount++;
      }

      if (codeSwapsTotal > 0) {
        const opt = COUNTRY_OPTIONS.find(o => o.code === code);
        duplicatesList.push({
          code,
          label: opt?.label || code,
          flag: opt?.flag || '🔁',
          count: codeSwapsTotal,
        });
      }
    }

    // Sort duplicates list descending
    duplicatesList.sort((a, b) => b.count - a.count);

    return {
      totalAlbumStickers,
      totalNeedsStickers,
      totalCollected,
      overallPercent,
      totalSwapsCount,
      uniqueSwapsCount,
      duplicatesList,
      countriesData,
      fwcSpecials: { total: 5, needs: fwcSpecialsNeeds, collected: 5 - fwcSpecialsNeeds },
      fwcBall: { total: 4, needs: fwcBallNeeds, collected: 4 - fwcBallNeeds },
      fwcHistory: { total: 11, needs: fwcHistoryNeeds, collected: 11 - fwcHistoryNeeds },
      ccStats: { total: 14, needs: ccNeeds, collected: 14 - ccNeeds },
    };
  }, [collection]);

  // Filter & sort countries list
  const processedCountries = useMemo(() => {
    let result = stats.countriesData.filter(item => {
      if (!filterSearch.trim()) return true;
      const search = filterSearch.toLowerCase();
      return (
        item.code.toLowerCase().includes(search) ||
        item.label.toLowerCase().includes(search)
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'percent-desc') return b.percent - a.percent || a.code.localeCompare(b.code);
      if (sortBy === 'percent-asc') return a.percent - b.percent || a.code.localeCompare(b.code);
      if (sortBy === 'code-asc') return a.code.localeCompare(b.code);
      if (sortBy === 'togo-desc') return b.needs - a.needs || a.code.localeCompare(b.code);
      return 0;
    });

    return result;
  }, [stats.countriesData, filterSearch, sortBy]);

  // Insight aggregates
  const topNeedCountries = useMemo(() => {
    return [...stats.countriesData]
      .filter(c => c.needs > 0 && c.code !== 'FWC' && c.code !== 'CC')
      .sort((a, b) => b.needs - a.needs)
      .slice(0, 5);
  }, [stats.countriesData]);

  const topCompletedCountries = useMemo(() => {
    return [...stats.countriesData]
      .filter(c => c.code !== 'FWC' && c.code !== 'CC')
      .sort((a, b) => b.percent - a.percent || a.needs - b.needs)
      .slice(0, 5);
  }, [stats.countriesData]);

  return (
    <div className="space-y-6">
      {/* ── SECTION 1: Overall Dashboard ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Donut Progress Panel */}
        <div className="lg:col-span-1 glass-panel rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden shadow-[0_0_30px_rgba(139,92,246,0.04)]">
          <div className="absolute -top-12 -left-12 w-36 h-36 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-fuchsia-600/10 rounded-full blur-2xl pointer-events-none" />

          <h3 className="text-xs font-bold text-violet-300 uppercase tracking-widest font-display mb-4 relative z-10 flex items-center gap-2">
            <PieChart size={14} />
            Album Completion
          </h3>

          <div className="relative z-10">
            <DonutChart
              value={stats.totalCollected}
              total={stats.totalAlbumStickers}
              color="url(#violet-grad)"
              size={150}
            />
            {/* SVG Gradient definition for premium progress ring */}
            <svg className="absolute w-0 h-0">
              <defs>
                <linearGradient id="violet-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#A7F3D0" /> {/* success-light */}
                  <stop offset="50%" stopColor="#10B981" /> {/* success */}
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          <p className="text-[10px] text-text-muted/50 font-semibold uppercase tracking-wider text-center mt-3 relative z-10 leading-relaxed">
            Overall Album Status
          </p>
        </div>

        {/* Dashboard stats numbers */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Album', value: stats.totalAlbumStickers, desc: 'stickers in checklist', color: 'text-text-muted/80', icon: <Layers size={14} className="text-text-muted/60" /> },
            { label: 'Collected', value: stats.totalCollected, desc: 'stickers obtained', color: 'text-emerald-400', icon: <Award size={14} className="text-emerald-400/80" /> },
            { label: 'Stickers to Go', value: stats.totalNeedsStickers, desc: 'still needed', color: 'text-amber-400', icon: <TrendingUp size={14} className="text-amber-400/80" /> },
            { label: 'My Duplicates', value: stats.totalSwapsCount, desc: `across ${stats.uniqueSwapsCount} unique codes`, color: 'text-violet-400', icon: <Layers size={14} className="text-violet-400/80" /> },
          ].map((card, i) => (
            <div key={i} className="glass-panel rounded-2xl p-5 flex flex-col justify-between border border-border/15">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] text-text-muted/50 font-bold uppercase tracking-widest font-display">
                  {card.label}
                </span>
                {card.icon}
              </div>
              <div>
                <span className={`text-2xl sm:text-3xl font-extrabold font-display tabular-nums tracking-tight ${card.color}`}>
                  {card.value}
                </span>
                <p className="text-[10px] text-text-muted/40 font-semibold mt-1 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: Specials Sub-sections ── */}
      <div className="glass-panel rounded-2xl p-5 border border-border/20 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <h3 className="text-xs font-bold text-violet-300 uppercase tracking-widest font-display mb-6 flex items-center gap-2 border-b border-border/10 pb-3">
          <Award size={14} />
          Specials & FWC Sub-Sections
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y lg:divide-y-0 lg:divide-x divide-border/10">
          <DonutChart
            value={stats.fwcSpecials.collected}
            total={stats.fwcSpecials.total}
            color="#C084FC" // violet light
            label="FWC Specials (🏆 00-4)"
          />
          <DonutChart
            value={stats.fwcBall.collected}
            total={stats.fwcBall.total}
            color="#38BDF8" // sky-400
            label="FWC Ball & Hosts (5-8)"
          />
          <DonutChart
            value={stats.fwcHistory.collected}
            total={stats.fwcHistory.total}
            color="#FB7185" // rose-400
            label="FWC History (Museum 9-19)"
          />
          <DonutChart
            value={stats.ccStats.collected}
            total={stats.ccStats.total}
            color="#EF4444" // red-500
            label="Coca-Cola Specials (🥤 1-14)"
          />
        </div>
      </div>

      {/* ── SECTION 3: Insights & Country Breakdown Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Side: Insights Lists */}
        <div className="lg:col-span-1 space-y-6">
          {/* Top Needs Countries */}
          <div className="glass-panel rounded-2xl p-5 border border-border/15">
            <h4 className="text-xs font-bold text-text/80 uppercase tracking-widest font-display mb-4 flex items-center gap-2 border-b border-border/10 pb-2">
              ⚠️ Top Missing Countries
            </h4>
            <div className="space-y-3">
              {topNeedCountries.map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text flex items-center gap-2">
                    <span className="text-sm select-none">{c.flag}</span>
                    {c.label}
                  </span>
                  <span className="font-bold text-amber-400 tabular-nums bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/10">
                    {c.needs} remaining
                  </span>
                </div>
              ))}
              {topNeedCountries.length === 0 && (
                <p className="text-xs text-text-muted/40 text-center py-4">No countries missing stickers!</p>
              )}
            </div>
          </div>

          {/* Top Duplicates Countries */}
          <div className="glass-panel rounded-2xl p-5 border border-border/15">
            <h4 className="text-xs font-bold text-text/80 uppercase tracking-widest font-display mb-4 flex items-center gap-2 border-b border-border/10 pb-2">
              🔁 Most Duplicates
            </h4>
            <div className="space-y-3">
              {stats.duplicatesList.slice(0, 5).map((c, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text flex items-center gap-2">
                    <span className="text-sm select-none">{c.flag}</span>
                    {c.label}
                  </span>
                  <span className="font-bold text-violet-300 tabular-nums bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-500/10">
                    {c.count} duplicates
                  </span>
                </div>
              ))}
              {stats.duplicatesList.length === 0 && (
                <p className="text-xs text-text-muted/40 text-center py-4">No duplicates in your collection!</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive country grid */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-border/20 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-border/10 pb-4">
            <h3 className="text-xs font-bold text-violet-300 uppercase tracking-widest font-display flex items-center gap-2">
              <Layers size={14} />
              Country-by-Country Progress
            </h3>

            {/* Filter and Sort controls */}
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0C0C14]/60 rounded-xl border border-border/40 max-w-xs w-full sm:w-48">
                <Search size={12} className="text-text-muted/40 shrink-0" />
                <input
                  type="text"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  placeholder="Filter country..."
                  className="bg-transparent text-xs text-text outline-none w-full placeholder:text-text-muted/20"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C0C14]/60 rounded-xl border border-border/40 cursor-pointer text-xs text-text-muted hover:text-text hover:border-border/60 transition-colors">
                <ArrowUpDown size={12} className="text-text-muted/40" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer font-bold font-display uppercase tracking-wider text-[10px]"
                >
                  <option value="percent-desc">Most Completed</option>
                  <option value="percent-asc">Least Completed</option>
                  <option value="togo-desc">Most to Go</option>
                  <option value="code-asc">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid list of progress bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {processedCountries.map(c => (
              <div key={c.code} className="flex flex-col gap-1.5 p-2.5 rounded-xl border border-border/5 bg-[#08080C]/40 hover:bg-[#12121A]/30 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text flex items-center gap-1.5">
                    <span className="select-none">{c.flag}</span>
                    <span className="tracking-wide">{c.code}</span>
                  </span>
                  <span className="text-[10px] text-text-muted/60 font-bold tabular-nums">
                    {c.collected}/{c.total} collected
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {/* Progress bar container */}
                  <div className="flex-grow h-2 bg-white/5 rounded-full overflow-hidden border border-white/[0.01] relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500
                        ${c.percent === 100
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                          : c.percent >= 75
                            ? 'bg-violet-500'
                            : c.percent >= 30
                              ? 'bg-indigo-500'
                              : 'bg-amber-500'
                        }`}
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-text-muted/80 w-8 text-right tabular-nums">
                    {Math.round(c.percent)}%
                  </span>
                </div>
              </div>
            ))}
            {processedCountries.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-text-muted/40">
                No matching countries found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
