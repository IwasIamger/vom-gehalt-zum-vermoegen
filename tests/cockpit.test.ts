import { describe, expect, it } from "vitest";
import {
  REBALANCING_SCHWELLE,
  aufgaben,
  bausteine,
  mischrendite,
  notgroschen,
  pauschbetrag,
  prognose,
  renditeVon,
  sollIst,
  sparrateGesamt,
  summen,
} from "@/lib/cockpit";
import { endkapitalSparplan } from "@/lib/finance";
import { LEER, RENDITE_VORGABE, type Daten, type Posten } from "@/lib/store";

/** Ein vollständiger Stand, wie ihn jemand nach dem Einstieg hätte. */
function stand(aenderung: Partial<Daten> = {}): Daten {
  return {
    ...LEER,
    nettomonatsausgaben: 2350,
    zufluesse: { gehalt: 3400 },
    bilanz: [
      { id: "1", art: "konto", name: "Hauptkonto", wert: 1200, rendite: 0 },
      { id: "2", art: "konto", name: "Notgroschen", wert: 6000, sparrate: 200 },
      { id: "3", art: "depot", name: "ETF", wert: 12000, sparrate: 400, sollAnteil: 0.8 },
      { id: "4", art: "depot", name: "Krypto", wert: 4000, sparrate: 50, sollAnteil: 0.1 },
      { id: "5", art: "depot", name: "P2P", wert: 1000, sparrate: 50, sollAnteil: 0.1 },
      { id: "6", art: "sachwert", name: "Auto", wert: 5000 },
      { id: "7", art: "schuld", name: "Autokredit", wert: 8000, sparrate: 250, rendite: 0.069 },
    ],
    ...aenderung,
  };
}

describe("summen", () => {
  it("trennt Konten, Depots, Sachwerte und Schulden", () => {
    const s = summen(stand().bilanz);
    expect(s.konten).toBe(7200);
    expect(s.anlagen).toBe(17000);
    expect(s.sachwerte).toBe(5000);
    expect(s.schulden).toBe(8000);
  });

  it("zieht Schulden vom Vermögen ab, statt sie mitzuzählen", () => {
    const s = summen(stand().bilanz);
    expect(s.brutto).toBe(7200 + 17000 + 5000);
    expect(s.netto).toBe(s.brutto - 8000);
  });

  it("behandelt leere Beträge als null", () => {
    const s = summen([{ id: "a", art: "konto", name: "Ohne Betrag" }]);
    expect(s.netto).toBe(0);
  });

  it("kann ein negatives Nettovermögen ausweisen", () => {
    const s = summen([
      { id: "a", art: "konto", name: "Giro", wert: 500 },
      { id: "b", art: "schuld", name: "Dispo", wert: 2000 },
    ]);
    expect(s.netto).toBe(-1500);
  });
});

describe("sparrateGesamt", () => {
  it("zählt zusammen, was in Vermögen fließt", () => {
    expect(sparrateGesamt(stand().bilanz)).toBe(200 + 400 + 50 + 50);
  });

  it("zählt die Tilgung nicht als Sparrate", () => {
    // Die 250 € Tilgung sind zwar sinnvoll, aber kein Sparplan.
    expect(sparrateGesamt(stand().bilanz)).not.toContain(250);
    expect(sparrateGesamt([{ id: "a", art: "schuld", name: "Kredit", sparrate: 250 }])).toBe(0);
  });
});

describe("renditeVon", () => {
  const d = stand();

  it("nimmt die eigene Annahme, wenn eine da ist", () => {
    expect(renditeVon(d.bilanz[0], d)).toBe(0); // Hauptkonto ausdrücklich 0 %
    expect(renditeVon(d.bilanz[6], d)).toBe(0.069); // Kreditzins
  });

  it("nimmt sonst die Vorgabe der Klasse", () => {
    expect(renditeVon(d.bilanz[1], d)).toBe(RENDITE_VORGABE.konto);
    expect(renditeVon(d.bilanz[5], d)).toBe(RENDITE_VORGABE.sachwert);
  });

  it("lässt Depots der allgemeinen Renditeannahme folgen", () => {
    expect(renditeVon(d.bilanz[2], d)).toBe(0.07);
    const sparsam = stand({ einstellungen: { ...LEER.einstellungen, renditeAnnahme: 0.04 } });
    expect(renditeVon(sparsam.bilanz[2], sparsam)).toBe(0.04);
  });

  it("unterscheidet eine eingetragene Null von keiner Angabe", () => {
    const d0 = stand();
    expect(renditeVon(d0.bilanz[0], d0)).toBe(0);
    expect(renditeVon({ id: "x", art: "konto", name: "Tagesgeld" }, d0)).toBe(RENDITE_VORGABE.konto);
  });
});

