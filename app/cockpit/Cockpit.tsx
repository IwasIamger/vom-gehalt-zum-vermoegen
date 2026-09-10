"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Linienchart from "@/components/Linienchart";
import { datum as fdatum, euro, prozent, zahlAusEingabe } from "@/lib/format";
import {
  REBALANCING_SCHWELLE,
  aufgaben,
  haltefristen,
  notgroschen,
  pauschbetrag,
  prognose,
  sollIst,
  sparrateGesamt,
  summen,
} from "@/lib/cockpit";
import {
  type Daten,
  type Posten,
  type PostenArt,
  LEER,
  exportieren,
  importieren,
  laden,
  loeschen,
  neuerPosten,
  speichern,
  vorlageBilanz,
} from "@/lib/store";

type Reiter = "stand" | "entwicklung" | "plan" | "todos";

const REITER: { id: Reiter; label: string }[] = [
  { id: "stand", label: "Stand" },
  { id: "entwicklung", label: "Entwicklung" },
  { id: "plan", label: "Plan" },
  { id: "todos", label: "To-dos" },
];

const GRUPPEN: { art: PostenArt; titel: string; hilfe: string }[] = [
  { art: "konto", titel: "Konten", hilfe: "Giro, Tagesgeld, Notgroschen, Sparkonten." },
  { art: "depot", titel: "Depots & Anlagen", hilfe: "ETF, Aktien, Krypto, P2P – alles mit Kursrisiko." },
  { art: "sachwert", titel: "Sachwerte", hilfe: "Immobilie, Auto, Wertgegenstände. Optional." },
  { art: "schuld", titel: "Schulden", hilfe: "Kredite, Dispo, Ratenkäufe. Positiv eintragen." },
];

const TON: Record<string, { text: string; balken: string; flaeche: string; rand: string }> = {
  gruen: { text: "text-gruen", balken: "bg-gruen", flaeche: "bg-gruen-hell", rand: "border-gruen/40" },
  blau: { text: "text-blau", balken: "bg-blau", flaeche: "bg-blau-hell", rand: "border-blau/40" },
  rot: { text: "text-rot", balken: "bg-rot", flaeche: "bg-rot-hell", rand: "border-rot/40" },
  gold: { text: "text-gold", balken: "bg-gold", flaeche: "bg-gold-hell", rand: "border-gold/50" },
};

