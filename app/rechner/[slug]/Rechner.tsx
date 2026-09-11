"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { rechnerNach } from "@/lib/rechner";
import { ladeMarktdaten } from "@/lib/marktdaten";

const TON: Record<string, string> = {
  gruen: "text-gruen",
  rot: "text-rot",
  blau: "text-blau",
  gold: "text-gold",
  neutral: "text-tinte",
};

function einheit(art: string) {
  return art === "prozent" ? "%" : art === "jahre" ? "Jahre" : art === "monate" ? "Monate" : "€";
}

export default function Rechner({ slug }: { slug: string }) {
  const def = rechnerNach(slug)!;
  const [werte, setWerte] = useState<Record<string, number>>(() =>
    Object.fromEntries(def.felder.map((f) => [f.key, f.start])),
  );

  // Felder mit Live-Kennzeichnung bekommen den aktuellen EZB-Satz – aber nur,
  // solange der Nutzer sie noch nicht selbst angefasst hat.
  const [beruehrt, setBeruehrt] = useState<Set<string>>(() => new Set());
  useEffect(() => {
    const live = def.felder.filter((f) => f.live);
    if (live.length === 0) return;
    let abgebrochen = false;
    ladeMarktdaten().then((m) => {
      if (abgebrochen || !m.einlagenzins) return;
      const satz = Math.round(m.einlagenzins.wert * 10000) / 100;
      setWerte((w) => {
        const neu = { ...w };
        for (const f of live) if (!beruehrt.has(f.key)) neu[f.key] = satz;
        return neu;
      });
    });
    return () => {
      abgebrochen = true;
    };
    // beruehrt absichtlich nicht als Abhaengigkeit: nur beim ersten Laden vorbelegen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def]);

  const ergebnisse = useMemo(() => {
    try {
      return def.rechne(werte);
    } catch {
      return [];
    }
  }, [def, werte]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/rechner" className="text-sm text-tinte2 transition-colors hover:text-gruen">
        ← Alle Rechner
      </Link>

      <header className="mt-5 mb-9">
        <p className="eyebrow text-gruen">Rechner</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">{def.titel}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">{def.einleitung}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
        {/* Eingaben */}
        <section className="rounded-xl border border-linie bg-flaeche p-6">
          <p className="eyebrow mb-5 text-tinte3">Deine Zahlen</p>
          <div className="space-y-6">
            {def.felder.map((f) => {
              const wert = werte[f.key];
              const max = f.max ?? (f.art === "euro" ? Math.max(f.start * 4, 1000) : 100);
              const schritt = f.schritt ?? 1;
              return (
                <div key={f.key}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-2">
                    <label htmlFor={f.key} className="min-w-0 text-sm font-medium text-tinte">
                      {f.label}
                    </label>
                    <div className="flex items-baseline gap-1.5">
                      <input
                        id={f.key}
                        type="number"
                        inputMode="decimal"
                        value={wert}
                        min={f.min ?? 0}
                        max={max}
                        step={schritt}
                        onChange={(e) => {
                          setBeruehrt((b) => new Set(b).add(f.key));
                          setWerte((w) => ({ ...w, [f.key]: Number(e.target.value) || 0 }));
                        }}
                        className="tabular w-24 rounded-md border border-linie2 bg-papier px-2.5 py-1.5 text-right font-serif text-lg font-bold outline-none focus:border-gruen sm:w-28"
                      />
                      <span className="w-10 shrink-0 text-xs text-tinte3">{einheit(f.art)}</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    aria-label={`${f.label} einstellen`}
                    value={wert}
                    min={f.min ?? 0}
                    max={max}
                    step={schritt}
                    onChange={(e) => {
                      setBeruehrt((b) => new Set(b).add(f.key));
                      setWerte((w) => ({ ...w, [f.key]: Number(e.target.value) }));
                    }}
                    className="mt-3 w-full accent-[var(--color-gruen)]"
                  />
                  {f.hinweis && <p className="mt-2 text-xs leading-relaxed text-tinte3">{f.hinweis}</p>}
                </div>
              );
            })}
          </div>
        </section>

        {/* Ergebnis */}
        <section className="rounded-xl border border-gruen/30 bg-gruen-hell p-6">
          <p className="eyebrow mb-5 text-gruen">Ergebnis</p>
          <dl className="space-y-5">
            {ergebnisse.map((e, i) => (
              <div key={i} className={i > 0 ? "border-t border-gruen/20 pt-5" : ""}>
                <dt className="text-sm text-tinte2">{e.label}</dt>
                <dd
                  className={`tabular mt-1 font-serif font-bold ${
                    e.gross ? "text-4xl" : "text-2xl"
                  } ${TON[e.ton ?? "neutral"]}`}
                >
                  {e.wert}
                </dd>
                {e.hinweis && (
                  <p className="mt-1.5 text-xs leading-relaxed text-tinte2">{e.hinweis}</p>
                )}
              </div>
            ))}
          </dl>
        </section>
      </div>

      {def.fussnote && (
        <p className="mt-6 text-xs leading-relaxed text-tinte3">{def.fussnote}</p>
      )}

      <div className="mt-10 rounded-xl border border-linie bg-flaeche p-6">
        <p className="text-sm leading-relaxed text-tinte2">
          Die Zahlen gehören zusammen. Trag sie in dein Kontensystem ein, dann siehst du sofort, ob
          deine Aufteilung aufgeht.
        </p>
        <Link
          href="/kontensystem"
          className="mt-4 inline-block rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
        >
          Zum Kontensystem
        </Link>
      </div>
    </div>
  );
}
