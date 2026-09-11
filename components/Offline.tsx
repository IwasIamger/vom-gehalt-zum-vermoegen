"use client";

import { useEffect } from "react";

/**
 * Meldet den Service Worker an – nur in Produktion.
 *
 * Im Entwicklungsbetrieb würde er den Hot Reload stören; dort ist er auch
 * nutzlos, weil der Server ohnehin lokal läuft.
 */
export default function Offline() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    const basis = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${basis}/sw.js`, { scope: `${basis}/` }).catch(() => {
      // Ohne Offlinebetrieb läuft die App genauso – nur eben nicht ohne Netz.
    });
  }, []);

  return null;
}
