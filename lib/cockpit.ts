/**
 * Ableitungen für das Cockpit.
 *
 * Reine Funktionen über den gespeicherten Daten – kein React, kein Browser.
 * Was hier steht, ist die Übersetzung der Kapitel in Zahlen: Stand,
 * Entwicklung, Prognose, Soll-Ist und die offenen Punkte.
 */

import {
  type Baustein,
  haltefrist,
  notgroschenZiel,
  realerWert,
  rebalancing,
  STEUER,
  steuersatz,
  vermoegensverlauf,
} from "@/lib/finance";
import { fortschritt, schnitt } from "@/lib/ausgaben";
import { euro } from "@/lib/format";
import { RENDITE_VORGABE, type Daten, type Posten } from "@/lib/store";

// ─────────────────────────────────────────────────────────── Bilanz

export type Summen = {
  konten: number;
  anlagen: number;
  sachwerte: number;
  schulden: number;
  brutto: number;
  netto: number;
};

export function summen(bilanz: Posten[]): Summen {
  const s = (art: Posten["art"]) =>
    bilanz.filter((p) => p.art === art).reduce((x, p) => x + (p.wert ?? 0), 0);
  const konten = s("konto");
  const anlagen = s("depot");
  const sachwerte = s("sachwert");
  const schulden = s("schuld");
  const brutto = konten + anlagen + sachwerte;
  return { konten, anlagen, sachwerte, schulden, brutto, netto: brutto - schulden };
}

/** Was monatlich insgesamt zurückgelegt wird – Grundlage jeder Prognose. */
export function sparrateGesamt(bilanz: Posten[]): number {
  return bilanz
    .filter((p) => p.art !== "schuld")
    .reduce((s, p) => s + (p.sparrate ?? 0), 0);
}

// ─────────────────────────────────────────────────────────── Soll-Ist

export function sollIst(bilanz: Posten[]) {
  const depots = bilanz.filter((p) => p.art === "depot" && (p.sollAnteil ?? 0) > 0);
  const summeSoll = depots.reduce((s, p) => s + (p.sollAnteil ?? 0), 0);
  const r = rebalancing(
    depots.map((p) => ({
      name: p.name || "Ohne Namen",
      wert: p.wert ?? 0,
      // Anteile normieren, damit auch 80/10/10 = 100 % ergibt, wenn jemand 8/1/1 einträgt.
      sollAnteil: summeSoll > 0 ? (p.sollAnteil ?? 0) / summeSoll : 0,
    })),
  );
  const groessteAbweichung = r.zeilen.reduce(
    (m, z) => Math.max(m, Math.abs(z.abweichung)),
    0,
  );
  return { ...r, summeSoll, groessteAbweichung, vollstaendig: Math.abs(summeSoll - 1) < 0.005 };
}

/** Ab fünf Prozentpunkten Abweichung lohnt sich das Nachjustieren. */
export const REBALANCING_SCHWELLE = 0.05;

// ─────────────────────────────────────────────────────────── Prognose

/**
 * Der Satz, mit dem ein Posten fortgeschrieben wird: eigene Annahme, sonst die
 * Vorgabe der Klasse. Depots folgen der allgemeinen Renditeannahme, damit ein
 * Regler alle Anlagen auf einmal verstellen kann.
 */
export function renditeVon(posten: Posten, daten: Daten): number {
  if (posten.rendite !== undefined) return posten.rendite;
  if (posten.art === "depot") return daten.einstellungen.renditeAnnahme;
  return RENDITE_VORGABE[posten.art];
}

export function bausteine(daten: Daten): Baustein[] {
  return daten.bilanz.map((p) => ({
    start: p.wert ?? 0,
    rate: p.sparrate ?? 0,
    zins: renditeVon(p, daten),
    istSchuld: p.art === "schuld",
  }));
}

/** Mischrendite über das gesamte Vermögen – nur zur Anzeige. */
export function mischrendite(daten: Daten): number | undefined {
  const anlagen = daten.bilanz.filter((p) => p.art !== "schuld");
  const summe = anlagen.reduce((s, p) => s + (p.wert ?? 0), 0);
  if (summe <= 0) return undefined;
  return anlagen.reduce((s, p) => s + (p.wert ?? 0) * renditeVon(p, daten), 0) / summe;
}

export type Prognosepunkt = {
  jahr: number;
  nominal: number;
  real: number;
  eingezahlt: number;
};

