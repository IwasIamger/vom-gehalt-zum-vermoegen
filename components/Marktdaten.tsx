"use client";

import { useEffect, useState } from "react";
import { datum as fdatum, prozentKurz } from "@/lib/format";
import { HINTERLEGT, type Marktdaten, ladeMarktdaten } from "@/lib/marktdaten";
import { monatName } from "@/lib/ausgaben";

/**
 * Zeigt den aktuellen Einlagenzins der EZB und die zuletzt gemeldete Inflation.
 *
 * Solange nichts geladen ist, steht der hinterlegte Wert da – mit seinem Stand,
 * damit niemand eine alte Zahl für eine aktuelle hält.
 */
export default function Marktdaten() {
  const [daten, setDaten] = useState<Marktdaten | null>(null);
  const [laeuft, setLaeuft] = useState(true);

  useEffect(() => {
    let abgebrochen = false;
    ladeMarktdaten().then((d) => {
      if (!abgebrochen) {
        setDaten(d);
        setLaeuft(false);
      }
    });
    return () => {
      abgebrochen = true;
    };
  }, []);

  const zins = daten?.einlagenzins;
  const inflation = daten?.inflation;

  return (
    <aside className="max-w-3xl rounded-xl border border-gruen/30 bg-gruen-hell p-6">
      <p className="eyebrow text-gruen">Aktuelle Werte</p>

      <dl className="mt-4 grid gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-tinte2">EZB-Einlagenzins</dt>
          <dd className="tabular mt-1 font-serif text-3xl font-bold text-gruen">
            {zins ? prozentKurz(zins.wert) : prozentKurz(HINTERLEGT.einlagenzins)}
          </dd>
          <dd className="mt-1 text-xs text-tinte3">
            {zins ? `gilt seit ${fdatum(zins.gueltigAb)}` : `Stand ${HINTERLEGT.stand}`}
          </dd>
        </div>

        <div>
          <dt className="text-sm text-tinte2">Inflation Deutschland</dt>
          <dd className="tabular mt-1 font-serif text-3xl font-bold text-gruen">
            {inflation ? prozentKurz(inflation.wert) : "–"}
          </dd>
          <dd className="mt-1 text-xs text-tinte3">
            {inflation
              ? `${monatName(inflation.monat)}, harmonisiert (HVPI)`
              : laeuft
                ? "wird geladen …"
                : "gerade nicht abrufbar"}
          </dd>
        </div>
      </dl>

      {daten?.naechsterZins && (
        <p className="mt-5 rounded-lg bg-gold-hell p-4 text-sm leading-relaxed text-tinte2">
          <span className="font-semibold text-gold">
            Ab {fdatum(daten.naechsterZins.gueltigAb)}: {prozentKurz(daten.naechsterZins.wert)}
          </span>{" "}
          – der Rat hat bereits entschieden, wirksam wird es erst dann.
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-tinte3">
        Direkt vom Datenportal der Europäischen Zentralbank, höchstens einmal täglich abgerufen.
        Ohne Netz steht hier der zuletzt geholte Wert.
        {daten?.geholt && ` Zuletzt: ${new Date(daten.geholt).toLocaleString("de-DE")}.`}
      </p>
    </aside>
  );
}
