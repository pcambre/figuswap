/**
 * matcherUtils.js
 * ─────────────────────────────────────────────────────────
 * Pure utility functions for parsing sticker lists and
 * calculating trade matches. No React dependencies.
 * ─────────────────────────────────────────────────────────
 */

/**
 * Normalise any category header text to a short uppercase code.
 *
 * Handles:
 *   MEX 🇲🇽  →  MEX
 *   🇲🇽 MEX  →  MEX
 *   FWC 🏆   →  FWC
 *   History (FWC)  →  FWC
 *   Host Countries and Cities (FWC)  →  FWC
 *   CC 🥤    →  CC
 */
function extractCategoryCode(text) {
  // FWC parenthetical variants: "History (FWC)", etc.
  if (/\(FWC\)/i.test(text)) {
    return 'FWC';
  }

  // Direct "FWC ..." prefix
  if (text.trim().toUpperCase().startsWith('FWC')) {
    return 'FWC';
  }

  // Standard 2-3 letter country / category code
  const m = text.match(/\b([A-Z]{2,3})\b/);
  if (m) {
    return m[1];
  }

  return null;
}

/**
 * Parse comma-separated sticker numbers, stripping multiplicity markers.
 * Returns array of unique number strings (for matching / needs).
 */
function parseNumbers(raw) {
  // Remove multiplicity markers: (×2), (x3), etc.
  const cleaned = raw.replace(/\s*\([×x]\s*\d+\)/gi, '');
  const nums = [];
  for (const tok of cleaned.split(',')) {
    const trimmed = tok.trim();
    if (trimmed) nums.push(trimmed);
  }
  return nums;
}

/**
 * Parse comma-separated sticker numbers AND their multiplicity counts.
 * Used for the swaps section so duplicates are properly tracked.
 * Returns { nums: string[], counts: Object.<string, number> }
 */
function parseNumbersWithCounts(raw) {
  const nums = [];
  const counts = {};
  for (const tok of raw.split(',')) {
    const trimmed = tok.trim();
    if (!trimmed) continue;
    // Match optional multiplier like (×3) or (x3) or (X3)
    const m = trimmed.match(/^(.+?)\s*\([×xX]\s*(\d+)\)$/);
    if (m) {
      const num = m[1].trim();
      const count = parseInt(m[2], 10);
      if (num) { nums.push(num); counts[num] = count; }
    } else {
      nums.push(trimmed);
      counts[trimmed] = 1;
    }
  }
  return { nums, counts };
}

/**
 * Detect if a line is a section header ("needs" or "swaps").
 * Returns 'needs', 'swaps', or null.
 */
function detectSection(line) {
  const low = line.toLowerCase();
  if (['i need', 'me faltan', 'necesito', 'faltan'].some(kw => low.includes(kw))) {
    return 'needs';
  }
  if (['swap', 'repetida', 'repeti', 'cambio', 'i have', 'have', 'tengo'].some(kw => low.includes(kw))) {
    return 'swaps';
  }
  return null;
}

/**
 * Sort sticker numbers numerically (with '00' handled).
 */
function sortStickerNums(nums) {
  return [...nums].sort((a, b) => {
    const na = parseInt(a, 10);
    const nb = parseInt(b, 10);
    if (isNaN(na) && isNaN(nb)) return a.localeCompare(b);
    if (isNaN(na)) return -1;
    if (isNaN(nb)) return 1;
    return na - nb;
  });
}

/**
 * Parse a full sticker list text and return { needs, swaps, swapCounts, headers }.
 * - needs/swaps map countryCode → array of sticker number strings (sorted, unique)
 * - swapCounts maps countryCode → { stickerNum: count } preserving multiplicity
 *
 * @param {string} text - Raw pasted text from a sticker tracking app
 * @returns {{ needs: Object, swaps: Object, swapCounts: Object, headers: Object }}
 */
