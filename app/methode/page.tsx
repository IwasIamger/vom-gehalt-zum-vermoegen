import type { Metadata } from "next";
import Link from "next/link";
import { KAPITEL } from "@/lib/kapitel";

export const metadata: Metadata = {
  title: "Die Methode",
  description:
    "Die zehn Kapitel: warum investieren, wie viel geht, Ausgaben, Reihenfolge, Anlageklassen, Portfolio, Kosten, Steuern, Fehler, ein echtes Setup.",
};

const BALKEN: Record<string, string> = {
  gruen: "bg-gruen",
  blau: "bg-blau",
  rot: "bg-rot",
  gold: "bg-gold",
  neutral: "bg-tinte3",
};
const TEXT: Record<string, string> = {
  gruen: "text-gruen",
  blau: "text-blau",
  rot: "text-rot",
  gold: "text-gold",
  neutral: "text-tinte3",
};

export default function Seite() {
  const minuten = KAPITEL.reduce((s, k) => s + k.minuten, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <header className="max-w-2xl">
        <p className="eyebrow text-gruen">Die Methode</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">Kapitel für Kapitel</h1>
        <p className="mt-5 leading-relaxed text-tinte2">
          Der komplette Vortrag zum Nachlesen – von der Frage, warum investieren überhaupt nötig
          ist, bis zu einem echten Setup mit echten Konten. Jedes Kapitel endet dort, wo du selbst
          rechnen kannst.
        </p>
        <p className="mt-4 text-sm text-tinte3">
          {KAPITEL.length} Kapitel · rund {minuten} Minuten Lesezeit
        </p>
      </header>

      <ol className="mt-12 space-y-3">
        {KAPITEL.map((k) => (
          <li key={k.slug}>
            <Link
              href={`/methode/${k.slug}`}
              className="group flex gap-5 overflow-hidden rounded-xl border border-linie bg-flaeche transition-colors hover:border-linie2"
            >
              <span className={`w-1.5 shrink-0 ${BALKEN[k.ton]}`} aria-hidden />
              <span className="flex flex-1 flex-wrap items-baseline gap-x-4 gap-y-2 py-5 pr-5">
                <span className={`tabular font-serif text-2xl font-bold ${TEXT[k.ton]}`}>
                  {String(k.nr).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-serif text-xl font-bold text-tinte transition-colors group-hover:text-gruen-tief">
                    {k.titel}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-tinte2">{k.kurz}</span>
                </span>
                <span className="shrink-0 text-xs text-tinte3">{k.minuten} Min.</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-xl border border-linie bg-flaeche p-6">
        <p className="text-sm leading-relaxed text-tinte2">
          Lieber gleich rechnen? Die sechs Rechner funktionieren auch ohne die Kapitel – und das
          Kontensystem bringt alle Zahlen an einer Stelle zusammen.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/rechner"
            className="rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
          >
            Zu den Rechnern
          </Link>
          <Link
            href="/kontensystem"
            className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
          >
            Zum Kontensystem
          </Link>
        </div>
      </div>
    </div>
  );
}
