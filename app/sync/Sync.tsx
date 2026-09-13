"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { datum as fdatum } from "@/lib/format";
import { laden, speichern } from "@/lib/store";
import {
  ableiten,
  blockAusStand,
  ablegen,
  holen,
  loeschenAufServer,
  neuerIst,
  neuerSatz,
  normalisiere,
  standAusBlock,
  syncstand,
  syncstandSetzen,
  type Syncstand,
} from "@/lib/sync";

type Schritt = "start" | "neu" | "verbinden" | "arbeitet";

export default function Sync() {
  const [stand, setStand] = useState<Syncstand | null>(null);
  const [bereit, setBereit] = useState(false);
  const [schritt, setSchritt] = useState<Schritt>("start");
  const [satz, setSatz] = useState("");
  const [bestaetigt, setBestaetigt] = useState(false);
  const [meldung, setMeldung] = useState<string | null>(null);
  const [kopiert, setKopiert] = useState(false);

  useEffect(() => {
    setStand(syncstand());
    setBereit(true);
    const h = () => setStand(syncstand());
    window.addEventListener("finanzcockpit:sync", h);
    return () => window.removeEventListener("finanzcockpit:sync", h);
  }, []);

  async function einrichten(eigenerSatz: string, modus: "neu" | "verbinden") {
    const s = normalisiere(eigenerSatz);
    if (s.split(" ").length < 4) {
      setMeldung("Der Satz sollte mindestens vier Wörter haben.");
      return;
    }
    setSchritt("arbeitet");
    setMeldung(null);
    try {
      const { kennung, schluessel } = await ableiten(s);
      const fern = await holen(kennung);
      const lokal = laden();

      if (modus === "neu" && fern) {
        // Sehr unwahrscheinlich bei sechs zufaelligen Woertern - aber moeglich bei eigenen.
        setMeldung("Unter diesem Satz liegt schon etwas. Wähle einen anderen – oder nutze „Verbinden“, wenn es dein eigener Stand ist.");
        setSchritt(modus);
        return;
      }

      if (fern) {
        const fremd = await standAusBlock(schluessel, fern.block);
        if (!fremd) {
          setMeldung("Unter diesem Satz liegt ein Block, der sich damit nicht öffnen lässt. Tippfehler?");
          setSchritt("verbinden");
          return;
        }
        const lokalHatEtwas = lokal.bilanz.length > 0 || lokal.ausgaben.length > 0;
        if (lokalHatEtwas && neuerIst(lokal, fremd)) {
          // Beide Seiten haben etwas, unseres ist neuer: hochladen, nicht ueberschreiben lassen.
          const block = await blockAusStand(schluessel, lokal);
          const e = await ablegen(kennung, block, fern.version);
          syncstandSetzen({ kennung, schluessel, version: e.ok ? e.version : fern.version, zuletzt: new Date().toISOString() });
          setMeldung("Verbunden. Dein Stand auf diesem Gerät war neuer und liegt jetzt auch auf dem Server.");
        } else {
          speichern(fremd, { stempel: false, still: true });
          syncstandSetzen({ kennung, schluessel, version: fern.version, zuletzt: new Date().toISOString() });
          setMeldung("Verbunden. Der Stand vom anderen Gerät ist jetzt hier.");
          window.setTimeout(() => window.location.reload(), 900);
        }
      } else {
        const block = await blockAusStand(schluessel, lokal);
        const e = await ablegen(kennung, block, 0);
        if (!e.ok) throw new Error("Hochladen hat nicht geklappt.");
        syncstandSetzen({ kennung, schluessel, version: e.version, zuletzt: new Date().toISOString() });
        setMeldung(modus === "neu" ? "Eingerichtet. Dein Stand liegt verschlüsselt auf dem Server." : "Verbunden – auf dem Server lag noch nichts, dein Stand ist jetzt dort.");
      }
      setSchritt("start");
      setSatz("");
      setBestaetigt(false);
    } catch (e) {
      setMeldung(e instanceof Error ? e.message : "Das hat nicht geklappt.");
      setSchritt(modus);
    }
  }

  async function trennen(auchServer: boolean) {
    const s = syncstand();
    if (!s) return;
    if (auchServer) {
      if (!confirm("Den verschlüsselten Block auf dem Server löschen? Deine Daten auf diesem Gerät bleiben.")) return;
      await loeschenAufServer(s.kennung);
    }
    syncstandSetzen(null);
    setMeldung(auchServer ? "Getrennt und auf dem Server gelöscht." : "Getrennt. Auf dem Server liegt der letzte Stand weiterhin – andere Geräte können ihn noch holen.");
  }

  const kopf = (
    <header>
      <p className="eyebrow text-gruen">Sync</p>
      <h1 className="mt-2.5 text-3xl sm:text-4xl">Dieselben Daten auf Handy und Laptop</h1>
      <p className="mt-4 max-w-2xl leading-relaxed text-tinte2">
        Ohne Konto, ohne E-Mail. Du merkst dir einen Satz. Daraus rechnet dein Browser einen
        Schlüssel, verschlüsselt deinen Stand und legt den unlesbaren Block ab. Auf dem anderen
        Gerät denselben Satz eingeben – fertig.
      </p>
    </header>
  );

  if (!bereit) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-10">
        {kopf}
        <p className="mt-8 text-tinte3">Lädt …</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      {kopf}

      {meldung && (
        <p role="status" className="mt-6 rounded-lg border border-gold/50 bg-gold-hell p-4 text-sm leading-relaxed text-tinte">
          {meldung}
        </p>
      )}

      {stand ? (
        <section className="mt-8 rounded-xl border border-gruen/40 bg-gruen-hell p-6">
          <p className="eyebrow text-gruen">Verbunden</p>
          <p className="mt-2 font-serif text-xl">Dieses Gerät gleicht ab.</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-tinte3">Zuletzt abgeglichen</dt>
              <dd className="mt-0.5 text-tinte">{stand.zuletzt ? new Date(stand.zuletzt).toLocaleString("de-DE") : "noch nicht"}</dd>
            </div>
            <div>
              <dt className="text-tinte3">Stand auf dem Server</dt>
              <dd className="mt-0.5 text-tinte">Version {stand.version}</dd>
            </div>
          </dl>
          {stand.fehler && (
            <p className="mt-4 rounded-lg bg-rot-hell p-3 text-sm text-rot">
              Zuletzt ging etwas schief: {stand.fehler}. Beim nächsten Speichern wird es erneut versucht.
            </p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-tinte2">
            Auf dem anderen Gerät: diese Seite öffnen, „Verbinden“, denselben Satz eingeben. Der Satz
            wird hier nirgends angezeigt – wer ihn nicht aufgeschrieben hat, richtet einfach einen neuen ein.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => trennen(false)} className="rounded-lg border border-linie2 px-4 py-2 text-sm font-semibold text-tinte transition-colors hover:border-tinte">
              Auf diesem Gerät trennen
            </button>
            <button type="button" onClick={() => trennen(true)} className="rounded-lg border border-linie2 px-4 py-2 text-sm font-semibold text-tinte3 transition-colors hover:border-rot hover:text-rot">
              Trennen und auf dem Server löschen
            </button>
          </div>
        </section>
      ) : schritt === "start" ? (
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              setSatz(neuerSatz());
              setSchritt("neu");
              setMeldung(null);
            }}
            className="rounded-xl border border-linie bg-flaeche p-6 text-left transition-colors hover:border-gruen"
          >
            <p className="eyebrow text-gruen">Erstes Gerät</p>
            <p className="mt-2 font-serif text-xl">Sync einrichten</p>
            <p className="mt-2 text-sm leading-relaxed text-tinte2">
              Du bekommst einen Satz aus sechs Wörtern. Aufschreiben, dann auf dem zweiten Gerät eingeben.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              setSatz("");
              setSchritt("verbinden");
              setMeldung(null);
            }}
            className="rounded-xl border border-linie bg-flaeche p-6 text-left transition-colors hover:border-gruen"
          >
            <p className="eyebrow text-blau">Weiteres Gerät</p>
            <p className="mt-2 font-serif text-xl">Verbinden</p>
            <p className="mt-2 text-sm leading-relaxed text-tinte2">
              Du hast den Satz schon von einem anderen Gerät. Hier eingeben, und der Stand kommt herüber.
            </p>
          </button>
        </div>
      ) : schritt === "arbeitet" ? (
        <p className="mt-8 text-tinte3">Schlüssel wird abgeleitet und abgeglichen … das dauert einen Moment.</p>
      ) : schritt === "neu" ? (
        <section className="mt-8 rounded-xl border border-linie bg-flaeche p-6">
          <p className="eyebrow text-gruen">Dein Sync-Satz</p>
          <p className="mt-3 rounded-lg border border-gold bg-gold-hell px-5 py-4 font-serif text-2xl leading-snug text-tinte">
            {satz}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(satz);
                  setKopiert(true);
                  window.setTimeout(() => setKopiert(false), 2000);
                } catch {
                  /* dann eben abschreiben */
                }
              }}
              className="rounded-lg border border-linie2 px-4 py-2 text-sm font-semibold text-tinte transition-colors hover:border-gruen hover:text-gruen"
            >
              {kopiert ? "Kopiert" : "Kopieren"}
            </button>
            <button type="button" onClick={() => setSatz(neuerSatz())} className="rounded-lg border border-linie2 px-4 py-2 text-sm text-tinte2 transition-colors hover:border-tinte">
              Anderen Satz
            </button>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-tinte2">
            Schreib ihn auf oder leg ihn in deinen Passwort-Manager. <strong>Er wird nirgends
            gespeichert und lässt sich nicht wiederherstellen.</strong> Ohne ihn kommt niemand an den
            Block – auch wir nicht. Deine Daten auf diesem Gerät bleiben davon unberührt.
          </p>
          <label className="mt-5 flex items-start gap-3 text-sm text-tinte">
            <input type="checkbox" checked={bestaetigt} onChange={(e) => setBestaetigt(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--color-gruen)]" />
            Ich habe den Satz aufgeschrieben.
          </label>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!bestaetigt}
              onClick={() => einrichten(satz, "neu")}
              className="rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gruen-tief disabled:cursor-not-allowed disabled:opacity-40"
            >
              Einrichten und hochladen
            </button>
            <button type="button" onClick={() => setSchritt("start")} className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-tinte">
              Abbrechen
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-8 rounded-xl border border-linie bg-flaeche p-6">
          <label className="block">
            <span className="eyebrow mb-2 block text-blau">Sync-Satz vom anderen Gerät</span>
            <input
              value={satz}
              onChange={(e) => setSatz(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") einrichten(satz, "verbinden");
              }}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="sechs wörter mit leerzeichen"
              className="w-full rounded-lg border border-linie2 bg-papier px-4 py-3 font-serif text-lg outline-none focus:border-gruen"
            />
          </label>
          <p className="mt-3 text-sm leading-relaxed text-tinte2">
            Groß- und Kleinschreibung spielen keine Rolle. Liegt auf diesem Gerät schon etwas, gewinnt
            der neuere Stand – nichts wird stillschweigend überschrieben, was jünger ist.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => einrichten(satz, "verbinden")} className="rounded-lg bg-gruen px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gruen-tief">
              Verbinden
            </button>
            <button type="button" onClick={() => setSchritt("start")} className="rounded-lg border border-linie2 px-5 py-2.5 text-sm font-semibold text-tinte transition-colors hover:border-tinte">
              Abbrechen
            </button>
          </div>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-linie bg-flaeche p-6 text-sm leading-relaxed text-tinte2">
        <h2 className="text-lg text-tinte">Was auf dem Server liegt – und was nicht</h2>
        <ul className="mt-3 space-y-2">
          <li>Ein Block aus Zufallszeichen unter einer Kennung aus Zufallszeichen. Beides ist aus deinem Satz abgeleitet, keines lässt sich zurückrechnen.</li>
          <li>Keine E-Mail, kein Name, kein Konto, keine Zahl im Klartext. Es gibt nichts, was wir verlieren oder herausgeben könnten.</li>
          <li>Verschlüsselt wird auf deinem Gerät (AES-256, Schlüssel aus 600.000 Ableitungsrunden). Der Server bei Cloudflare in der EU sieht nur das Ergebnis.</li>
          <li>Wer zuletzt gespeichert hat, gewinnt. Für zwei Geräte einer Person reicht das; gleichzeitiges Tippen auf beiden ist der eine Fall, in dem etwas untergehen kann.</li>
        </ul>
        <p className="mt-4">
          <Link href="/cockpit" className="font-semibold text-gruen underline">Zurück zum Cockpit</Link>
        </p>
      </section>
    </div>
  );
}
