/**
 * localStorageUtils.js
 * ─────────────────────────────────────────────────────────
 * Persistence layer for the user's sticker collection.
 * Uses localStorage with the key 'stickerswap_collection'.
 *
 * Collection shape:
 * {
 *   needs:      { code: string[] }           — stickers user needs (no counts)
 *   swaps:      { code: string[] }           — unique sticker numbers user has as dupes
 *   swapCounts: { code: { num: number } }   — how many copies of each swap sticker
 *   headers:    { code: string }             — display labels like "MEX 🇲🇽"
 * }
 * ─────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'stickerswap_collection';

function emptyCollection() {
  return { needs: {}, swaps: {}, swapCounts: {}, headers: {} };
}

/**
 * Load the collection from localStorage.
 */
export function loadCollection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCollection();
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.needs && parsed.swaps) {
      return {
        needs:      parsed.needs      || {},
        swaps:      parsed.swaps      || {},
        swapCounts: parsed.swapCounts || {},
        headers:    parsed.headers    || {},
      };
    }
    return emptyCollection();
  } catch {
    return emptyCollection();
  }
}

export function saveCollection(collection) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
  } catch (err) {
    console.error('Failed to save collection to localStorage:', err);
  }
}

export function clearCollectionStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear collection from localStorage:', err);
  }
}

function sortNums(nums) {
  return [...nums].sort((a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    if (isNaN(na) && isNaN(nb)) return a.localeCompare(b);
    if (isNaN(na)) return -1;
    if (isNaN(nb)) return 1;
    return na - nb;
  });
}

/**
 * Add a sticker to a section. For swaps, optionally pass count (default 1).
 * Calling addSticker again for an existing swap sticker INCREMENTS its count.
 */
export function addSticker(collection, section, countryCode, stickerNum, header, count = 1) {
  const code = countryCode.toUpperCase();
  const num  = stickerNum.trim();

  const updated = {
    needs:      { ...collection.needs },
    swaps:      { ...collection.swaps },
    swapCounts: { ...collection.swapCounts },
    headers:    { ...collection.headers },
  };

  if (header) updated.headers[code] = header;
  else if (!updated.headers[code]) updated.headers[code] = code;

  if (section === 'swaps') {
    // Add to the unique array if not already there
    const existingSet = new Set(updated.swaps[code] || []);
    existingSet.add(num);
    updated.swaps[code] = sortNums([...existingSet]);

    // Increment count
    if (!updated.swapCounts[code]) updated.swapCounts[code] = {};
    updated.swapCounts[code] = { ...updated.swapCounts[code] };
    updated.swapCounts[code][num] = (updated.swapCounts[code][num] || 0) + count;
  } else {
    // needs — no count tracking
    const existingSet = new Set(updated.needs[code] || []);
    existingSet.add(num);
    updated.needs[code] = sortNums([...existingSet]);
  }

  return updated;
}

/**
 * Set the exact count for a swap sticker (for +/- UI controls).
 * If count <= 0, the sticker is removed.
 */
export function setSwapCount(collection, countryCode, stickerNum, count) {
  if (count <= 0) return removeSticker(collection, 'swaps', countryCode, stickerNum);

  const updated = {
    needs:      { ...collection.needs },
    swaps:      { ...collection.swaps },
    swapCounts: { ...collection.swapCounts },
    headers:    { ...collection.headers },
  };

  // Ensure sticker is in the array
  const existingSet = new Set(updated.swaps[countryCode] || []);
  existingSet.add(stickerNum);
  updated.swaps[countryCode] = sortNums([...existingSet]);

  if (!updated.swapCounts[countryCode]) updated.swapCounts[countryCode] = {};
  updated.swapCounts[countryCode] = { ...updated.swapCounts[countryCode] };
  updated.swapCounts[countryCode][stickerNum] = count;

  return updated;
}

/**
 * Remove a sticker from a section.
 * For swaps: decrements count by 1; fully removes only when count reaches 0.
 * Pass force=true to remove regardless of count.
 */