export function parseStickerList(text) {
  const needs = {};
  const swaps = {};
  const swapCounts = {}; // { code: { num: count } }
  const headers = {};

  let section = null; // 'needs' | 'swaps'

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for section header
    const sec = detectSection(line);
    if (sec) {
      section = sec;
      continue;
    }

    // Must be inside a known section
    if (section === null) continue;

    // Must contain a colon to be a data line
    if (!line.includes(':')) continue;

    // Split on the FIRST colon only
    const colonIdx = line.indexOf(':');
    const header = line.substring(0, colonIdx).trim();
    const numsRaw = line.substring(colonIdx + 1);

    const code = extractCategoryCode(header);
    if (!code) continue;

    // Save header mapping (e.g. "MEX 🇲🇽" or "🇲🇽 MEX")
    headers[code] = header;

    if (section === 'needs') {
      // Needs: strip counts, just track which stickers are needed
      const numbers = parseNumbers(numsRaw);
      if (numbers.length === 0) continue;
      if (!needs[code]) needs[code] = new Set();
      for (const n of numbers) needs[code].add(n);
    } else {
      // Swaps: preserve multiplicity counts
      const { nums, counts } = parseNumbersWithCounts(numsRaw);
      if (nums.length === 0) continue;
      if (!swaps[code]) swaps[code] = new Set();
      if (!swapCounts[code]) swapCounts[code] = {};
      for (const n of nums) {
        swaps[code].add(n);
        // Accumulate counts (in case same sticker appears on multiple lines)
        swapCounts[code][n] = (swapCounts[code][n] || 0) + (counts[n] || 1);
      }
    }
  }

  // Convert sets to sorted arrays
  const result = { needs: {}, swaps: {}, swapCounts: {}, headers };
  for (const [code, numSet] of Object.entries(needs)) {
    result.needs[code] = sortStickerNums([...numSet]);
  }
  for (const [code, numSet] of Object.entries(swaps)) {
    result.swaps[code] = sortStickerNums([...numSet]);
    result.swapCounts[code] = swapCounts[code];
  }

  return result;
}

/**
 * Calculate trade matches between two parsed lists.
 *
 * "I give them" = intersection of (my swaps ∩ their needs)
 * "They give me" = intersection of (my needs ∩ their swaps)
 *
 * @param {{ needs: Object, swaps: Object }} listA - Parsed "My List"
 * @param {{ needs: Object, swaps: Object }} listB - Parsed "Friend's List"
 * @returns {{ iGiveThem: Object.<string, string[]>, theyGiveMe: Object.<string, string[]> }}
 */
export function calculateMatches(listA, listB) {
  function intersect(have, want) {
    const result = {};
    for (const code of Object.keys(have)) {
      const haveSet = new Set(have[code]);
      const wantArr = want[code] || [];
      const common = wantArr.filter(n => haveSet.has(n));
      if (common.length > 0) {
        result[code] = sortStickerNums(common);
      }
    }
    return result;
  }

  return {
    iGiveThem: intersect(listA.swaps, listB.needs),
    theyGiveMe: intersect(listB.swaps, listA.needs),
  };
}

/**
 * Count total stickers across all country codes.
 * @param {Object.<string, string[]>} matchObj
 * @returns {number}
 */
export function countTotal(matchObj) {
  return Object.values(matchObj).reduce((sum, arr) => sum + arr.length, 0);
}

// ─────────────────────────────────────────────────────────
//  Selection helpers
// ─────────────────────────────────────────────────────────

/**
 * Create initial selection state with all stickers selected.
 * @param {Object.<string, string[]>} matchData - e.g. { ARG: ['1','4'], MEX: ['5','7'] }
 * @returns {Object.<string, Set<string>>} - e.g. { ARG: Set(['1','4']), MEX: Set(['5','7']) }
 */
export function initAllSelected(matchData) {
  const sel = {};
  for (const [code, nums] of Object.entries(matchData)) {
    sel[code] = new Set(nums);
  }
  return sel;
}

/**
 * Filter match data to only selected stickers.
 * @param {Object.<string, string[]>} matchData
 * @param {Object.<string, Set<string>>} selection
 * @returns {Object.<string, string[]>}
 */
export function filterBySelection(matchData, selection) {
  const result = {};
  for (const [code, nums] of Object.entries(matchData)) {
    const sel = selection[code];
    if (!sel) continue;
    const filtered = nums.filter(n => sel.has(n));
    if (filtered.length > 0) {
      result[code] = filtered;
    }
  }
  return result;
}

