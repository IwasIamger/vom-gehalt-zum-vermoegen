"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Linienchart from "@/components/Linienchart";
import { monatKurz, monatName } from "@/lib/ausgaben";
import { datum as fdatum, euro, prozent } from "@/lib/format";
import { rueckblick } from "@/lib/rueckblick";
import { LEER, laden, type Daten } from "@/lib/store";

export default function Rueckblick() {
  const [daten, setDaten] = useState<Daten>(LEER);
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    setDaten(laden());
    setBereit(true);
  }, []);

  const r = useMemo(() => rueckblick(daten), [daten]);

  const kopf = (
    <header>
      <p className="eyebrow text-gruen">Rückblick</p>
      <h1 className="mt-2.5 text-3xl sm:text-4xl">Was sich {r.jahr} getan hat</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">
        Nichts hier ist neu eingetragen. Der Rückblick liest aus dem, was die App seit Jahresanfang
        gesammelt hat – festgehaltene Stände, erfasste Ausgaben, abgehakte Punkte. Je länger du
        dabei bist, desto mehr steht hier.
      </p>
    </header>
  );

  if (!bereit) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10">
        {kopf}
        <p className="mt-8 text-tinte3">Lädt …</p>
      </div>
    );
  }

  const v = r.vermoegen;
  const a = r.ausgaben;
  const leer = r.saetze.length === 0 && v.punkte.length < 2 && a.monate.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      {kopf}

      {leer ? (
        <section className="mt-9 rounded-xl border border-gold/50 bg-gold-hell p-6">
          <p className="font-serif text-lg font-bold text-gold">Noch zu früh für einen Rückblick</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
            Der Rückblick braucht mindestens zwei festgehaltene Stände oder einen abgeschlossenen
            Monat mit Ausgaben. Das Cockpit hält den Stand von selbst einmal im Monat fest – ab dem
            zweiten Monat wird hier etwas stehen.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/cockpit" className="rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gruen-tief">
              Zum Cockpit
            </Link>
            <Link href="/ausgaben" className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen">
              Ausgaben erfassen
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Die Sätze – das, was man sich merkt */}
          {r.saetze.length > 0 && (
            <section className="mt-9 rounded-xl bg-dunkel p-7 text-white">
              <p className="eyebrow text-[#7dc9a8]">In einem Satz</p>
              <ul className="mt-4 space-y-3">
                {r.saetze.map((s) => (
                  <li key={s} className="font-serif text-lg leading-snug sm:text-xl">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Vermögen */}
          {v.veraenderung !== undefined && (
            <section className="mt-6 rounded-xl border border-linie bg-flaeche p-6">
              <h2 className="text-xl">Vermögen</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-linie bg-papier p-5">
                  <p className="tabular font-serif text-2xl font-bold text-tinte">{euro(v.anfang!.gesamt)}</p>
                  <p className="eyebrow mt-1.5 text-tinte3">{fdatum(v.anfang!.datum)}</p>
                </div>
                <div className="rounded-xl border border-linie bg-papier p-5">
                  <p className="tabular font-serif text-2xl font-bold text-tinte">{euro(v.ende!.gesamt)}</p>
                  <p className="eyebrow mt-1.5 text-tinte3">{fdatum(v.ende!.datum)}</p>
                </div>
                <div className={`rounded-xl border p-5 ${v.veraenderung >= 0 ? "border-gruen/30 bg-gruen-hell" : "border-rot/30 bg-rot-hell"}`}>
                  <p className={`tabular font-serif text-2xl font-bold ${v.veraenderung >= 0 ? "text-gruen" : "text-rot"}`}>
                    {v.veraenderung >= 0 ? "+" : "−"}
                    {euro(Math.abs(v.veraenderung))}
                  </p>
                  <p className="eyebrow mt-1.5 text-tinte3">Veränderung</p>
                </div>
              </div>

              {v.punkte.length >= 2 && (
                <div className="mt-6">
                  <Linienchart
                    labels={v.punkte.map((p) => fdatum(p.datum).slice(0, 6))}
                    reihen={[
                      { name: "Nettovermögen", farbe: "var(--color-gruen)", werte: v.punkte.map((p) => p.gesamt), flaeche: true },
                    ]}
                    hoehe={220}
                  />
                </div>
              )}

              {v.geschaetzteEinzahlung !== undefined && (
                <div className="mt-6 grid gap-4 border-t border-linie pt-5 sm:grid-cols-2">
                  <div>
                    <p className="eyebrow text-tinte3">Selbst eingezahlt (geschätzt)</p>
                    <p className="tabular mt-1 font-serif text-xl font-bold text-tinte">{euro(v.geschaetzteEinzahlung)}</p>
                  </div>
                  <div>
                    <p className="eyebrow text-tinte3">Vom Markt (geschätzt)</p>
                    <p className={`tabular mt-1 font-serif text-xl font-bold ${(v.geschaetzterMarkt ?? 0) >= 0 ? "text-gruen" : "text-rot"}`}>
                      {(v.geschaetzterMarkt ?? 0) >= 0 ? "+" : "−"}
                      {euro(Math.abs(v.geschaetzterMarkt ?? 0))}
                    </p>
                  </div>
                  <p className="text-xs leading-relaxed text-tinte3 sm:col-span-2">
                    Die Einzahlung ist aus deiner heutigen Sparrate hochgerechnet, nicht aus Buchungen. Hast du
                    die Rate im Jahr verändert, stimmt die Aufteilung nur ungefähr – die Gesamtveränderung stimmt
                    immer.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Ausgaben */}
          {a.monate.length > 0 && (
            <section className="mt-6 rounded-xl border border-linie bg-flaeche p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-xl">Ausgaben</h2>
                <p className="text-sm text-tinte3">
                  {a.monate.length} abgeschlossene {a.monate.length === 1 ? "Monat" : "Monate"}
                </p>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-linie bg-papier p-5">
                  <p className="tabular font-serif text-2xl font-bold text-rot">{euro(a.summe)}</p>
                  <p className="eyebrow mt-1.5 text-tinte3">Gesamt</p>
                </div>
                <div className="rounded-xl border border-linie bg-papier p-5">
                  <p className="tabular font-serif text-2xl font-bold text-tinte">{euro(a.schnitt ?? 0)}</p>
                  <p className="eyebrow mt-1.5 text-tinte3">pro Monat</p>
                </div>
                <div className="rounded-xl border border-linie bg-papier p-5">
                  <p className="tabular font-serif text-2xl font-bold text-tinte">
                    {a.festerAnteil !== undefined ? prozent(a.festerAnteil, 0) : "–"}
                  </p>
                  <p className="eyebrow mt-1.5 text-tinte3">davon fest</p>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                {a.monate.map((m) => {
                  const max = Math.max(...a.monate.map((x) => x.summe));
                  const istExtrem = m.monat === a.teuerster?.monat || m.monat === a.guenstigster?.monat;
                  return (
                    <div key={m.monat} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-sm text-tinte2">{monatKurz(m.monat)}</span>
                      <span className="h-5 flex-1 overflow-hidden rounded bg-papier">
                        <span
                          className={`block h-full rounded ${istExtrem ? "bg-rot" : "bg-rot/45"}`}
                          style={{ width: `${Math.max(2, (m.summe / max) * 100)}%` }}
                        />
                      </span>
                      <span className="tabular w-20 shrink-0 text-right text-sm font-semibold">{euro(m.summe, false)}</span>
                    </div>
                  );
                })}
              </div>
              {a.teuerster && a.guenstigster && a.teuerster.monat !== a.guenstigster.monat && (
                <p className="mt-3 text-xs text-tinte3">
                  Kräftig: teuerster ({monatName(a.teuerster.monat)}) und günstigster Monat ({monatName(a.guenstigster.monat)}).
                </p>
              )}

              {a.kategorien.length > 0 && (
                <div className="mt-6 border-t border-linie pt-5">
                  <p className="eyebrow text-tinte3">Nach Kategorie</p>
                  <div className="mt-3 space-y-3">
                    {a.kategorien.slice(0, 6).map((k) => (
                      <div key={k.kategorie}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="text-tinte2">{k.kategorie}</span>
                          <span className="tabular shrink-0 font-semibold text-tinte">
                            {euro(k.summe, false)}
                            <span className="ml-2 font-normal text-tinte3">{Math.round(k.anteil * 100)} %</span>
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-papier">
                          <div className="h-full rounded-full bg-rot/70" style={{ width: `${k.anteil * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Erledigt */}
          {(r.erledigt.anzahl > 0 || r.steuerfreiGeworden.length > 0) && (
            <section className="mt-6 rounded-xl border border-linie bg-flaeche p-6">
              <h2 className="text-xl">Geschafft</h2>
              <ul className="mt-4 space-y-2.5">
                {r.notgroschen.erreicht && (
                  <li className="flex gap-3 text-sm text-tinte">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gruen text-xs font-bold text-white">✓</span>
                    Notgroschen voll
                  </li>
                )}
                {r.steuerfreiGeworden.map((n) => (
                  <li key={n} className="flex gap-3 text-sm text-tinte">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gruen text-xs font-bold text-white">✓</span>
                    {n}: Haltefrist abgelaufen, Gewinne steuerfrei
                  </li>
                ))}
                {r.erledigt.titel
                  .filter((t) => !(r.notgroschen.erreicht && t === "Notgroschen auffüllen"))
                  .map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-tinte2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-linie2 text-xs font-bold text-white">✓</span>
                      {t}
                    </li>
                  ))}
              </ul>
            </section>
          )}

          <p className="mt-8 text-xs leading-relaxed text-tinte3">
            Der laufende Monat bleibt in allen Ausgaben-Zahlen außen vor – er ist nie vollständig. Vermögensstände
            stammen aus den Momentaufnahmen im Cockpit; die App hält sie einmal im Monat von selbst fest.
          </p>
        </>
      )}
    </div>
  );
}
