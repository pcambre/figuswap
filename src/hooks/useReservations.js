import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  loadReservations,
  saveReservations,
  createReservation,
  confirmReservation as confirmUtil,
  cancelReservation as cancelUtil,
  partialCancelReservation as partialCancelUtil,
  getPendingReservedStickers,
} from '../utils/reservationUtils';
import { applySwap } from '../utils/localStorageUtils';

/**
 * useReservations — Manages the full reservation lifecycle.
 *
 * @param {{ collection, setCollection }} collectionHandlers
 *   We need setCollection from useLocalCollection to apply confirmed swaps.
 *   Pass the confirmSwap callback from useLocalCollection instead.
 *
 * @returns {{
 *   reservations: Array,
 *   pendingCount: number,
 *   reserveSwap: (selectedData, note) => void,
 *   confirmReservation: (id) => void,
 *   cancelReservation: (id) => void,
 *   partialCancel: (id, keepGive, keepGet) => void,
 *   reservedGiveStickers: Object.<string, Set<string>>,
 *   reservedGetStickers: Object.<string, Set<string>>,
 * }}
 */
export default function useReservations({ onConfirmSwap }) {
  const [reservations, setReservations] = useState(() => loadReservations());

  // Sync to localStorage on every change
  useEffect(() => {
    saveReservations(reservations);
  }, [reservations]);

  // ── Derive reserved sticker sets for indicator display ──
  const { reservedGiveStickers, reservedGetStickers } = useMemo(() => {
    const { give, get } = getPendingReservedStickers(reservations);
    return { reservedGiveStickers: give, reservedGetStickers: get };
  }, [reservations]);

  const pendingCount = reservations.filter(r => r.status === 'pending').length;

  // ── Reserve a trade (snapshot — does NOT touch collection) ──
  const reserveSwap = useCallback((selectedData, note = '') => {
    const newReservation = createReservation(selectedData, note);
    setReservations(prev => [newReservation, ...prev]);
  }, []);

  // ── Confirm a pending reservation (applies swap to collection) ──
  const confirmReservation = useCallback((id, keepGive, keepGet) => {
    setReservations(prev => {
      const { updatedReservations, trade } = confirmUtil(id, keepGive, keepGet, prev);
      if (trade && onConfirmSwap) {
        onConfirmSwap(trade);
      }
      return updatedReservations;
    });
  }, [onConfirmSwap]);

  // ── Cancel a reservation fully ──
  const cancelReservation = useCallback((id) => {
    setReservations(prev => cancelUtil(id, prev));
  }, []);

  // ── Partially cancel — keep only specified stickers ──
  const partialCancel = useCallback((id, keepGive, keepGet) => {
    setReservations(prev => partialCancelUtil(id, keepGive, keepGet, prev));
  }, []);

  return {
    reservations,
    pendingCount,
    reserveSwap,
    confirmReservation,
    cancelReservation,
    partialCancel,
    reservedGiveStickers,
    reservedGetStickers,
  };
}