export default function Cockpit() {
  const [daten, setDaten] = useState<Daten>(LEER);
  const [bereit, setBereit] = useState(false);
  const [reiter, setReiter] = useState<Reiter>("stand");
  const dateiRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDaten(laden());
    setBereit(true);
  }, []);

  // Der Reiter steht in der Adresse, damit sich ein Bereich verlinken laesst und
  // der Zurueck-Knopf tut, was man erwartet. Auch ein Sprung auf derselben Seite
  // (#todos, waehrend man schon im Cockpit ist) muss ankommen.
  useEffect(() => {
    const ausHash = () => {
      const h = window.location.hash.replace("#", "");
      if (REITER.some((r) => r.id === h)) setReiter(h as Reiter);
    };
    ausHash();
    window.addEventListener("hashchange", ausHash);
    return () => window.removeEventListener("hashchange", ausHash);
  }, []);

  function wechsle(id: Reiter) {
    setReiter(id);
    history.replaceState(null, "", id === "stand" ? window.location.pathname : `#${id}`);
  }

  useEffect(() => {
    if (bereit) speichern(daten);
  }, [daten, bereit]);

  const su = useMemo(() => summen(daten.bilanz), [daten.bilanz]);
  const rate = useMemo(() => sparrateGesamt(daten.bilanz), [daten.bilanz]);
  const ng = useMemo(() => notgroschen(daten), [daten]);
  const si = useMemo(() => sollIst(daten.bilanz), [daten.bilanz]);
  const pb = useMemo(() => pauschbetrag(daten), [daten]);
  const hf = useMemo(() => haltefristen(daten), [daten]);
  const todos = useMemo(() => aufgaben(daten), [daten]);

  const offen = todos.filter((t) => !t.erfuellt && !daten.erledigt.includes(t.id)).length;

  // Der letzte festgehaltene Stand vor heute – daraus die Veränderung.
  const heuteISO = new Date().toISOString().slice(0, 10);
  const frueher = daten.verlauf.filter((v) => v.datum !== heuteISO);
  const letzter = frueher[frueher.length - 1];
  const delta = letzter ? su.netto - letzter.gesamt : undefined;

  function aendere(id: string, feld: keyof Posten, wert: unknown) {
    setDaten((d) => ({
      ...d,
      bilanz: d.bilanz.map((p) => (p.id === id ? { ...p, [feld]: wert } : p)),
    }));
  }

  function ergaenze(art: PostenArt) {
    setDaten((d) => ({ ...d, bilanz: [...d.bilanz, neuerPosten(art)] }));
  }

  function entferne(id: string) {
    setDaten((d) => ({ ...d, bilanz: d.bilanz.filter((p) => p.id !== id) }));
  }

  function standFesthalten() {
    setDaten((d) => {
      const eintrag = {
        datum: heuteISO,
        gesamt: summen(d.bilanz).netto,
        anlagen: summen(d.bilanz).anlagen,
        schulden: summen(d.bilanz).schulden,
      };
      const ohneHeute = d.verlauf.filter((v) => v.datum !== eintrag.datum);
      return { ...d, verlauf: [...ohneHeute, eintrag].sort((a, b) => a.datum.localeCompare(b.datum)) };
    });
  }

  if (!bereit) {
    return <div className="mx-auto max-w-6xl px-5 py-20 text-tinte3">Lade deine Daten …</div>;
  }

  const leer = daten.bilanz.length === 0;

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      {/* ───────────────────────────── Kopf */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow text-gruen">Cockpit</p>
          <h1 className="mt-2.5 text-3xl sm:text-4xl">Dein Stand</h1>
        </div>
        <div className="text-right">
          <p className="eyebrow text-tinte3">Nettovermögen</p>
          <p className="tabular mt-1 font-serif text-4xl font-bold text-tinte">{euro(su.netto)}</p>
          {delta !== undefined && (
            <p className={`tabular mt-1 text-sm ${delta >= 0 ? "text-gruen" : "text-rot"}`}>
              {delta >= 0 ? "+" : "−"}
              {euro(Math.abs(delta))} seit {fdatum(letzter.datum)}
            </p>
          )}
        </div>
      </header>

      {/* ───────────────────────────── Reiter */}
      <nav className="kein-druck mt-8 flex gap-1 overflow-x-auto border-b border-linie" aria-label="Bereiche">
        {REITER.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => wechsle(r.id)}
            aria-current={reiter === r.id ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              reiter === r.id
                ? "border-gruen text-gruen"
                : "border-transparent text-tinte2 hover:text-tinte"
            }`}
          >
            {r.label}
            {r.id === "todos" && offen > 0 && (
              <span className="ml-2 rounded-full bg-rot px-1.5 py-0.5 text-[11px] text-white">
                {offen}
              </span>
            )}
          </button>
        ))}
      </nav>

      {leer && (
        <div className="mt-8 rounded-xl border border-gold/50 bg-gold-hell p-6">
          <p className="font-serif text-lg font-bold text-gold">Noch nichts erfasst</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
            Das Cockpit rechnet mit dem, was du einträgst. Fang mit einer Vorlage an – Konten und
            Depots aus Kapitel 10 – und trag deine eigenen Stände ein. Alles bleibt in diesem
            Browser.
          </p>
          <button
            type="button"
            onClick={() => setDaten((d) => ({ ...d, bilanz: vorlageBilanz() }))}
            className="mt-4 rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
          >
            Vorlage anlegen
          </button>
        </div>
      )}

      {/* ───────────────────────────── STAND */}
      {reiter === "stand" && (
        <div className="mt-9 space-y-10">
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Konten", wert: su.konten, ton: "gruen" },
              { label: "Depots & Anlagen", wert: su.anlagen, ton: "blau" },
              { label: "Sachwerte", wert: su.sachwerte, ton: "gold" },
              { label: "Schulden", wert: -su.schulden, ton: "rot" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-linie bg-flaeche p-5">
                <p className={`tabular font-serif text-2xl font-bold ${TON[k.ton].text}`}>
                  {euro(k.wert)}
                </p>
                <p className="eyebrow mt-1.5 text-tinte3">{k.label}</p>
              </div>
            ))}
          </section>

          {/* Notgroschen-Fortschritt */}
          <section className="rounded-xl border border-linie bg-flaeche p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl">Notgroschen</h2>
              <p className="text-sm text-tinte2">
                Ziel: {daten.einstellungen.notgroschenMonate} Nettomonatsausgaben
              </p>
            </div>
            {ng.ziel === undefined ? (
              <p className="mt-4 text-sm leading-relaxed text-tinte2">
                Trag deine durchschnittlichen Nettomonatsausgaben im{" "}
                <Link href="/kontensystem" className="font-semibold text-gruen underline">
                  Kontensystem
                </Link>{" "}
                ein, dann steht das Ziel automatisch hier.
              </p>
            ) : (
              <>
                <div className="mt-5 h-4 overflow-hidden rounded-full bg-papier">
                  <div
                    className={`h-full rounded-full ${(ng.anteil ?? 0) >= 1 ? "bg-gruen" : "bg-gold"}`}
                    style={{ width: `${Math.min(100, Math.max(1, (ng.anteil ?? 0) * 100))}%` }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 text-sm">
                  <p className="tabular text-tinte2">
                    <span className="font-serif text-lg font-bold text-tinte">
                      {euro(ng.stand ?? 0)}
                    </span>{" "}
                    von {euro(ng.ziel)}
                  </p>
                  <p className={(ng.anteil ?? 0) >= 1 ? "text-gruen" : "text-gold"}>
                    {(ng.anteil ?? 0) >= 1
                      ? "Ziel erreicht."
                      : `Es fehlen noch ${euro(ng.ziel - (ng.stand ?? 0))}.`}
                  </p>
                </div>
              </>
            )}
          </section>

          {/* Bilanz-Editor */}
          {GRUPPEN.map((g) => {
            const posten = daten.bilanz.filter((p) => p.art === g.art);
            if (posten.length === 0 && leer) return null;
            return (
              <section key={g.art}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h2 className="text-xl">{g.titel}</h2>
                    <p className="mt-1 text-sm text-tinte3">{g.hilfe}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => ergaenze(g.art)}
                    className="kein-druck rounded-lg border border-linie2 px-4 py-2 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
                  >
                    + Hinzufügen
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {posten.map((p) => (
                    <Zeile
                      key={p.id}
                      posten={p}
                      onChange={(feld, wert) => aendere(p.id, feld, wert)}
                      onEntfernen={() => entferne(p.id)}
                    />
                  ))}
                  {posten.length === 0 && (
                    <p className="rounded-lg border border-dashed border-linie2 p-5 text-sm text-tinte3">
                      Nichts erfasst.
                    </p>
                  )}
                </div>
              </section>
            );
          })}

          <Datenzeile
            daten={daten}
            setDaten={setDaten}
            dateiRef={dateiRef}
            standFesthalten={standFesthalten}
          />
        </div>
      )}

      {/* ───────────────────────────── ENTWICKLUNG */}
      {reiter === "entwicklung" && (
        <div className="mt-9 space-y-10">
          <section className="rounded-xl border border-linie bg-flaeche p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-xl">Entwicklung</h2>
              <button
                type="button"
                onClick={standFesthalten}
                className="kein-druck rounded-lg bg-gruen px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
              >
                Heutigen Stand festhalten
              </button>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
              Jeder festgehaltene Stand ist ein Punkt auf der Kurve. Einmal im Monat genügt – dann
              wird nach einem Jahr sichtbar, was sonst nur gefühlt ist.
            </p>
            <div className="mt-6">
              {daten.verlauf.length < 2 ? (
                <p className="rounded-lg border border-dashed border-linie2 p-6 text-center text-sm text-tinte3">
                  {daten.verlauf.length === 0
                    ? "Noch kein Stand festgehalten."
                    : "Ein Punkt ist noch keine Kurve. Beim nächsten Mal wird es eine."}
                </p>
              ) : (
                <Linienchart
                  labels={daten.verlauf.map((v) => fdatum(v.datum).slice(0, 6))}
                  reihen={[
                    {
                      name: "Nettovermögen",
                      farbe: "var(--color-gruen)",
                      werte: daten.verlauf.map((v) => v.gesamt),
                      flaeche: true,
                    },
                    {
                      name: "davon Anlagen",
                      farbe: "var(--color-blau)",
                      werte: daten.verlauf.map((v) => v.anlagen),
                      gestrichelt: true,
                    },
                  ]}
                />
              )}
            </div>
            {daten.verlauf.length > 0 && (
              <ul className="mt-6 divide-y divide-linie border-t border-linie text-sm">
                {[...daten.verlauf].reverse().slice(0, 6).map((v) => (
                  <li key={v.datum} className="flex items-center justify-between py-2.5">
                    <span className="text-tinte2">{fdatum(v.datum)}</span>
                    <span className="tabular font-semibold">{euro(v.gesamt)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setDaten((d) => ({
                          ...d,
                          verlauf: d.verlauf.filter((e) => e.datum !== v.datum),
                        }))
                      }
                      className="kein-druck text-xs text-tinte3 transition-colors hover:text-rot"
                      aria-label={`Stand vom ${fdatum(v.datum)} löschen`}
                    >
                      entfernen
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Prognosebereich daten={daten} setDaten={setDaten} rate={rate} start={su.netto} />
        </div>
      )}

      {/* ───────────────────────────── PLAN */}
      {reiter === "plan" && (
        <div className="mt-9 space-y-10">
          {/* Soll-Ist */}
          <section className="rounded-xl border border-linie bg-flaeche p-6">
            <h2 className="text-xl">Soll gegen Ist</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
              Du legst eine Aufteilung fest, der Markt verschiebt sie. Ab{" "}
              {Math.round(REBALANCING_SCHWELLE * 100)} Prozentpunkten Abweichung lohnt das
              Nachjustieren.
            </p>
            {!si.vollstaendig && si.summeSoll > 0 && (
              <p className="mt-3 text-sm text-gold">
                Die Soll-Anteile ergeben zusammen {prozent(si.summeSoll)} – für die Rechnung werden
                sie auf 100 % normiert.
              </p>
            )}
            {si.zeilen.length === 0 ? (
              <p className="mt-5 rounded-lg border border-dashed border-linie2 p-5 text-sm text-tinte3">
                Trag bei deinen Depots einen Soll-Anteil ein, dann erscheint hier der Abgleich.
              </p>
            ) : (
              <div className="mt-6 space-y-5">
                {si.zeilen.map((z) => {
                  const kritisch = Math.abs(z.abweichung) >= REBALANCING_SCHWELLE;
                  return (
                    <div key={z.name}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-tinte">{z.name}</p>
                        <p className="tabular text-sm text-tinte2">
                          Ist {prozent(z.istAnteil)} · Soll {prozent(z.sollAnteil)}
                        </p>
                      </div>
                      <div className="mt-2 flex h-5 overflow-hidden rounded bg-papier">
                        <div
                          className={`h-full ${kritisch ? "bg-gold" : "bg-blau"}`}
                          style={{ width: `${Math.min(100, z.istAnteil * 100)}%` }}
                        />
                      </div>
                      {/* Soll-Markierung */}
                      <div className="relative h-3">
                        <span
                          className="absolute top-0 h-2 w-0.5 -translate-x-1/2 bg-tinte"
                          style={{ left: `${Math.min(100, z.sollAnteil * 100)}%` }}
                          aria-hidden
                        />
                      </div>
                      <p
                        className={`tabular mt-0.5 text-sm ${
                          kritisch ? "font-semibold text-gold" : "text-tinte2"
                        }`}
                      >
                        {Math.abs(z.differenzEuro) < 1
                          ? "Passt."
                          : z.differenzEuro > 0
                            ? `${euro(z.differenzEuro)} nachkaufen`
                            : `${euro(-z.differenzEuro)} zu viel`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Sparerpauschbetrag */}
          <section className="rounded-xl border border-linie bg-flaeche p-6">
            <h2 className="text-xl">Sparerpauschbetrag</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
              1.000 € Kapitalerträge pro Person bleiben steuerfrei – aber nur, wenn ein
              Freistellungsauftrag erteilt ist. Sonst zieht die Bank ab und du holst es dir erst
              über die Steuererklärung zurück.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <Eingabe
                label="Erwartete Kapitalerträge dieses Jahr"
                wert={daten.steuer.ertraegeJahr}
                onChange={(v) =>
                  setDaten((d) => ({ ...d, steuer: { ...d.steuer, ertraegeJahr: v } }))
                }
              />
              <Eingabe
                label="Erteilte Freistellungsaufträge"
                wert={daten.steuer.freistellungsauftrag}
                onChange={(v) =>
                  setDaten((d) => ({ ...d, steuer: { ...d.steuer, freistellungsauftrag: v } }))
                }
              />
            </div>
            <div className="mt-6 h-4 overflow-hidden rounded-full bg-papier">
              <div
                className="h-full bg-gold"
                style={{ width: `${Math.min(100, (pb.auftrag / pb.maximum) * 100)}%` }}
              />
            </div>
            <p className="tabular mt-3 text-sm text-tinte2">
              {euro(pb.auftrag)} von {euro(pb.maximum)} erteilt
            </p>
            {pb.zuVielSteuer > 0.5 && (
              <p className="mt-3 rounded-lg bg-rot-hell p-4 text-sm leading-relaxed text-tinte2">
                <span className="font-semibold text-rot">
                  {euro(pb.zuVielSteuer)} Steuer zahlst du dieses Jahr unnötig
                </span>{" "}
                – weil Erträge anfallen, für die kein Freistellungsauftrag hinterlegt ist.
              </p>
            )}
          </section>

          {/* Haltefristen */}
          <section className="rounded-xl border border-linie bg-flaeche p-6">
            <h2 className="text-xl">Haltefrist Krypto</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
              Nach zwölf Monaten sind Gewinne aus Kryptowährungen steuerfrei (§ 23 EStG, Stand
              09/2026). Setz bei einem Posten das Häkchen „Haltefrist" und trag das Kaufdatum ein.
            </p>
            {hf.length === 0 ? (
              <p className="mt-5 rounded-lg border border-dashed border-linie2 p-5 text-sm text-tinte3">
                Kein Posten mit Haltefrist erfasst.
              </p>
            ) : (
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {hf.map((h) => (
                  <li
                    key={h.posten.id}
                    className={`rounded-xl border p-5 ${
                      h.istSteuerfrei ? "border-gruen/40 bg-gruen-hell" : "border-gold/50 bg-gold-hell"
                    }`}
                  >
                    <p className="font-semibold text-tinte">{h.posten.name || "Ohne Namen"}</p>
                    {h.istSteuerfrei ? (
                      <>
                        <p className="mt-2 font-serif text-2xl font-bold text-gruen">Steuerfrei</p>
                        <p className="mt-1 text-sm text-tinte2">
                          seit {fdatum(h.steuerfreiAb)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="tabular mt-2 font-serif text-2xl font-bold text-gold">
                          noch {h.tageBisSteuerfrei} Tage
                        </p>
                        <p className="mt-1 text-sm text-tinte2">
                          steuerfrei ab {fdatum(h.steuerfreiAb)}
                        </p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {/* ───────────────────────────── TO-DOS */}
      {reiter === "todos" && (
        <div className="mt-9">
          <p className="max-w-2xl leading-relaxed text-tinte2">
            Die Liste ergibt sich aus deinen Daten. Was du einträgst, hakt sich von selbst ab.
          </p>
          <ul className="mt-7 space-y-3">
            {todos.map((t) => {
              const manuell = daten.erledigt.includes(t.id);
              const fertig = t.erfuellt || manuell;
              return (
                <li
                  key={t.id}
                  className={`rounded-xl border p-5 transition-colors ${
                    fertig ? "border-linie bg-papier" : `${TON[t.ton].rand} ${TON[t.ton].flaeche}`
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() =>
                        setDaten((d) => ({
                          ...d,
                          erledigt: manuell
                            ? d.erledigt.filter((x) => x !== t.id)
                            : [...d.erledigt, t.id],
                        }))
                      }
                      aria-pressed={fertig}
                      aria-label={`${t.titel} abhaken`}
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold transition-colors ${
                        fertig
                          ? "border-gruen bg-gruen text-white"
                          : "border-linie2 text-transparent hover:border-gruen"
                      }`}
                    >
                      {fertig ? "✓" : ""}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-serif text-lg font-bold ${
                          fertig ? "text-tinte3 line-through" : "text-tinte"
                        }`}
                      >
                        {t.titel}
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-tinte2">{t.text}</p>
                      {t.href && !fertig && (
                        <Link
                          href={t.href}
                          className={`mt-3 inline-block text-sm font-semibold underline ${TON[t.ton].text}`}
                        >
                          {t.linkLabel ?? "Ansehen"}
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────── Bausteine

function Eingabe({
  label,
  wert,
  onChange,
  einheit = "€",
  breit,
}: {
  label: string;
  wert?: number;
  onChange: (v: number | undefined) => void;
  einheit?: string;
  breit?: boolean;
}) {
  const [text, setText] = useState(wert !== undefined ? String(wert).replace(".", ",") : "");
  const [fokus, setFokus] = useState(false);
  useEffect(() => {
    if (!fokus) setText(wert !== undefined ? String(wert).replace(".", ",") : "");
  }, [wert, fokus]);

  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block text-tinte3">{label}</span>
      <span
        className={`flex items-center gap-2 rounded-md border border-linie2 bg-papier px-3 py-2 focus-within:border-gruen ${
          breit ? "" : "max-w-xs"
        }`}
      >
        <input
          inputMode="decimal"
          value={text}
          placeholder="0"
          onFocus={() => setFokus(true)}
          onBlur={() => setFokus(false)}
          onChange={(e) => {
            setText(e.target.value);
            onChange(zahlAusEingabe(e.target.value));
          }}
          className="tabular w-full bg-transparent text-right outline-none placeholder:text-tinte3"
        />
        <span className="shrink-0 text-xs text-tinte3">{einheit}</span>
      </span>
    </label>
  );
}

function Zeile({
  posten,
  onChange,
  onEntfernen,
}: {
  posten: Posten;
  onChange: (feld: keyof Posten, wert: unknown) => void;
  onEntfernen: () => void;
}) {
  const istDepot = posten.art === "depot";
  return (
    <div className="rounded-xl border border-linie bg-flaeche p-4">
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
        <label className="block">
          <span className="eyebrow mb-1.5 block text-tinte3">Name</span>
          <input
            value={posten.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder={istDepot ? "z. B. ETF Welt" : "z. B. Tagesgeld"}
            className="w-full rounded-md border border-linie2 bg-papier px-3 py-2 outline-none focus:border-gruen"
          />
        </label>
        <Eingabe
          label={posten.art === "schuld" ? "Restschuld" : "Aktueller Wert"}
          wert={posten.wert}
          onChange={(v) => onChange("wert", v)}
          breit
        />
        <Eingabe
          label={posten.art === "schuld" ? "Tilgung p. M." : "Sparrate p. M."}
          wert={posten.sparrate}
          onChange={(v) => onChange("sparrate", v)}
          breit
        />
        <button
          type="button"
          onClick={onEntfernen}
          aria-label={`${posten.name || "Posten"} entfernen`}
          className="kein-druck h-10 shrink-0 rounded-md border border-linie2 px-3 text-sm text-tinte3 transition-colors hover:border-rot hover:text-rot"
        >
          Entfernen
        </button>
      </div>

      {istDepot && (
        <div className="mt-4 grid gap-4 border-t border-linie pt-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <Eingabe
            label="Soll-Anteil"
            einheit="%"
            wert={posten.sollAnteil !== undefined ? Math.round(posten.sollAnteil * 1000) / 10 : undefined}
            onChange={(v) => onChange("sollAnteil", v === undefined ? undefined : v / 100)}
            breit
          />
          <label className="block">
            <span className="eyebrow mb-1.5 block text-tinte3">Kaufdatum</span>
            <input
              type="date"
              value={posten.kaufdatum ?? ""}
              onChange={(e) => onChange("kaufdatum", e.target.value || undefined)}
              className="w-full rounded-md border border-linie2 bg-papier px-3 py-2 outline-none focus:border-gruen"
            />
          </label>
          <label className="flex items-center gap-2.5 pb-2.5 text-sm text-tinte2">
            <input
              type="checkbox"
              checked={!!posten.haltefrist}
              onChange={(e) => onChange("haltefrist", e.target.checked)}
              className="h-4 w-4 accent-[var(--color-gruen)]"
            />
            Haltefrist verfolgen
          </label>
        </div>
      )}
    </div>
  );
}

function Prognosebereich({
  daten,
  setDaten,
  rate,
  start,
}: {
  daten: Daten;
  setDaten: React.Dispatch<React.SetStateAction<Daten>>;
  rate: number;
  start: number;
}) {
  const jahre = daten.einstellungen.prognoseJahre ?? 20;
  const punkte = useMemo(() => prognose(daten, jahre), [daten, jahre]);
  const letzte = punkte[punkte.length - 1];

  return (
    <section className="rounded-xl border border-linie bg-flaeche p-6">
      <h2 className="text-xl">Prognose</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
        Aus deinem heutigen Stand ({euro(start)}) und deiner monatlichen Sparrate ({euro(rate)}).
        Eine Fortschreibung, keine Zusage – der Markt liefert keine gerade Linie.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <label className="block">
          <span className="eyebrow mb-2 block text-tinte3">Zeitraum: {jahre} Jahre</span>
          <input
            type="range"
            min={1}
            max={45}
            value={jahre}
            onChange={(e) =>
              setDaten((d) => ({
                ...d,
                einstellungen: { ...d.einstellungen, prognoseJahre: Number(e.target.value) },
              }))
            }
            className="w-full accent-[var(--color-gruen)]"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-tinte3">
            Rendite: {prozent(daten.einstellungen.renditeAnnahme)}
          </span>
          <input
            type="range"
            min={0}
            max={12}
            step={0.5}
            value={daten.einstellungen.renditeAnnahme * 100}
            onChange={(e) =>
              setDaten((d) => ({
                ...d,
                einstellungen: { ...d.einstellungen, renditeAnnahme: Number(e.target.value) / 100 },
              }))
            }
            className="w-full accent-[var(--color-gruen)]"
          />
        </label>
        <label className="block">
          <span className="eyebrow mb-2 block text-tinte3">
            Inflation: {prozent(daten.einstellungen.inflationAnnahme)}
          </span>
          <input
            type="range"
            min={0}
            max={6}
            step={0.1}
            value={daten.einstellungen.inflationAnnahme * 100}
            onChange={(e) =>
              setDaten((d) => ({
                ...d,
                einstellungen: {
                  ...d.einstellungen,
                  inflationAnnahme: Number(e.target.value) / 100,
                },
              }))
            }
            className="w-full accent-[var(--color-gruen)]"
          />
        </label>
      </div>

      <div className="mt-7">
        <Linienchart
          labels={punkte.map((p) => (p.jahr === 0 ? "heute" : `+${p.jahr}`))}
          reihen={[
            {
              name: "Nominal",
              farbe: "var(--color-gruen)",
              werte: punkte.map((p) => p.nominal),
              flaeche: true,
            },
            {
              name: "Kaufkraft von heute",
              farbe: "var(--color-gold)",
              werte: punkte.map((p) => p.real),
              gestrichelt: true,
            },
            {
              name: "Eingezahlt",
              farbe: "var(--color-tinte3)",
              werte: punkte.map((p) => p.eingezahlt),
              gestrichelt: true,
            },
          ]}
        />
        <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-tinte2">
          {[
            { n: "Nominal", f: "var(--color-gruen)" },
            { n: "Kaufkraft von heute", f: "var(--color-gold)" },
            { n: "Eingezahlt", f: "var(--color-tinte3)" },
          ].map((l) => (
            <li key={l.n} className="flex items-center gap-2">
              <span className="h-0.5 w-5 rounded" style={{ background: l.f }} aria-hidden />
              {l.n}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gruen/30 bg-gruen-hell p-5">
          <p className="tabular font-serif text-2xl font-bold text-gruen">{euro(letzte.nominal)}</p>
          <p className="eyebrow mt-1.5 text-tinte3">in {jahre} Jahren</p>
        </div>
        <div className="rounded-xl border border-gold/40 bg-gold-hell p-5">
          <p className="tabular font-serif text-2xl font-bold text-gold">{euro(letzte.real)}</p>
          <p className="eyebrow mt-1.5 text-tinte3">in heutiger Kaufkraft</p>
        </div>
        <div className="rounded-xl border border-linie p-5">
          <p className="tabular font-serif text-2xl font-bold text-tinte">
            {euro(letzte.nominal - letzte.eingezahlt)}
          </p>
          <p className="eyebrow mt-1.5 text-tinte3">davon Zinsen</p>
        </div>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-tinte3">
        Rechengrundlage: monatliche Einzahlung, Zinsen thesauriert, vor Kosten und Steuern.
        Sachwerte und Schulden werden mit fortgeschrieben, obwohl sie sich in der Realität anders
        entwickeln – prüf das Ergebnis mit Augenmaß.
      </p>
    </section>
  );
}

function Datenzeile({
  daten,
  setDaten,
  dateiRef,
  standFesthalten,
}: {
  daten: Daten;
  setDaten: React.Dispatch<React.SetStateAction<Daten>>;
  dateiRef: React.RefObject<HTMLInputElement | null>;
  standFesthalten: () => void;
}) {
  return (
    <section className="kein-druck rounded-xl border border-linie bg-flaeche p-6">
      <p className="text-sm leading-relaxed text-tinte2">
        Gespeichert in diesem Browser, zuletzt{" "}
        {new Date(daten.aktualisiert).toLocaleString("de-DE")}. Nichts davon verlässt dein Gerät –
        sichere es deshalb ab und zu als Datei.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={standFesthalten}
          className="rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
        >
          Stand festhalten
        </button>
        <button
          type="button"
          onClick={() => {
            const blob = new Blob([exportieren(daten)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `finanzcockpit-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
        >
          Als Datei sichern
        </button>
        <button
          type="button"
          onClick={() => dateiRef.current?.click()}
          className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
        >
          Datei laden
        </button>
        <input
          ref={dateiRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const d = importieren(await f.text());
            if (d) setDaten(d);
            else alert("Die Datei passt nicht zu diesem Format.");
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => {
            if (confirm("Alle Eingaben auf diesem Gerät löschen?")) {
              loeschen();
              setDaten({ ...LEER, aktualisiert: new Date().toISOString() });
            }
          }}
          className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte3 transition-colors hover:border-rot hover:text-rot"
        >
          Alles löschen
        </button>
      </div>
    </section>
  );
}