export function prognose(daten: Daten, jahre?: number): Prognosepunkt[] {
  const j = jahre ?? daten.einstellungen.prognoseJahre ?? 20;
  const inflation = daten.einstellungen.inflationAnnahme;
  const verlauf = vermoegensverlauf(bausteine(daten), j * 12);

  const schritt = j <= 10 ? 1 : j <= 25 ? 5 : 10;
  const jahresliste: number[] = [];
  for (let x = 0; x <= j; x += schritt) jahresliste.push(x);
  if (jahresliste[jahresliste.length - 1] !== j) jahresliste.push(j);

  return jahresliste.map((x) => {
    const p = verlauf[x * 12];
    return {
      jahr: x,
      nominal: p.netto,
      real: realerWert(p.netto, inflation, x),
      eingezahlt: p.eingezahlt,
    };
  });
}

// ─────────────────────────────────────────────────────────── Notgroschen

export function notgroschen(daten: Daten) {
  const ziel = daten.nettomonatsausgaben
    ? notgroschenZiel(daten.nettomonatsausgaben, daten.einstellungen.notgroschenMonate)
    : undefined;
  const posten = daten.bilanz.find((p) => /notgroschen|rücklage|ruecklage/i.test(p.name));
  const stand = posten?.wert;
  const anteil = ziel && ziel > 0 && stand !== undefined ? stand / ziel : undefined;
  return { ziel, stand, anteil, posten };
}

// ─────────────────────────────────────────────────────────── Haltefrist

export function haltefristen(daten: Daten, heute = new Date()) {
  return daten.bilanz
    .filter((p) => p.haltefrist && p.kaufdatum)
    .map((p) => ({ posten: p, ...haltefrist(new Date(p.kaufdatum!), heute) }))
    .sort((a, b) => a.tageBisSteuerfrei - b.tageBisSteuerfrei);
}

// ─────────────────────────────────────────────────────────── Sparerpauschbetrag

export function pauschbetrag(daten: Daten) {
  const auftrag = daten.steuer.freistellungsauftrag ?? 0;
  const ertraege = daten.steuer.ertraegeJahr ?? 0;
  const maximum = STEUER.sparerpauschbetrag;
  const genutzt = Math.min(ertraege, auftrag);
  const ungenutzt = Math.max(0, Math.min(maximum, auftrag) - ertraege);
  const satz = steuersatz(daten.steuer.kirchensteuer ?? 0);
  // Ertraege oberhalb des erteilten Auftrags werden versteuert.
  const zuVielSteuer = Math.max(0, Math.min(ertraege, maximum) - auftrag) * satz;
  return { maximum, auftrag, ertraege, genutzt, ungenutzt, satz, zuVielSteuer };
}

// ─────────────────────────────────────────────────────────── Aufgaben

export type Aufgabe = {
  id: string;
  titel: string;
  text: string;
  ton: "gruen" | "blau" | "rot" | "gold";
  /** Aus den Daten erkannt: Der Punkt ist inhaltlich erfüllt. */
  erfuellt: boolean;
  href?: string;
  linkLabel?: string;
};

/**
 * Die To-do-Liste entsteht aus den Daten, nicht aus einer gespeicherten Liste.
 * Trägt jemand seine Nettomonatsausgaben ein, verschwindet der Punkt von selbst.
 */
