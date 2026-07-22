import { useEffect } from 'react';

/**
 * ISC Intellectual Property Protection
 *
 * Applies browser-level deterrents against casual content theft:
 * - Disables right-click context menu site-wide
 * - Blocks common DevTools / source-view keyboard shortcuts
 * - Prevents image drag-and-drop extraction
 * - Injects a console ownership warning for developers
 * - Disables text selection on elements marked `.isc-protected`
 */
export function useIPProtection() {
  useEffect(() => {
    // ── Console ownership warning ────────────────────────────────────────
    console.log(
      '%c⚠ STOP.',
      'color:#C9A84C;font-size:28px;font-weight:900;'
    );
    console.log(
      '%cThis is a browser feature intended for developers. If someone told you to paste something here, they are attempting to compromise this application.\n\nAll content, methodologies, frameworks, AI tools, and source code on this platform are the exclusive intellectual property of I Supply Chain (ISC) — Ma\'in Alhaqash MCIPS CPSM MSc.\n\nUnauthorised access, copying, scraping or reproduction is a violation of international copyright law and will be prosecuted under applicable Saudi Arabian, Jordanian and international IP legislation.\n\n© 2026 I Supply Chain. All Rights Reserved.',
      'color:#082C6B;font-size:14px;line-height:1.6;'
    );

    // ── Disable right-click ──────────────────────────────────────────────
    const blockContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // ── Block DevTools & source-view shortcuts ───────────────────────────
    const blockShortcuts = (e: KeyboardEvent) => {
      const ctrl  = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const key   = e.key.toUpperCase();

      const blocked =
        e.key === 'F12' ||                                       // DevTools
        (ctrl && shift && key === 'I') ||                        // DevTools
        (ctrl && shift && key === 'J') ||                        // Console
        (ctrl && shift && key === 'C') ||                        // Inspector
        (ctrl && key === 'U') ||                                 // View source
        (ctrl && key === 'S') ||                                 // Save page
        (ctrl && shift && key === 'K');                          // Firefox console

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      return undefined;
    };

    // ── Disable image drag ───────────────────────────────────────────────
    const blockImageDrag = (e: DragEvent) => {
      if ((e.target as HTMLElement).tagName === 'IMG') {
        e.preventDefault();
        return false;
      }
      return undefined;
    };

    // ── Disable print ────────────────────────────────────────────────────
    const blockPrint = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toUpperCase() === 'P') {
        e.preventDefault();
        return false;
      }
      return undefined;
    };

    document.addEventListener('contextmenu', blockContextMenu);
    document.addEventListener('keydown',     blockShortcuts,   { capture: true });
    document.addEventListener('keydown',     blockPrint,       { capture: true });
    document.addEventListener('dragstart',   blockImageDrag);

    return () => {
      document.removeEventListener('contextmenu', blockContextMenu);
      document.removeEventListener('keydown',     blockShortcuts,  { capture: true });
      document.removeEventListener('keydown',     blockPrint,      { capture: true });
      document.removeEventListener('dragstart',   blockImageDrag);
    };
  }, []);
}