describe("mischrendite", () => {
  it("gewichtet nach Wert, nicht nach Anzahl", () => {
    const d = stand({
      bilanz: [
        { id: "a", art: "konto", name: "Giro", wert: 9000, rendite: 0 },
        { id: "b", art: "depot", name: "ETF", wert: 1000, rendite: 0.1 },
      ],
    });
    expect(mischrendite(d)).toBeCloseTo(0.01, 10);
  });

  it("lässt Schulden außen vor", () => {
    const d = stand({
      bilanz: [
        { id: "a", art: "depot", name: "ETF", wert: 1000, rendite: 0.07 },
        { id: "b", art: "schuld", name: "Kredit", wert: 5000, rendite: 0.1 },
      ],
    });
    expect(mischrendite(d)).toBeCloseTo(0.07, 10);
  });

  it("ist ohne Vermögen nicht definiert", () => {
    expect(mischrendite(stand({ bilanz: [] }))).toBeUndefined();
  });
});

describe("sollIst", () => {
  it("rechnet Ist-Anteile über die Depots", () => {
    const s = sollIst(stand().bilanz);
    expect(s.gesamt).toBe(17000);
    expect(s.zeilen).toHaveLength(3);
    expect(s.vollstaendig).toBe(true);
  });

  it("normiert krumme Soll-Angaben auf 100 %", () => {
    // Wer 8 / 1 / 1 einträgt, meint 80 / 10 / 10.
    const s = sollIst([
      { id: "a", art: "depot", name: "ETF", wert: 8000, sollAnteil: 8 },
      { id: "b", art: "depot", name: "Krypto", wert: 1000, sollAnteil: 1 },
      { id: "c", art: "depot", name: "P2P", wert: 1000, sollAnteil: 1 },
    ]);
    expect(s.zeilen[0].sollAnteil).toBeCloseTo(0.8, 10);
    expect(s.zeilen.reduce((x, z) => x + z.sollAnteil, 0)).toBeCloseTo(1, 10);
  });

  it("meldet unvollständige Aufteilungen", () => {
    const s = sollIst([
      { id: "a", art: "depot", name: "ETF", wert: 1000, sollAnteil: 0.8 },
      { id: "b", art: "depot", name: "Krypto", wert: 1000, sollAnteil: 0.1 },
    ]);
    expect(s.summeSoll).toBeCloseTo(0.9, 10);
    expect(s.vollstaendig).toBe(false);
  });

  it("findet die größte Abweichung", () => {
    const s = sollIst(stand().bilanz);
    // ETF weicht um 9,4 Punkte ab (70,6 gegen 80), Krypto um 13,5 (23,5 gegen 10).
    // Gemeldet wird der größere der beiden.
    expect(s.groessteAbweichung).toBeCloseTo(4000 / 17000 - 0.1, 6);
    expect(s.groessteAbweichung).toBeGreaterThan(0.8 - 12000 / 17000);
    expect(s.groessteAbweichung).toBeGreaterThan(REBALANCING_SCHWELLE);
  });

  it("ignoriert Posten ohne Soll-Anteil", () => {
    const s = sollIst([
      { id: "a", art: "depot", name: "ETF", wert: 1000, sollAnteil: 1 },
      { id: "b", art: "depot", name: "Spielgeld", wert: 500 },
      { id: "c", art: "konto", name: "Giro", wert: 9000 },
    ]);
    expect(s.zeilen).toHaveLength(1);
    expect(s.gesamt).toBe(1000);
  });
});

