"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { aufgaben, notgroschen, sparrateGesamt, summen } from "@/lib/cockpit";
import { fortschritt } from "@/lib/ausgaben";
import { datum as fdatum, euro, prozent } from "@/lib/format";
import { laden, type Daten } from "@/lib/store";

/**
 * Die Karte rechts im Auftakt.
 *
 * Wer zum ersten Mal kommt, liest das Versprechen: ohne Anmeldung, alles auf
 * dem Gerät. Wer schon Daten hat, braucht das nicht mehr zu lesen – der sieht
 * seinen Stand und das, was als Nächstes ansteht. Die Seite bleibt statisch;
 * nur diese Karte schaut nach dem ersten Zeichnen in den Speicher.
 */
export default function Wiederkehrer() {
  const [daten, setDaten] = useState<Daten | null>(null);

  useEffect(() => {
    const d = laden();
    const hatEtwas =
      d.bilanz.some((p) => (p.wert ?? 0) !== 0) ||
      d.ausgaben.length > 0 ||
      d.dauerausgaben.length > 0 ||
      (d.nettomonatsausgaben ?? 0) > 0;
    if (hatEtwas) setDaten(d);
  }, []);

  if (!daten) {
    return (
      <div className="self-center rounded-xl border border-[#2b3a34] bg-dunkel2 p-7">
        <p className="eyebrow text-[#7dc9a8]">Ohne Anmeldung</p>
        <p className="mt-4 font-serif text-2xl leading-snug">Alles bleibt auf deinem Gerät.</p>
        <p className="mt-3 text-sm leading-relaxed text-[#9fb0aa]">
          Kein Konto, kein Upload, keine Weitergabe. Was du eingibst, speichert dein Browser – und
          nur dein Browser. Du kannst es jederzeit als Datei sichern oder löschen.
        </p>
        <p className="mt-5 border-t border-[#2b3a34] pt-5 text-sm leading-relaxed text-[#9fb0aa]">
          Kostenlos. Das Wissen soll weitergegeben werden, nicht verkauft.
        </p>
      </div>
    );
  }

  const su = summen(daten.bilanz);
  const rate = sparrateGesamt(daten.bilanz);
  const ng = notgroschen(daten);
  const fs = fortschritt(daten.ausgaben, daten.dauerausgaben);
  const offen = aufgaben(daten).filter((a) => !a.erfuellt && !daten.erledigt.includes(a.id));
  const letzterVerlauf = daten.verlauf[daten.verlauf.length - 2];
  const delta = letzterVerlauf ? su.netto - letzterVerlauf.gesamt : undefined;

  return (
    <div className="self-center rounded-xl border border-[#2b3a34] bg-dunkel2 p-7">
      <div className="flex items-baseline justify-between gap-3">
        <p className="eyebrow text-[#7dc9a8]">Willkommen zurück</p>
        <p className="text-xs text-[#7c8985]">Stand {fdatum(daten.aktualisiert)}</p>
      </div>

      <p className="tabular mt-4 font-serif text-4xl font-bold">{euro(su.netto)}</p>
      <p className="mt-1 text-sm text-[#9fb0aa]">
        Nettovermögen
        {delta !== undefined && (
          <span className={delta >= 0 ? " text-[#7dc9a8]" : " text-[#ee8a85]"}>
            {" "}
            · {delta >= 0 ? "+" : "−"}
            {euro(Math.abs(delta))} seit {fdatum(letzterVerlauf.datum)}
          </span>
        )}
      </p>

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-[#2b3a34] pt-5 text-sm">
        <div>
          <dt className="text-xs text-[#7c8985]">Sparrate</dt>
          <dd className="tabular mt-0.5 font-semibold">{euro(rate)}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#7c8985]">Notgroschen</dt>
          <dd className="tabular mt-0.5 font-semibold">
            {ng.anteil !== undefined ? prozent(Math.min(1, ng.anteil), 0) : "–"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[#7c8985]">Ausgaben</dt>
          <dd className="tabular mt-0.5 font-semibold">
            {fs.volleMonate}/3 Monate
          </dd>
        </div>
      </dl>

      {offen.length > 0 && (
        <div className="mt-5 rounded-lg bg-[#0f1a17] p-4">
          <p className="text-xs text-[#7c8985]">
            {offen.length === 1 ? "Ein offener Punkt" : `${offen.length} offene Punkte`} · als Nächstes
          </p>
          <p className="mt-1 font-semibold">{offen[0].titel}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/cockpit"
          className="rounded-lg bg-gruen px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gruen-tief"
        >
          Zum Cockpit
        </Link>
        <Link
          href="/ausgaben"
          className="rounded-lg border border-[#3a4b45] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0f1a17]"
        >
          Ausgabe erfassen
        </Link>
      </div>
    </div>
  );
}
