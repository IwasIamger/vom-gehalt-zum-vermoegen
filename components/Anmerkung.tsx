"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type Hinweis, laden, neuerHinweis, speichern } from "@/lib/store";

/**
 * Anmerkung erfassen – von jeder Seite aus.
 *
 * Beim Testen fällt etwas auf, und drei Klicks später ist es vergessen. Der
 * Knopf hängt deshalb überall und merkt sich selbst, auf welcher Seite man war.
 * Gespeichert wird lokal; verschickt wird nichts, solange niemand exportiert.
 */

const ARTEN: { id: Hinweis["art"]; label: string; hilfe: string }[] = [
  { id: "fehler", label: "Fehler", hilfe: "Etwas funktioniert nicht oder sieht kaputt aus." },
  { id: "wunsch", label: "Verbesserung", hilfe: "Etwas fehlt oder könnte besser sein." },
  { id: "frage", label: "Frage", hilfe: "Etwas ist unklar." },
];

export default function Anmerkung() {
  const pfad = usePathname();
  const [offen, setOffen] = useState(false);
  const [art, setArt] = useState<Hinweis["art"]>("fehler");
  const [text, setText] = useState("");
  const [gemerkt, setGemerkt] = useState(false);
  const feldRef = useRef<HTMLTextAreaElement>(null);

  // Auf der Übersicht selbst wäre der Knopf nur im Weg.
  const ausblenden = pfad.startsWith("/hinweise");

  useEffect(() => {
    if (offen) feldRef.current?.focus();
  }, [offen]);

  useEffect(() => {
    const zu = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOffen(false);
    };
    window.addEventListener("keydown", zu);
    return () => window.removeEventListener("keydown", zu);
  }, []);

  function sichern() {
    const inhalt = text.trim();
    if (!inhalt) {
      feldRef.current?.focus();
      return;
    }
    const daten = laden();
    speichern({
      ...daten,
      hinweise: [...daten.hinweise, neuerHinweis(art, inhalt, pfad)],
    });
    setText("");
    setOffen(false);
    setGemerkt(true);
    window.setTimeout(() => setGemerkt(false), 3500);
  }

  if (ausblenden) return null;

  return (
    <>
      {/* Bestätigung */}
      {gemerkt && (
        <div
          role="status"
          className="kein-druck fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-dunkel px-5 py-3 text-sm text-white shadow-lg sm:bottom-6"
        >
          Notiert.{" "}
          <Link href="/hinweise" className="underline">
            Alle Anmerkungen
          </Link>
        </div>
      )}

      {/* Knopf – über der Tableiste, damit er sie nicht verdeckt */}
      {!offen && (
        <button
          type="button"
          onClick={() => setOffen(true)}
          aria-label="Anmerkung zu dieser Seite notieren"
          className="kein-druck fixed right-4 bottom-20 z-40 flex h-12 touch-manipulation items-center gap-2 rounded-full border border-linie2 bg-flaeche px-4 text-sm font-semibold text-tinte2 shadow-md transition-colors select-none hover:border-gruen hover:text-gruen sm:right-6 sm:bottom-6"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          Anmerkung
        </button>
      )}

      {/* Eingabe */}
      {offen && (
        <div className="kein-druck fixed inset-0 z-50 flex items-end justify-center bg-dunkel/30 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Anmerkung notieren"
            className="w-full max-w-lg rounded-xl border border-linie bg-flaeche p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow text-gruen">Anmerkung</p>
                <h2 className="mt-2 text-xl">Was ist dir aufgefallen?</h2>
              </div>
              <button
                type="button"
                onClick={() => setOffen(false)}
                aria-label="Schließen"
                className="-mt-1 rounded-md px-2 py-1 text-2xl leading-none text-tinte3 transition-colors hover:text-tinte"
              >
                ×
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {ARTEN.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setArt(a.id)}
                  aria-pressed={art === a.id}
                  title={a.hilfe}
                  className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    art === a.id
                      ? "border-gruen bg-gruen text-white"
                      : "border-linie2 text-tinte2 hover:border-gruen hover:text-gruen"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <p className="mt-2.5 text-xs text-tinte3">
              {ARTEN.find((a) => a.id === art)?.hilfe}
            </p>

            <textarea
              ref={feldRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) sichern();
              }}
              rows={4}
              placeholder="So genau wie möglich: Was hast du gemacht, was hast du erwartet, was ist passiert?"
              className="mt-4 w-full resize-y rounded-md border border-linie2 bg-papier px-3.5 py-3 text-sm leading-relaxed outline-none focus:border-gruen"
            />

            <p className="mt-2 text-xs text-tinte3">
              Wird zu dieser Seite gespeichert: <span className="text-tinte2">{pfad}</span>. Bleibt
              auf deinem Gerät, bis du die Liste exportierst.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/hinweise"
                className="text-sm text-tinte2 underline transition-colors hover:text-gruen"
              >
                Bisherige Anmerkungen
              </Link>
              <button
                type="button"
                onClick={sichern}
                className="rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gruen-tief"
              >
                Notieren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
