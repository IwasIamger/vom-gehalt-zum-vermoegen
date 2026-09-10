import type { Metadata } from "next";
import Link from "next/link";
import { RECHNER } from "@/lib/rechner";

export const metadata: Metadata = {
  title: "Rechner",
  description:
    "Notgroschen, Sparrate, Zinseszins, Saveback, Kosten und Kaufkraft – kostenlos und ohne Anmeldung.",
};

export default function Uebersicht() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <p className="eyebrow text-gruen">Werkzeuge</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">Rechnen statt schätzen</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">
        Jeder Rechner läuft sofort, ohne Anmeldung. Nichts wird gespeichert oder übertragen –
        die Rechnung passiert in deinem Browser.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {RECHNER.map((r) => (
          <Link
            key={r.slug}
            href={`/rechner/${r.slug}`}
            className="group rounded-xl border border-linie bg-flaeche p-6 transition-colors hover:border-gruen hover:bg-gruen-hell"
          >
            <h2 className="text-xl transition-colors group-hover:text-gruen-tief">{r.titel}</h2>
            <p className="mt-2 text-sm leading-relaxed text-tinte2">{r.kurz}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
