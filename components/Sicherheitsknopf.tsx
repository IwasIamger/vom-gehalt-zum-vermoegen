"use client";

import { useEffect, useState } from "react";

/**
 * Ein Knopf, der erst nachfragt – ohne Browser-Dialog.
 *
 * `confirm()` blockiert den ganzen Tab, sieht auf jedem System anders aus und
 * wird in manchen mobilen Browsern gar nicht erst gezeigt. Zwei Stufen im
 * eigenen Layout sind verlässlicher und stören weniger.
 */
export default function Sicherheitsknopf({
  label,
  frage,
  bestaetigung = "Ja, löschen",
  onBestaetigt,
  className = "",
}: {
  label: string;
  frage: string;
  bestaetigung?: string;
  onBestaetigt: () => void;
  className?: string;
}) {
  const [fragt, setFragt] = useState(false);

  // Nach einer Weile von selbst zurückfallen, damit kein scharfer Knopf stehenbleibt.
  useEffect(() => {
    if (!fragt) return;
    const t = window.setTimeout(() => setFragt(false), 8000);
    return () => window.clearTimeout(t);
  }, [fragt]);

  if (!fragt) {
    return (
      <button
        type="button"
        onClick={() => setFragt(true)}
        className={
          className ||
          "rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte3 transition-colors hover:border-rot hover:text-rot"
        }
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-rot/50 bg-rot-hell px-3 py-2">
      <span className="text-sm text-tinte2">{frage}</span>
      <button
        type="button"
        onClick={() => {
          setFragt(false);
          onBestaetigt();
        }}
        className="rounded-md bg-rot px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-rot-tief"
      >
        {bestaetigung}
      </button>
      <button
        type="button"
        onClick={() => setFragt(false)}
        className="rounded-md px-3 py-1.5 text-sm font-semibold text-tinte2 transition-colors hover:text-tinte"
      >
        Abbrechen
      </button>
    </span>
  );
}
