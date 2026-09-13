/**
 * Jahresrückblick.
 *
 * Nichts davon wird neu erfasst – alles kommt aus dem, was die App ohnehin
 * sammelt: Momentaufnahmen des Vermögens, Ausgaben, feste Posten, To-dos.
 * Wo die Datenlage dünn ist, sagt der Rückblick das, statt eine Zahl zu
 * erfinden.
 */

import { proMonat, type Monatswert } from "@/lib/ausgaben";
import { aufgaben, haltefristen, notgroschen, sparrateGesamt } from "@/lib/cockpit";
import type { Daten, Momentaufnahme } from "@/lib/store";

export type Vermoegensrueckblick = {
  /** Erste Momentaufnahme im Jahr – oder die letzte davor, falls vorhanden. */
  anfang?: Momentaufnahme;
  ende?: Momentaufnahme;
  veraenderung?: number;
  /** Was über die Sparrate rechnerisch eingezahlt wurde – eine Schätzung. */
  geschaetzteEinzahlung?: number;
  /** Veränderung minus Einzahlung: das, was der Markt beigesteuert hat. */
  geschaetzterMarkt?: number;
  punkte: Momentaufnahme[];
};

export type Ausgabenrueckblick = {
  monate: Monatswert[];
  summe: number;
  schnitt?: number;
  teuerster?: Monatswert;
  guenstigster?: Monatswert;
  kategorien: { kategorie: string; summe: number; anteil: number }[];
  festerAnteil?: number;
};

export type Rueckblick = {
  jahr: number;
  /** Anzahl Monate des Jahres, die schon vorbei sind. */
  vergangeneMonate: number;
  vermoegen: Vermoegensrueckblick;
  ausgaben: Ausgabenrueckblick;
  notgroschen: { anteil?: number; erreicht: boolean };
  erledigt: { anzahl: number; titel: string[] };
  steuerfreiGeworden: string[];
  /** Kurze Sätze, aus den Zahlen abgeleitet. */
  saetze: string[];
};

function imJahr(datum: string, jahr: number): boolean {
  return datum.startsWith(String(jahr));
}

export function vermoegensrueckblick(
  verlauf: Momentaufnahme[],
  jahr: number,
  sparrate: number,
): Vermoegensrueckblick {
  const sortiert = [...verlauf].sort((a, b) => a.datum.localeCompare(b.datum));
  const dieses = sortiert.filter((v) => imJahr(v.datum, jahr));
  const davor = sortiert.filter((v) => v.datum < `${jahr}-01-01`);
  // Der Ausgangspunkt ist der letzte Stand vor dem Jahr, sonst der erste im Jahr.
  const anfang = davor[davor.length - 1] ?? dieses[0];
  const ende = dieses[dieses.length - 1];
  if (!anfang || !ende || anfang.datum === ende.datum) {
    return { anfang, ende, punkte: dieses };
  }
  const monate = monateZwischen(anfang.datum, ende.datum);
  const geschaetzteEinzahlung = sparrate * monate;
  const veraenderung = ende.gesamt - anfang.gesamt;
  return {
    anfang,
    ende,
    veraenderung,
    geschaetzteEinzahlung,
    geschaetzterMarkt: veraenderung - geschaetzteEinzahlung,
    punkte: [anfang, ...dieses.filter((v) => v.datum !== anfang.datum)],
  };
}

/** Ganze Monate zwischen zwei ISO-Daten, kaufmännisch gerundet. */
export function monateZwischen(von: string, bis: string): number {
  const a = new Date(von);
  const b = new Date(bis);
  const tage = (b.getTime() - a.getTime()) / 86_400_000;
  return Math.max(0, Math.round(tage / 30.44));
}

export function ausgabenrueckblick(daten: Daten, jahr: number, heute = new Date()): Ausgabenrueckblick {
  const alle = proMonat(daten.ausgaben, daten.dauerausgaben, heute);
  const laufend = heute.toISOString().slice(0, 7);
  // Nur abgeschlossene Monate dieses Jahres – der laufende verzerrt jeden Vergleich.
  const monate = alle.filter((m) => imJahr(m.monat, jahr) && m.monat < laufend);
  const summe = monate.reduce((s, m) => s + m.summe, 0);
  const proKat = new Map<string, number>();
  for (const m of monate) for (const k of m.proKategorie) proKat.set(k.kategorie, (proKat.get(k.kategorie) ?? 0) + k.summe);
  const kategorien = [...proKat.entries()]
    .map(([kategorie, s]) => ({ kategorie, summe: s, anteil: summe > 0 ? s / summe : 0 }))
    .sort((a, b) => b.summe - a.summe);
  const fest = monate.reduce((s, m) => s + m.dauerSumme, 0);
  const nachSumme = [...monate].sort((a, b) => a.summe - b.summe);
  return {
    monate,
    summe,
    schnitt: monate.length ? summe / monate.length : undefined,
    teuerster: nachSumme[nachSumme.length - 1],
    guenstigster: nachSumme[0],
    kategorien,
    festerAnteil: summe > 0 ? fest / summe : undefined,
  };
}

