import { describe, expect, it } from "vitest";
import {
  MONATE_PRO_JAHR,
  SAVEBACK,
  STEUER,
  endkapitalSparplan,
  gegenrechnung,
  haltefrist,
  kapitalertragsteuer,
  kostenVergleich,
  notgroschenZiel,
  realeRendite,
  realerWert,
  rebalancing,
  savebackEffekt,
  savebackMonatlich,
  sparplanAufteilung,
  sparplanVerlauf,
  steuersatz,
  vermoegensverlauf,
} from "@/lib/finance";

/**
 * Die Zahlen sind das Produkt. Diese Tests prüfen sie deshalb nicht gegen den
 * Code selbst, sondern gegen unabhängig formulierte Vergleichsrechnungen,
 * gegen Werte aus dem Vortrag und gegen Eigenschaften, die immer gelten müssen.
 */

/** Dieselbe Aufgabe, anders gerechnet: Monat für Monat statt mit Rentenformel. */
function referenzSparplan(rate: number, jahre: number, zins: number, start = 0): number {
  let stand = start;
  for (let m = 0; m < Math.round(jahre * 12); m++) stand = stand * (1 + zins / 12) + rate;
  return stand;
}

const nahe = (a: number, b: number, toleranz = 0.01) => expect(Math.abs(a - b)).toBeLessThan(toleranz);

describe("endkapitalSparplan", () => {
  it("stimmt mit der monatlichen Nachrechnung überein", () => {
    for (const [rate, jahre, zins, start] of [
      [50, 40, 0.07, 0],
      [200, 30, 0.07, 0],
      [1, 1, 0.12, 0],
      [400, 20, 0.07, 12000],
      [0, 15, 0.0225, 6000],
    ] as const) {
      nahe(endkapitalSparplan(rate, jahre, zins, start), referenzSparplan(rate, jahre, zins, start), 0.5);
    }
  });

  it("ohne Zins ist es schlicht die Summe der Raten", () => {
    expect(endkapitalSparplan(100, 10, 0)).toBeCloseTo(100 * 120, 6);
    expect(endkapitalSparplan(100, 10, 0, 500)).toBeCloseTo(500 + 100 * 120, 6);
  });

  it("ohne Laufzeit bleibt nur das Startkapital", () => {
    expect(endkapitalSparplan(100, 0, 0.07, 2500)).toBe(2500);
    expect(endkapitalSparplan(100, -5, 0.07, 2500)).toBe(2500);
  });

  it("50 € über 40 Jahre bei 7 % ergeben 131.241 €", () => {
    // Nachschüssig gerechnet: 50 × ((1 + 0,07/12)^480 − 1) / (0,07/12).
    // Die Präsentation nennt 130.517 € – die Zahl stammt aus einem fremden
    // Rechner mit anderer Zinsgutschrift und weicht um 724 € ab.
    expect(Math.round(endkapitalSparplan(50, 40, 0.07))).toBe(131241);
  });

  it("wächst monoton mit Rate, Laufzeit und Zins", () => {
    expect(endkapitalSparplan(51, 20, 0.05)).toBeGreaterThan(endkapitalSparplan(50, 20, 0.05));
    expect(endkapitalSparplan(50, 21, 0.05)).toBeGreaterThan(endkapitalSparplan(50, 20, 0.05));
    expect(endkapitalSparplan(50, 20, 0.06)).toBeGreaterThan(endkapitalSparplan(50, 20, 0.05));
  });
});

describe("sparplanAufteilung", () => {
  it("Einzahlungen plus Zinsen ergeben das Endkapital", () => {
    const a = sparplanAufteilung(250, 25, 0.06, 3000);
    nahe(a.einzahlungen + a.zinsen, a.endkapital, 0.000001);
  });

  it("zählt Startkapital zu den Einzahlungen, nicht zu den Zinsen", () => {
    const a = sparplanAufteilung(0, 10, 0, 1000);
    expect(a.einzahlungen).toBe(1000);
    expect(a.zinsen).toBeCloseTo(0, 6);
  });

  it("nennt den Zinsanteil als Bruchteil des Endkapitals", () => {
    const a = sparplanAufteilung(50, 40, 0.07);
    expect(a.zinsanteil).toBeCloseTo(a.zinsen / a.endkapital, 10);
    // Im Vortrag: 82 % des Endkapitals stammen aus Zinsen.
    expect(Math.round(a.zinsanteil * 100)).toBe(82);
  });
});

