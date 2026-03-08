import { FeedbackData } from "../types";

const CACHE_KEY = 'qariai_client_cache_v2';
const MAX_ITEMS = 20;
const EXPIRY_DAYS = 7;

export const getCachedFeedback = (surah: number, ayahRange: string, duration: number): FeedbackData | null => {
  try {
    const key = `rec_${surah}_${ayahRange}_${Math.round(duration)}`;
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) return null;

    let cache = JSON.parse(stored);
    const now = Date.now();
    const expiryMs = EXPIRY_DAYS * 24 * 60 * 60 * 1000;

    const entry = cache.find((e: any) => e.key === key);
    if (entry && (now - entry.timestamp) < expiryMs) {
      return entry.data;
    }
    return null;
  } catch (e) { return null; }
};

export const saveToCache = (surah: number, ayahRange: string, duration: number, data: FeedbackData) => {
  try {
    const key = `rec_${surah}_${ayahRange}_${Math.round(duration)}`;
    let cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');

    // Add new entry and remove duplicates
    cache = [{ key, data, timestamp: Date.now() }, ...cache.filter((e: any) => e.key !== key)];

    // Keep only last 20 and save
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache.slice(0, MAX_ITEMS)));
  } catch (e) { console.error("Cache save failed", e); }
};