export function rueckblick(daten: Daten, heute = new Date()): Rueckblick {
  const jahr = heute.getFullYear();
  const vergangeneMonate = heute.getMonth(); // Januar = 0 vergangene Monate
  const rate = sparrateGesamt(daten.bilanz);
  const vermoegen = vermoegensrueckblick(daten.verlauf, jahr, rate);
  const ausgaben = ausgabenrueckblick(daten, jahr, heute);
  const ng = notgroschen(daten);
  const alleAufgaben = aufgaben(daten);
  const erledigt = alleAufgaben.filter((a) => a.erfuellt || daten.erledigt.includes(a.id));
  const steuerfrei = haltefristen(daten, heute)
    .filter((h) => h.istSteuerfrei && imJahr(h.steuerfreiAb.toISOString().slice(0, 10), jahr))
    .map((h) => h.posten.name || "Ohne Namen");

  const saetze: string[] = [];
  if (vermoegen.veraenderung !== undefined) {
    const v = vermoegen.veraenderung;
    saetze.push(
      v >= 0
        ? `Dein Nettovermögen ist seit ${monatName(vermoegen.anfang!.datum)} um ${euroKurz(v)} gewachsen.`
        : `Dein Nettovermögen ist seit ${monatName(vermoegen.anfang!.datum)} um ${euroKurz(-v)} gesunken.`,
    );
    if (vermoegen.geschaetzterMarkt !== undefined && Math.abs(vermoegen.geschaetzterMarkt) > 50) {
      const m = vermoegen.geschaetzterMarkt;
      saetze.push(
        m >= 0
          ? `Rund ${euroKurz(vermoegen.geschaetzteEinzahlung!)} davon hast du selbst eingezahlt, etwa ${euroKurz(m)} kamen vom Markt.`
          : `Du hast rund ${euroKurz(vermoegen.geschaetzteEinzahlung!)} eingezahlt – der Markt hat davon etwa ${euroKurz(-m)} wieder genommen. Das ist normal, und genau der Grund für den langen Horizont.`,
      );
    }
  }
  if (ausgaben.schnitt !== undefined && ausgaben.monate.length >= 2) {
    saetze.push(
      `Im Schnitt hast du ${euroKurz(ausgaben.schnitt)} im Monat ausgegeben – am meisten im ${monatName(ausgaben.teuerster!.monat + "-01")}, am wenigsten im ${monatName(ausgaben.guenstigster!.monat + "-01")}.`,
    );
  }
  if (ausgaben.kategorien[0] && ausgaben.kategorien[0].anteil >= 0.3) {
    const k = ausgaben.kategorien[0];
    saetze.push(`${Math.round(k.anteil * 100)} % deiner Ausgaben gehen in „${k.kategorie}“.`);
  }
  if (ng.anteil !== undefined && ng.anteil >= 1) saetze.push("Dein Notgroschen ist voll. Das ist die wichtigste Zahl auf dieser Seite.");
  if (steuerfrei.length) saetze.push(`Steuerfrei geworden: ${steuerfrei.join(", ")}.`);
  // Bei einem leeren Stand ist "keine Schulden" zwar wahr, aber kein Verdienst.
  const hatAngefangen = daten.bilanz.length > 0 || daten.erledigt.length > 0;
  if (erledigt.length && hatAngefangen) saetze.push(`${erledigt.length} von ${alleAufgaben.length} Punkten auf deiner Liste sind erledigt.`);

  return {
    jahr,
    vergangeneMonate,
    vermoegen,
    ausgaben,
    notgroschen: { anteil: ng.anteil, erreicht: (ng.anteil ?? 0) >= 1 },
    erledigt: { anzahl: erledigt.length, titel: erledigt.map((a) => a.titel) },
    steuerfreiGeworden: steuerfrei,
    saetze,
  };
}

// ───────────────────────────────────────────── kleine Helfer ohne Intl-Abhängigkeit

const MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function monatName(iso: string): string {
  const [j, m] = iso.split("-");
  return `${MONATE[Number(m) - 1]} ${j}`;
}

function euroKurz(n: number): string {
  return `${Math.round(n).toLocaleString("de-DE")} €`;
}