describe("sparplanVerlauf", () => {
  it("endet immer genau auf der gewünschten Laufzeit", () => {
    for (const jahre of [1, 7, 12, 40]) {
      const v = sparplanVerlauf(100, jahre, 0.05, 0, 5);
      expect(v[v.length - 1].jahr).toBe(jahre);
    }
  });

  it("liefert aufsteigende Stützpunkte", () => {
    const v = sparplanVerlauf(100, 30, 0.05);
    for (let i = 1; i < v.length; i++) {
      expect(v[i].jahr).toBeGreaterThan(v[i - 1].jahr);
      expect(v[i].gesamt).toBeGreaterThan(v[i - 1].gesamt);
    }
  });
});

describe("notgroschenZiel", () => {
  it("ist das Vielfache der Monatsausgaben", () => {
    expect(notgroschenZiel(2350, 4)).toBe(9400);
    expect(notgroschenZiel(2000)).toBe(8000); // Vorgabe: 4 Monate
    expect(notgroschenZiel(1500, 3)).toBe(4500);
    expect(notgroschenZiel(1500, 5)).toBe(7500);
  });
});

describe("Kaufkraft", () => {
  it("entwertet mit der Inflation", () => {
    // Im Vortrag: 100 € sind nach 10 Jahren bei 2 % rund 82 €, nach 20 rund 67 €.
    expect(Math.round(realerWert(100, 0.02, 10))).toBe(82);
    expect(Math.round(realerWert(100, 0.02, 20))).toBe(67);
  });

  it("lässt sich umkehren", () => {
    const heute = 10000;
    const spaeter = realerWert(heute, 0.025, 12);
    nahe(spaeter * Math.pow(1.025, 12), heute, 0.000001);
  });

  it("reale Rendite folgt Fisher, nicht der Differenz", () => {
    // 7 % nominal bei 2 % Inflation sind 4,90 %, nicht 5,00 %.
    expect(realeRendite(0.07, 0.02)).toBeCloseTo(0.0490196, 6);
    expect(realeRendite(0.07, 0.02)).toBeLessThan(0.05);
    expect(realeRendite(0.02, 0.02)).toBeCloseTo(0, 10);
    expect(realeRendite(0.01, 0.03)).toBeLessThan(0);
  });
});

describe("Saveback", () => {
  it("sind 1 % des Kartenumsatzes", () => {
    expect(savebackMonatlich(650)).toBeCloseTo(6.5, 10);
    expect(savebackMonatlich(0)).toBe(0);
  });

  it("ist bei 15 € im Monat gedeckelt", () => {
    expect(savebackMonatlich(1500)).toBe(SAVEBACK.deckelMonat);
    expect(savebackMonatlich(99999)).toBe(SAVEBACK.deckelMonat);
    expect(savebackMonatlich(1499)).toBeCloseTo(14.99, 10);
  });

  it("setzt einen laufenden Sparplan ab 50 € voraus", () => {
    const ohne = savebackEffekt(650, 49, 40, 0.07);
    expect(ohne.berechtigt).toBe(false);
    expect(ohne.proMonat).toBe(0);
    expect(ohne.extra).toBeNull();
    expect(ohne.zuwachsAnteil).toBe(0);

    const mit = savebackEffekt(650, 50, 40, 0.07);
    expect(mit.berechtigt).toBe(true);
    expect(mit.proMonat).toBeCloseTo(6.5, 10);
  });

  it("reproduziert die Zahlen der Saveback-Folie", () => {
    const e = savebackEffekt(650, 50, 40, 0.07);
    expect(Math.round(e.extra!.endkapital)).toBe(17061);
    expect(Math.round(e.ohne.endkapital)).toBe(131241);
    expect(Math.round(e.zuwachsAnteil * 100)).toBe(13);
    // 6,50 € über 480 Monate sind 3.120 € Einzahlung.
    expect(Math.round(e.extra!.einzahlungen)).toBe(3120);
  });

  it("meldet den erreichten Deckel", () => {
    expect(savebackEffekt(1000, 100, 10, 0.07).deckelErreicht).toBe(false);
    expect(savebackEffekt(1500, 100, 10, 0.07).deckelErreicht).toBe(true);
  });
});

