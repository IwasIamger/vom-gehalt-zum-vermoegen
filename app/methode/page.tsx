import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Die Methode" };

export default function Seite() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-20">
      <p className="eyebrow text-gruen">Die Methode</p>
      <h1 className="mt-3 text-3xl sm:text-4xl">Kapitel für Kapitel</h1>
      <p className="mt-5 leading-relaxed text-tinte2">Warum investieren, wie viel geht überhaupt, welche Anlageklassen, Portfolio, Kosten, Steuern, die häufigsten Fehler. Die zehn Kapitel aus dem Vortrag – als Seiten zum Durchklicken, mit den Grafiken interaktiv statt statisch.</p>
      <div className="mt-8 rounded-xl border border-gold/50 bg-gold-hell p-6">
        <p className="eyebrow text-gold">In Arbeit</p>
        <p className="mt-2.5 text-sm leading-relaxed text-tinte2">
          Dieser Bereich wird gerade gebaut. Das Kontensystem ist bereits nutzbar.
        </p>
        <Link href="/kontensystem" className="mt-4 inline-block rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]">
          Zum Kontensystem
        </Link>
      </div>
    </div>
  );
}
