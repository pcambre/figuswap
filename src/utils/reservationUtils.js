/**
 * reservationUtils.js
 * ─────────────────────────────────────────────────────────
 * Persistence and logic layer for the sticker reservation system.
 * Stored in localStorage under key 'stickerswap_reservations'.
 *
 * A reservation is a snapshot of a selected trade. It does NOT
 * modify the user's collection until explicitly confirmed.
 *
 * Shape:
 * {
 *   id: string,           // unique ID (uuid-like)
 *   createdAt: string,    // ISO date string
 *   note: string,         // optional label e.g. "with Matías"
 *   iGiveThem: Object,    // { countryCode: string[] }
 *   theyGiveMe: Object,   // { countryCode: string[] }
 *   status: 'pending' | 'confirmed' | 'cancelled'
 * }
 * ─────────────────────────────────────────────────────────
 */

const STORAGE_KEY = 'stickerswap_reservations';

// ─── Simple ID generator ───
function generateId() {
  return `rsv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Load all reservations from localStorage.
 * @returns {Array} Array of reservation objects
 */
export function loadReservations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save all reservations to localStorage.
 * @param {Array} reservations
 */
export function saveReservations(reservations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations));
  } catch (err) {
    console.error('Failed to save reservations:', err);
  }
}

/**
 * Create a new pending reservation from selected trade data.
 * @param {{ iGiveThem: Object, theyGiveMe: Object }} selectedData
 * @param {string} note - Optional free-text label
 * @returns {Object} The new reservation object
 */
export function createReservation(selectedData, note = '') {
  return {
    id: generateId(),
    createdAt: new Date().toISOString(),
    note: note.trim(),
    iGiveThem: selectedData.iGiveThem || {},
    theyGiveMe: selectedData.theyGiveMe || {},
    status: 'pending',
  };
}

/**
 * Confirm a reservation: mark as confirmed and return the trade data
 * to apply to the collection.
 *
 * @param {string} id
 * @param {Array} reservations
 * @returns {{ updatedReservations: Array, trade: Object|null }}
 */
export function confirmReservation(id, keepGive, keepGet, reservations) {
  let trade = null;
  const updatedReservations = reservations.map(r => {
    if (r.id === id && r.status === 'pending') {
      const finalGive = keepGive !== undefined ? keepGive : r.iGiveThem;
      const finalGet = keepGet !== undefined ? keepGet : r.theyGiveMe;
      trade = { iGiveThem: finalGive, theyGiveMe: finalGet };
      return { ...r, iGiveThem: finalGive, theyGiveMe: finalGet, status: 'confirmed' };
    }
    return r;
  });
  return { updatedReservations, trade };
}

/**
 * Fully cancel a reservation (status → 'cancelled'). Collection unchanged.
 * @param {string} id
 * @param {Array} reservations
 * @returns {Array} Updated reservations array
 */
export function cancelReservation(id, reservations) {
  return reservations.map(r =>
    r.id === id && r.status === 'pending' ? { ...r, status: 'cancelled' } : r
  );
}

/**
 * Partially cancel a reservation by keeping only the specified stickers.
 * - keepGive: { code: string[] } — stickers to KEEP in iGiveThem
 * - keepGet:  { code: string[] } — stickers to KEEP in theyGiveMe
 * If nothing remains, the reservation is fully cancelled.
 *
 * @param {string} id
 * @param {Object} keepGive - stickers to keep in iGiveThem
 * @param {Object} keepGet  - stickers to keep in theyGiveMe
 * @param {Array}  reservations
 * @returns {Array} Updated reservations array
 */
export function partialCancelReservation(id, keepGive, keepGet, reservations) {
  return reservations.map(r => {
    if (r.id !== id || r.status !== 'pending') return r;

    // Filter iGiveThem to only kept stickers
    const newGive = {};
    for (const [code, nums] of Object.entries(keepGive)) {
      if (nums.length > 0) newGive[code] = nums;
    }

    // Filter theyGiveMe to only kept stickers
    const newGet = {};
    for (const [code, nums] of Object.entries(keepGet)) {
      if (nums.length > 0) newGet[code] = nums;
    }

    const hasAnything =
      Object.values(newGive).some(a => a.length > 0) ||
      Object.values(newGet).some(a => a.length > 0);

    if (!hasAnything) {
      return { ...r, status: 'cancelled' };
    }

    return { ...r, iGiveThem: newGive, theyGiveMe: newGet };
  });
}

/**
 * Get all stickers currently reserved across ALL pending reservations.
 * Used to show indicators in the collection view.
 *
 * @param {Array} reservations
 * @returns {{
 *   give: Object.<string, Set<string>>,   // stickers user will give away
 *   get:  Object.<string, Set<string>>    // stickers user will receive
 * }}
 */
export function getPendingReservedStickers(reservations) {
  const give = {};
  const get = {};

  for (const r of reservations) {
    if (r.status !== 'pending') continue;

    for (const [code, nums] of Object.entries(r.iGiveThem || {})) {
      if (!give[code]) give[code] = new Set();
      for (const n of nums) give[code].add(n);
    }

    for (const [code, nums] of Object.entries(r.theyGiveMe || {})) {
      if (!get[code]) get[code] = new Set();
      for (const n of nums) get[code].add(n);
    }
  }

  return { give, get };
}

/**
 * Count total stickers across all pending reservations.
 * @param {Array} reservations
 * @returns {number}
 */
export function countPendingStickers(reservations) {
  let total = 0;
  for (const r of reservations) {
    if (r.status !== 'pending') continue;
    for (const nums of Object.values(r.iGiveThem || {})) total += nums.length;
    for (const nums of Object.values(r.theyGiveMe || {})) total += nums.length;
  }
  return total;
}
