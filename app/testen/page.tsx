import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mittesten",
  description:
    "So probierst du die App aus und gibst Rückmeldung – in einer Viertelstunde, ohne Anmeldung, ohne Risiko für deine Daten.",
};

const schritte = [
  {
    nr: 1,
    titel: "Fünf Minuten Einstieg",
    text: "Fünf Fragen, dann steht dein Ausgangspunkt. Echte Zahlen sind besser als erfundene – sie bleiben ohnehin auf deinem Gerät.",
    href: "/start",
    label: "Einstieg starten",
  },
  {
    nr: 2,
    titel: "Eine Ausgabe erfassen",
    text: "Betrag, Kategorie, Enter. Trag außerdem zwei, drei feste Ausgaben ein – Miete, ein Abo. Dann siehst du, wie sich der Schnitt aufbaut.",
    href: "/ausgaben",
    label: "Ausgaben öffnen",
  },
  {
    nr: 3,
    titel: "Cockpit durchklicken",
    text: "Stand, Entwicklung, Plan, To-dos. Verstell die Regler in der Prognose. Bei Krypto: Coin und Menge eintragen statt Eurowert – der Kurs kommt von selbst.",
    href: "/cockpit",
    label: "Zum Cockpit",
  },
  {
    nr: 4,
    titel: "Ein Kapitel lesen",
    text: "Kapitel 4 (Reihenfolge) oder 9 (Wie weiter). Passen Sprache und Länge? Fehlt etwas, das du gebraucht hättest?",
    href: "/methode",
    label: "Zur Methode",
  },
  {
    nr: 5,
    titel: "Aufs Handy holen",
    text: "Im Browser „Zum Startbildschirm hinzufügen“ – dann läuft es wie eine App, auch ohne Netz. Probier den Dunkelmodus in der Fußzeile.",
  },
];

const fragen = [
  "Wo warst du kurz unsicher, was du tun sollst?",
  "Welche Zahl hast du nicht geglaubt – und warum?",
  "Was hast du gesucht und nicht gefunden?",
  "Was würdest du weglassen?",
  "Würdest du das nächste Woche noch einmal öffnen? Wenn nein: was müsste anders sein?",
];

export default function Seite() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <header>
        <p className="eyebrow text-gruen">Mittesten</p>
        <h1 className="mt-2.5 text-3xl sm:text-4xl">Eine Viertelstunde, dann weißt du Bescheid</h1>
        <p className="mt-4 leading-relaxed text-tinte2">
          Das hier ist eine Testfassung. Sie funktioniert vollständig – aber sie ist noch nicht
          fertig, und genau deshalb bist du hier. Alles, was du eingibst, bleibt in deinem Browser;
          es gibt keine Anmeldung und nichts wird hochgeladen.
        </p>
      </header>

      <ol className="mt-9 space-y-4">
        {schritte.map((s) => (
          <li key={s.nr} className="flex gap-4 rounded-xl border border-linie bg-flaeche p-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gruen font-serif text-base font-bold text-white">
              {s.nr}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg">{s.titel}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-tinte2">{s.text}</p>
              {s.href && (
                <Link
                  href={s.href}
                  className="mt-3 inline-block text-sm font-semibold text-gruen underline"
                >
                  {s.label}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>

      <section className="mt-10 rounded-xl border border-gold/50 bg-gold-hell p-6">
        <p className="eyebrow text-gold">Was mich interessiert</p>
        <ul className="mt-4 space-y-2.5">
          {fragen.map((f) => (
            <li key={f} className="flex gap-3 text-sm leading-relaxed text-tinte">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-xl border border-linie bg-flaeche p-6">
        <h2 className="text-lg">Und so kommt es bei mir an</h2>
        <p className="mt-2 text-sm leading-relaxed text-tinte2">
          Unten rechts auf jeder Seite liegt der Knopf <strong>„Anmerkung“</strong>. Sobald dir
          etwas auffällt – Fehler, Wunsch, Frage – hineinschreiben und weitermachen; die Seite,
          auf der du warst, wird mitgespeichert. Am Ende gehst du auf die Übersicht, drückst
          <strong> „Alle kopieren“</strong> und schickst mir den Text, wie es dir am leichtesten
          fällt. Die Liste enthält nur deine Anmerkungen, keine Finanzdaten.
        </p>
        <Link
          href="/hinweise"
          className="mt-4 inline-block rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gruen-tief"
        >
          Zu den Anmerkungen
        </Link>
      </section>

      <p className="mt-8 text-xs leading-relaxed text-tinte3">
        Keine Anlageberatung. Die Inhalte zeigen, wie eine Person es für sich macht, und dienen der
        Information. Vor eigenen Entscheidungen: selbst nachrechnen, im Zweifel beraten lassen.
      </p>
    </div>
  );
}
