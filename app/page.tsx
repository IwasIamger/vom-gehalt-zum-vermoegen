import Link from "next/link";

const gruende = [
  {
    nummer: "01",
    titel: "Inflation",
    zahl: "2,0 %",
    label: "EZB-Zielwert",
    text: "Geld auf dem Girokonto verliert jedes Jahr an Kaufkraft. Wer nicht investiert, verliert real – auch ohne etwas zu tun.",
    farbe: "text-gruen",
    strich: "bg-gruen",
  },
  {
    nummer: "02",
    titel: "Rentenlücke",
    zahl: "48 %",
    label: "Rentenniveau 2026",
    text: "Die gesetzliche Rente ersetzt nur einen Teil des letzten Nettoeinkommens. Der Rest muss privat kommen.",
    farbe: "text-blau",
    strich: "bg-blau",
  },
  {
    nummer: "03",
    titel: "Passives Einkommen",
    zahl: "∞",
    label: "Zeit statt Tausch",
    text: "Investiertes Geld arbeitet weiter, auch wenn du es nicht tust. Das schafft Wahlfreiheit – im Job und danach.",
    farbe: "text-rot",
    strich: "bg-rot",
  },
];

const schritte = [
  {
    nr: 1,
    titel: "Ausgaben tracken",
    text: "Drei Monate lang. Ergebnis: deine Nettomonatsausgaben – die Zahl, aus der alles Weitere folgt.",
  },
  {
    nr: 2,
    titel: "Vermögen bilanzieren",
    text: "Alles auflisten, was da ist: Konten, Depots, Verträge, Schulden.",
  },
  {
    nr: 3,
    titel: "Kontensystem einrichten",
    text: "Ein Hauptkonto als Drehscheibe, getrennte Konten für Notgroschen, Rücklagen und Urlaub.",
  },
  {
    nr: 4,
    titel: "Fahrplan festlegen",
    text: "Aufteilung, Sparrate, Zeitpunkt. Schriftlich, damit es verbindlich wird.",
  },
];

const werkzeuge = [
  { href: "/rechner/notgroschen", titel: "Notgroschen", text: "Wie viel Rücklage brauchst du wirklich?" },
  { href: "/rechner/sparrate", titel: "Sparrate", text: "Was bleibt am Ende des Monats übrig?" },
  { href: "/rechner/zinseszins", titel: "Zinseszins", text: "Was wird aus deiner Sparrate über die Jahre?" },
  { href: "/rechner/saveback", titel: "Saveback", text: "Was 1 % Cashback über 40 Jahre ausmacht." },
  { href: "/rechner/kosten", titel: "Kosten", text: "Was 1,3 % Gebührenunterschied kosten." },
  { href: "/rechner/inflation", titel: "Kaufkraft", text: "Was aus 100 € in zwanzig Jahren wird." },
];

export default function Start() {
  return (
    <>
      {/* Auftakt */}
      <section className="border-b border-linie bg-dunkel text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[1.15fr_1fr] md:py-28">
          <div>
            <p className="eyebrow text-[#7dc9a8]">Privater Vermögensaufbau</p>
            <h1 className="mt-5 text-4xl leading-[1.05] sm:text-5xl md:text-6xl">
              Vom Gehalt
              <br />
              <span className="text-[#6fd3a9]">zum Vermögen</span>
            </h1>
            <div className="mt-7 h-[3px] w-24 bg-gruen" />
            <p className="mt-7 max-w-lg text-lg leading-relaxed text-[#b9c7c2]">
              Ein Fahrplan von der ersten Sparrate bis zum eigenen Portfolio – rechnen, aufteilen,
              automatisieren.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/kontensystem"
                className="rounded-lg bg-gruen px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#256a43]"
              >
                Kontensystem einrichten
              </Link>
              <Link
                href="/methode"
                className="rounded-lg border border-[#3a4b45] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-dunkel2"
              >
                Erst die Methode ansehen
              </Link>
            </div>
          </div>

          <div className="self-center rounded-xl border border-[#2b3a34] bg-dunkel2 p-7">
            <p className="eyebrow text-[#7dc9a8]">Ohne Anmeldung</p>
            <p className="mt-4 font-serif text-2xl leading-snug">
              Alles bleibt auf deinem Gerät.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#9fb0aa]">
              Kein Konto, kein Upload, keine Weitergabe. Was du eingibst, speichert dein Browser –
              und nur dein Browser. Du kannst es jederzeit als Datei sichern oder löschen.
            </p>
            <p className="mt-5 border-t border-[#2b3a34] pt-5 text-sm leading-relaxed text-[#9fb0aa]">
              Kostenlos. Das Wissen soll weitergegeben werden, nicht verkauft.
            </p>
          </div>
        </div>
      </section>

      {/* Warum */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow text-gruen">Warum überhaupt</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">Drei Gründe, die sich gegenseitig verstärken</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {gruende.map((g) => (
            <article
              key={g.nummer}
              className="overflow-hidden rounded-xl border border-linie bg-flaeche"
            >
              <div className={`h-1.5 ${g.strich}`} />
              <div className="p-7">
                <p className="eyebrow text-tinte3">{g.nummer}</p>
                <h3 className="mt-3 text-xl">{g.titel}</h3>
                <p className={`mt-4 font-serif text-4xl font-bold ${g.farbe}`}>{g.zahl}</p>
                <p className="eyebrow mt-1.5 text-tinte3">{g.label}</p>
                <p className="mt-5 text-sm leading-relaxed text-tinte2">{g.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Methode */}
      <section className="border-y border-linie bg-flaeche">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow text-gruen">Die Methode</p>
          <h2 className="mt-3 text-3xl sm:text-4xl">Vier Schritte. In dieser Reihenfolge.</h2>
          <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">
            Die Reihenfolge ist kein Detail. Wer investiert, bevor der Notgroschen steht, muss im
            Notfall verkaufen – meist zum schlechtesten Zeitpunkt.
          </p>
          <ol className="mt-10 grid gap-5 md:grid-cols-4">
            {schritte.map((s) => (
              <li key={s.nr} className="rounded-xl border border-linie bg-papier p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gruen font-serif text-lg font-bold text-white">
                  {s.nr}
                </span>
                <h3 className="mt-4 text-lg leading-snug">{s.titel}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-tinte2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Werkzeuge */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow text-gruen">Werkzeuge</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">Rechnen statt schätzen</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">
          Jeder Rechner funktioniert sofort, ohne Anmeldung. Die Ergebnisse kannst du direkt in dein
          Kontensystem übernehmen.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {werkzeuge.map((w) => (
            <Link
              key={w.href}
              href={w.href}
              className="group rounded-xl border border-linie bg-flaeche p-6 transition-colors hover:border-gruen hover:bg-gruen-hell"
            >
              <h3 className="text-lg transition-colors group-hover:text-gruen-tief">{w.titel}</h3>
              <p className="mt-2 text-sm leading-relaxed text-tinte2">{w.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Abschluss */}
      <section className="border-t border-linie bg-dunkel text-white">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="max-w-xl text-3xl leading-snug sm:text-4xl">
            Fang klein an.
            <br />
            Aber fang an.
          </h2>
          <p className="mt-6 max-w-lg leading-relaxed text-[#b9c7c2]">
            Der erste Sparplan muss nicht der richtige sein. Er muss nur existieren.
          </p>
          <Link
            href="/kontensystem"
            className="mt-8 inline-block rounded-lg bg-gruen px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[#256a43]"
          >
            Jetzt anfangen
          </Link>
        </div>
      </section>
    </>
  );
}