export function removeSticker(collection, section, countryCode, stickerNum, force = false) {
  const updated = {
    needs:      { ...collection.needs },
    swaps:      { ...collection.swaps },
    swapCounts: { ...collection.swapCounts },
    headers:    { ...collection.headers },
  };

  if (section === 'swaps') {
    const currentCount = updated.swapCounts[countryCode]?.[stickerNum] || 1;
    const newCount = force ? 0 : currentCount - 1;

    if (newCount <= 0) {
      // Remove from array and counts map
      updated.swaps[countryCode] = (updated.swaps[countryCode] || []).filter(n => n !== stickerNum);
      if (updated.swapCounts[countryCode]) {
        updated.swapCounts[countryCode] = { ...updated.swapCounts[countryCode] };
        delete updated.swapCounts[countryCode][stickerNum];
        if (Object.keys(updated.swapCounts[countryCode]).length === 0) {
          delete updated.swapCounts[countryCode];
        }
      }
      if (!updated.swaps[countryCode]?.length) delete updated.swaps[countryCode];
    } else {
      // Just decrement count
      updated.swapCounts[countryCode] = { ...updated.swapCounts[countryCode] };
      updated.swapCounts[countryCode][stickerNum] = newCount;
    }
  } else {
    const remaining = (updated.needs[countryCode] || []).filter(n => n !== stickerNum);
    if (remaining.length > 0) updated.needs[countryCode] = remaining;
    else delete updated.needs[countryCode];
  }

  // Clean up orphaned headers
  if (!updated.needs[countryCode]?.length && !updated.swaps[countryCode]?.length) {
    delete updated.headers[countryCode];
  }

  return updated;
}

/**
 * Apply a confirmed swap to the collection.
 * - iGiveThem: decrement swap count by 1 per sticker (remove if count hits 0)
 * - theyGiveMe: remove from needs
 */
export function applySwap(collection, confirmedTrade) {
  const updated = {
    needs:      { ...collection.needs },
    swaps:      { ...collection.swaps },
    swapCounts: { ...collection.swapCounts },
    headers:    { ...collection.headers },
  };

  // Decrement counts for stickers given away
  for (const [code, nums] of Object.entries(confirmedTrade.iGiveThem || {})) {
    for (const num of nums) {
      const currentCount = updated.swapCounts[code]?.[num] || 1;
      const newCount = currentCount - 1;

      if (newCount <= 0) {
        updated.swaps[code] = (updated.swaps[code] || []).filter(n => n !== num);
        if (!updated.swaps[code]?.length) delete updated.swaps[code];
        if (updated.swapCounts[code]) {
          updated.swapCounts[code] = { ...updated.swapCounts[code] };
          delete updated.swapCounts[code][num];
          if (Object.keys(updated.swapCounts[code]).length === 0) delete updated.swapCounts[code];
        }
      } else {
        if (!updated.swapCounts[code]) updated.swapCounts[code] = {};
        updated.swapCounts[code] = { ...updated.swapCounts[code] };
        updated.swapCounts[code][num] = newCount;
      }
    }
  }

  // Remove received stickers from needs
  for (const [code, nums] of Object.entries(confirmedTrade.theyGiveMe || {})) {
    const toRemove = new Set(nums);
    const remaining = (updated.needs[code] || []).filter(n => !toRemove.has(n));
    if (remaining.length > 0) updated.needs[code] = remaining;
    else delete updated.needs[code];
  }

  // Clean up orphaned headers
  for (const code of Object.keys(updated.headers)) {
    if (!updated.needs[code]?.length && !updated.swaps[code]?.length) {
      delete updated.headers[code];
    }
  }

  return updated;
}

/**
 * Merge a parsed sticker list into the existing collection.
 * For swaps: accumulates counts (adds on top of existing).
 */
export function mergeIntoCollection(collection, parsedList) {
  const merged = {
    needs:      { ...collection.needs },
    swaps:      { ...collection.swaps },
    swapCounts: { ...collection.swapCounts },
    headers:    { ...collection.headers },
  };

  for (const [code, header] of Object.entries(parsedList.headers || {})) {
    if (!merged.headers[code]) merged.headers[code] = header;
  }

  // Merge needs (union, no counts)
  for (const [code, nums] of Object.entries(parsedList.needs || {})) {
    const existing = new Set(merged.needs[code] || []);
    for (const n of nums) existing.add(n);
    merged.needs[code] = sortNums([...existing]);
  }

  // Merge swaps (union of unique nums + accumulate counts)
  for (const [code, nums] of Object.entries(parsedList.swaps || {})) {
    const existing = new Set(merged.swaps[code] || []);
    for (const n of nums) existing.add(n);
    merged.swaps[code] = sortNums([...existing]);

    // Merge counts
    const incomingCounts = parsedList.swapCounts?.[code] || {};
    if (!merged.swapCounts[code]) merged.swapCounts[code] = {};
    merged.swapCounts[code] = { ...merged.swapCounts[code] };
    for (const n of nums) {
      const inCount = incomingCounts[n] || 1;
      merged.swapCounts[code][n] = (merged.swapCounts[code][n] || 0) + inCount;
    }
  }

  return merged;
}

