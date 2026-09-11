import Link from "next/link";
import Marktdaten from "@/components/Marktdaten";
import type { Block, Ton } from "@/lib/kapitel";

const TEXT: Record<Ton, string> = {
  gruen: "text-gruen",
  blau: "text-blau",
  rot: "text-rot",
  gold: "text-gold",
  neutral: "text-tinte",
};
const RAND: Record<Ton, string> = {
  gruen: "border-gruen/40",
  blau: "border-blau/40",
  rot: "border-rot/40",
  gold: "border-gold/50",
  neutral: "border-linie",
};
const FLAECHE: Record<Ton, string> = {
  gruen: "bg-gruen-hell",
  blau: "bg-blau-hell",
  rot: "bg-rot-hell",
  gold: "bg-gold-hell",
  neutral: "bg-flaeche",
};
const BALKEN: Record<Ton, string> = {
  gruen: "bg-gruen",
  blau: "bg-blau",
  rot: "bg-rot",
  gold: "bg-gold",
  neutral: "bg-tinte3",
};

export default function Bloecke({ bloecke }: { bloecke: Block[] }) {
  return (
    <div className="space-y-10">
      {bloecke.map((b, i) => (
        <Einzeln key={i} b={b} />
      ))}
    </div>
  );
}

function Einzeln({ b }: { b: Block }) {
  switch (b.art) {
    case "text":
      return <p className="max-w-2xl text-[17px] leading-relaxed text-tinte2">{b.inhalt}</p>;

    case "rendite":
      return (
        <div className="flex flex-wrap items-center gap-4">
          <div
            className={`rounded-lg px-5 py-3 ${FLAECHE[b.ton ?? "gruen"]} border ${RAND[b.ton ?? "gruen"]}`}
          >
            <span className={`eyebrow mr-3 ${TEXT[b.ton ?? "gruen"]}`}>Rendite</span>
            <span className={`font-serif text-xl font-bold ${TEXT[b.ton ?? "gruen"]}`}>{b.wert}</span>
          </div>
          {b.hinweis && <p className="max-w-md text-sm italic text-tinte2">{b.hinweis}</p>}
        </div>
      );

    case "kennzahlen":
      return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {b.werte.map((w, i) => (
            <div key={i} className="rounded-xl border border-linie bg-flaeche p-5">
              <p className={`tabular font-serif text-3xl font-bold ${TEXT[w.ton ?? "blau"]}`}>
                {w.zahl}
              </p>
              <p className="eyebrow mt-1.5 text-tinte3">{w.label}</p>
              {w.text && <p className="mt-3 text-sm leading-relaxed text-tinte2">{w.text}</p>}
            </div>
          ))}
        </div>
      );

    case "karten":
      return (
        <div className="grid gap-5 md:grid-cols-3">
          {b.karten.map((k, i) => (
            <article
              key={i}
              className="overflow-hidden rounded-xl border border-linie bg-flaeche"
            >
              <div className={`h-1.5 ${BALKEN[k.ton ?? "gruen"]}`} />
              <div className="p-6">
                {k.nummer && <p className="eyebrow text-tinte3">{k.nummer}</p>}
                <h3 className="mt-2 text-xl">{k.titel}</h3>
                {k.zahl && (
                  <p className={`mt-3 font-serif text-3xl font-bold ${TEXT[k.ton ?? "gruen"]}`}>
                    {k.zahl}
                  </p>
                )}
                <p className="mt-3 text-sm leading-relaxed text-tinte2">{k.text}</p>
              </div>
            </article>
          ))}
        </div>
      );

    case "liste":
      return (
        <ul className="max-w-2xl space-y-4">
          {b.punkte.map((p, i) => (
            <li key={i} className="flex gap-3">
              <span
                className={`mt-2 h-2 w-2 shrink-0 rounded-full ${BALKEN[b.ton ?? "gruen"]}`}
                aria-hidden
              />
              <div>
                <p className="font-semibold text-tinte">{p.titel}</p>
                {p.text && <p className="mt-1 text-sm leading-relaxed text-tinte2">{p.text}</p>}
              </div>
            </li>
          ))}
        </ul>
      );

    case "hinweis":
      return (
        <div
          className={`max-w-3xl rounded-xl border p-6 ${RAND[b.ton ?? "gold"]} ${FLAECHE[b.ton ?? "gold"]}`}
        >
          {b.titel && (
            <p className={`font-serif text-lg font-bold ${TEXT[b.ton ?? "gold"]}`}>{b.titel}</p>
          )}
          <p className="mt-2 leading-relaxed text-tinte2">{b.text}</p>
        </div>
      );

    case "balken": {
      const max = Math.max(...b.daten.map((d) => d.wert));
      return (
        <figure className="max-w-3xl rounded-xl border border-linie bg-flaeche p-6">
          {b.titel && <figcaption className="eyebrow mb-5 text-tinte3">{b.titel}</figcaption>}
          <div className="space-y-2.5">
            {b.daten.map((d, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-tinte2">{d.label}</span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-papier">
                  <div
                    className={`h-full rounded ${BALKEN[d.ton ?? "gruen"]}`}
                    style={{ width: `${Math.max(2, (d.wert / max) * 100)}%` }}
                  />
                </div>
                <span className="tabular w-16 shrink-0 text-right text-sm font-semibold">
                  {d.wert.toLocaleString("de-DE", {
                    minimumFractionDigits: Number.isInteger(d.wert) ? 0 : 1,
                    maximumFractionDigits: 1,
                  })}
                  {b.einheit ?? " %"}
                </span>
              </div>
            ))}
          </div>
          {b.quelle && <p className="mt-4 text-xs text-tinte3">{b.quelle}</p>}
        </figure>
      );
    }

    case "vergleich":
      return (
        <div className="grid gap-5 md:grid-cols-2">
          {b.spalten.map((s, i) => (
            <article key={i} className="overflow-hidden rounded-xl border border-linie bg-flaeche">
              <div className={`${BALKEN[s.ton]} px-6 py-4`}>
                <p className="font-serif text-xl font-bold text-white">{s.name}</p>
                {s.unter && <p className="text-sm text-white/80">{s.unter}</p>}
              </div>
              <div className="p-6">
                <p className={`font-serif text-3xl font-bold ${TEXT[s.ton]}`}>{s.zahl}</p>
                {s.zahlHinweis && <p className="text-xs text-tinte3">{s.zahlHinweis}</p>}
                <ul className="mt-4 space-y-2">
                  {s.zeilen.map((z, k) => (
                    <li key={k} className="flex items-start gap-2.5 text-sm">
                      <span
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                          z.gut ? "bg-gruen" : "bg-rot"
                        }`}
                        aria-hidden
                      >
                        {z.gut ? "✓" : "×"}
                      </span>
                      <span className={z.gut ? "text-tinte" : "text-tinte2"}>{z.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      );

    case "tabelle":
      return (
        <div className="max-w-4xl overflow-x-auto rounded-xl border border-linie bg-flaeche">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-linie">
                {b.kopf.map((k, i) => (
                  <th key={i} className="eyebrow px-5 py-3 text-tinte3">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.zeilen.map((z, i) => (
                <tr key={i} className="border-b border-linie last:border-0">
                  {z.map((c, k) => (
                    <td
                      key={k}
                      className={`px-5 py-3.5 align-top ${
                        k === 0 ? "font-semibold text-tinte" : "text-tinte2"
                      }`}
                    >
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "live":
      return <Marktdaten />;

    case "cta":
      return (
        <div className="max-w-3xl rounded-xl border border-linie bg-flaeche p-6">
          <p className="leading-relaxed text-tinte2">{b.text}</p>
          <Link
            href={b.href}
            className="mt-4 inline-block rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#256a43]"
          >
            {b.label}
          </Link>
        </div>
      );
  }
}