/**
 * Count total selected stickers.
 * @param {Object.<string, Set<string>>} selection
 * @returns {number}
 */
export function countSelected(selection) {
  return Object.values(selection).reduce((sum, s) => sum + s.size, 0);
}

/**
 * Check if all stickers are selected.
 * @param {Object.<string, string[]>} matchData
 * @param {Object.<string, Set<string>>} selection
 * @returns {boolean}
 */
export function isAllSelected(matchData, selection) {
  for (const [code, nums] of Object.entries(matchData)) {
    const sel = selection[code];
    if (!sel || sel.size !== nums.length) return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────
//  Formatting
// ─────────────────────────────────────────────────────────

/**
 * Format matches into a human-readable text summary for clipboard.
 * @param {{ iGiveThem: Object, theyGiveMe: Object }} data
 * @returns {string}
 */
export function formatTradeSummary(data) {
  function formatSection(title, sectionData) {
    const codes = Object.keys(sectionData).sort();
    if (codes.length === 0) return `${title} (nothing)`;
    const lines = codes.map(code => `  ${code}: ${sectionData[code].join(', ')}`);
    return `${title}\n${lines.join('\n')}`;
  }

  const iGive = formatSection('📤 I give you:', data.iGiveThem);
  const theyGive = formatSection('📥 You give me:', data.theyGiveMe);
  const totalGive = countTotal(data.iGiveThem);
  const totalGet = countTotal(data.theyGiveMe);
  const fair = Math.min(totalGive, totalGet);

  return [
    '🔄 Panini FIFA World Cup 2026 StickerSwap Trade Summary',
    '━'.repeat(32),
    '',
    iGive,
    '',
    theyGive,
    '',
    '━'.repeat(32),
    `📊 Total: I give ${totalGive} · You give ${totalGet} · Fair swap: ${fair}`,
  ].join('\n');
}

// ─────────────────────────────────────────────────────────
//  PDF Generation
// ─────────────────────────────────────────────────────────

/**
 * Generate and download a PDF with the selected trade stickers.
 * @param {{ iGiveThem: Object.<string, string[]>, theyGiveMe: Object.<string, string[]> }} data
 */
export async function generateTradePDF(data) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const totalGive = countTotal(data.iGiveThem);
  const totalGet = countTotal(data.theyGiveMe);
  const fair = Math.min(totalGive, totalGet);

  // ── Helper: check if we need a new page ──
  function ensureSpace(needed) {
    const pageH = doc.internal.pageSize.getHeight();
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // ── Title ──
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(139, 92, 246); // sophisticated violet
  doc.text('Panini FIFA World Cup 2026 StickerSwap Trade Summary', margin, y);
  y += 8;

  // ── Date ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128); // muted
  doc.text(new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }), margin, y);
  y += 6;

  // ── Divider ──
  doc.setDrawColor(229, 231, 235);
  doc.setLineWidth(0.4);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ── Summary box ──
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, y, contentW, 18, 3, 3, 'F');
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const colW = contentW / 3;
  // You give
  doc.setTextColor(22, 163, 74);
  doc.text(`You give: ${totalGive}`, margin + colW * 0.5, y + 7, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('stickers', margin + colW * 0.5, y + 12, { align: 'center' });
  // You receive
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(37, 99, 235);
  doc.text(`You receive: ${totalGet}`, margin + colW * 1.5, y + 7, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('stickers', margin + colW * 1.5, y + 12, { align: 'center' });
  // Fair swap
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(31, 41, 55);
  doc.text(`Fair swap: ${fair}`, margin + colW * 2.5, y + 7, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('stickers each', margin + colW * 2.5, y + 12, { align: 'center' });
  y += 26;

  // ── Section renderer ──
  function renderSection(title, sectionData, color) {
    const codes = Object.keys(sectionData).sort();
    if (codes.length === 0) return;

    ensureSpace(16);

    // Section header bar
    doc.setFillColor(...color.bg);
    doc.roundedRect(margin, y, contentW, 9, 2, 2, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color.text);
    doc.text(title, margin + 4, y + 6.5);

    const sectionTotal = codes.reduce((s, c) => s + sectionData[c].length, 0);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${sectionTotal} stickers`, pageW - margin - 4, y + 6.5, { align: 'right' });
    y += 13;

    // Country rows
    for (const code of codes) {
      const nums = sectionData[code];
      const numStr = nums.join(', ');

      // Estimate lines needed
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(numStr, contentW - 22);
      const rowH = Math.max(6, lines.length * 4.5 + 2);
      ensureSpace(rowH + 2);

      // Alternating background
      const codeIdx = codes.indexOf(code);
      if (codeIdx % 2 === 0) {
        doc.setFillColor(249, 250, 251);
        doc.rect(margin, y - 1, contentW, rowH + 1, 'F');
      }

      // Country code
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.text(code, margin + 3, y + 3.5);

      // Numbers
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(31, 41, 55);
      doc.setFontSize(9);
      doc.text(lines, margin + 20, y + 3.5);

      y += rowH;
    }
    y += 4;
  }

  renderSection('You give them', data.iGiveThem, {
    bg: [220, 252, 231], text: [21, 128, 61]
  });

  renderSection('They give you', data.theyGiveMe, {
    bg: [238, 242, 255], text: [67, 56, 202] // periwinkle/indigo
  });

  // ── Footer ──
  const pageH = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(156, 163, 175);
  doc.text('Generated by Panini FIFA World Cup 2026 StickerSwap Matcher', margin, pageH - 10);
  doc.text('panini-fifa-world-cup-2026-stickerswap-matcher', pageW - margin, pageH - 10, { align: 'right' });

  doc.save('sticker-swap-trade.pdf');
}

/**
 * Update the user's sticker list by removing traded stickers.
 * - Traded needs (stickers received) are removed from the needs list.
 * - Traded swaps (stickers given) are removed from the swaps list.
 *
 * @param {{ needs: Object, swaps: Object }} originalList - Parsed original list
 * @param {{ iGiveThem: Object, theyGiveMe: Object }} selectedTrades - Selected traded stickers
 * @returns {{ needs: Object, swaps: Object }} Updated list
 */
export function getUpdatedList(originalList, selectedTrades) {
  const updated = { needs: {}, swaps: {} };

  function subtract(source, subtractList) {
    const res = {};
    for (const [code, nums] of Object.entries(source)) {
      const toSub = new Set(subtractList[code] || []);
      const remaining = nums.filter(n => !toSub.has(n));
      if (remaining.length > 0) {
        res[code] = remaining;
      }
    }
    return res;
  }

  updated.needs = subtract(originalList.needs || {}, selectedTrades.theyGiveMe || {});
  updated.swaps = subtract(originalList.swaps || {}, selectedTrades.iGiveThem || {});

  return updated;
}

/**
 * Format a sticker list to a target string structure (figuritas, figuri, or json).
 *
 * @param {{ needs: Object, swaps: Object }} list - The updated list to format
 * @param {Object.<string, string>} headers - Mapping code -> original category line
 * @param {'figuritas' | 'figuri' | 'json'} format - Target layout
 * @returns {string} Formatted text
 */
export function formatStickerList(list, headers, format) {
  if (format === 'json') {
    return JSON.stringify({ needs: list.needs, swaps: list.swaps }, null, 2);
  }

  const needsCount = countTotal(list.needs || {});
  const swapsCount = countTotal(list.swaps || {});

  const formatSection = (title, items) => {
    const lines = [title];
    const sortedCodes = Object.keys(items).sort();
    for (const code of sortedCodes) {
      const nums = items[code];
      if (nums && nums.length > 0) {
        const header = headers[code] || code;
        lines.push(`${header}: ${nums.join(', ')}`);
      }
    }
    return lines.join('\n');
  };

  if (format === 'figuri') {
    const needsPart = formatSection(`❌ Me faltan (${needsCount}):`, list.needs || {});
    const swapsPart = formatSection(`🔁 Repetidas (${swapsCount}):`, list.swaps || {});
    return `${needsPart}\n\n${swapsPart}`;
  } else {
    // Default to 'figuritas' format
    const needsPart = formatSection('I need', list.needs || {});
    const swapsPart = formatSection('Swaps', list.swaps || {});
    return `${needsPart}\n\n${swapsPart}`;
  }
}
