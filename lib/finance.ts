/**
 * Rechenkern.
 *
 * Bewusst frei von React und Browser-APIs: dieselben Funktionen sollen später
 * unverändert in einer nativen App laufen. Alle Beträge in Euro, alle Zinssätze
 * als Dezimalzahl (7 % => 0.07).
 */

export const MONATE_PRO_JAHR = 12;

/** Endkapital eines Sparplans mit gleichbleibender Monatsrate, monatlich verzinst. */
export function endkapitalSparplan(
  monatsrate: number,
  jahre: number,
  zinssatz: number,
  startkapital = 0,
): number {
  const i = zinssatz / MONATE_PRO_JAHR;
  const n = Math.round(jahre * MONATE_PRO_JAHR);
  if (n <= 0) return startkapital;
  const wachstum = Math.pow(1 + i, n);
  const ausRaten = i === 0 ? monatsrate * n : monatsrate * ((wachstum - 1) / i);
  return startkapital * wachstum + ausRaten;
}

/** Einzahlungen, Zinsen und Endkapital – die drei Zahlen, die man zeigen will. */
export function sparplanAufteilung(
  monatsrate: number,
  jahre: number,
  zinssatz: number,
  startkapital = 0,
) {
  const endkapital = endkapitalSparplan(monatsrate, jahre, zinssatz, startkapital);
  const einzahlungen = startkapital + monatsrate * Math.round(jahre * MONATE_PRO_JAHR);
  const zinsen = endkapital - einzahlungen;
  return {
    endkapital,
    einzahlungen,
    zinsen,
    zinsanteil: endkapital > 0 ? zinsen / endkapital : 0,
  };
}

/** Verlauf in Stützpunkten – für Diagramme. */
export function sparplanVerlauf(
  monatsrate: number,
  jahre: number,
  zinssatz: number,
  startkapital = 0,
  schritt = 5,
) {
  const punkte: { jahr: number; einzahlungen: number; zinsen: number; gesamt: number }[] = [];
  for (let j = schritt; j <= jahre; j += schritt) {
    const a = sparplanAufteilung(monatsrate, j, zinssatz, startkapital);
    punkte.push({ jahr: j, einzahlungen: a.einzahlungen, zinsen: a.zinsen, gesamt: a.endkapital });
  }
  if (punkte.length === 0 || punkte[punkte.length - 1].jahr !== jahre) {
    const a = sparplanAufteilung(monatsrate, jahre, zinssatz, startkapital);
    punkte.push({ jahr: jahre, einzahlungen: a.einzahlungen, zinsen: a.zinsen, gesamt: a.endkapital });
  }
  return punkte;
}

/**
 * Ein Baustein des Vermögens für die Fortschreibung.
 * `zins` ist der jährliche Satz als Dezimalzahl, `rate` was monatlich zufließt
 * (bei Schulden: die Tilgung).
 */
export type Baustein = { start: number; rate: number; zins: number; istSchuld?: boolean };

export type Vermoegenspunkt = {
  monat: number;
  brutto: number;
  schulden: number;
  netto: number;
  /** Startvermögen plus alle Einzahlungen – die Linie ohne jeden Zinseffekt. */
  eingezahlt: number;
};

/**
 * Monatliche Fortschreibung mit eigenem Zins je Baustein.
 *
 * Ein Girokonto verzinst sich nicht wie ein Welt-ETF. Über alles denselben Satz
 * zu legen wäre bequem und deutlich zu optimistisch – deshalb rechnet jeder
 * Posten mit seinem eigenen.
 *
 * Schulden wachsen mit ihrem Zins und schrumpfen um die Tilgung. Ist eine Schuld
 * getilgt, wird die frei gewordene Rate NICHT automatisch investiert – das wäre
 * eine Annahme über künftiges Verhalten, keine Rechnung.
 */
export function vermoegensverlauf(bausteine: Baustein[], monate: number): Vermoegenspunkt[] {
  const stand = bausteine.map((b) => b.start);
  let eingezahlt = bausteine.reduce((s, b) => s + (b.istSchuld ? -b.start : b.start), 0);

  const punkte: Vermoegenspunkt[] = [];
  const erfassen = (m: number) => {
    let brutto = 0;
    let schulden = 0;
    bausteine.forEach((b, i) => {
      if (b.istSchuld) schulden += stand[i];
      else brutto += stand[i];
    });
    punkte.push({ monat: m, brutto, schulden, netto: brutto - schulden, eingezahlt });
  };

  erfassen(0);
  for (let m = 1; m <= monate; m++) {
    bausteine.forEach((b, i) => {
      const wachstum = stand[i] * (1 + b.zins / MONATE_PRO_JAHR);
      if (b.istSchuld) {
        const neu = Math.max(0, wachstum - b.rate);
        // Nur die tatsaechlich geleistete Tilgung zaehlt als Einzahlung.
        eingezahlt += Math.min(b.rate, wachstum);
        stand[i] = neu;
      } else {
        stand[i] = wachstum + b.rate;
        eingezahlt += b.rate;
      }
    });
    erfassen(m);
  }
  return punkte;
}

/** Notgroschen-Ziel als Vielfaches der Nettomonatsausgaben. */
export function notgroschenZiel(monatsausgaben: number, monate = 4): number {
  return monatsausgaben * monate;
}

/** Wie viel Kaufkraft von heutigen X Euro in N Jahren übrig bleibt. */
export function realerWert(betrag: number, inflation: number, jahre: number): number {
  return betrag / Math.pow(1 + inflation, jahre);
}

