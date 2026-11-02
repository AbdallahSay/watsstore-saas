'use client';

import { useEffect, useRef } from 'react';

/** Keeps keyboard navigation inside an open dialog and restores the trigger. */
export function useDialog(open: boolean, onClose: () => void, closeAt?: string) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    if (!open) return;
    const breakpoint = closeAt ? window.matchMedia(closeAt) : null;
    if (breakpoint?.matches) { close.current(); return; }
    const dialog = ref.current;
    if (!dialog) return;
    const trigger = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
    )).filter(element => element.getClientRects().length > 0 && !element.matches(':disabled,[aria-disabled="true"]') && element.tabIndex >= 0);
    (focusable()[0] || dialog).focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      const first = elements[0], last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    const handleBreakpoint = () => { if (breakpoint?.matches) close.current(); };
    breakpoint?.addEventListener('change', handleBreakpoint);
    return () => {
      document.removeEventListener('keydown', handleKey);
      breakpoint?.removeEventListener('change', handleBreakpoint);
      document.body.style.overflow = overflow;
      if (trigger?.isConnected && trigger.getClientRects().length) trigger.focus();
    };
  }, [open, closeAt]);
  return ref;
}
