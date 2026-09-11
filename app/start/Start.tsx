"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { euro, prozent, zahlAusEingabe } from "@/lib/format";
import { aufgaben, notgroschen, sparrateGesamt, summen } from "@/lib/cockpit";
import { schnitt } from "@/lib/ausgaben";
import {
  type Daten,
  type PostenArt,
  LEER,
  laden,
  postenLoeschen,
  postenSetzen,
  speichern,
} from "@/lib/store";

/**
 * Geführter Einstieg.
 *
 * Ein leeres Cockpit ist für Einsteiger die höchste Hürde: Man sieht eine
 * Tabelle und weiß nicht, wo man anfängt. Diese Seite stellt stattdessen fünf
 * Fragen und schreibt die Antworten fortlaufend weg – wer nach Frage zwei
 * abbricht, hat trotzdem etwas gewonnen.
 */

type Vorschlag = { name: string; hilfe: string; standard?: boolean };

const KONTEN: Vorschlag[] = [
  { name: "Hauptkonto", hilfe: "Gehalt kommt an, Daueraufträge gehen ab.", standard: true },
  { name: "Notgroschen", hilfe: "Tagesgeld, getrennt vom Alltag.", standard: true },
  { name: "Dauerausgaben", hilfe: "Versicherungen, KFZ-Steuer, Rundfunk." },
  { name: "Urlaub", hilfe: "Zweckgebunden angespart." },
  { name: "Auto", hilfe: "Reparatur, Steuer, Versicherung." },
];

const ANLAGEN: (Vorschlag & { sollAnteil: number; haltefrist?: boolean })[] = [
  { name: "ETF", hilfe: "Der Kern. Welt-ETF oder 50/30/20.", sollAnteil: 0.8, standard: true },
  { name: "Krypto", hilfe: "Satellit. Haltefrist zählt.", sollAnteil: 0.1, haltefrist: true },
  { name: "P2P", hilfe: "Satellit. Keine Einlagensicherung.", sollAnteil: 0.1 },
  { name: "Einzelaktien", hilfe: "Satellit. Klein halten.", sollAnteil: 0.05 },
];

const SCHULDEN: Vorschlag[] = [
  { name: "Dispokredit", hilfe: "10 – 13 %. Der teuerste Kredit, den es gibt." },
  { name: "Konsumkredit", hilfe: "Auto, Möbel, Ratenkäufe. Meist 6 – 10 %." },
  { name: "Immobilienkredit", hilfe: "Unter 3 % ist paralleles Investieren vertretbar." },
];

const SCHRITTE = ["Ausgaben", "Einnahmen", "Konten", "Anlagen", "Schulden", "Fertig"];

