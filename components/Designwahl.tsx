"use client";

import { useEffect, useState } from "react";

type Wahl = "system" | "light" | "dark";
const SCHLUESSEL = "finanzcockpit.design";

/**
 * Hell, dunkel oder wie das System – in der Fußzeile, wo man es sucht.
 * Ein kleines Skript im Kopf der Seite setzt die Wahl vor dem ersten
 * Zeichnen, damit nichts aufblitzt.
 */
export default function Designwahl() {
  const [wahl, setWahl] = useState<Wahl>("system");

  useEffect(() => {
    try {
      const g = window.localStorage.getItem(SCHLUESSEL) as Wahl | null;
      if (g === "light" || g === "dark") setWahl(g);
    } catch {
      /* dann eben System */
    }
  }, []);

  function waehle(w: Wahl) {
    setWahl(w);
    try {
      if (w === "system") window.localStorage.removeItem(SCHLUESSEL);
      else window.localStorage.setItem(SCHLUESSEL, w);
    } catch {
      /* egal */
    }
    if (w === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", w);
  }

  const knoepfe: { id: Wahl; label: string }[] = [
    { id: "system", label: "System" },
    { id: "light", label: "Hell" },
    { id: "dark", label: "Dunkel" },
  ];

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Design">
      <span className="mr-2 text-xs text-tinte3">Darstellung</span>
      {knoepfe.map((k) => (
        <button
          key={k.id}
          type="button"
          onClick={() => waehle(k.id)}
          aria-pressed={wahl === k.id}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            wahl === k.id ? "bg-tinte text-papier" : "text-tinte2 hover:text-tinte"
          }`}
        >
          {k.label}
        </button>
      ))}
    </div>
  );
}
