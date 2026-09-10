"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { type Daten, type Hinweis, LEER, laden, speichern } from "@/lib/store";

const ART: Record<Hinweis["art"], { label: string; farbe: string; flaeche: string }> = {
  fehler: { label: "Fehler", farbe: "text-rot", flaeche: "bg-rot-hell" },
  wunsch: { label: "Verbesserung", farbe: "text-blau", flaeche: "bg-blau-hell" },
  frage: { label: "Frage", farbe: "text-gold", flaeche: "bg-gold-hell" },
};

function zeit(iso: string) {
  return new Date(iso).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Als Text, den man in eine Mail oder einen Chat kippen kann. */
function alsText(liste: Hinweis[]): string {
  const zeilen = liste.map(
    (h) =>
      `- [${ART[h.art].label}${h.erledigt ? ", erledigt" : ""}] ${h.seite ?? "–"} · ${zeit(h.datum)}\n  ${h.text.replace(/\n/g, "\n  ")}`,
  );
  return `Anmerkungen zu "Vom Gehalt zum Vermögen"\nStand: ${new Date().toLocaleString("de-DE")}\n${liste.length} Einträge\n\n${zeilen.join("\n\n")}\n`;
}

export default function Hinweise() {
  const [daten, setDaten] = useState<Daten>(LEER);
  const [bereit, setBereit] = useState(false);
  const [filter, setFilter] = useState<"alle" | Hinweis["art"]>("alle");
  const [kopiert, setKopiert] = useState(false);

  useEffect(() => {
    setDaten(laden());
    setBereit(true);
  }, []);

  useEffect(() => {
    if (bereit) speichern(daten);
  }, [daten, bereit]);

  const liste = useMemo(
    () =>
      [...daten.hinweise]
        .filter((h) => filter === "alle" || h.art === filter)
        .sort((a, b) => b.datum.localeCompare(a.datum)),
    [daten.hinweise, filter],
  );

  const offen = daten.hinweise.filter((h) => !h.erledigt).length;

  function umschalten(id: string) {
    setDaten((d) => ({
      ...d,
      hinweise: d.hinweise.map((h) => (h.id === id ? { ...h, erledigt: !h.erledigt } : h)),
    }));
  }

  function entferne(id: string) {
    setDaten((d) => ({ ...d, hinweise: d.hinweise.filter((h) => h.id !== id) }));
  }

  async function kopieren() {
    try {
      await navigator.clipboard.writeText(alsText(daten.hinweise));
      setKopiert(true);
      window.setTimeout(() => setKopiert(false), 2500);
    } catch {
      alert("Kopieren hat nicht geklappt. Nutz stattdessen „Als Datei sichern“.");
    }
  }

  function sichern() {
    const blob = new Blob([alsText(daten.hinweise)], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anmerkungen-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!bereit) {
    return <div className="mx-auto max-w-3xl px-5 py-20 text-tinte3">Lade deine Daten …</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <header>
        <p className="eyebrow text-gruen">Anmerkungen</p>
        <h1 className="mt-2.5 text-3xl sm:text-4xl">Was dir aufgefallen ist</h1>
        <p className="mt-4 leading-relaxed text-tinte2">
          Der Stift unten rechts notiert von jeder Seite aus – samt der Seite, auf der du gerade
          warst. Hier stehen die Notizen zum Durchgehen und Weitergeben.
        </p>
        <p className="mt-3 text-sm text-tinte3">
          Die Liste liegt in deinem Browser. Sie wird nirgends automatisch verschickt: Zum
          Weitergeben kopierst du sie oder lädst sie als Datei herunter.
        </p>
      </header>

      {daten.hinweise.length === 0 ? (
        <div className="mt-9 rounded-xl border border-dashed border-linie2 p-8 text-center">
          <p className="text-tinte2">Noch keine Anmerkung notiert.</p>
          <p className="mt-2 text-sm leading-relaxed text-tinte3">
            Der Knopf „Anmerkung“ liegt auf jeder Seite unten rechts. Wenn beim Ausprobieren etwas
            hakt, unklar ist oder fehlt: kurz hineinschreiben und weitermachen.
          </p>
          <Link
            href="/cockpit"
            className="mt-5 inline-block rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
          >
            Weiter ausprobieren
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {(["alle", "fehler", "wunsch", "frage"] as const).map((f) => {
              const anzahl =
                f === "alle"
                  ? daten.hinweise.length
                  : daten.hinweise.filter((h) => h.art === f).length;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  aria-pressed={filter === f}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    filter === f
                      ? "border-tinte bg-tinte text-white"
                      : "border-linie2 text-tinte2 hover:border-tinte hover:text-tinte"
                  }`}
                >
                  {f === "alle" ? "Alle" : ART[f].label} ({anzahl})
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-tinte2">
            {offen} von {daten.hinweise.length} noch offen.
          </p>

          <ul className="mt-6 space-y-3">
            {liste.map((h) => (
              <li
                key={h.id}
                className={`rounded-xl border border-linie p-5 ${
                  h.erledigt ? "bg-papier" : ART[h.art].flaeche
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => umschalten(h.id)}
                    aria-pressed={!!h.erledigt}
                    aria-label={`${h.text.slice(0, 40)} als erledigt markieren`}
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 text-sm font-bold transition-colors ${
                      h.erledigt
                        ? "border-gruen bg-gruen text-white"
                        : "border-linie2 text-transparent hover:border-gruen"
                    }`}
                  >
                    {h.erledigt ? "✓" : ""}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className={`eyebrow ${ART[h.art].farbe}`}>{ART[h.art].label}</span>
                      {h.seite && (
                        <Link
                          href={h.seite}
                          className="text-xs text-tinte2 underline transition-colors hover:text-gruen"
                        >
                          {h.seite}
                        </Link>
                      )}
                      <span className="text-xs text-tinte3">{zeit(h.datum)}</span>
                    </div>
                    <p
                      className={`mt-2 whitespace-pre-wrap leading-relaxed ${
                        h.erledigt ? "text-tinte3 line-through" : "text-tinte"
                      }`}
                    >
                      {h.text}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => entferne(h.id)}
                    aria-label="Anmerkung löschen"
                    className="kein-druck shrink-0 rounded-md border border-linie2 px-2.5 py-1 text-xs text-tinte3 transition-colors hover:border-rot hover:text-rot"
                  >
                    Löschen
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <section className="kein-druck mt-9 rounded-xl border border-linie bg-flaeche p-6">
            <h2 className="text-lg">Weitergeben</h2>
            <p className="mt-2 text-sm leading-relaxed text-tinte2">
              Kopieren und in eine Mail oder einen Chat einfügen – oder als Textdatei sichern und
              anhängen. Beides enthält nur die Anmerkungen, keine Finanzdaten.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={kopieren}
                className="rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
              >
                {kopiert ? "Kopiert" : "Alle kopieren"}
              </button>
              <button
                type="button"
                onClick={sichern}
                className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
              >
                Als Datei sichern
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Alle erledigten Anmerkungen entfernen?")) {
                    setDaten((d) => ({ ...d, hinweise: d.hinweise.filter((h) => !h.erledigt) }));
                  }
                }}
                className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte3 transition-colors hover:border-rot hover:text-rot"
              >
                Erledigte aufräumen
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
