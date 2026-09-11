"use client";

import { useEffect, useState } from "react";
import { beschaedigterStand, beschaedigtenStandVerwerfen } from "@/lib/store";

/**
 * Warnt, wenn der Browser nichts speichern kann – oder wenn ein alter Stand
 * unlesbar war.
 *
 * Die ganze App verspricht „bleibt auf deinem Gerät". Wenn das Gerät nicht
 * mitspielt (privater Modus, gesperrte Website-Daten, volle Ablage), muss das
 * sichtbar sein, bevor jemand eine Stunde Eingaben verliert.
 */
export default function Speicherhinweis() {
  const [lage, setLage] = useState<"gut" | "gesperrt" | "gerettet">("gut");
  const [weg, setWeg] = useState(false);

  useEffect(() => {
    try {
      const probe = "finanzcockpit.probe";
      window.localStorage.setItem(probe, "1");
      window.localStorage.removeItem(probe);
    } catch {
      setLage("gesperrt");
      return;
    }
    if (beschaedigterStand()) setLage("gerettet");
  }, []);

  if (lage === "gut" || weg) return null;

  const gesperrt = lage === "gesperrt";

  return (
    <div
      role="alert"
      className={`kein-druck border-b px-5 py-3 text-sm ${
        gesperrt ? "border-rot/30 bg-rot-hell text-tinte" : "border-gold/40 bg-gold-hell text-tinte"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-start gap-4">
        <p className="flex-1 leading-relaxed">
          {gesperrt ? (
            <>
              <span className="font-semibold text-rot">
                Dieser Browser speichert nichts.
              </span>{" "}
              Eingaben gehen verloren, sobald du den Tab schließt – meist liegt es am privaten
              Fenster oder an blockierten Website-Daten. Du kannst trotzdem rechnen; sichere
              wichtige Stände über „Als Datei sichern“.
            </>
          ) : (
            <>
              <span className="font-semibold text-gold">Ein alter Stand war unlesbar.</span> Er
              wurde nicht gelöscht, sondern beiseitegelegt – falls du ihn brauchst, meld dich.
              Weitermachen kannst du normal.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => {
            if (!gesperrt) beschaedigtenStandVerwerfen();
            setWeg(true);
          }}
          className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-tinte3 transition-colors hover:text-tinte"
          aria-label="Hinweis schließen"
        >
          ×
        </button>
      </div>
    </div>
  );
}
