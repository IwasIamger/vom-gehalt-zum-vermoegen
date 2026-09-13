"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { datum as fdatum, euro, plural, zahlAusEingabe } from "@/lib/format";
import {
  alsCsv,
  fortschritt,
  laufenderMonat,
  monatKurz,
  monatName,
  proMonat,
  proTag,
  schnitt,
} from "@/lib/ausgaben";
import {
  type Ausgabe,
  type Daten,
  type Dauerausgabe,
  LEER,
  laden,
  neueDauerausgabe,
  speichern,
} from "@/lib/store";

export default function Ausgaben() {
  const [daten, setDaten] = useState<Daten>(LEER);
  const [bereit, setBereit] = useState(false);

  const [betrag, setBetrag] = useState("");
  const [kategorie, setKategorie] = useState<string>("");
  const [tag, setTag] = useState(() => new Date().toISOString().slice(0, 10));
  const [notiz, setNotiz] = useState("");
  const [gebucht, setGebucht] = useState<string | null>(null);
  const [kategorieOffen, setKategorieOffen] = useState(false);
  const [neueKategorie, setNeueKategorie] = useState("");
  const betragRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const d = laden();
    setDaten(d);
    setKategorie(d.kategorien[0] ?? "Sonstiges");
    setBereit(true);
  }, []);

  useEffect(() => {
    if (bereit) speichern(daten);
  }, [daten, bereit]);

  const monate = useMemo(
    () => proMonat(daten.ausgaben, daten.dauerausgaben),
    [daten.ausgaben, daten.dauerausgaben],
  );
  const sch = useMemo(
    () => schnitt(daten.ausgaben, daten.dauerausgaben),
    [daten.ausgaben, daten.dauerausgaben],
  );
  const fs = useMemo(
    () => fortschritt(daten.ausgaben, daten.dauerausgaben),
    [daten.ausgaben, daten.dauerausgaben],
  );
  const tage = useMemo(() => proTag(daten.ausgaben), [daten.ausgaben]);
  const monatlichFest = useMemo(
    () => daten.dauerausgaben.filter((x) => x.rhythmus === 1).reduce((s, x) => s + x.betrag, 0),
    [daten.dauerausgaben],
  );

  const [gewaehlt, setGewaehlt] = useState<string>("");
  const [alleZeigen, setAlleZeigen] = useState(false);
  const TAGE_KURZ = 14;
  const aktuell = gewaehlt || monate[monate.length - 1]?.monat || laufenderMonat();
  const monatsWert = monate.find((m) => m.monat === aktuell);

  function eintragen() {
    const wert = zahlAusEingabe(betrag);
    if (!wert || wert <= 0) {
      betragRef.current?.focus();
      return;
    }
    const eintrag: Ausgabe = {
      id: crypto.randomUUID(),
      datum: tag,
      betrag: wert,
      kategorie: kategorie || "Sonstiges",
      notiz: notiz.trim() || undefined,
    };
    setDaten((d) => ({ ...d, ausgaben: [...d.ausgaben, eintrag] }));
    setBetrag("");
    setNotiz("");
    setGebucht(`${euro(wert)} · ${eintrag.kategorie}`);
    window.setTimeout(() => setGebucht(null), 2500);
    betragRef.current?.focus();
  }

  function entferne(id: string) {
    setDaten((d) => ({ ...d, ausgaben: d.ausgaben.filter((a) => a.id !== id) }));
  }

  function festeAendern(id: string, feld: keyof Dauerausgabe, wert: unknown) {
    setDaten((d) => ({
      ...d,
      dauerausgaben: d.dauerausgaben.map((x) => (x.id === id ? { ...x, [feld]: wert } : x)),
    }));
  }

  function festeEntfernen(id: string) {
    setDaten((d) => ({ ...d, dauerausgaben: d.dauerausgaben.filter((x) => x.id !== id) }));
  }

  function kategorieErgaenzen() {
    const name = neueKategorie.trim();
    if (!name) return;
    if (!daten.kategorien.some((k) => k.toLowerCase() === name.toLowerCase())) {
      setDaten((d) => ({ ...d, kategorien: [...d.kategorien, name] }));
    }
    setKategorie(name);
    setNeueKategorie("");
    setKategorieOffen(false);
  }

  // Der Kopf gehört ins ausgelieferte HTML, damit Vorschau, Suchmaschine und
  // ein langsames Netz mehr sehen als "Lädt".
  const kopf = (
    <header>
      <p className="eyebrow text-rot">Ausgaben</p>
      <h1 className="mt-2.5 text-3xl sm:text-4xl">Erfassen</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">
        Drei Monate am Stück, dann steht die Zahl, die alles andere bemisst. Jeder Eintrag dauert
        zwei Sekunden – Betrag, Kategorie, fertig.
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

  const uebernommen =
    sch.wert !== undefined &&
    daten.nettomonatsausgaben !== undefined &&
    Math.abs(daten.nettomonatsausgaben - sch.wert) < 1;

  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      {kopf}

      {/* ───────────────────────────── Erfassen */}
      <section className="mt-8 rounded-xl border border-linie bg-flaeche p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="font-serif text-3xl text-tinte3">€</span>
          <input
            ref={betragRef}
            inputMode="decimal"
            value={betrag}
            placeholder="0,00"
            onChange={(e) => setBetrag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") eintragen();
            }}
            aria-label="Betrag"
            className="tabular w-full bg-transparent font-serif text-4xl font-bold outline-none placeholder:text-linie2"
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {daten.kategorien.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKategorie(k)}
              aria-pressed={kategorie === k}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                kategorie === k
                  ? "border-rot bg-rot text-white"
                  : "border-linie2 text-tinte2 hover:border-rot hover:text-rot"
              }`}
            >
              {k}
            </button>
          ))}
          {kategorieOffen ? (
            <span className="inline-flex items-center gap-2">
              <input
                autoFocus
                value={neueKategorie}
                onChange={(e) => setNeueKategorie(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") kategorieErgaenzen();
                  if (e.key === "Escape") {
                    setNeueKategorie("");
                    setKategorieOffen(false);
                  }
                }}
                placeholder="Name der Kategorie"
                aria-label="Name der neuen Kategorie"
                className="w-44 rounded-full border border-gruen bg-papier px-4 py-2 text-sm outline-none"
              />
              <button
                type="button"
                onClick={kategorieErgaenzen}
                className="rounded-full bg-gruen px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gruen-tief"
              >
                Anlegen
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setKategorieOffen(true)}
              className="rounded-full border border-dashed border-linie2 px-4 py-2 text-sm text-tinte3 transition-colors hover:border-gruen hover:text-gruen"
            >
              + Kategorie
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr_auto] sm:items-center">
          <input
            type="date"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            aria-label="Datum"
            className="rounded-md border border-linie2 bg-papier px-3 py-2.5 text-sm outline-none focus:border-gruen"
          />
          <input
            value={notiz}
            onChange={(e) => setNotiz(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") eintragen();
            }}
            placeholder="Notiz (optional)"
            aria-label="Notiz"
            className="rounded-md border border-linie2 bg-papier px-3 py-2.5 text-sm outline-none focus:border-gruen"
          />
          <button
            type="button"
            onClick={eintragen}
            className="rounded-lg bg-rot px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rot-tief"
          >
            Eintragen
          </button>
        </div>

        <p
          role="status"
          aria-live="polite"
          className="mt-4 min-h-5 text-sm text-gruen"
        >
          {gebucht ? `Erfasst: ${gebucht}` : ""}
        </p>
      </section>

      {/* Feste Ausgaben */}
      <section className="mt-6 rounded-xl border border-linie bg-flaeche p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl">Feste Ausgaben</h2>
          {monatlichFest > 0 && (
            <p className="tabular text-sm text-tinte2">{euro(monatlichFest)} monatlich</p>
          )}
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
          Miete, Versicherungen, Abos: einmal eintragen statt jeden Monat neu. Sie z&auml;hlen in
          jedem f&auml;lligen Monat mit &ndash; ein Jahresbeitrag aber nur in dem Monat, in dem er
          tats&auml;chlich abgeht. Die Nettomonatsausgaben sollen zeigen, was wirklich abflie&szlig;t.
        </p>

        {daten.dauerausgaben.length > 0 && (
          <ul className="mt-6 space-y-3">
            {daten.dauerausgaben.map((f) => (
              <li key={f.id} className="rounded-xl border border-linie bg-papier p-4">
                <div className="grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-end">
                  <label className="block">
                    <span className="eyebrow mb-1.5 block text-tinte3">Name</span>
                    <input
                      value={f.name}
                      onChange={(e) => festeAendern(f.id, "name", e.target.value)}
                      placeholder="z. B. Miete"
                      className="w-full rounded-md border border-linie2 bg-flaeche px-3 py-2 outline-none focus:border-gruen"
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-1.5 block text-tinte3">Betrag</span>
                    <span className="flex items-center gap-2 rounded-md border border-linie2 bg-flaeche px-3 py-2 focus-within:border-gruen">
                      <input
                        inputMode="decimal"
                        defaultValue={f.betrag ? String(f.betrag).replace(".", ",") : ""}
                        placeholder="0"
                        onChange={(e) =>
                          festeAendern(f.id, "betrag", zahlAusEingabe(e.target.value) ?? 0)
                        }
                        aria-label="Betrag"
                        className="tabular w-full bg-transparent text-right outline-none"
                      />
                      <span className="shrink-0 text-xs text-tinte3">&euro;</span>
                    </span>
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-1.5 block text-tinte3">Rhythmus</span>
                    <select
                      value={f.rhythmus}
                      onChange={(e) => festeAendern(f.id, "rhythmus", Number(e.target.value))}
                      className="w-full rounded-md border border-linie2 bg-flaeche px-3 py-2 outline-none focus:border-gruen"
                    >
                      <option value={1}>monatlich</option>
                      <option value={3}>alle 3 Monate</option>
                      <option value={6}>halbj&auml;hrlich</option>
                      <option value={12}>j&auml;hrlich</option>
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => festeEntfernen(f.id)}
                    aria-label={`${f.name || "Posten"} entfernen`}
                    className="h-10 shrink-0 justify-self-end rounded-md border border-linie2 px-3 text-sm text-tinte3 transition-colors hover:border-rot hover:text-rot"
                  >
                    Entfernen
                  </button>
                </div>

                <div className="mt-3 grid gap-3 border-t border-linie pt-3 md:grid-cols-3 md:items-end">
                  <label className="block">
                    <span className="eyebrow mb-1.5 block text-tinte3">Kategorie</span>
                    <select
                      value={f.kategorie}
                      onChange={(e) => festeAendern(f.id, "kategorie", e.target.value)}
                      className="w-full rounded-md border border-linie2 bg-flaeche px-3 py-2 outline-none focus:border-gruen"
                    >
                      {daten.kategorien.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-1.5 block text-tinte3">Erstmals f&auml;llig</span>
                    <input
                      type="month"
                      value={f.ab}
                      onChange={(e) => festeAendern(f.id, "ab", e.target.value)}
                      className="w-full rounded-md border border-linie2 bg-flaeche px-3 py-2 outline-none focus:border-gruen"
                    />
                  </label>
                  <label className="block">
                    <span className="eyebrow mb-1.5 block text-tinte3">L&auml;uft bis (optional)</span>
                    <input
                      type="month"
                      value={f.bis ?? ""}
                      onChange={(e) => festeAendern(f.id, "bis", e.target.value || undefined)}
                      className="w-full rounded-md border border-linie2 bg-flaeche px-3 py-2 outline-none focus:border-gruen"
                    />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          onClick={() =>
            setDaten((d) => ({
              ...d,
              dauerausgaben: [
                ...d.dauerausgaben,
                neueDauerausgabe(d.kategorien[1] ?? d.kategorien[0] ?? "Fixkosten"),
              ],
            }))
          }
          className="mt-5 rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
        >
          + Feste Ausgabe
        </button>
      </section>

      {/* ───────────────────────────── Fortschritt */}
      <section className="mt-6 rounded-xl border border-linie bg-flaeche p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-xl">Dein Schnitt</h2>
          {fs.seit && (
            <p className="text-sm text-tinte3">
              seit {fdatum(fs.seit)} · {plural(fs.tage, "Tag", "Tage")} ·{" "}
              {plural(daten.ausgaben.length, "Eintrag", "Einträge")}
              {daten.dauerausgaben.length > 0 &&
                ` · ${plural(daten.dauerausgaben.length, "fester Posten", "feste Posten")}`}
            </p>
          )}
        </div>

        {sch.wert === undefined ? (
          <p className="mt-4 text-sm leading-relaxed text-tinte2">
            Sobald ein Monat abgeschlossen ist, steht hier der erste Wert. Der laufende Monat zählt
            nicht mit – er ist immer unvollständig und würde den Schnitt zu niedrig aussehen lassen.
          </p>
        ) : (
          <>
            <p className="tabular mt-4 font-serif text-4xl font-bold text-rot">{euro(sch.wert)}</p>
            <p className="mt-1.5 text-sm text-tinte2">
              Durchschnitt aus {sch.monate === 1 ? "einem vollen Monat" : `${sch.monate} vollen Monaten`}{" "}
              ({sch.genutzt.map((m) => monatKurz(m.monat)).join(", ")})
            </p>
            {!sch.belastbar && (
              <p className="mt-3 rounded-lg bg-gold-hell p-4 text-sm leading-relaxed text-tinte2">
                Noch {plural(sch.ziel - sch.monate, "Monat", "Monate")} bis der Wert belastbar
                ist. Ein einzelner Monat enthält fast immer einen Ausreißer, den man erst im
                Vergleich als solchen erkennt.
              </p>
            )}
          </>
        )}

        {/* Drei Kästchen als Fortschritt */}
        <div className="mt-5 flex gap-2">
          {Array.from({ length: sch.ziel }, (_, i) => (
            <div
              key={i}
              className={`h-2.5 flex-1 rounded-full ${i < fs.volleMonate ? "bg-rot" : "bg-papier"}`}
              aria-hidden
            />
          ))}
        </div>

        {sch.wert !== undefined && (
          <div className="mt-6 border-t border-linie pt-5">
            {uebernommen ? (
              <p className="text-sm leading-relaxed text-gruen">
                Übernommen. Notgroschen-Ziel und Cockpit rechnen mit {euro(sch.wert)}.
              </p>
            ) : (
              <>
                <p className="text-sm leading-relaxed text-tinte2">
                  {daten.nettomonatsausgaben
                    ? `Aktuell rechnen Notgroschen und Cockpit mit ${euro(daten.nettomonatsausgaben)}.`
                    : "Notgroschen und Cockpit rechnen noch mit gar nichts."}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setDaten((d) => ({
                      ...d,
                      nettomonatsausgaben: Math.round(sch.wert!),
                    }))
                  }
                  className="mt-3 rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gruen-tief"
                >
                  Als Nettomonatsausgaben übernehmen
                </button>
              </>
            )}
          </div>
        )}
      </section>

      {/* ───────────────────────────── Auswertung */}
      {monate.length > 0 && (
        <section className="mt-6 rounded-xl border border-linie bg-flaeche p-6">
          <h2 className="text-xl">Monate im Vergleich</h2>
          <div className="mt-5 space-y-2.5">
            {monate.map((m) => {
              const max = Math.max(...monate.map((x) => x.summe));
              const laufend = m.monat === laufenderMonat();
              return (
                <button
                  key={m.monat}
                  type="button"
                  onClick={() => setGewaehlt(m.monat)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="w-20 shrink-0 text-sm text-tinte2">{monatKurz(m.monat)}</span>
                  <span
                    className={`h-6 flex-1 overflow-hidden rounded bg-papier ${
                      m.monat === aktuell ? "ring-2 ring-tinte ring-offset-1" : ""
                    }`}
                  >
                    <span
                      className={`block h-full rounded ${laufend ? "bg-linie2" : "bg-rot"}`}
                      style={{ width: `${Math.max(2, (m.summe / max) * 100)}%` }}
                    />
                  </span>
                  <span className="tabular w-24 shrink-0 text-right text-sm font-semibold">
                    {euro(m.summe, false)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-tinte3">
            Grau: der laufende Monat, noch nicht abgeschlossen. Zum Aufschlüsseln antippen.
          </p>

          {monatsWert && (
            <div className="mt-7 border-t border-linie pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="text-lg">{monatName(monatsWert.monat)}</h3>
                <p className="tabular font-serif text-xl font-bold text-rot">
                  {euro(monatsWert.summe)}
                </p>
              </div>
              <div className="mt-5 space-y-4">
                {monatsWert.proKategorie.map((k) => (
                  <div key={k.kategorie}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-tinte2">{k.kategorie}</span>
                      <span className="tabular shrink-0 font-semibold text-tinte">
                        {euro(k.summe, false)}
                        <span className="ml-2 font-normal text-tinte3">
                          {Math.round((k.summe / monatsWert.summe) * 100)} %
                        </span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-papier">
                      <div
                        className="h-full rounded-full bg-rot/70"
                        style={{ width: `${(k.summe / monatsWert.summe) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ───────────────────────────── Einträge */}
      {tage.length > 0 && (
        <section className="mt-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xl">Alle Einträge</h2>
            <button
              type="button"
              onClick={() => {
                // Excel auf Deutsch: Semikolon, Dezimalkomma, UTF-8 mit BOM.
                const blob = new Blob([alsCsv(daten.ausgaben, daten.dauerausgaben)], {
                  type: "text/csv;charset=utf-8",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `ausgaben-${new Date().toISOString().slice(0, 10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="kein-druck rounded-lg border border-linie2 px-4 py-2 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
            >
              Als CSV für Excel
            </button>
          </div>
          <div className="mt-5 space-y-5">
            {(alleZeigen ? tage : tage.slice(0, TAGE_KURZ)).map((t) => (
              <div key={t.datum} className="rounded-xl border border-linie bg-flaeche">
                <div className="flex items-baseline justify-between border-b border-linie px-5 py-3">
                  <p className="text-sm font-semibold text-tinte">{fdatum(t.datum)}</p>
                  <p className="tabular text-sm text-tinte2">{euro(t.summe)}</p>
                </div>
                <ul className="divide-y divide-linie">
                  {t.eintraege.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-tinte">{a.kategorie}</span>
                        {a.notiz && (
                          <span className="block text-xs text-tinte3">{a.notiz}</span>
                        )}
                      </span>
                      <span className="tabular shrink-0 text-sm font-semibold">{euro(a.betrag)}</span>
                      <button
                        type="button"
                        onClick={() => entferne(a.id)}
                        aria-label={`${a.kategorie} über ${euro(a.betrag)} löschen`}
                        className="kein-druck shrink-0 rounded-md border border-linie2 px-2.5 py-1 text-xs text-tinte3 transition-colors hover:border-rot hover:text-rot"
                      >
                        Löschen
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {tage.length > TAGE_KURZ && (
            <button
              type="button"
              onClick={() => setAlleZeigen((x) => !x)}
              className="kein-druck mt-5 w-full rounded-lg border border-linie2 px-5 py-3 text-sm font-semibold text-tinte2 transition-colors hover:border-gruen hover:text-gruen"
            >
              {alleZeigen
                ? "Weniger anzeigen"
                : `Alle ${tage.length} Tage anzeigen`}
            </button>
          )}
        </section>
      )}

      {daten.ausgaben.length === 0 && daten.dauerausgaben.length === 0 && (
        <section className="mt-6 rounded-xl border border-gold/50 bg-gold-hell p-6">
          <p className="font-serif text-lg font-bold text-gold">Noch kein Eintrag</p>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-tinte2">
            Fang einfach beim nächsten Einkauf an. Es muss nicht rückwirkend sein und nicht
            vollständig sein – es muss nur laufen. Warum das die wichtigste Übung ist, steht in
            Kapitel 3.
          </p>
          <Link
            href="/methode/ausgaben"
            className="mt-4 inline-block text-sm font-semibold text-gold underline"
          >
            Kapitel 3 lesen
          </Link>
        </section>
      )}
    </div>
  );
}
