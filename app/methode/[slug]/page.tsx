import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Bloecke from "@/components/Bloecke";
import { KAPITEL, kapitelNach, nachbarn } from "@/lib/kapitel";

export function generateStaticParams() {
  return KAPITEL.map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const k = kapitelNach(slug);
  if (!k) return {};
  return { title: `${k.titel}`, description: k.kurz };
}

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

export default async function Seite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const k = kapitelNach(slug);
  if (!k) notFound();
  const { vorher, nachher } = nachbarn(slug);
  const mehrereAbschnitte = k.abschnitte.length > 1;

  return (
    <article className="mx-auto max-w-5xl px-5 py-12">
      <Link href="/methode" className="text-sm text-tinte2 transition-colors hover:text-gruen">
        ← Alle Kapitel
      </Link>

      <header className="mt-5 border-b border-linie pb-9">
        <p className={`eyebrow ${TEXT[k.ton]}`}>Kapitel {String(k.nr).padStart(2, "0")}</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">{k.titel}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">{k.kurz}</p>
      </header>

      {/* Sprungmarken – nur wenn es wirklich mehrere Abschnitte gibt. */}
      {mehrereAbschnitte && (
        <nav className="kein-druck mt-8 flex flex-wrap gap-2" aria-label="Abschnitte">
          {k.abschnitte.map((a, i) => (
            <a
              key={i}
              href={`#a${i}`}
              className="rounded-lg border border-linie bg-flaeche px-3.5 py-2 text-sm text-tinte2 transition-colors hover:border-linie2 hover:text-tinte"
            >
              {a.titel}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-12 space-y-16">
        {k.abschnitte.map((a, i) => (
          <section key={i} id={`a${i}`} className="scroll-mt-24">
            <div className="mb-7 flex items-center gap-3">
              <span className={`h-5 w-1 rounded-full ${BALKEN[k.ton]}`} aria-hidden />
              <h2 className="text-2xl">{a.titel}</h2>
            </div>
            <Bloecke bloecke={a.bloecke} />
          </section>
        ))}
      </div>

      {/* Weiterblättern */}
      <nav className="kein-druck mt-16 grid gap-4 border-t border-linie pt-8 sm:grid-cols-2">
        {vorher ? (
          <Link
            href={`/methode/${vorher.slug}`}
            className="rounded-xl border border-linie bg-flaeche p-5 transition-colors hover:border-linie2"
          >
            <span className="eyebrow text-tinte3">← Kapitel {vorher.nr}</span>
            <span className="mt-2 block font-serif text-lg font-bold text-tinte">
              {vorher.titel}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {nachher ? (
          <Link
            href={`/methode/${nachher.slug}`}
            className="rounded-xl border border-linie bg-flaeche p-5 text-right transition-colors hover:border-linie2"
          >
            <span className="eyebrow text-tinte3">Kapitel {nachher.nr} →</span>
            <span className="mt-2 block font-serif text-lg font-bold text-tinte">
              {nachher.titel}
            </span>
          </Link>
        ) : (
          <Link
            href="/kontensystem"
            className="rounded-xl border border-gruen/40 bg-gruen-hell p-5 text-right transition-colors hover:border-gruen"
          >
            <span className="eyebrow text-gruen">Und jetzt →</span>
            <span className="mt-2 block font-serif text-lg font-bold text-gruen-tief">
              Dein eigenes Kontensystem
            </span>
          </Link>
        )}
      </nav>
    </article>
  );
}
