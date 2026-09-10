"use client";

import { useEffect, useState } from "react";
import { euro, zahlAusEingabe } from "@/lib/format";

type Props = {
  wert?: number;
  onChange: (wert: number | undefined) => void;
  label?: string;
  einheit?: string;
  platzhalter?: string;
  gross?: boolean;
};

/**
 * Das goldene Feld vom Arbeitsblatt, nur eben tippbar.
 * Leer = gold gestrichelt, gefüllt = ruhig und grau. Genau wie auf Papier.
 */
export default function Betragsfeld({
  wert,
  onChange,
  label,
  einheit = "p. M.",
  platzhalter = "Betrag",
  gross,
}: Props) {
  const [text, setText] = useState(wert !== undefined ? String(wert).replace(".", ",") : "");
  const [fokus, setFokus] = useState(false);

  useEffect(() => {
    if (!fokus) setText(wert !== undefined ? String(wert).replace(".", ",") : "");
  }, [wert, fokus]);

  const gefuellt = wert !== undefined && wert !== null;

  return (
    <div>
      {label && <p className="eyebrow mb-1.5 text-tinte3">{label}</p>}
      <div
        className={`flex items-center gap-2 px-3 ${gross ? "py-3" : "py-2"} feld ${
          gefuellt ? "feld--gefuellt" : ""
        }`}
      >
        <span className={`shrink-0 text-tinte3 ${gross ? "text-lg" : "text-base"}`}>€</span>
        <input
          inputMode="decimal"
          value={text}
          placeholder={platzhalter}
          onFocus={() => setFokus(true)}
          onBlur={() => setFokus(false)}
          onChange={(e) => {
            setText(e.target.value);
            onChange(zahlAusEingabe(e.target.value));
          }}
          aria-label={label ?? platzhalter}
          className={`tabular w-full bg-transparent text-right outline-none placeholder:text-gold/60 ${
            gross ? "font-serif text-xl font-bold" : "text-base"
          } text-tinte`}
        />
        <span className="shrink-0 text-xs text-tinte3">{einheit}</span>
      </div>
      {gefuellt && gross && (
        <p className="mt-1 text-right text-xs text-tinte3">{euro(wert!)}</p>
      )}
    </div>
  );
}
