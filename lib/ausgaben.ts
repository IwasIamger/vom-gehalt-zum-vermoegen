/**
 * Auswertung der erfassten Ausgaben.
 *
 * Ziel des ganzen Bereichs ist eine einzige Zahl: die durchschnittlichen
 * Nettomonatsausgaben. Sie bemisst den Notgroschen und prüft die Sparrate.
 * Damit sie belastbar ist, zählen nur abgeschlossene Monate – der laufende
 * Monat ist immer unvollständig und würde den Schnitt nach unten ziehen.
 */

import type { Ausgabe, Dauerausgabe } from "@/lib/store";

export const MONATE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

/** "2026-09-10" → "2026-09" */
export function monatVon(datum: string): string {
  return datum.slice(0, 7);
}

export function monatName(schluessel: string): string {
  const [j, m] = schluessel.split("-");
  return `${MONATE[Number(m) - 1]} ${j}`;
}

export function monatKurz(schluessel: string): string {
  const [j, m] = schluessel.split("-");
  return `${MONATE[Number(m) - 1].slice(0, 3)} ${j.slice(2)}`;
}

export type Monatswert = {
  monat: string;
  summe: number;
  anzahl: number;
  proKategorie: { kategorie: string; summe: number }[];
  /** Anteil, der aus wiederkehrenden Posten stammt. */
  dauerSumme: number;
};

/** "2026-09" als Zahl, um Monate vergleichen und zählen zu können. */
function monatsIndex(schluessel: string): number {
  const [j, m] = schluessel.split("-").map(Number);
  return j * 12 + (m - 1);
}

function indexZuMonat(index: number): string {
  const j = Math.floor(index / 12);
  const m = index % 12;
  return `${j}-${String(m + 1).padStart(2, "0")}`;
}

/** Fällt dieser wiederkehrende Posten in dem Monat an? */
export function faelligIn(d: Dauerausgabe, monat: string): boolean {
  const ab = monatsIndex(d.ab);
  const jetzt = monatsIndex(monat);
  if (jetzt < ab) return false;
  if (d.bis && jetzt > monatsIndex(d.bis)) return false;
  const rhythmus = Math.max(1, Math.round(d.rhythmus));
  return (jetzt - ab) % rhythmus === 0;
}

/** Was in einem Monat automatisch anfällt. */
export function dauerFuerMonat(dauerausgaben: Dauerausgabe[], monat: string) {
  return dauerausgaben.filter((d) => faelligIn(d, monat));
}

/**
 * Alle Monate mit Einträgen, aufsteigend sortiert.
 *
 * Wiederkehrende Posten werden für jeden fälligen Monat mitgerechnet – bis
 * einschließlich des laufenden Monats, nicht in die Zukunft hinein.
 */
export function proMonat(
  ausgaben: Ausgabe[],
  dauerausgaben: Dauerausgabe[] = [],
  heute = new Date(),
): Monatswert[] {
  const monate = new Set<string>();
  for (const a of ausgaben) monate.add(monatVon(a.datum));

  const bisIndex = monatsIndex(laufenderMonat(heute));
  for (const d of dauerausgaben) {
    const ende = Math.min(bisIndex, d.bis ? monatsIndex(d.bis) : bisIndex);
    for (let i = monatsIndex(d.ab); i <= ende; i++) {
      const m = indexZuMonat(i);
      if (faelligIn(d, m)) monate.add(m);
    }
  }

  return [...monate]
    .sort((a, b) => a.localeCompare(b))
    .map((monat) => {
      const einzeln = ausgaben.filter((a) => monatVon(a.datum) === monat);
      const dauer = dauerFuerMonat(dauerausgaben, monat);
      const proKat = new Map<string, number>();
      for (const a of einzeln) proKat.set(a.kategorie, (proKat.get(a.kategorie) ?? 0) + a.betrag);
      for (const d of dauer) proKat.set(d.kategorie, (proKat.get(d.kategorie) ?? 0) + d.betrag);
      const dauerSumme = dauer.reduce((s, d) => s + d.betrag, 0);
      return {
        monat,
        summe: einzeln.reduce((s, a) => s + a.betrag, 0) + dauerSumme,
        anzahl: einzeln.length + dauer.length,
        dauerSumme,
        proKategorie: [...proKat.entries()]
          .map(([kategorie, summe]) => ({ kategorie, summe }))
          .sort((a, b) => b.summe - a.summe),
      };
    });
}

export function laufenderMonat(heute = new Date()): string {
  return heute.toISOString().slice(0, 7);
}

/** Abgeschlossene Monate – der laufende zählt nicht mit. */
export function volleMonate(
  ausgaben: Ausgabe[],
  dauerausgaben: Dauerausgabe[] = [],
  heute = new Date(),
): Monatswert[] {
  const jetzt = laufenderMonat(heute);
  return proMonat(ausgaben, dauerausgaben, heute).filter((m) => m.monat < jetzt);
}

