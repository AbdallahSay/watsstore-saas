'use client';
import { useEffect, useRef } from 'react';
export function useVisiblePoll(callback: () => void | Promise<void>, enabled: boolean, interval = 30000) {
  const latest = useRef(callback); latest.current = callback;
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const update = () => {
      clearInterval(timer);
      if (document.visibilityState !== 'visible') return;
      void latest.current();
      timer = setInterval(() => {if (document.visibilityState === 'visible') void latest.current();}, interval);
    };
    update(); document.addEventListener('visibilitychange', update);
    return () => {clearInterval(timer);document.removeEventListener('visibilitychange',update);};
  }, [enabled, interval]);
}
