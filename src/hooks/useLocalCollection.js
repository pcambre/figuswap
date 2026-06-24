import { useState, useCallback, useEffect } from 'react';
import {
  loadCollection,
  saveCollection,
  clearCollectionStorage,
  addSticker as addStickerUtil,
  removeSticker as removeStickerUtil,
  setSwapCount as setSwapCountUtil,
  applySwap as applySwapUtil,
  mergeIntoCollection,
  collectionToText,
  countSection,
  countSwapsWithQuantity,
} from '../utils/localStorageUtils';

/**
 * useLocalCollection — Custom hook for managing the user's persisted sticker collection.
 *
 * @returns {{
 *   collection: { needs: Object, swaps: Object, headers: Object },
 *   addSticker: (section: string, code: string, num: string, header?: string) => void,
 *   removeSticker: (section: string, code: string, num: string) => void,
 *   confirmSwap: (selectedTrade: Object) => void,
 *   mergeList: (parsedList: Object) => void,
 *   clearAll: () => void,
 *   toText: () => string,
 *   needsCount: number,
 *   swapsCount: number,
 *   isEmpty: boolean,
 * }}
 */
export default function useLocalCollection() {
  const [collection, setCollection] = useState(() => loadCollection());

  // Sync to localStorage whenever collection changes
  useEffect(() => {
    saveCollection(collection);
  }, [collection]);

  const addSticker = useCallback((section, code, num, header) => {
    setCollection(prev => addStickerUtil(prev, section, code, num, header));
  }, []);

  const removeSticker = useCallback((section, code, num, force = false) => {
    setCollection(prev => removeStickerUtil(prev, section, code, num, force));
  }, []);

  const setSwapCount = useCallback((code, num, count) => {
    setCollection(prev => setSwapCountUtil(prev, code, num, count));
  }, []);

  const confirmSwap = useCallback((selectedTrade) => {
    setCollection(prev => applySwapUtil(prev, selectedTrade));
  }, []);

  const mergeList = useCallback((parsedList) => {
    setCollection(prev => mergeIntoCollection(prev, parsedList));
  }, []);

  const clearAll = useCallback(() => {
    clearCollectionStorage();
    setCollection({ needs: {}, swaps: {}, headers: {} });
  }, []);

  const toText = useCallback(() => {
    return collectionToText(collection);
  }, [collection]);

  const needsCount  = countSection(collection.needs);
  const swapsCount  = countSwapsWithQuantity(collection.swaps, collection.swapCounts);
  const isEmpty     = countSection(collection.needs) === 0 && countSection(collection.swaps) === 0;

  return {
    collection,
    addSticker,
    removeSticker,
    setSwapCount,
    confirmSwap,
    mergeList,
    clearAll,
    toText,
    needsCount,
    swapsCount,
    isEmpty,
  };
}
