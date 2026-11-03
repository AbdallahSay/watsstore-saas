'use client';
import { useSyncExternalStore } from 'react';
const eventName = 'watsstore-storage-change';
const memoryFallback = new Map<string, string>();
function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(eventName, listener);
  return () => { window.removeEventListener('storage', listener); window.removeEventListener(eventName, listener); };
}
export function useBrowserStorage(key: string, session = false) {
  return useSyncExternalStore(subscribe, () => {
    try { return (session ? sessionStorage : localStorage).getItem(key); } catch { return session ? null : memoryFallback.get(key) ?? null; }
  }, () => null);
}
export function writeBrowserStorage(key: string, value: string) {
  memoryFallback.set(key, value);
  try { localStorage.setItem(key, value); } catch { /* Browser storage may be unavailable. */ }
  window.dispatchEvent(new Event(eventName));
}
const clientSnapshot = () => true, serverSnapshot = () => false;
export function useBrowserReady() { return useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot); }
