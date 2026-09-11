/**
 * Aktuelle Zahlen von der EZB.
 *
 * Der Vortrag lebt davon, dass seine Zahlen stimmen. Der Einlagenzins stand
 * hier fest verdrahtet auf 2,25 % – richtig am Tag, an dem es geschrieben
 * wurde, und falsch, sobald der Rat das nächste Mal tagt. Deshalb holt die App
 * ihn jetzt selbst.
 *
 * Kein Server, kein Schlüssel: Das offene Datenportal der EZB erlaubt Zugriffe
 * direkt aus dem Browser. Was geholt wurde, liegt im Zwischenspeicher – ohne
 * Netz und beim nächsten Aufruf ist es sofort da. Geht gar nichts, bleibt der
 * hinterlegte Wert stehen, mit seinem Stand.
 */

const BASIS = "https://data-api.ecb.europa.eu/service/data";

/** Einlagenfazilität der EZB – der Satz, den ein Tagesgeldkonto dauerhaft mitgeht. */
const REIHE_ZINS = "FM/B.U2.EUR.4F.KR.DFR.LEV";
/** Harmonisierter Verbraucherpreisindex Deutschland, Veränderung zum Vorjahr. */
const REIHE_INFLATION = "ICP/M.DE.N.000000.4.ANR";

const SPEICHER = "finanzcockpit.marktdaten";
/** Einmal am Tag reicht: Die EZB ändert den Satz höchstens alle sechs Wochen. */
const HALTBAR_MS = 24 * 60 * 60 * 1000;

export type Punkt = { zeit: string; wert: number };

export type Marktdaten = {
  einlagenzins?: { wert: number; gueltigAb: string };
  /** Schon beschlossen, aber noch nicht in Kraft. */
  naechsterZins?: { wert: number; gueltigAb: string };
  inflation?: { wert: number; monat: string };
  /** Wann zuletzt erfolgreich geholt. */
  geholt?: string;
};

/**
 * Der Rückfallwert, wenn nichts geladen werden kann.
 * Stand 11.09.2026 – ab 16.09.2026 gilt 2,50 %.
 */
export const HINTERLEGT = {
  einlagenzins: 0.0225,
  stand: "September 2026",
} as const;

// ─────────────────────────────────────────────────────── Auswertung

/**
 * Die EZB veröffentlicht Zinsbeschlüsse mit ihrem Wirksamkeitsdatum – auch
 * solche, die erst in einigen Tagen greifen. Gültig ist der letzte Beschluss,
 * der schon in Kraft ist; der nächste wird getrennt ausgewiesen.
 */
export function zinsFuerHeute(punkte: Punkt[], heute = new Date()) {
  const stichtag = heute.toISOString().slice(0, 10);
  const sortiert = [...punkte].sort((a, b) => a.zeit.localeCompare(b.zeit));
  const inKraft = sortiert.filter((p) => p.zeit <= stichtag);
  const kuenftig = sortiert.find((p) => p.zeit > stichtag);
  const aktuell = inKraft[inKraft.length - 1];
  return {
    aktuell: aktuell ? { wert: aktuell.wert / 100, gueltigAb: aktuell.zeit } : undefined,
    naechster: kuenftig ? { wert: kuenftig.wert / 100, gueltigAb: kuenftig.zeit } : undefined,
  };
}

/** Aus der SDMX-Antwort der EZB die Beobachtungen herauslösen. */
export function punkteAus(json: unknown): Punkt[] {
  try {
    const j = json as {
      dataSets: { series: Record<string, { observations: Record<string, (number | null)[]> }> }[];
      structure: { dimensions: { observation: { values: { id: string }[] }[] } };
    };
    const serie = Object.values(j.dataSets[0].series)[0];
    const zeiten = j.structure.dimensions.observation[0].values;
    return Object.entries(serie.observations)
      .map(([i, w]) => ({ zeit: zeiten[Number(i)]?.id, wert: w[0] }))
      .filter((p): p is Punkt => typeof p.zeit === "string" && typeof p.wert === "number");
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────────────── Zwischenspeicher

function ausSpeicher(): Marktdaten | null {
  if (typeof window === "undefined") return null;
  try {
    const roh = window.localStorage.getItem(SPEICHER);
    return roh ? (JSON.parse(roh) as Marktdaten) : null;
  } catch {
    return null;
  }
}

function inSpeicher(d: Marktdaten): void {
  try {
    window.localStorage.setItem(SPEICHER, JSON.stringify(d));
  } catch {
    /* ohne Zwischenspeicher geht es auch, nur langsamer */
  }
}

export function istFrisch(d: Marktdaten | null, jetzt = Date.now()): boolean {
  if (!d?.geholt) return false;
  return jetzt - new Date(d.geholt).getTime() < HALTBAR_MS;
}

// ─────────────────────────────────────────────────────── Laden

async function reihe(pfad: string, anzahl: number): Promise<Punkt[]> {
  const r = await fetch(`${BASIS}/${pfad}?lastNObservations=${anzahl}&format=jsondata`);
  if (!r.ok) throw new Error(String(r.status));
  return punkteAus(await r.json());
}

/**
 * Holt die Werte – aus dem Zwischenspeicher, wenn sie frisch genug sind.
 * Schlägt das Netz fehl, bleibt der alte Stand stehen: eine Zahl von gestern
 * ist besser als keine.
 */
export async function ladeMarktdaten(erzwingen = false): Promise<Marktdaten> {
  const gespeichert = ausSpeicher();
  if (!erzwingen && istFrisch(gespeichert)) return gespeichert!;

  try {
    const [zinsen, inflation] = await Promise.all([
      reihe(REIHE_ZINS, 8),
      reihe(REIHE_INFLATION, 1),
    ]);
    const z = zinsFuerHeute(zinsen);
    const neu: Marktdaten = {
      einlagenzins: z.aktuell,
      naechsterZins: z.naechster,
      inflation: inflation[0] ? { wert: inflation[0].wert / 100, monat: inflation[0].zeit } : undefined,
      geholt: new Date().toISOString(),
    };
    inSpeicher(neu);
    return neu;
  } catch {
    return gespeichert ?? {};
  }
}