export default function Start() {
  const [daten, setDaten] = useState<Daten>(LEER);
  const [bereit, setBereit] = useState(false);
  const [schritt, setSchritt] = useState(0);

  useEffect(() => {
    setDaten(laden());
    setBereit(true);
  }, []);

  useEffect(() => {
    if (bereit) speichern(daten);
  }, [daten, bereit]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [schritt]);

  const su = useMemo(() => summen(daten.bilanz), [daten.bilanz]);
  const rate = useMemo(() => sparrateGesamt(daten.bilanz), [daten.bilanz]);
  const ng = useMemo(() => notgroschen(daten), [daten]);
  const sch = useMemo(
    () => schnitt(daten.ausgaben, daten.dauerausgaben),
    [daten.ausgaben, daten.dauerausgaben],
  );
  const offen = useMemo(
    () => aufgaben(daten).filter((a) => !a.erfuellt && !daten.erledigt.includes(a.id)),
    [daten],
  );

  const kopf = (
    <header>
      <p className="eyebrow text-gruen">Einstieg</p>
      <h1 className="mt-2.5 text-3xl sm:text-4xl">In fünf Minuten startklar</h1>
      <p className="mt-4 leading-relaxed text-tinte2">
        Fünf Fragen. Was du beantwortest, wird sofort gespeichert – du kannst jederzeit aufhören
        und später weitermachen. Nichts davon verlässt dein Gerät.
      </p>
    </header>
  );

  if (!bereit) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        {kopf}
        <p className="mt-8 text-tinte3">Lädt …</p>
      </div>
    );
  }

  const hat = (art: PostenArt, name: string) =>
    daten.bilanz.some((p) => p.art === art && p.name.toLowerCase() === name.toLowerCase());
  const wertVon = (art: PostenArt, name: string, feld: "wert" | "sparrate") =>
    daten.bilanz.find((p) => p.art === art && p.name.toLowerCase() === name.toLowerCase())?.[feld];

  function umschalten(art: PostenArt, v: Vorschlag & { sollAnteil?: number; haltefrist?: boolean }) {
    setDaten((d) =>
      hat(art, v.name)
        ? { ...d, bilanz: postenLoeschen(d.bilanz, art, v.name) }
        : {
            ...d,
            bilanz: postenSetzen(d.bilanz, art, v.name, {
              sollAnteil: v.sollAnteil,
              haltefrist: v.haltefrist,
              // Ein Hauptkonto verzinst sich nicht – das soll die Prognose wissen.
              rendite: v.name === "Hauptkonto" ? 0 : undefined,
            }),
          },
    );
  }

  const summeSoll = daten.bilanz
    .filter((p) => p.art === "depot")
    .reduce((x, p) => x + (p.sollAnteil ?? 0), 0);

  /** Die gewaehlten Anteile auf 100 % strecken, ohne ihr Verhaeltnis zu aendern. */
  function normieren() {
    if (summeSoll <= 0) return;
    setDaten((d) => ({
      ...d,
      bilanz: d.bilanz.map((p) =>
        p.art === "depot" && p.sollAnteil
          ? { ...p, sollAnteil: Math.round((p.sollAnteil / summeSoll) * 1000) / 1000 }
          : p,
      ),
    }));
  }

  function setzen(art: PostenArt, name: string, feld: "wert" | "sparrate", v?: number) {
    setDaten((d) => ({ ...d, bilanz: postenSetzen(d.bilanz, art, name, { [feld]: v }) }));
  }

  const letzter = schritt === SCHRITTE.length - 1;

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      {kopf}

      {/* Fortschritt */}
      <nav className="kein-druck mt-8" aria-label="Fortschritt">
        {/* Auf dem Handy ist fuer sechs Beschriftungen kein Platz - dort genuegt eine Zeile. */}
        <p className="mb-2 text-sm text-tinte2 sm:hidden">
          Schritt {schritt + 1} von {SCHRITTE.length} ·{" "}
          <span className="font-semibold text-gruen">{SCHRITTE[schritt]}</span>
        </p>
        <ol className="flex gap-1.5">
          {SCHRITTE.map((s, i) => (
            <li key={s} className="flex-1">
              <button
                type="button"
                onClick={() => setSchritt(i)}
                className="w-full text-left"
                aria-current={i === schritt ? "step" : undefined}
              >
                <span
                  className={`block h-1.5 rounded-full ${
                    i < schritt ? "bg-gruen" : i === schritt ? "bg-gruen" : "bg-linie"
                  }`}
                />
                <span
                  className={`mt-2 hidden text-[11px] sm:block ${
                    i === schritt ? "font-semibold text-gruen" : "text-tinte3"
                  }`}
                >
                  {s}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-9 rounded-xl border border-linie bg-flaeche p-6 sm:p-8">
        {/* ───────────────── 1 Ausgaben */}
        {schritt === 0 && (
          <Frage
            titel="Was gibst du im Monat aus?"
            hilfe="Alles zusammen: Miete, Einkäufe, Abos, Versicherungen. Diese eine Zahl bemisst später deinen Notgroschen und prüft deine Sparrate."
          >
            <Betrag
              label="Nettomonatsausgaben"
              wert={daten.nettomonatsausgaben}
              onChange={(v) => setDaten((d) => ({ ...d, nettomonatsausgaben: v }))}
            />
            {sch.wert !== undefined && (
              <button
                type="button"
                onClick={() =>
                  setDaten((d) => ({ ...d, nettomonatsausgaben: Math.round(sch.wert!) }))
                }
                className="mt-4 rounded-lg border border-linie2 px-4 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
              >
                Aus deiner Erfassung übernehmen: {euro(sch.wert)}
              </button>
            )}
            <p className="mt-5 text-sm leading-relaxed text-tinte2">
              Du weißt es nicht genau? Schätz erst mal – und erfasse ab heute mit. Nach drei vollen
              Monaten hast du die echte Zahl.
            </p>
            <Link
              href="/ausgaben"
              className="mt-2 inline-block text-sm font-semibold text-rot underline"
            >
              Ausgaben erfassen
            </Link>
          </Frage>
        )}

        {/* ───────────────── 2 Einnahmen */}
        {schritt === 1 && (
          <Frage
            titel="Was kommt netto rein?"
            hilfe="Gehalt und alles, was regelmäßig dazukommt. Die Differenz zu deinen Ausgaben ist der Betrag, um den es hier geht."
          >
            <Betrag
              label="Monatliche Einnahmen"
              wert={daten.zufluesse.gehalt}
              onChange={(v) =>
                setDaten((d) => ({ ...d, zufluesse: { ...d.zufluesse, gehalt: v } }))
              }
            />
            {daten.zufluesse.gehalt !== undefined && daten.nettomonatsausgaben !== undefined && (
              <div className="mt-6 rounded-xl border border-gruen/30 bg-gruen-hell p-5">
                <p className="eyebrow text-gruen">Daraus folgt</p>
                <p className="tabular mt-2 font-serif text-3xl font-bold text-gruen">
                  {euro(daten.zufluesse.gehalt - daten.nettomonatsausgaben)}
                </p>
                <p className="mt-1.5 text-sm text-tinte2">
                  bleiben im Monat übrig
                  {daten.zufluesse.gehalt > 0 &&
                    ` – das sind ${prozent(
                      (daten.zufluesse.gehalt - daten.nettomonatsausgaben) /
                        daten.zufluesse.gehalt,
                      0,
                    )} deiner Einnahmen.`}
                </p>
                {daten.zufluesse.gehalt - daten.nettomonatsausgaben <= 0 && (
                  <p className="mt-3 text-sm leading-relaxed text-rot">
                    Da bleibt nichts übrig. Dann ist der erste Schritt nicht das Investieren,
                    sondern die Ausgabenseite – oder die Einnahmenseite.
                  </p>
                )}
              </div>
            )}
          </Frage>
        )}

        {/* ───────────────── 3 Konten */}
        {schritt === 2 && (
          <Frage
            titel="Welche Konten hast du?"
            hilfe="Häkchen setzen, Stand eintragen. Was du nicht hast, lässt du weg – ergänzen kannst du jederzeit."
          >
            <Auswahl
              art="konto"
              liste={KONTEN}
              hat={hat}
              wertVon={wertVon}
              umschalten={umschalten}
              setzen={setzen}
              betragLabel="Aktueller Stand"
              rateLabel="Monatlich dorthin"
            />
          </Frage>
        )}

        {/* ───────────────── 4 Anlagen */}
        {schritt === 3 && (
          <Frage
            titel="Investierst du schon?"
            hilfe="Auch mit 0 € sinnvoll: Trag die Anlageklassen ein, die du haben willst – dann steht deine Zielaufteilung, bevor die erste Order läuft."
          >
            <Auswahl
              art="depot"
              liste={ANLAGEN}
              hat={hat}
              wertVon={wertVon}
              umschalten={umschalten}
              setzen={setzen}
              betragLabel="Aktueller Wert"
              rateLabel="Sparplan p. M."
            />
            <p className="mt-5 text-sm leading-relaxed text-tinte3">
              Die Soll-Anteile werden mit den Werten aus Kapitel 6 vorbelegt (ETF 80 %, Satelliten
              je 10 %). Im Cockpit kannst du sie ändern.
            </p>
            {summeSoll > 0 && Math.abs(summeSoll - 1) > 0.005 && (
              <div className="mt-4 rounded-xl border border-gold/50 bg-gold-hell p-5">
                <p className="text-sm leading-relaxed text-tinte2">
                  Deine Soll-Anteile ergeben zusammen{" "}
                  <span className="font-semibold text-gold">{prozent(summeSoll)}</span>. Für eine
                  Zielaufteilung sollten es 100 % sein – sonst ist nicht festgelegt, wohin der Rest
                  gehört.
                </p>
                <button
                  type="button"
                  onClick={normieren}
                  className="mt-3 rounded-lg border border-gold px-4 py-2 text-sm font-semibold text-gold transition-colors hover:bg-gold hover:text-white"
                >
                  Auf 100 % normieren
                </button>
              </div>
            )}
          </Frage>
        )}

        {/* ───────────────── 5 Schulden */}
        {schritt === 4 && (
          <Frage
            titel="Hast du Kredite?"
            hilfe="Teure Schulden gehen jedem Investment vor: Tilgen bringt garantiert den Kreditzins, und den schafft keine Anlage verlässlich."
          >
            <Auswahl
              art="schuld"
              liste={SCHULDEN}
              hat={hat}
              wertVon={wertVon}
              umschalten={umschalten}
              setzen={setzen}
              betragLabel="Restschuld"
              rateLabel="Tilgung p. M."
            />
            <p className="mt-5 text-sm leading-relaxed text-tinte3">
              Keine? Dann einfach weiter – das ist die beste Antwort auf diese Frage.
            </p>
          </Frage>
        )}

        {/* ───────────────── 6 Fertig */}
        {letzter && (
          <div>
            <p className="eyebrow text-gruen">Fertig</p>
            <h2 className="mt-2.5 text-2xl">Das ist dein Ausgangspunkt</h2>

            <div className="mt-7 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-linie bg-papier p-5">
                <p className="tabular font-serif text-2xl font-bold text-tinte">{euro(su.netto)}</p>
                <p className="eyebrow mt-1.5 text-tinte3">Nettovermögen</p>
              </div>
              <div className="rounded-xl border border-linie bg-papier p-5">
                <p className="tabular font-serif text-2xl font-bold text-gruen">{euro(rate)}</p>
                <p className="eyebrow mt-1.5 text-tinte3">Sparrate p. M.</p>
              </div>
              <div className="rounded-xl border border-linie bg-papier p-5">
                <p className="tabular font-serif text-2xl font-bold text-gold">
                  {ng.anteil !== undefined ? prozent(Math.min(1, ng.anteil), 0) : "–"}
                </p>
                <p className="eyebrow mt-1.5 text-tinte3">Notgroschen erreicht</p>
              </div>
            </div>

            {offen.length > 0 && (
              <div className="mt-8">
                <p className="eyebrow text-tinte3">Deine nächsten Schritte</p>
                <ol className="mt-3 space-y-3">
                  {offen.slice(0, 3).map((a, i) => (
                    <li key={a.id} className="flex gap-3.5 rounded-xl border border-linie p-5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gruen font-serif text-sm font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-tinte">{a.titel}</span>
                        <span className="mt-1 block text-sm leading-relaxed text-tinte2">
                          {a.text}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/cockpit"
                className="rounded-lg bg-gruen px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
              >
                Zum Cockpit
              </Link>
              <Link
                href="/methode"
                className="rounded-lg border border-linie2 px-6 py-3 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
              >
                Erst die Methode lesen
              </Link>
            </div>
          </div>
        )}

        {/* Navigation */}
        {!letzter && (
          <div className="mt-9 flex items-center justify-between gap-4 border-t border-linie pt-6">
            <button
              type="button"
              onClick={() => setSchritt((s) => Math.max(0, s - 1))}
              disabled={schritt === 0}
              className="text-sm text-tinte2 transition-colors hover:text-tinte disabled:invisible"
            >
              ← Zurück
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSchritt((s) => s + 1)}
                className="text-sm text-tinte3 transition-colors hover:text-tinte"
              >
                Überspringen
              </button>
              <button
                type="button"
                onClick={() => setSchritt((s) => s + 1)}
                className="rounded-lg bg-gruen px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
              >
                Weiter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────── Bausteine

function Frage({
  titel,
  hilfe,
  children,
}: {
  titel: string;
  hilfe: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-2xl">{titel}</h2>
      <p className="mt-3 max-w-xl leading-relaxed text-tinte2">{hilfe}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}

function Betrag({
  label,
  wert,
  onChange,
}: {
  label: string;
  wert?: number;
  onChange: (v: number | undefined) => void;
}) {
  const [text, setText] = useState(wert !== undefined ? String(wert).replace(".", ",") : "");
  const [fokus, setFokus] = useState(false);
  useEffect(() => {
    if (!fokus) setText(wert !== undefined ? String(wert).replace(".", ",") : "");
  }, [wert, fokus]);

  return (
    <label className="block max-w-sm">
      <span className="eyebrow mb-2 block text-tinte3">{label}</span>
      <span className="flex items-center gap-3 rounded-lg border border-linie2 bg-papier px-4 py-3 focus-within:border-gruen">
        <span className="font-serif text-2xl text-tinte3">€</span>
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
          className="tabular w-full bg-transparent text-right font-serif text-2xl font-bold outline-none placeholder:text-linie2"
        />
      </span>
    </label>
  );
}

function Auswahl({
  art,
  liste,
  hat,
  wertVon,
  umschalten,
  setzen,
  betragLabel,
  rateLabel,
}: {
  art: PostenArt;
  liste: (Vorschlag & { sollAnteil?: number; haltefrist?: boolean })[];
  hat: (art: PostenArt, name: string) => boolean;
  wertVon: (art: PostenArt, name: string, feld: "wert" | "sparrate") => number | undefined;
  umschalten: (art: PostenArt, v: Vorschlag & { sollAnteil?: number; haltefrist?: boolean }) => void;
  setzen: (art: PostenArt, name: string, feld: "wert" | "sparrate", v?: number) => void;
  betragLabel: string;
  rateLabel: string;
}) {
  return (
    <ul className="space-y-3">
      {liste.map((v) => {
        const an = hat(art, v.name);
        return (
          <li
            key={v.name}
            className={`rounded-xl border p-5 transition-colors ${
              an ? "border-gruen/40 bg-gruen-hell" : "border-linie"
            }`}
          >
            <button
              type="button"
              onClick={() => umschalten(art, v)}
              aria-pressed={an}
              className="flex w-full items-start gap-3.5 text-left"
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold transition-colors ${
                  an ? "border-gruen bg-gruen text-white" : "border-linie2 text-transparent"
                }`}
                aria-hidden
              >
                {an ? "✓" : ""}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-tinte">{v.name}</span>
                <span className="mt-0.5 block text-sm text-tinte2">{v.hilfe}</span>
              </span>
            </button>

            {an && (
              <div className="mt-4 grid gap-4 border-t border-gruen/25 pt-4 sm:grid-cols-2">
                <KleinFeld
                  label={betragLabel}
                  wert={wertVon(art, v.name, "wert")}
                  onChange={(x) => setzen(art, v.name, "wert", x)}
                />
                <KleinFeld
                  label={rateLabel}
                  wert={wertVon(art, v.name, "sparrate")}
                  onChange={(x) => setzen(art, v.name, "sparrate", x)}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function KleinFeld({
  label,
  wert,
  onChange,
}: {
  label: string;
  wert?: number;
  onChange: (v: number | undefined) => void;
}) {
  const [text, setText] = useState(wert !== undefined ? String(wert).replace(".", ",") : "");
  const [fokus, setFokus] = useState(false);
  useEffect(() => {
    if (!fokus) setText(wert !== undefined ? String(wert).replace(".", ",") : "");
  }, [wert, fokus]);

  return (
    <label className="block">
      <span className="eyebrow mb-1.5 block text-tinte3">{label}</span>
      <span className="flex items-center gap-2 rounded-md border border-linie2 bg-papier px-3 py-2 focus-within:border-gruen">
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
        <span className="shrink-0 text-xs text-tinte3">€</span>
      </span>
    </label>
  );
}
