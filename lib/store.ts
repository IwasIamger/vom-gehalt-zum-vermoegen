/**
 * Local-first Speicher.
 *
 * Alles bleibt im Browser des Nutzers. Kein Konto, kein Server, keine
 * Datenschutz-Last. Sync und Bankanbindung kommen später als freiwillige
 * Aufsätze – dieselbe Datenform, nur ein anderer Adapter dahinter.
 */

const KEY = "finanzcockpit.v1";

export const VERSION = 4 as const;

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

/** Ein Posten der Vermögensbilanz – Guthaben, Depot, Sachwert oder Schuld. */
export type PostenArt = "konto" | "depot" | "sachwert" | "schuld";

export type Posten = {
  id: string;
  art: PostenArt;
  name: string;
  anbieter?: string;
  /** Aktueller Stand in Euro. Schulden werden positiv erfasst und negativ verrechnet. */
  wert?: number;
  /** Was monatlich hierhin fließt – Grundlage der Prognose. */
  sparrate?: number;
  /** Nur für Depots: Zielgewicht innerhalb der Anlagen. 0.8 = 80 %. */
  sollAnteil?: number;
  /** Für die Krypto-Haltefrist: Datum des Kaufs. */
  kaufdatum?: string;
  /** Haltefrist-Timer für diesen Posten anzeigen. */
  haltefrist?: boolean;
  /** Eigene Renditeannahme als Dezimalzahl. Leer = Vorgabe der Klasse. */
  rendite?: number;
};

/**
 * Vorgaben je Anlageklasse, wenn ein Posten keine eigene Annahme hat.
 *
 * Konten: 2,25 % – der EZB-Einlagenzins, den ein Tagesgeldkonto dauerhaft
 * mitgeht. Ein Girokonto bringt nichts; dort gehört eine 0 in den Posten.
 * Depots: die allgemeine Renditeannahme aus den Einstellungen (Vorgabe 7 %).
 * Sachwerte und Schulden: keine Annahme, bis jemand eine einträgt.
 */
export const RENDITE_VORGABE: Record<PostenArt, number> = {
  konto: 0.0225,
  depot: 0.07,
  sachwert: 0,
  schuld: 0,
};

/** Ein festgehaltener Stand – daraus entsteht die Entwicklungskurve. */
export type Momentaufnahme = {
  datum: string;
  gesamt: number;
  anlagen: number;
  schulden: number;
};

/** Ein erfasster Ausgabenposten. Die Grundlage von Kapitel 3. */
export type Ausgabe = {
  id: string;
  /** ISO-Datum, jjjj-mm-tt. */
  datum: string;
  betrag: number;
  kategorie: string;
  notiz?: string;
};

/** Vorgabe nach dem Kontensystem – jederzeit erweiterbar. */
export const KATEGORIEN_START = [
  "Täglicher Bedarf",
  "Fixkosten",
  "Dauerausgaben",
  "Auto",
  "Freizeit",
  "Sonstiges",
];

/**
 * Eine Anmerkung zur App selbst – Fehler, Wunsch oder Frage.
 *
 * Bleibt wie alles andere lokal. Zum Weitergeben exportiert der Nutzer sie
 * bewusst als Datei oder kopiert den Text; nichts wird still verschickt.
 */
export type Hinweis = {
  id: string;
  datum: string;
  art: "fehler" | "wunsch" | "frage";
  seite?: string;
  text: string;
  erledigt?: boolean;
};

export type Steuerlage = {
  /** Erwartete Kapitalerträge im laufenden Jahr. */
  ertraegeJahr?: number;
  /** Erteilter Freistellungsauftrag in Euro. */
  freistellungsauftrag?: number;
  /** 0, 0.08 oder 0.09. */
  kirchensteuer?: number;
};

export type Daten = {
  version: typeof VERSION;
  aktualisiert: string;
  /** Kapitel 3: die Zahl, aus der fast alles andere folgt. */
  nettomonatsausgaben?: number;
  zufluesse: { gehalt?: number; rueckfluss?: number };
  konten: Konto[];
  anlagen: AnlagePosition[];
  bilanz: Posten[];
  verlauf: Momentaufnahme[];
  ausgaben: Ausgabe[];
  kategorien: string[];
  hinweise: Hinweis[];
  /** IDs abgehakter Aufgaben. Die Liste selbst wird abgeleitet, nicht gespeichert. */
  erledigt: string[];
  steuer: Steuerlage;
  einstellungen: {
    notgroschenMonate: number;
    renditeAnnahme: number;
    inflationAnnahme: number;
    kartenumsatzMonat?: number;
    /** Jahre bis zum Zielzeitpunkt der Prognose. */
    prognoseJahre?: number;
  };
};

export const LEER: Daten = {
  version: VERSION,
  aktualisiert: new Date().toISOString(),
  zufluesse: {},
  konten: [],
  anlagen: [],
  bilanz: [],
  verlauf: [],
  ausgaben: [],
  kategorien: KATEGORIEN_START,
  hinweise: [],
  erledigt: [],
  steuer: {},
  einstellungen: {
    notgroschenMonate: 4,
    renditeAnnahme: 0.07,
    inflationAnnahme: 0.02,
    prognoseJahre: 20,
  },
};

