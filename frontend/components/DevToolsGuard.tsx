"use client";

import { useEffect } from "react";

interface DevToolsGuardProps {
  /** If false, protections are bypassed (useful for local development if desired) */
  enabled?: boolean;
  /** Whether to disable right-click context menu (default: true) */
  disableContextMenu?: boolean;
  /** Whether to block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, etc. (default: true) */
  disableShortcuts?: boolean;
}

export function DevToolsGuard({
  enabled,
  disableContextMenu = true,
  disableShortcuts = true,
}: DevToolsGuardProps) {
  useEffect(() => {
    // Only block inspection in production by default (leaves dev mode unblocked for debugging)
    const isProduction = process.env.NODE_ENV === "production";
    
    // Optional URL param overrides: ?guard=true to test guard in dev, ?guard=false to bypass in prod
    const urlParams = new URLSearchParams(window.location.search);
    const guardParam = urlParams.get("guard");

    let isGuarded = enabled ?? isProduction;
    if (guardParam === "true") isGuarded = true;
    if (guardParam === "false") isGuarded = false;

    if (!isGuarded) return;

    // 1. Block right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      if (disableContextMenu) {
        e.preventDefault();
      }
    };

    // 2. Block inspection keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!disableShortcuts) return;

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return false;
      }

      // Ctrl+Shift+I (DevTools Inspect)
      // Ctrl+Shift+J (DevTools Console)
      // Ctrl+Shift+C (DevTools Inspect Element)
      if (isCtrlOrMeta && e.shiftKey && (key === "i" || key === "j" || key === "c")) {
        e.preventDefault();
        return false;
      }

      // Ctrl+U (View Source)
      if (isCtrlOrMeta && key === "u") {
        e.preventDefault();
        return false;
      }

      // Ctrl+S (Save Page)
      if (isCtrlOrMeta && key === "s") {
        e.preventDefault();
        return false;
      }
    };

    // 3. Security notice in Console
    try {
      console.clear();
      console.log(
        "%cSTOP!",
        "color: #ef4444; font-size: 36px; font-weight: 900; text-shadow: 2px 2px 0px black;"
      );
      console.log(
        "%cThis browser feature is intended for authorized developers only.\nAttempting to reverse engineer or inspect internal structures is prohibited.",
        "font-size: 14px; font-weight: 500; color: #475569;"
      );
    } catch {
      // Ignore in environments where console is restricted
    }

    window.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, disableContextMenu, disableShortcuts]);

  return null;
}
