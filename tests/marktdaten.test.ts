import { describe, expect, it } from "vitest";
import { istFrisch, punkteAus, zinsFuerHeute, type Punkt } from "@/lib/marktdaten";

/**
 * Die EZB veröffentlicht Beschlüsse mit Wirksamkeitsdatum – auch künftige.
 * Wer einfach den letzten Eintrag nimmt, zeigt einen Zins an, der noch gar
 * nicht gilt. Genau das prüfen diese Tests.
 */

const verlauf: Punkt[] = [
  { zeit: "2025-02-05", wert: 2.75 },
  { zeit: "2025-03-12", wert: 2.5 },
  { zeit: "2025-04-23", wert: 2.25 },
  { zeit: "2025-06-11", wert: 2.0 },
  { zeit: "2026-06-17", wert: 2.25 },
  { zeit: "2026-09-16", wert: 2.5 },
];

describe("zinsFuerHeute", () => {
  it("nimmt den letzten Beschluss, der schon in Kraft ist", () => {
    const z = zinsFuerHeute(verlauf, new Date("2026-09-11T12:00:00Z"));
    expect(z.aktuell).toEqual({ wert: 0.0225, gueltigAb: "2026-06-17" });
  });

  it("weist einen beschlossenen, aber künftigen Satz getrennt aus", () => {
    const z = zinsFuerHeute(verlauf, new Date("2026-09-11T12:00:00Z"));
    expect(z.naechster).toEqual({ wert: 0.025, gueltigAb: "2026-09-16" });
  });

  it("übernimmt ihn am Tag des Wirksamwerdens", () => {
    const z = zinsFuerHeute(verlauf, new Date("2026-09-16T08:00:00Z"));
    expect(z.aktuell!.wert).toBe(0.025);
    expect(z.naechster).toBeUndefined();
  });

  it("rechnet Prozentangaben in Dezimalzahlen um", () => {
    const z = zinsFuerHeute([{ zeit: "2020-01-01", wert: 2.25 }], new Date("2026-01-01"));
    expect(z.aktuell!.wert).toBeCloseTo(0.0225, 10);
  });

  it("kommt mit unsortierten Daten zurecht", () => {
    const gemischt = [verlauf[3], verlauf[5], verlauf[0], verlauf[4]];
    const z = zinsFuerHeute(gemischt, new Date("2026-09-11T12:00:00Z"));
    expect(z.aktuell!.gueltigAb).toBe("2026-06-17");
  });

  it("hat nichts, wenn noch nichts in Kraft ist", () => {
    const z = zinsFuerHeute(verlauf, new Date("2024-01-01T12:00:00Z"));
    expect(z.aktuell).toBeUndefined();
    expect(z.naechster!.gueltigAb).toBe("2025-02-05");
  });

  it("bleibt bei leeren Daten still", () => {
    const z = zinsFuerHeute([], new Date());
    expect(z.aktuell).toBeUndefined();
    expect(z.naechster).toBeUndefined();
  });
});

describe("punkteAus", () => {
  const antwort = {
    dataSets: [
      {
        series: {
          "0:0:0:0:0:0:0": {
            observations: { "0": [2.25, 0], "1": [2.5, 0] },
          },
        },
      },
    ],
    structure: {
      dimensions: {
        observation: [{ values: [{ id: "2026-06-17" }, { id: "2026-09-16" }] }],
      },
    },
  };

  it("liest Zeit und Wert zusammen", () => {
    expect(punkteAus(antwort)).toEqual([
      { zeit: "2026-06-17", wert: 2.25 },
      { zeit: "2026-09-16", wert: 2.5 },
    ]);
  });

  it("überspringt Lücken in der Reihe", () => {
    const mitLuecke = {
      ...antwort,
      dataSets: [
        { series: { s: { observations: { "0": [null], "1": [2.5] } } } },
      ],
    };
    expect(punkteAus(mitLuecke)).toEqual([{ zeit: "2026-09-16", wert: 2.5 }]);
  });

  it("gibt bei unerwarteten Antworten nichts zurück, statt zu stürzen", () => {
    expect(punkteAus(null)).toEqual([]);
    expect(punkteAus({})).toEqual([]);
    expect(punkteAus({ dataSets: [] })).toEqual([]);
    expect(punkteAus("<html>Fehlerseite</html>")).toEqual([]);
  });
});

describe("istFrisch", () => {
  const jetzt = new Date("2026-09-11T12:00:00Z").getTime();

  it("hält einen Stand von heute für frisch", () => {
    expect(istFrisch({ geholt: "2026-09-11T06:00:00Z" }, jetzt)).toBe(true);
  });

  it("hält einen Stand von vorgestern für alt", () => {
    expect(istFrisch({ geholt: "2026-09-09T06:00:00Z" }, jetzt)).toBe(false);
  });

  it("hält nichts für frisch, wenn nie geholt wurde", () => {
    expect(istFrisch(null, jetzt)).toBe(false);
    expect(istFrisch({}, jetzt)).toBe(false);
  });
});