function id(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/** Startbelegung nach dem Kontensystem aus dem Arbeitsblatt. */
export function vorlageKontensystem(): Daten {
  const k = (typ: Konto["typ"], name: string, notiz?: string): Konto => ({
    id: id(),
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
      { id: id(), name: "ETF", sollAnteil: 0.8 },
      { id: id(), name: "Krypto", sollAnteil: 0.1 },
      { id: id(), name: "P2P", sollAnteil: 0.1 },
    ],
  };
}

/** Startbelegung der Bilanz – die Struktur aus Kapitel 10, ohne Beträge. */
export function vorlageBilanz(): Posten[] {
  return [
    { id: id(), art: "konto", name: "Hauptkonto", rendite: 0 },
    { id: id(), art: "konto", name: "Notgroschen" },
    { id: id(), art: "depot", name: "ETF", sollAnteil: 0.8 },
    { id: id(), art: "depot", name: "Krypto", sollAnteil: 0.1, haltefrist: true },
    { id: id(), art: "depot", name: "P2P", sollAnteil: 0.1 },
  ];
}

export function neuerHinweis(art: Hinweis["art"], text: string, seite?: string): Hinweis {
  return { id: id(), datum: new Date().toISOString(), art, text, seite };
}

export function neueAusgabe(kategorie: string): Ausgabe {
  return { id: id(), datum: new Date().toISOString().slice(0, 10), betrag: 0, kategorie };
}

/**
 * Posten nach Namen anlegen oder ergänzen.
 *
 * Der geführte Einstieg soll bestehende Eingaben nicht überschreiben, sondern
 * auffüllen – wer schon ein Konto "Notgroschen" hat, bekommt kein zweites.
 */
export function postenSetzen(
  bilanz: Posten[],
  art: PostenArt,
  name: string,
  werte: Partial<Omit<Posten, "id" | "art" | "name">>,
): Posten[] {
  const i = bilanz.findIndex(
    (p) => p.art === art && p.name.trim().toLowerCase() === name.trim().toLowerCase(),
  );
  if (i < 0) return [...bilanz, { id: id(), art, name, ...werte }];
  return bilanz.map((p, k) => (k === i ? { ...p, ...werte } : p));
}

/** Posten nach Namen entfernen – wenn im Einstieg ein Haken zurückgenommen wird. */
export function postenLoeschen(bilanz: Posten[], art: PostenArt, name: string): Posten[] {
  return bilanz.filter(
    (p) => !(p.art === art && p.name.trim().toLowerCase() === name.trim().toLowerCase()),
  );
}

export function neuerPosten(art: PostenArt): Posten {
  return { id: id(), art, name: "", haltefrist: art === "depot" ? false : undefined };
}

/**
 * Ältere Stände weiterverwenden statt verwerfen – niemand soll seine Eingaben
 * verlieren, nur weil eine Funktion dazugekommen ist.
 */
function migriere(roh: unknown): Daten | null {
  if (!roh || typeof roh !== "object") return null;
  const d = roh as Omit<Partial<Daten>, "version"> & { version?: number };
  if (!(typeof d.version === "number" && d.version >= 1 && d.version <= VERSION)) return null;

  // Wer sein Kontensystem schon ausgefuellt hat, soll seine Konten und Depots
  // nicht ein zweites Mal benennen muessen. Betraege werden bewusst NICHT
  // uebernommen: im Kontensystem stehen monatliche Fluesse, in der Bilanz Staende.
  const bilanz: Posten[] =
    d.bilanz ??
    [
      ...(d.konten ?? [])
        .filter((k) => k.typ === "konto")
        .map((k) => ({ id: k.id, art: "konto" as const, name: k.name, anbieter: k.bank })),
      ...(d.anlagen ?? []).map((a) => ({
        id: a.id,
        art: "depot" as const,
        name: a.name,
        anbieter: a.anbieter,
        wert: a.wert,
        sparrate: a.betragMonat,
        sollAnteil: a.sollAnteil,
        kaufdatum: a.kaufdatum,
        // Wer ein Kaufdatum gepflegt hat, will die Haltefrist auch sehen.
        haltefrist: a.kaufdatum ? true : undefined,
      })),
    ];

  return {
    ...LEER,
    ...d,
    version: VERSION,
    bilanz,
    verlauf: d.verlauf ?? [],
    ausgaben: d.ausgaben ?? [],
    kategorien: d.kategorien?.length ? d.kategorien : KATEGORIEN_START,
    hinweise: d.hinweise ?? [],
    erledigt: d.erledigt ?? [],
    steuer: d.steuer ?? {},
    einstellungen: { ...LEER.einstellungen, ...(d.einstellungen ?? {}) },
  };
}

export function laden(): Daten {
  if (typeof window === "undefined") return LEER;
  try {
    const roh = window.localStorage.getItem(KEY);
    if (!roh) return LEER;
    return migriere(JSON.parse(roh)) ?? LEER;
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
    return migriere(JSON.parse(text));
  } catch {
    return null;
  }
}
