"use client";

import { useEffect, useMemo, useState } from "react";
import Betragsfeld from "@/components/Betragsfeld";
import { euro } from "@/lib/format";
import { gegenrechnung, notgroschenZiel } from "@/lib/finance";
import { type Daten, laden, speichern, vorlageKontensystem, exportieren, importieren, LEER } from "@/lib/store";

type Spalte = "vermoegen" | "ausgaben";

const AUFBAU: Record<Spalte, { schluessel: string; name: string; typ: "konto" | "kategorie"; notiz?: string }[]> = {
  vermoegen: [
    { schluessel: "notgroschen", name: "Konto Notgroschen", typ: "konto", notiz: "Separat, jederzeit verfügbar." },
    { schluessel: "investitionen", name: "Konto Investitionen", typ: "konto", notiz: "Verrechnungskonto vor den Depots." },
  ],
  ausgaben: [
    { schluessel: "taeglich", name: "Täglicher Bedarf", typ: "kategorie", notiz: "Lebensmittel, Drogerie, Tanken." },
    { schluessel: "fixkosten", name: "Monatliche Fixkosten", typ: "kategorie", notiz: "Abos, Versicherungen." },
    { schluessel: "dauerausgaben", name: "Konto Dauerausgaben", typ: "konto", notiz: "Quartals-, halb- und jährliche Posten." },
    { schluessel: "auto", name: "Konto Auto", typ: "konto", notiz: "Versicherung, Steuer, Reparaturen." },
    { schluessel: "urlaub", name: "Konto Urlaub", typ: "konto" },
  ],
};

