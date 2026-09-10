/**
 * Auswertung der erfassten Ausgaben.
 *
 * Ziel des ganzen Bereichs ist eine einzige Zahl: die durchschnittlichen
 * Nettomonatsausgaben. Sie bemisst den Notgroschen und prüft die Sparrate.
 * Damit sie belastbar ist, zählen nur abgeschlossene Monate – der laufende
 * Monat ist immer unvollständig und würde den Schnitt nach unten ziehen.
 */

import type { Ausgabe } from "@/lib/store";

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
};

/** Alle Monate mit Einträgen, aufsteigend sortiert. */
export function proMonat(ausgaben: Ausgabe[]): Monatswert[] {
  const karte = new Map<string, Ausgabe[]>();
  for (const a of ausgaben) {
    const m = monatVon(a.datum);
    karte.set(m, [...(karte.get(m) ?? []), a]);
  }
  return [...karte.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([monat, liste]) => {
      const proKat = new Map<string, number>();
      for (const a of liste) {
        proKat.set(a.kategorie, (proKat.get(a.kategorie) ?? 0) + a.betrag);
      }
      return {
        monat,
        summe: liste.reduce((s, a) => s + a.betrag, 0),
        anzahl: liste.length,
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
export function volleMonate(ausgaben: Ausgabe[], heute = new Date()): Monatswert[] {
  const jetzt = laufenderMonat(heute);
  return proMonat(ausgaben).filter((m) => m.monat < jetzt);
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

export function schnitt(ausgaben: Ausgabe[], ziel = 3, heute = new Date()): Schnitt {
  const volle = volleMonate(ausgaben, heute);
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

export function fortschritt(ausgaben: Ausgabe[], ziel = 3, heute = new Date()): Fortschritt {
  if (ausgaben.length === 0) return { tage: 0, volleMonate: 0, fehlend: ziel };
  const seit = ausgaben.reduce((min, a) => (a.datum < min ? a.datum : min), ausgaben[0].datum);
  const tage = Math.max(
    1,
    Math.floor((heute.getTime() - new Date(seit).getTime()) / 86_400_000) + 1,
  );
  const voll = volleMonate(ausgaben, heute).length;
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