describe("kostenVergleich", () => {
  it("zieht die Kosten von der Bruttorendite ab", () => {
    const k = kostenVergleich(200, 30, 0.07, 0.002, 0.015);
    nahe(k.a, referenzSparplan(200, 30, 0.07 - 0.002), 0.5);
    nahe(k.b, referenzSparplan(200, 30, 0.07 - 0.015), 0.5);
    expect(k.differenz).toBeCloseTo(Math.abs(k.a - k.b), 8);
    expect(k.einzahlungen).toBe(200 * 30 * MONATE_PRO_JAHR);
  });

  it("macht bei gleichen Kosten keinen Unterschied", () => {
    const k = kostenVergleich(200, 30, 0.07, 0.005, 0.005);
    expect(k.differenz).toBeCloseTo(0, 8);
  });

  it("ergibt die Größenordnung aus dem Vortrag", () => {
    const k = kostenVergleich(200, 30, 0.07, 0.002, 0.015);
    expect(Math.round(k.differenz)).toBeGreaterThan(51000);
    expect(Math.round(k.differenz)).toBeLessThan(53000);
  });
});

describe("rebalancing", () => {
  const positionen = [
    { name: "ETF", wert: 12000, sollAnteil: 0.8 },
    { name: "Krypto", wert: 4000, sollAnteil: 0.1 },
    { name: "P2P", wert: 1000, sollAnteil: 0.1 },
  ];

  it("rechnet Ist-Anteile, die zusammen eins ergeben", () => {
    const r = rebalancing(positionen);
    expect(r.gesamt).toBe(17000);
    nahe(r.zeilen.reduce((s, z) => s + z.istAnteil, 0), 1, 1e-10);
    expect(r.zeilen[0].istAnteil).toBeCloseTo(12000 / 17000, 10);
  });

  it("die Umschichtungen heben sich auf", () => {
    const r = rebalancing(positionen);
    nahe(r.zeilen.reduce((s, z) => s + z.differenzEuro, 0), 0, 1e-8);
  });

  it("zeigt an, was zu groß und was zu klein ist", () => {
    const r = rebalancing(positionen);
    const etf = r.zeilen.find((z) => z.name === "ETF")!;
    const krypto = r.zeilen.find((z) => z.name === "Krypto")!;
    expect(etf.abweichung).toBeLessThan(0); // untergewichtet
    expect(etf.differenzEuro).toBeGreaterThan(0); // also nachkaufen
    expect(krypto.abweichung).toBeGreaterThan(0); // übergewichtet
    expect(krypto.differenzEuro).toBeLessThan(0); // also abbauen
  });

  it("bricht bei leerem Depot nicht", () => {
    const r = rebalancing([{ name: "ETF", wert: 0, sollAnteil: 1 }]);
    expect(r.gesamt).toBe(0);
    expect(r.zeilen[0].istAnteil).toBe(0);
    expect(Number.isFinite(r.zeilen[0].differenzEuro)).toBe(true);
  });
});