export default function Kontensystem() {
  const [daten, setDaten] = useState<Daten>(LEER);
  const [bereit, setBereit] = useState(false);

  useEffect(() => {
    const d = laden();
    setDaten(d.konten.length ? d : vorlageKontensystem());
    setBereit(true);
  }, []);

  useEffect(() => {
    if (bereit) speichern(daten);
  }, [daten, bereit]);

  const betrag = (schluessel: string) =>
    daten.konten.find((k) => k.id === schluessel)?.betragMonat;

  const setzeBetrag = (schluessel: string, name: string, typ: "konto" | "kategorie", wert?: number) =>
    setDaten((d) => {
      const vorhanden = d.konten.find((k) => k.id === schluessel);
      const konten = vorhanden
        ? d.konten.map((k) => (k.id === schluessel ? { ...k, betragMonat: wert } : k))
        : [...d.konten, { id: schluessel, typ, name, betragMonat: wert }];
      return { ...d, konten };
    });

  const abfluesse = useMemo(
    () =>
      [...AUFBAU.vermoegen, ...AUFBAU.ausgaben]
        .filter((p) => p.schluessel !== "notgroschen")
        .map((p) => betrag(p.schluessel) ?? 0),
    [daten],
  );

  const zufluesse = (daten.zufluesse.gehalt ?? 0) + (daten.zufluesse.rueckfluss ?? 0);
  const rechnung = gegenrechnung(zufluesse, abfluesse);
  const ziel = daten.nettomonatsausgaben
    ? notgroschenZiel(daten.nettomonatsausgaben, daten.einstellungen.notgroschenMonate)
    : undefined;

  if (!bereit) return <div className="mx-auto max-w-6xl px-5 py-24 text-tinte3">Lädt …</div>;

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <header className="mb-9">
        <p className="eyebrow text-gruen">Dein Kontensystem</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Ein Konto als Drehscheibe</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">
          Trag ein, was monatlich wohin fließt. Die Gegenrechnung unten zeigt sofort, ob die
          Aufteilung aufgeht. Alles wird automatisch in deinem Browser gespeichert.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Vermögen */}
        <section className="rounded-xl border border-gruen/40 bg-gruen-hell p-5">
          <h2 className="text-center text-2xl text-gruen-tief">Vermögen</h2>
          <p className="mt-1 text-center text-sm text-gruen-tief/70">Was für dich arbeitet.</p>

          <div className="mt-6 space-y-4">
            {AUFBAU.vermoegen.map((p) => (
              <article key={p.schluessel} className="rounded-lg border border-gruen/40 bg-flaeche p-4">
                <span className="eyebrow rounded bg-gruen px-2 py-0.5 text-[10px] text-white">
                  {p.typ === "konto" ? "Konto" : "Kategorie"}
                </span>
                <h3 className="mt-2.5 text-lg">{p.name}</h3>
                {p.notiz && <p className="mt-1 text-xs text-tinte3">{p.notiz}</p>}

                {p.schluessel === "notgroschen" && (
                  <div className="mt-3 rounded-md bg-gruen-hell p-3">
                    <Betragsfeld
                      label="Deine Nettomonatsausgaben"
                      einheit="p. M."
                      wert={daten.nettomonatsausgaben}
                      onChange={(v) => setDaten((d) => ({ ...d, nettomonatsausgaben: v }))}
                    />
                    <p className="mt-2.5 text-sm text-gruen-tief">
                      Zielbetrag{" "}
                      <strong className="tabular font-serif text-base">
                        {ziel !== undefined ? euro(ziel) : "–"}
                      </strong>{" "}
                      <span className="text-xs text-tinte3">
                        ({daten.einstellungen.notgroschenMonate} Monatsausgaben)
                      </span>
                    </p>
                  </div>
                )}

                <div className="mt-3">
                  <Betragsfeld
                    label={p.schluessel === "notgroschen" ? "Monatlich zurücklegen" : "Dauerauftrag"}
                    wert={betrag(p.schluessel)}
                    onChange={(v) => setzeBetrag(p.schluessel, p.name, p.typ, v)}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Mitte */}
        <section className="space-y-5">
          <article className="rounded-xl border border-blau/40 bg-blau-hell p-5">
            <span className="eyebrow rounded bg-blau px-2 py-0.5 text-[10px] text-white">
              Zuflüsse
            </span>
            <h2 className="mt-2.5 text-2xl text-blau-tief">Was reinkommt</h2>
            <div className="mt-4 space-y-3">
              <Betragsfeld
                label="Gehalt"
                gross
                wert={daten.zufluesse.gehalt}
                onChange={(v) =>
                  setDaten((d) => ({ ...d, zufluesse: { ...d.zufluesse, gehalt: v } }))
                }
              />
              <Betragsfeld
                label="Rückfluss aus Vermögen"
                wert={daten.zufluesse.rueckfluss}
                onChange={(v) =>
                  setDaten((d) => ({ ...d, zufluesse: { ...d.zufluesse, rueckfluss: v } }))
                }
              />
            </div>
          </article>

          <article className="rounded-xl border-2 border-blau bg-blau-hell p-5">
            <span className="eyebrow rounded bg-blau px-2 py-0.5 text-[10px] text-white">Konto</span>
            <h2 className="mt-2.5 text-2xl text-blau-tief">Hauptkonto</h2>
            <p className="mt-1 text-sm text-blau-tief/70">Alles läuft hier durch.</p>
            <p className="tabular mt-4 font-serif text-3xl font-bold text-blau-tief">
              {euro(zufluesse)}
            </p>
            <p className="text-xs text-tinte3">Durchlauf pro Monat</p>
          </article>

          {/* Gegenrechnung */}
          <article className="rounded-xl border border-tinte/50 bg-[#f2f3f3] p-5">
            <span className="eyebrow rounded bg-[#4a5054] px-2 py-0.5 text-[10px] text-white">
              Gegenrechnung
            </span>
            <h2 className="mt-2.5 text-xl">Kontrolle</h2>
            <dl className="tabular mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-tinte2">Zuflüsse</dt>
                <dd className="font-semibold">{euro(rechnung.zufluesse)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-tinte2">− Abflüsse</dt>
                <dd className="font-semibold">{euro(rechnung.abfluesse)}</dd>
              </div>
              <div
                className={`mt-3 flex justify-between rounded-lg border-2 px-3 py-2.5 ${
                  Math.abs(rechnung.rest) < 1
                    ? "border-gruen bg-gruen-hell"
                    : rechnung.rest < 0
                      ? "border-rot bg-rot-hell"
                      : "border-gold bg-gold-hell"
                }`}
              >
                <dt className="font-semibold">= Rest</dt>
                <dd className="font-serif text-lg font-bold">{euro(rechnung.rest)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-tinte2">
              {Math.abs(rechnung.rest) < 1
                ? "Die Rechnung geht auf. Jeder Euro hat ein Ziel."
                : rechnung.rest < 0
                  ? "Du verteilst mehr, als reinkommt. Eine Position muss kleiner werden."
                  : "Hier ist noch Geld ohne Ziel. Ungeplantes Geld wird meistens ausgegeben."}
            </p>
          </article>
        </section>

        {/* Ausgaben */}
        <section className="rounded-xl border border-rot/40 bg-rot-hell p-5">
          <h2 className="text-center text-2xl text-rot-tief">Ausgaben</h2>
          <p className="mt-1 text-center text-sm text-rot-tief/70">Was planbar rausgeht.</p>

          <div className="mt-6 space-y-4">
            {AUFBAU.ausgaben.map((p) => (
              <article key={p.schluessel} className="rounded-lg border border-rot/30 bg-flaeche p-4">
                <span
                  className={`eyebrow rounded px-2 py-0.5 text-[10px] ${
                    p.typ === "konto" ? "bg-rot text-white" : "border border-rot text-rot"
                  }`}
                >
                  {p.typ === "konto" ? "Konto" : "Kategorie"}
                </span>
                <h3 className="mt-2.5 text-lg">{p.name}</h3>
                {p.notiz && <p className="mt-1 text-xs text-tinte3">{p.notiz}</p>}
                <div className="mt-3">
                  <Betragsfeld
                    wert={betrag(p.schluessel)}
                    onChange={(v) => setzeBetrag(p.schluessel, p.name, p.typ, v)}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      {/* Datenhoheit */}
      <div className="kein-druck mt-10 flex flex-wrap items-center gap-3 rounded-xl border border-linie bg-flaeche p-5">
        <p className="mr-auto text-sm text-tinte2">
          Gespeichert in deinem Browser. Zuletzt: {new Date(daten.aktualisiert).toLocaleString("de-DE")}
        </p>
        <button
          onClick={() => {
            const blob = new Blob([exportieren(daten)], { type: "application/json" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `kontensystem-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(a.href);
          }}
          className="rounded-lg border border-linie2 px-4 py-2 text-sm font-medium transition-colors hover:bg-papier"
        >
          Als Datei sichern
        </button>
        <label className="cursor-pointer rounded-lg border border-linie2 px-4 py-2 text-sm font-medium transition-colors hover:bg-papier">
          Datei laden
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const d = importieren(await f.text());
              if (d) setDaten(d);
              else alert("Diese Datei konnte nicht gelesen werden.");
            }}
          />
        </label>
        <button
          onClick={() => window.print()}
          className="rounded-lg border border-linie2 px-4 py-2 text-sm font-medium transition-colors hover:bg-papier"
        >
          Drucken
        </button>
        <button
          onClick={() => {
            if (confirm("Alle Eingaben auf diesem Gerät löschen?")) setDaten(vorlageKontensystem());
          }}
          className="rounded-lg border border-rot/40 px-4 py-2 text-sm font-medium text-rot transition-colors hover:bg-rot-hell"
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}
