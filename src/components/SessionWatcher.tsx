"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

/**
 * SessionWatcher
 * Mounts invisibly in the layout. Periodically checks /api/auth/validate
 * to detect if the current user was deleted from the DB. If so, it calls
 * signOut() to clear cookies and redirect to /login.
 *
 * Poll interval: every 30 seconds (configurable via POLL_INTERVAL_MS).
 */
const POLL_INTERVAL_MS = 30_000;

export default function SessionWatcher() {
  const { status } = useSession();

  useEffect(() => {
    // Only poll when we have an active session
    if (status !== "authenticated") return;

    const checkValidity = async () => {
      try {
        const res = await fetch("/api/auth/validate", { cache: "no-store" });
        if (!res.ok) return; // network error — fail open
        const data = await res.json();
        if (!data.valid) {
          // User was deleted or banned — clear session and redirect
          await signOut({ callbackUrl: "/login" });
        }
      } catch {
        // Network issues — don't log out, just skip this check
      }
    };

    // Run immediately on mount, then on interval
    checkValidity();
    const interval = setInterval(checkValidity, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status]);

  // Renders nothing — purely a side-effect component
  return null;
}