export function aufgaben(daten: Daten): Aufgabe[] {
  const su = summen(daten.bilanz);
  const ng = notgroschen(daten);
  const si = sollIst(daten.bilanz);
  const pb = pauschbetrag(daten);
  const rate = sparrateGesamt(daten.bilanz);
  const schulden = daten.bilanz.filter((p) => p.art === "schuld" && (p.wert ?? 0) > 0);
  const fs = fortschritt(daten.ausgaben, daten.dauerausgaben);
  const sch = schnitt(daten.ausgaben, daten.dauerausgaben);

  const liste: Aufgabe[] = [
    {
      id: "ausgaben",
      titel: "Ausgaben drei Monate tracken",
      text: fs.volleMonate
        ? `${fs.volleMonate} von 3 vollen Monaten erfasst${
            sch.wert !== undefined
              ? `, Schnitt bisher ${euro(sch.wert, false)}`
              : ""
          }. Ohne diese Zahl lässt sich weder der Notgroschen bemessen noch die Sparrate prüfen.`
        : "Ohne die durchschnittlichen Nettomonatsausgaben lässt sich weder der Notgroschen bemessen noch die Sparrate prüfen.",
      ton: "rot",
      erfuellt: (daten.nettomonatsausgaben ?? 0) > 0,
      href: "/ausgaben",
      linkLabel: daten.ausgaben.length ? "Weiter erfassen" : "Ausgaben erfassen",
    },
    {
      id: "bilanz",
      titel: "Vermögen bilanzieren",
      text: "Alles auflisten, was da ist: Konten, Depots, Sachwerte, Schulden. Erst dann gibt es einen Ausgangspunkt.",
      ton: "blau",
      erfuellt: daten.bilanz.some((p) => (p.wert ?? 0) !== 0),
    },
    {
      id: "schulden",
      titel: "Teure Schulden zuerst tilgen",
      text: schulden.length
        ? `Offen: ${schulden.map((s) => s.name || "Schuld").join(", ")}. Tilgen bringt garantiert den Kreditzins – das schafft kein Investment.`
        : "Keine Schulden erfasst. Falls doch welche bestehen, gehören sie zuerst weg.",
      ton: "rot",
      erfuellt: schulden.length === 0,
      href: "/methode/reihenfolge",
      linkLabel: "Kapitel 4 lesen",
    },
    {
      id: "notgroschen",
      titel: "Notgroschen auffüllen",
      text:
        ng.ziel === undefined
          ? "Sobald die Nettomonatsausgaben stehen, steht auch das Ziel."
          : ng.anteil === undefined
            ? "Trag den aktuellen Stand deines Notgroschen-Kontos in die Bilanz ein."
            : `${Math.round((ng.anteil ?? 0) * 100)} % des Ziels erreicht. Erst die Sicherheit, dann die Rendite.`,
      ton: "gruen",
      erfuellt: (ng.anteil ?? 0) >= 1,
      href: "/rechner/notgroschen",
      linkLabel: "Notgroschen berechnen",
    },
    {
      id: "sparplan",
      titel: "Sparplan starten",
      text: "Eine feste Rate am Tag nach dem Gehaltseingang. Fünfzig Euro reichen zum Anfangen – der Dauerauftrag schlägt die Disziplin.",
      ton: "gold",
      erfuellt: rate > 0,
      href: "/rechner/zinseszins",
      linkLabel: "Zinseszins rechnen",
    },
    {
      id: "aufteilung",
      titel: "Aufteilung festlegen",
      text: si.vollstaendig
        ? "Steht. Die Soll-Anteile deiner Depots ergeben zusammen 100 %."
        : "Leg fest, welcher Anteil in welche Anlageklasse gehört – schriftlich, vor der ersten Order.",
      ton: "blau",
      erfuellt: si.vollstaendig,
      href: "/methode/portfolio",
      linkLabel: "Kapitel 6 lesen",
    },
    {
      id: "rebalancing",
      titel: "Rebalancing prüfen",
      text:
        su.anlagen === 0
          ? "Sobald Depotwerte eingetragen sind, wird hier der Soll-Ist-Abgleich sichtbar."
          : si.groessteAbweichung >= REBALANCING_SCHWELLE
            ? `Größte Abweichung: ${Math.round(si.groessteAbweichung * 100)} Prozentpunkte. Verkaufen, was zu groß geworden ist, nachkaufen, was zu klein ist.`
            : "Alles innerhalb der Toleranz. Mindestens einmal im Jahr trotzdem nachsehen.",
      ton: "gold",
      erfuellt: su.anlagen > 0 && si.groessteAbweichung < REBALANCING_SCHWELLE,
      href: "/methode/portfolio",
      linkLabel: "Kapitel 6 lesen",
    },
    {
      id: "freistellung",
      titel: "Freistellungsauftrag erteilen",
      text:
        pb.auftrag >= pb.maximum
          ? "Der Pauschbetrag ist vollständig verteilt."
          : `Noch ${euro(pb.maximum - pb.auftrag, false)} des Sparerpauschbetrags sind nicht erteilt. Kostenlos, zwei Minuten, bis zu 264 € Steuern pro Jahr.`,
      ton: "gold",
      erfuellt: pb.auftrag >= pb.maximum,
      href: "/methode/steuern",
      linkLabel: "Kapitel 7 lesen",
    },
  ];

  return liste;
}