export type Schnitt = {
  /** Durchschnitt der letzten abgeschlossenen Monate, oder undefined. */
  wert?: number;
  /** Wie viele Monate tatsächlich eingeflossen sind. */
  monate: number;
  /** Ziel sind drei volle Monate (Kapitel 3). */
  ziel: number;
  belastbar: boolean;
  genutzt: Monatswert[];
};

export function schnitt(
  ausgaben: Ausgabe[],
  dauerausgaben: Dauerausgabe[] = [],
  ziel = 3,
  heute = new Date(),
): Schnitt {
  const volle = volleMonate(ausgaben, dauerausgaben, heute);
  const genutzt = volle.slice(-ziel);
  const wert = genutzt.length
    ? genutzt.reduce((s, m) => s + m.summe, 0) / genutzt.length
    : undefined;
  return { wert, monate: genutzt.length, ziel, belastbar: genutzt.length >= ziel, genutzt };
}

export type Fortschritt = {
  seit?: string;
  tage: number;
  volleMonate: number;
  /** Wie viele volle Monate noch fehlen, bis der Schnitt belastbar ist. */
  fehlend: number;
};

export function fortschritt(
  ausgaben: Ausgabe[],
  dauerausgaben: Dauerausgabe[] = [],
  ziel = 3,
  heute = new Date(),
): Fortschritt {
  // Auch ein wiederkehrender Posten ist ein Anfang: Wer seine Fixkosten
  // eingetragen hat, hat fuer jeden Monat seither schon eine Teilzahl.
  const anfaenge = [
    ...ausgaben.map((a) => a.datum),
    ...dauerausgaben.map((d) => `${d.ab}-01`),
  ];
  if (anfaenge.length === 0) return { tage: 0, volleMonate: 0, fehlend: ziel };
  const seit = anfaenge.reduce((min, x) => (x < min ? x : min));
  const tage = Math.max(
    1,
    Math.floor((heute.getTime() - new Date(seit).getTime()) / 86_400_000) + 1,
  );
  const voll = volleMonate(ausgaben, dauerausgaben, heute).length;
  return { seit, tage, volleMonate: voll, fehlend: Math.max(0, ziel - voll) };
}

/** Die zuletzt erfassten Einträge, neueste zuerst. */
export function neueste(ausgaben: Ausgabe[], anzahl?: number): Ausgabe[] {
  const sortiert = [...ausgaben].sort(
    (a, b) => b.datum.localeCompare(a.datum) || b.id.localeCompare(a.id),
  );
  return anzahl ? sortiert.slice(0, anzahl) : sortiert;
}

/** Einträge nach Tag gruppiert – so liest sich die Liste wie ein Kontoauszug. */
export function proTag(ausgaben: Ausgabe[]): { datum: string; summe: number; eintraege: Ausgabe[] }[] {
  const karte = new Map<string, Ausgabe[]>();
  for (const a of neueste(ausgaben)) {
    karte.set(a.datum, [...(karte.get(a.datum) ?? []), a]);
  }
  return [...karte.entries()].map(([datum, eintraege]) => ({
    datum,
    summe: eintraege.reduce((s, a) => s + a.betrag, 0),
    eintraege,
  }));
}

// ─────────────────────────────────────────────────────────── CSV

/** Deutsche Schreibweise: Komma als Dezimaltrenner, ohne Tausenderpunkte. */
function csvBetrag(n: number): string {
  return n.toFixed(2).replace(".", ",");
}

function csvFeld(text: string): string {
  // Semikolon, Anführungszeichen oder Zeilenumbruch: dann in Anführungszeichen.
  return /[;"\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Alle Ausgaben als CSV, so wie Excel auf Deutsch sie erwartet: Semikolon als
 * Trenner, Dezimalkomma, UTF-8 mit Byte-Order-Mark (sonst zeigt Excel "Ã¤").
 *
 * Wiederkehrende Posten stehen für jeden fälligen Monat als eigene Zeile
 * (Datum = Monatserster), damit eine Summe in Excel dasselbe ergibt wie hier.
 */
export function alsCsv(
  ausgaben: Ausgabe[],
  dauerausgaben: Dauerausgabe[] = [],
  heute = new Date(),
): string {
  const zeilen: string[][] = [];
  for (const a of ausgaben) {
    zeilen.push([a.datum, a.kategorie, csvBetrag(a.betrag), a.notiz ?? "", "einzeln"]);
  }
  for (const m of proMonat([], dauerausgaben, heute)) {
    for (const d of dauerFuerMonat(dauerausgaben, m.monat)) {
      zeilen.push([`${m.monat}-01`, d.kategorie, csvBetrag(d.betrag), d.name, "fest"]);
    }
  }
  zeilen.sort((a, b) => a[0].localeCompare(b[0]));
  const kopf = ["Datum", "Kategorie", "Betrag", "Notiz", "Art"];
  const text = [kopf, ...zeilen].map((z) => z.map(csvFeld).join(";")).join("\r\n");
  return "\uFEFF" + text + "\r\n";
}
