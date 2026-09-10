/**
 * Local-first Speicher.
 *
 * Alles bleibt im Browser des Nutzers. Kein Konto, kein Server, keine
 * Datenschutz-Last. Sync und Bankanbindung kommen später als freiwillige
 * Aufsätze – dieselbe Datenform, nur ein anderer Adapter dahinter.
 */

const KEY = "finanzcockpit.v1";

export type Konto = {
  id: string;
  typ: "konto" | "depot" | "kategorie";
  name: string;
  bank?: string;
  betragMonat?: number;
  zielbetrag?: number;
  notiz?: string;
};

export type AnlagePosition = {
  id: string;
  name: string;
  anbieter?: string;
  betragMonat?: number;
  wert?: number;
  sollAnteil?: number;
  kaufdatum?: string;
};

export type Daten = {
  version: 1;
  aktualisiert: string;
  /** Kapitel 3: die Zahl, aus der fast alles andere folgt. */
  nettomonatsausgaben?: number;
  zufluesse: { gehalt?: number; rueckfluss?: number };
  konten: Konto[];
  anlagen: AnlagePosition[];
  einstellungen: {
    notgroschenMonate: number;
    renditeAnnahme: number;
    inflationAnnahme: number;
    kartenumsatzMonat?: number;
  };
};

export const LEER: Daten = {
  version: 1,
  aktualisiert: new Date().toISOString(),
  zufluesse: {},
  konten: [],
  anlagen: [],
  einstellungen: { notgroschenMonate: 4, renditeAnnahme: 0.07, inflationAnnahme: 0.02 },
};

/** Startbelegung nach dem Kontensystem aus dem Arbeitsblatt. */
export function vorlageKontensystem(): Daten {
  const k = (typ: Konto["typ"], name: string, notiz?: string): Konto => ({
    id: crypto.randomUUID(),
    typ,
    name,
    notiz,
  });
  return {
    ...LEER,
    aktualisiert: new Date().toISOString(),
    konten: [
      k("konto", "Hauptkonto", "Alles läuft hier durch."),
      k("konto", "Notgroschen", "Separat, jederzeit verfügbar."),
      k("konto", "Investitionen", "Verrechnungskonto vor den Depots."),
      k("kategorie", "Täglicher Bedarf", "Lebensmittel, Drogerie, Tanken."),
      k("kategorie", "Monatliche Fixkosten", "Abos, Versicherungen."),
      k("konto", "Dauerausgaben", "Quartals-, halb- und jährliche Posten."),
      k("konto", "Urlaub"),
    ],
    anlagen: [
      { id: crypto.randomUUID(), name: "ETF", sollAnteil: 0.8 },
      { id: crypto.randomUUID(), name: "Krypto", sollAnteil: 0.1 },
      { id: crypto.randomUUID(), name: "P2P", sollAnteil: 0.1 },
    ],
  };
}

export function laden(): Daten {
  if (typeof window === "undefined") return LEER;
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return LEER;
    const d = JSON.parse(roh) as Daten;
    return d.version === 1 ? { ...LEER, ...d } : LEER;
  } catch {
    return LEER;
  }
}

export function speichern(daten: Daten): void {
  if (typeof window === "undefined") return;
  const mitStempel = { ...daten, aktualisiert: new Date().toISOString() };
  window.localStorage.setItem(KEY, JSON.stringify(mitStempel));
}

export function loeschen(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** Export als Datei – das Backup, das der Nutzer selbst in der Hand hat. */
export function exportieren(daten: Daten): string {
  return JSON.stringify(daten, null, 2);
}

export function importieren(text: string): Daten | null {
  try {
    const d = JSON.parse(text) as Daten;
    if (d?.version !== 1) return null;
    return { ...LEER, ...d };
  } catch {
    return null;
  }
}