/**
 * Serialize collection back to text format (Figuritas).
 * Emits (×N) for swap stickers with count > 1.
 */
export function collectionToText(collection) {
  const lines = [];

  const formatNeeds = (title, items, headers) => {
    const sortedCodes = Object.keys(items).sort();
    if (sortedCodes.length === 0) return;
    lines.push(title);
    for (const code of sortedCodes) {
      const nums = items[code];
      if (nums?.length > 0) {
        const header = headers[code] || code;
        lines.push(`${header}: ${nums.join(', ')}`);
      }
    }
    lines.push('');
  };

  const formatSwaps = (title, items, counts, headers) => {
    const sortedCodes = Object.keys(items).sort();
    if (sortedCodes.length === 0) return;
    lines.push(title);
    for (const code of sortedCodes) {
      const nums = items[code];
      if (nums?.length > 0) {
        const header = headers[code] || code;
        const codeCounts = counts?.[code] || {};
        const parts = nums.map(n => {
          const c = codeCounts[n] || 1;
          return c > 1 ? `${n} (×${c})` : n;
        });
        lines.push(`${header}: ${parts.join(', ')}`);
      }
    }
    lines.push('');
  };

  formatNeeds('I need', collection.needs || {}, collection.headers || {});
  formatSwaps('Swaps', collection.swaps || {}, collection.swapCounts || {}, collection.headers || {});

  return lines.join('\n');
}

/**
 * Count total stickers in needs (each = 1).
 */
export function countSection(section) {
  return Object.values(section || {}).reduce((sum, arr) => sum + arr.length, 0);
}

/**
 * Count total swap stickers respecting quantities.
 */
export function countSwapsWithQuantity(swaps, swapCounts) {
  let total = 0;
  for (const code of Object.keys(swaps || {})) {
    for (const num of swaps[code]) {
      total += swapCounts?.[code]?.[num] || 1;
    }
  }
  return total;
}

/**
 * Format a collection into a target string structure (figuritas, figuri, or json).
 */
export function formatCollection(collection, format) {
  if (format === 'json') {
    return JSON.stringify(collection, null, 2);
  }

  const needsCount = Object.values(collection.needs || {}).reduce((sum, arr) => sum + arr.length, 0);
  const swapsCount = Object.values(collection.swaps || {}).reduce((sum, arr) => sum + arr.length, 0);

  const formatSection = (title, items, isSwaps = false) => {
    const lines = [title];
    const sortedCodes = Object.keys(items).sort();
    for (const code of sortedCodes) {
      const nums = items[code];
      if (nums && nums.length > 0) {
        const header = collection.headers?.[code] || code;
        if (isSwaps) {
          const counts = collection.swapCounts?.[code] || {};
          const parts = nums.map(n => {
            const c = counts[n] || 1;
            return c > 1 ? `${n} (×${c})` : n;
          });
          lines.push(`${header}: ${parts.join(', ')}`);
        } else {
          lines.push(`${header}: ${nums.join(', ')}`);
        }
      }
    }
    return lines.join('\n');
  };

  if (format === 'figuri') {
    const needsPart = formatSection(`❌ Me faltan (${needsCount}):`, collection.needs || {});
    const swapsPart = formatSection(`🔁 Repetidas (${swapsCount}):`, collection.swaps || {}, true);
    return `${needsPart}\n\n${swapsPart}`;
  } else {
    // Default to 'figuritas' format
    const needsPart = formatSection('I need', collection.needs || {});
    const swapsPart = formatSection('Swaps', collection.swaps || {}, true);
    return `${needsPart}\n\n${swapsPart}`;
  }
}