describe("Steuern", () => {
  it("Abgeltungsteuer plus Soli sind 26,375 %", () => {
    expect(steuersatz()).toBeCloseTo(0.26375, 10);
  });

  it("Kirchensteuer ist als Sonderausgabe abziehbar", () => {
    // 9 % Kirchensteuer ergeben 27,99 % – nicht 28,63 %, wie es ohne den
    // Sonderausgabenabzug herauskäme. So steht es auch im Vortrag.
    expect(steuersatz(0.09)).toBeCloseTo(0.27995, 5);
    expect(steuersatz(0.08)).toBeCloseTo(0.27819, 5);
    expect(steuersatz(0.09)).toBeGreaterThan(steuersatz(0.08));
    expect(steuersatz(0.08)).toBeGreaterThan(steuersatz(0));
    expect(steuersatz(0.09)).toBeLessThan(0.28);
    // Ohne den Abzug wäre der Satz höher – genau das soll nicht passieren.
    expect(steuersatz(0.09)).toBeLessThan(0.25 * (1 + 0.055 + 0.09));
  });

  it("Teilfreistellung senkt den Satz auf rund 18,46 %", () => {
    expect(steuersatz(0, STEUER.teilfreistellungAktienfonds)).toBeCloseTo(0.1846, 4);
  });

  it("der Pauschbetrag bleibt steuerfrei", () => {
    const unter = kapitalertragsteuer(800);
    expect(unter.steuer).toBe(0);
    expect(unter.genutzterPauschbetrag).toBe(800);
    expect(unter.effektiverSatz).toBe(0);
  });

  it("rechnet mit demselben Satz wie steuersatz()", () => {
    const e = kapitalertragsteuer(2000, { kirchensteuer: 0.09, pauschbetragRest: 0 });
    expect(e.effektiverSatz).toBeCloseTo(steuersatz(0.09), 10);
  });

  it("besteuert nur den Teil oberhalb des Pauschbetrags", () => {
    const e = kapitalertragsteuer(2000);
    expect(e.genutzterPauschbetrag).toBe(STEUER.sparerpauschbetrag);
    expect(e.steuer).toBeCloseTo(1000 * 0.26375, 8);
    expect(e.effektiverSatz).toBeCloseTo(0.26375 / 2, 8);
  });

  it("berücksichtigt einen bereits verbrauchten Pauschbetrag", () => {
    const e = kapitalertragsteuer(1000, { pauschbetragRest: 0 });
    expect(e.steuer).toBeCloseTo(1000 * 0.26375, 8);
  });

  it("bleibt bei null Ertrag bei null", () => {
    const e = kapitalertragsteuer(0);
    expect(e.steuer).toBe(0);
    expect(e.effektiverSatz).toBe(0);
  });
});

describe("haltefrist", () => {
  it("endet ein Jahr und einen Tag nach dem Kauf", () => {
    const h = haltefrist(new Date("2026-03-15T12:00:00Z"), new Date("2026-03-15T12:00:00Z"));
    expect(h.steuerfreiAb.toISOString().slice(0, 10)).toBe("2027-03-16");
    expect(h.istSteuerfrei).toBe(false);
  });

  it("zählt die verbleibenden Tage", () => {
    const h = haltefrist(new Date("2026-03-15T12:00:00Z"), new Date("2027-03-06T12:00:00Z"));
    expect(h.tageBisSteuerfrei).toBe(10);
  });

  it("ist am Stichtag erreicht", () => {
    const h = haltefrist(new Date("2026-03-15T12:00:00Z"), new Date("2027-03-16T12:00:00Z"));
    expect(h.istSteuerfrei).toBe(true);
    expect(h.tageBisSteuerfrei).toBe(0);
  });

  it("meldet nie negative Tage", () => {
    const h = haltefrist(new Date("2020-01-01T00:00:00Z"), new Date("2026-01-01T00:00:00Z"));
    expect(h.tageBisSteuerfrei).toBe(0);
    expect(h.istSteuerfrei).toBe(true);
  });

  it("kommt mit dem 29. Februar zurecht", () => {
    const h = haltefrist(new Date("2028-02-29T12:00:00Z"), new Date("2028-03-01T12:00:00Z"));
    // 2029 hat keinen 29. Februar – JavaScript rollt auf den 1. März, plus ein Tag.
    expect(h.steuerfreiAb.getUTCFullYear()).toBe(2029);
    expect(h.istSteuerfrei).toBe(false);
  });
});

