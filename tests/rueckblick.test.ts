import { describe, expect, it } from "vitest";
import { ausgabenrueckblick, monateZwischen, rueckblick, vermoegensrueckblick } from "@/lib/rueckblick";
import { LEER, type Daten, type Momentaufnahme } from "@/lib/store";

const HEUTE = new Date("2026-09-13T12:00:00Z");

const m = (datum: string, gesamt: number): Momentaufnahme => ({ datum, gesamt, anlagen: gesamt, schulden: 0 });

function stand(aenderung: Partial<Daten> = {}): Daten {
  return {
    ...LEER,
    nettomonatsausgaben: 2000,
    bilanz: [
      { id: "1", art: "konto", name: "Notgroschen", wert: 8000, sparrate: 100 },
      { id: "2", art: "depot", name: "ETF", wert: 20000, sparrate: 400, sollAnteil: 1 },
    ],
    verlauf: [m("2025-12-15", 20000), m("2026-03-01", 22000), m("2026-06-01", 25000), m("2026-09-01", 28000)],
    ausgaben: [
      { id: "a", datum: "2026-01-10", betrag: 1500, kategorie: "Täglicher Bedarf" },
      { id: "b", datum: "2026-02-10", betrag: 2500, kategorie: "Täglicher Bedarf" },
      { id: "c", datum: "2026-03-10", betrag: 1000, kategorie: "Freizeit" },
      { id: "d", datum: "2026-09-10", betrag: 9999, kategorie: "Freizeit" }, // laufender Monat
    ],
    dauerausgaben: [{ id: "f", name: "Miete", betrag: 800, kategorie: "Fixkosten", rhythmus: 1, ab: "2026-01" }],
    ...aenderung,
  };
}

describe("monateZwischen", () => {
  it("zählt ganze Monate", () => {
    expect(monateZwischen("2026-01-01", "2026-04-01")).toBe(3);
    expect(monateZwischen("2025-12-15", "2026-09-01")).toBe(9);
  });
  it("wird nie negativ", () => {
    expect(monateZwischen("2026-05-01", "2026-01-01")).toBe(0);
  });
});

describe("vermoegensrueckblick", () => {
  it("nimmt als Ausgangspunkt den letzten Stand vor dem Jahr", () => {
    const v = vermoegensrueckblick(stand().verlauf, 2026, 500);
    expect(v.anfang!.datum).toBe("2025-12-15");
    expect(v.ende!.datum).toBe("2026-09-01");
    expect(v.veraenderung).toBe(8000);
  });

  it("trennt Einzahlung und Markt", () => {
    const v = vermoegensrueckblick(stand().verlauf, 2026, 500);
    // Dezember bis September: 9 Monate à 500 € = 4.500 € eingezahlt.
    expect(v.geschaetzteEinzahlung).toBe(4500);
    expect(v.geschaetzterMarkt).toBe(3500);
  });

  it("nimmt sonst den ersten Stand im Jahr", () => {
    const v = vermoegensrueckblick([m("2026-02-01", 100), m("2026-08-01", 300)], 2026, 0);
    expect(v.anfang!.datum).toBe("2026-02-01");
    expect(v.veraenderung).toBe(200);
  });

  it("bleibt ohne zwei Punkte ohne Veränderung", () => {
    expect(vermoegensrueckblick([m("2026-05-01", 100)], 2026, 100).veraenderung).toBeUndefined();
    expect(vermoegensrueckblick([], 2026, 100).veraenderung).toBeUndefined();
  });

  it("ignoriert Punkte aus anderen Jahren als Endpunkt", () => {
    const v = vermoegensrueckblick([m("2026-01-01", 10), m("2027-01-01", 99)], 2026, 0);
    expect(v.ende!.datum).toBe("2026-01-01");
  });
});

describe("ausgabenrueckblick", () => {
  it("lässt den laufenden Monat weg", () => {
    const a = ausgabenrueckblick(stand(), 2026, HEUTE);
    expect(a.monate.map((x) => x.monat)).not.toContain("2026-09");
    expect(a.monate.every((x) => x.summe < 9999)).toBe(true);
  });

  it("rechnet feste Posten in jeden Monat", () => {
    const a = ausgabenrueckblick(stand(), 2026, HEUTE);
    // Januar bis August: acht Monate Miete plus drei Einzelbuchungen.
    expect(a.monate).toHaveLength(8);
    expect(a.summe).toBe(8 * 800 + 1500 + 2500 + 1000);
  });

  it("findet teuersten und günstigsten Monat", () => {
    const a = ausgabenrueckblick(stand(), 2026, HEUTE);
    expect(a.teuerster!.monat).toBe("2026-02");
    expect(a.guenstigster!.summe).toBe(800);
  });

  it("kennt den Anteil der festen Ausgaben", () => {
    const a = ausgabenrueckblick(stand(), 2026, HEUTE);
    expect(a.festerAnteil).toBeCloseTo((8 * 800) / a.summe, 10);
  });

  it("sortiert Kategorien nach Summe, Anteile ergeben eins", () => {
    const a = ausgabenrueckblick(stand(), 2026, HEUTE);
    expect(a.kategorien[0].kategorie).toBe("Fixkosten");
    expect(a.kategorien.reduce((s, k) => s + k.anteil, 0)).toBeCloseTo(1, 10);
  });

  it("kommt mit nichts zurecht", () => {
    const a = ausgabenrueckblick(LEER, 2026, HEUTE);
    expect(a.summe).toBe(0);
    expect(a.schnitt).toBeUndefined();
    expect(a.teuerster).toBeUndefined();
  });
});

describe("rueckblick", () => {
  it("formuliert Sätze nur, wo Daten sind", () => {
    const r = rueckblick(stand(), HEUTE);
    expect(r.jahr).toBe(2026);
    expect(r.saetze.some((s) => s.includes("gewachsen"))).toBe(true);
    expect(r.saetze.some((s) => s.includes("vom Markt"))).toBe(true);
    expect(r.saetze.some((s) => s.includes("Notgroschen ist voll"))).toBe(true);
  });

  it("nennt einen Rückgang beim Namen", () => {
    const r = rueckblick(stand({ verlauf: [m("2025-12-15", 30000), m("2026-09-01", 27000)] }), HEUTE);
    expect(r.saetze[0]).toContain("gesunken");
    expect(r.saetze.some((s) => s.includes("wieder genommen"))).toBe(true);
  });

  it("bleibt bei leerem Stand still, ohne zu stürzen", () => {
    const r = rueckblick(LEER, HEUTE);
    expect(r.saetze).toEqual([]);
    expect(r.notgroschen.erreicht).toBe(false);
  });

  it("zählt erledigte Punkte", () => {
    const r = rueckblick(stand({ erledigt: ["freistellung"] }), HEUTE);
    expect(r.erledigt.anzahl).toBeGreaterThan(0);
    expect(r.erledigt.titel).toContain("Freistellungsauftrag erteilen");
  });
});