describe("prognose", () => {
  it("beginnt beim heutigen Nettovermögen", () => {
    const d = stand();
    expect(prognose(d, 20)[0].nominal).toBe(summen(d.bilanz).netto);
    expect(prognose(d, 20)[0].jahr).toBe(0);
  });

  it("endet genau auf dem gewählten Zeitraum", () => {
    for (const jahre of [1, 5, 12, 20, 45]) {
      const p = prognose(stand(), jahre);
      expect(p[p.length - 1].jahr).toBe(jahre);
    }
  });

  it("stimmt bei einem einzigen Depot mit dem Sparplan überein", () => {
    const d = stand({
      bilanz: [{ id: "a", art: "depot", name: "ETF", wert: 10000, sparrate: 300, sollAnteil: 1 }],
    });
    const p = prognose(d, 15);
    const erwartet = endkapitalSparplan(300, 15, 0.07, 10000);
    expect(Math.abs(p[p.length - 1].nominal - erwartet)).toBeLessThan(1);
  });

  it("schreibt ein zinsloses Konto nicht fort", () => {
    const d = stand({
      bilanz: [{ id: "a", art: "konto", name: "Hauptkonto", wert: 5000, rendite: 0 }],
    });
    const p = prognose(d, 30);
    expect(p[p.length - 1].nominal).toBeCloseTo(5000, 6);
  });

  it("liegt real immer unter nominal, solange es Inflation gibt", () => {
    const p = prognose(stand(), 20);
    for (const punkt of p.slice(1)) expect(punkt.real).toBeLessThan(punkt.nominal);
    expect(p[0].real).toBeCloseTo(p[0].nominal, 6);
  });

  it("ohne Inflation sind real und nominal gleich", () => {
    const d = stand({ einstellungen: { ...LEER.einstellungen, inflationAnnahme: 0 } });
    for (const punkt of prognose(d, 10)) expect(punkt.real).toBeCloseTo(punkt.nominal, 6);
  });

  it("wächst über die Zeit", () => {
    const p = prognose(stand(), 30);
    for (let i = 1; i < p.length; i++) expect(p[i].nominal).toBeGreaterThan(p[i - 1].nominal);
  });

  it("weist Zinsen als Differenz zur Einzahlung aus", () => {
    const p = prognose(stand(), 20);
    const letzte = p[p.length - 1];
    expect(letzte.nominal).toBeGreaterThan(letzte.eingezahlt);
  });
});

describe("bausteine", () => {
  it("markiert Schulden als solche", () => {
    const b = bausteine(stand());
    expect(b.filter((x) => x.istSchuld)).toHaveLength(1);
    expect(b.find((x) => x.istSchuld)!.zins).toBe(0.069);
  });
});

describe("notgroschen", () => {
  it("findet das Konto am Namen", () => {
    const n = notgroschen(stand());
    expect(n.stand).toBe(6000);
    expect(n.ziel).toBe(9400);
    expect(n.anteil).toBeCloseTo(6000 / 9400, 10);
  });

  it("erkennt auch die Schreibweise Rücklage", () => {
    const d = stand({
      bilanz: [{ id: "a", art: "konto", name: "Rücklage", wert: 4000 }],
    });
    expect(notgroschen(d).stand).toBe(4000);
  });

  it("bleibt ohne Monatsausgaben ohne Ziel", () => {
    const n = notgroschen(stand({ nettomonatsausgaben: undefined }));
    expect(n.ziel).toBeUndefined();
    expect(n.anteil).toBeUndefined();
  });

  it("folgt der eingestellten Monatszahl", () => {
    const d = stand({ einstellungen: { ...LEER.einstellungen, notgroschenMonate: 3 } });
    expect(notgroschen(d).ziel).toBe(3 * 2350);
  });
});