/** Reale Rendite nach Inflation (Fisher, exakt statt Differenz). */
export function realeRendite(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

/**
 * Trade-Republic-Saveback: 1 % des Kartenumsatzes, gedeckelt.
 * Voraussetzung ist ein laufender Sparplan ab der Mindestrate.
 */
export const SAVEBACK = { quote: 0.01, deckelMonat: 15, mindestSparplan: 50 } as const;

export function savebackMonatlich(kartenumsatz: number): number {
  return Math.min(kartenumsatz * SAVEBACK.quote, SAVEBACK.deckelMonat);
}

/** Was der Saveback über die Laufzeit zusätzlich einbringt. */
export function savebackEffekt(
  kartenumsatz: number,
  sparrate: number,
  jahre: number,
  zinssatz: number,
) {
  const proMonat = savebackMonatlich(kartenumsatz);
  const berechtigt = sparrate >= SAVEBACK.mindestSparplan;
  const ohne = sparplanAufteilung(sparrate, jahre, zinssatz);
  const extra = berechtigt ? sparplanAufteilung(proMonat, jahre, zinssatz) : null;
  return {
    proMonat: berechtigt ? proMonat : 0,
    berechtigt,
    deckelErreicht: kartenumsatz * SAVEBACK.quote >= SAVEBACK.deckelMonat,
    ohne,
    extra,
    gesamt: ohne.endkapital + (extra?.endkapital ?? 0),
    zuwachsAnteil: extra ? extra.endkapital / ohne.endkapital : 0,
  };
}

/** Was ein Kostenunterschied über die Laufzeit ausmacht. */
export function kostenVergleich(
  monatsrate: number,
  jahre: number,
  bruttoRendite: number,
  terA: number,
  terB: number,
) {
  const a = endkapitalSparplan(monatsrate, jahre, bruttoRendite - terA);
  const b = endkapitalSparplan(monatsrate, jahre, bruttoRendite - terB);
  return { a, b, differenz: Math.abs(a - b), einzahlungen: monatsrate * jahre * MONATE_PRO_JAHR };
}

export type Position = { name: string; wert: number; sollAnteil: number };

/** Soll-Ist-Abgleich einer Allokation inklusive Kauf-/Verkaufsvorschlag. */
export function rebalancing(positionen: Position[]) {
  const gesamt = positionen.reduce((s, p) => s + p.wert, 0);
  return {
    gesamt,
    zeilen: positionen.map((p) => {
      const istAnteil = gesamt > 0 ? p.wert / gesamt : 0;
      const sollWert = gesamt * p.sollAnteil;
      return {
        ...p,
        istAnteil,
        sollWert,
        abweichung: istAnteil - p.sollAnteil,
        differenzEuro: sollWert - p.wert,
      };
    }),
  };
}

/** Deutsche Kapitalertragsteuer. Kirchensteuer optional (8 % oder 9 %). */
export const STEUER = {
  abgeltung: 0.25,
  soli: 0.055,
  sparerpauschbetrag: 1000,
  teilfreistellungAktienfonds: 0.3,
  basiszins2026: 0.032,
} as const;

/**
 * Der Abgeltungsteuersatz vor Anrechnung des Pauschbetrags.
 *
 * Kirchensteuer ist als Sonderausgabe abziehbar, deshalb sinkt die
 * Abgeltungsteuer selbst: 25 % / (1 + 25 % × Kirchensteuersatz). Ohne diesen
 * Abzug käme man bei 9 % auf 28,63 % statt der tatsächlichen 27,99 %.
 */
export function steuersatz(kirchensteuer = 0, teilfreistellung = 0): number {
  const abgeltung = STEUER.abgeltung / (1 + STEUER.abgeltung * kirchensteuer);
  return abgeltung * (1 + STEUER.soli + kirchensteuer) * (1 - teilfreistellung);
}

/** Steuer auf einen Ertrag, Pauschbetrag wird angerechnet. */
export function kapitalertragsteuer(
  ertrag: number,
  optionen: { kirchensteuer?: number; teilfreistellung?: number; pauschbetragRest?: number } = {},
) {
  const {
    kirchensteuer = 0,
    teilfreistellung = 0,
    // STEUER ist `as const`, der Vorgabewert waere sonst auf 1000 festgenagelt.
    pauschbetragRest = STEUER.sparerpauschbetrag as number,
  } = optionen;
  const steuerpflichtig = Math.max(0, ertrag * (1 - teilfreistellung) - pauschbetragRest);
  // Teilfreistellung steckt schon im steuerpflichtigen Betrag – hier nur der Satz.
  const satz = steuersatz(kirchensteuer);
  return {
    steuer: steuerpflichtig * satz,
    genutzterPauschbetrag: Math.min(pauschbetragRest, Math.max(0, ertrag * (1 - teilfreistellung))),
    effektiverSatz: ertrag > 0 ? (steuerpflichtig * satz) / ertrag : 0,
  };
}

/** Krypto: nach zwölf Monaten Haltefrist steuerfrei (§ 23 EStG, Stand 09/2026). */
export function haltefrist(kaufdatum: Date, heute = new Date()) {
  const frei = new Date(kaufdatum);
  frei.setFullYear(frei.getFullYear() + 1);
  frei.setDate(frei.getDate() + 1);
  const msTag = 86_400_000;
  const tage = Math.ceil((frei.getTime() - heute.getTime()) / msTag);
  return { steuerfreiAb: frei, tageBisSteuerfrei: Math.max(0, tage), istSteuerfrei: tage <= 0 };
}

/** Die Gegenrechnung vom Arbeitsblatt: geht die Aufteilung auf? */
export function gegenrechnung(zufluesse: number, abfluesse: number[]) {
  const summeAbfluesse = abfluesse.reduce((s, v) => s + (v || 0), 0);
  return { zufluesse, abfluesse: summeAbfluesse, rest: zufluesse - summeAbfluesse };
}