describe("gegenrechnung", () => {
  it("bleibt ohne Rest, wenn alles verteilt ist", () => {
    const g = gegenrechnung(3400, [650, 1200, 35, 170, 300, 1045]);
    expect(g.abfluesse).toBe(3400);
    expect(g.rest).toBe(0);
  });

  it("zeigt einen Überschuss positiv und eine Lücke negativ", () => {
    expect(gegenrechnung(3400, [3000]).rest).toBe(400);
    expect(gegenrechnung(3400, [3800]).rest).toBe(-400);
  });

  it("überspringt leere Felder", () => {
    const g = gegenrechnung(1000, [500, undefined as unknown as number, 0, Number.NaN ? 0 : 200]);
    expect(g.abfluesse).toBe(700);
  });
});

describe("vermoegensverlauf", () => {
  it("entspricht bei einem einzelnen Baustein dem Sparplan", () => {
    const jahre = 20;
    const v = vermoegensverlauf([{ start: 12000, rate: 400, zins: 0.07 }], jahre * 12);
    nahe(v[jahre * 12].netto, endkapitalSparplan(400, jahre, 0.07, 12000), 1);
  });

  it("beginnt beim heutigen Stand", () => {
    const v = vermoegensverlauf(
      [
        { start: 1200, rate: 0, zins: 0 },
        { start: 8000, rate: 250, zins: 0.069, istSchuld: true },
      ],
      120,
    );
    expect(v[0].brutto).toBe(1200);
    expect(v[0].schulden).toBe(8000);
    expect(v[0].netto).toBe(-6800);
    expect(v[0].eingezahlt).toBe(1200 - 8000);
  });

  it("tilgt Schulden und lässt sie nicht negativ werden", () => {
    const v = vermoegensverlauf([{ start: 8000, rate: 250, zins: 0.069, istSchuld: true }], 120);
    expect(v.every((p) => p.schulden >= 0)).toBe(true);
    expect(v[120].schulden).toBe(0);
    // Bei 6,9 % und 250 € Tilgung dauert es länger als 32 reine Ratenmonate.
    const getilgt = v.findIndex((p) => p.schulden === 0);
    expect(getilgt).toBeGreaterThan(32);
    expect(getilgt).toBeLessThan(40);
  });

  it("rechnet jeden Posten mit seinem eigenen Zins", () => {
    const gemischt = vermoegensverlauf(
      [
        { start: 10000, rate: 0, zins: 0 },
        { start: 10000, rate: 0, zins: 0.07 },
      ],
      120,
    );
    const einheitlich = vermoegensverlauf([{ start: 20000, rate: 0, zins: 0.07 }], 120);
    // Der zinslose Teil darf nicht mitwachsen.
    expect(gemischt[120].netto).toBeLessThan(einheitlich[120].netto);
    nahe(gemischt[120].netto, 10000 + 10000 * Math.pow(1 + 0.07 / 12, 120), 0.01);
  });

  it("zählt nur tatsächlich geleistete Tilgung als Einzahlung", () => {
    // Restschuld 100 €, Tilgung 250 €: Der letzte Monat kostet keine vollen 250 €.
    const v = vermoegensverlauf([{ start: 100, rate: 250, zins: 0, istSchuld: true }], 2);
    expect(v[1].schulden).toBe(0);
    expect(v[1].eingezahlt).toBe(-100 + 100);
    expect(v[2].eingezahlt).toBe(0);
  });

  it("liefert für jeden Monat einen Punkt, Start eingeschlossen", () => {
    const v = vermoegensverlauf([{ start: 0, rate: 100, zins: 0.05 }], 36);
    expect(v).toHaveLength(37);
    expect(v[0].monat).toBe(0);
    expect(v[36].monat).toBe(36);
  });

  it("kommt ohne Bausteine zurecht", () => {
    const v = vermoegensverlauf([], 12);
    expect(v[12].netto).toBe(0);
    expect(v[12].eingezahlt).toBe(0);
  });
});