describe("pauschbetrag", () => {
  it("meldet nichts zu holen, wenn der Auftrag reicht", () => {
    const d = stand({ steuer: { ertraegeJahr: 300, freistellungsauftrag: 1000 } });
    expect(pauschbetrag(d).zuVielSteuer).toBe(0);
    expect(pauschbetrag(d).ungenutzt).toBe(700);
  });

  it("rechnet die unnötige Steuer aus", () => {
    const d = stand({ steuer: { ertraegeJahr: 800, freistellungsauftrag: 200 } });
    const p = pauschbetrag(d);
    // 600 € stünden steuerfrei zu, werden aber mit 26,375 % belastet.
    expect(p.zuVielSteuer).toBeCloseTo(600 * 0.26375, 6);
  });

  it("rechnet über den Pauschbetrag hinaus nichts schön", () => {
    const d = stand({ steuer: { ertraegeJahr: 5000, freistellungsauftrag: 1000 } });
    expect(pauschbetrag(d).zuVielSteuer).toBe(0);
  });

  it("berücksichtigt die Kirchensteuer", () => {
    const ohne = pauschbetrag(stand({ steuer: { ertraegeJahr: 800, freistellungsauftrag: 0 } }));
    const mit = pauschbetrag(
      stand({ steuer: { ertraegeJahr: 800, freistellungsauftrag: 0, kirchensteuer: 0.09 } }),
    );
    expect(mit.zuVielSteuer).toBeGreaterThan(ohne.zuVielSteuer);
  });
});

describe("aufgaben", () => {
  const finde = (d: Daten, id: string) => aufgaben(d).find((a) => a.id === id)!;

  it("hakt die Ausgabenerfassung ab, sobald die Zahl steht", () => {
    expect(finde(stand({ nettomonatsausgaben: undefined }), "ausgaben").erfuellt).toBe(false);
    expect(finde(stand(), "ausgaben").erfuellt).toBe(true);
  });

  it("hakt die Bilanz ab, sobald ein Betrag eingetragen ist", () => {
    expect(finde(stand({ bilanz: [] }), "bilanz").erfuellt).toBe(false);
    expect(finde(stand(), "bilanz").erfuellt).toBe(true);
  });

  it("meldet offene Schulden namentlich", () => {
    const a = finde(stand(), "schulden");
    expect(a.erfuellt).toBe(false);
    expect(a.text).toContain("Autokredit");
  });

  it("ist ohne Schulden zufrieden", () => {
    const d = stand({ bilanz: stand().bilanz.filter((p: Posten) => p.art !== "schuld") });
    expect(finde(d, "schulden").erfuellt).toBe(true);
  });

  it("hakt den Notgroschen erst bei vollem Ziel ab", () => {
    expect(finde(stand(), "notgroschen").erfuellt).toBe(false);
    const voll = stand({
      bilanz: stand().bilanz.map((p: Posten) =>
        p.name === "Notgroschen" ? { ...p, wert: 9400 } : p,
      ),
    });
    expect(finde(voll, "notgroschen").erfuellt).toBe(true);
  });

  it("hakt das Rebalancing nur innerhalb der Toleranz ab", () => {
    expect(finde(stand(), "rebalancing").erfuellt).toBe(false);
    const passend = stand({
      bilanz: [
        { id: "a", art: "depot", name: "ETF", wert: 8000, sollAnteil: 0.8 },
        { id: "b", art: "depot", name: "Krypto", wert: 1000, sollAnteil: 0.1 },
        { id: "c", art: "depot", name: "P2P", wert: 1000, sollAnteil: 0.1 },
      ],
    });
    expect(finde(passend, "rebalancing").erfuellt).toBe(true);
  });

  it("verlangt den vollen Freistellungsauftrag", () => {
    expect(finde(stand({ steuer: { freistellungsauftrag: 400 } }), "freistellung").erfuellt).toBe(false);
    expect(finde(stand({ steuer: { freistellungsauftrag: 1000 } }), "freistellung").erfuellt).toBe(true);
  });

  it("gibt jedem Punkt eine eindeutige Kennung", () => {
    const ids = aufgaben(stand()).map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("übersteht einen völlig leeren Stand", () => {
    expect(() => aufgaben(LEER)).not.toThrow();
    expect(aufgaben(LEER).every((a) => typeof a.text === "string" && a.text.length > 0)).toBe(true);
  });
});
