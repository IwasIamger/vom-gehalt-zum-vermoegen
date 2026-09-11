import { describe, expect, it } from "vitest";
import {
  dauerFuerMonat,
  faelligIn,
  fortschritt,
  laufenderMonat,
  monatKurz,
  monatName,
  monatVon,
  neueste,
  proMonat,
  proTag,
  schnitt,
  volleMonate,
} from "@/lib/ausgaben";
import type { Ausgabe, Dauerausgabe } from "@/lib/store";

/**
 * Der laufende Monat darf den Schnitt nicht verfälschen. Alle Tests rechnen
 * deshalb gegen ein festes "Heute", statt sich auf die Systemuhr zu verlassen.
 */
const HEUTE = new Date("2026-09-11T12:00:00Z");

let zaehler = 0;
const a = (datum: string, betrag: number, kategorie = "Täglicher Bedarf"): Ausgabe => ({
  id: `e${zaehler++}`,
  datum,
  betrag,
  kategorie,
});

const juniBisSeptember: Ausgabe[] = [
  a("2026-06-03", 1000),
  a("2026-06-20", 1200, "Fixkosten"),
  a("2026-07-05", 900),
  a("2026-07-19", 983, "Fixkosten"),
  a("2026-08-02", 1100),
  a("2026-08-28", 1108, "Auto"),
  a("2026-09-01", 200),
  a("2026-09-10", 223, "Freizeit"),
];

describe("monatVon", () => {
  it("schneidet den Tag ab", () => {
    expect(monatVon("2026-09-11")).toBe("2026-09");
    expect(monatVon("2026-01-01")).toBe("2026-01");
  });

  it("sortiert sich als Zeichenkette richtig", () => {
    const monate = ["2026-10", "2026-09", "2027-01", "2026-02"].sort();
    expect(monate).toEqual(["2026-02", "2026-09", "2026-10", "2027-01"]);
  });
});

describe("Monatsnamen", () => {
  it("schreibt sie deutsch aus", () => {
    expect(monatName("2026-01")).toBe("Januar 2026");
    expect(monatName("2026-09")).toBe("September 2026");
    expect(monatName("2026-12")).toBe("Dezember 2026");
  });

  it("kürzt sie für Diagramme", () => {
    expect(monatKurz("2026-03")).toBe("Mär 26");
    expect(monatKurz("2026-12")).toBe("Dez 26");
  });
});

describe("proMonat", () => {
  it("fasst nach Monat zusammen und sortiert aufsteigend", () => {
    const m = proMonat(juniBisSeptember);
    expect(m.map((x) => x.monat)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09"]);
    expect(m[0].summe).toBe(2200);
    expect(m[0].anzahl).toBe(2);
  });

  it("schlüsselt nach Kategorie auf, größte zuerst", () => {
    const august = proMonat(juniBisSeptember).find((m) => m.monat === "2026-08")!;
    expect(august.proKategorie[0].kategorie).toBe("Auto");
    expect(august.proKategorie[0].summe).toBe(1108);
    expect(august.proKategorie.reduce((s, k) => s + k.summe, 0)).toBe(august.summe);
  });

  it("addiert mehrere Einträge derselben Kategorie", () => {
    const m = proMonat([a("2026-05-01", 10), a("2026-05-02", 15), a("2026-05-03", 5, "Auto")]);
    expect(m[0].proKategorie).toEqual([
      { kategorie: "Täglicher Bedarf", summe: 25 },
      { kategorie: "Auto", summe: 5 },
    ]);
  });

  it("liefert für nichts auch nichts", () => {
    expect(proMonat([])).toEqual([]);
  });
});

describe("volleMonate", () => {
  it("lässt den laufenden Monat weg", () => {
    const v = volleMonate(juniBisSeptember, [], HEUTE);
    expect(v.map((m) => m.monat)).toEqual(["2026-06", "2026-07", "2026-08"]);
  });

  it("ist am Monatsersten genauso streng", () => {
    const v = volleMonate(juniBisSeptember, [], new Date("2026-09-01T00:30:00Z"));
    expect(v.map((m) => m.monat)).not.toContain("2026-09");
  });

  it("nimmt den Vormonat auf, sobald er vorbei ist", () => {
    const v = volleMonate(juniBisSeptember, [], new Date("2026-10-01T12:00:00Z"));
    expect(v.map((m) => m.monat)).toContain("2026-09");
  });
});

describe("schnitt", () => {
  it("mittelt nur über abgeschlossene Monate", () => {
    const s = schnitt(juniBisSeptember, [], 3, HEUTE);
    // (2200 + 1883 + 2208) / 3 – der September bleibt außen vor.
    expect(s.wert).toBeCloseTo((2200 + 1883 + 2208) / 3, 8);
    expect(s.monate).toBe(3);
    expect(s.belastbar).toBe(true);
  });

  it("nimmt die jüngsten Monate, nicht die ältesten", () => {
    const lang = [a("2026-01-15", 100), ...juniBisSeptember];
    const s = schnitt(lang, [], 3, HEUTE);
    expect(s.genutzt.map((m) => m.monat)).toEqual(["2026-06", "2026-07", "2026-08"]);
  });

  it("meldet sich als noch nicht belastbar", () => {
    const s = schnitt([a("2026-08-01", 500)], [], 3, HEUTE);
    expect(s.monate).toBe(1);
    expect(s.belastbar).toBe(false);
    expect(s.wert).toBe(500);
  });

  it("bleibt ohne vollen Monat ohne Wert", () => {
    const s = schnitt([a("2026-09-05", 300)], [], 3, HEUTE);
    expect(s.wert).toBeUndefined();
    expect(s.monate).toBe(0);
    expect(s.belastbar).toBe(false);
  });

  it("kommt mit gar keinen Daten zurecht", () => {
    const s = schnitt([], [], 3, HEUTE);
    expect(s.wert).toBeUndefined();
    expect(s.genutzt).toEqual([]);
  });

  it("lässt sich auf andere Zeiträume einstellen", () => {
    expect(schnitt(juniBisSeptember, [], 2, HEUTE).genutzt.map((m) => m.monat)).toEqual([
      "2026-07",
      "2026-08",
    ]);
  });
});

describe("fortschritt", () => {
  it("zählt ab dem ersten Eintrag", () => {
    const f = fortschritt(juniBisSeptember, [], 3, HEUTE);
    expect(f.seit).toBe("2026-06-03");
    expect(f.volleMonate).toBe(3);
    expect(f.fehlend).toBe(0);
  });

  it("rechnet die Tage einschließlich des ersten", () => {
    const f = fortschritt([a("2026-09-11", 10)], [], 3, new Date("2026-09-11T23:00:00Z"));
    expect(f.tage).toBe(1);
  });

  it("sagt, wie viele Monate noch fehlen", () => {
    const f = fortschritt([a("2026-08-01", 500)], [], 3, HEUTE);
    expect(f.volleMonate).toBe(1);
    expect(f.fehlend).toBe(2);
  });

  it("beginnt bei null", () => {
    const f = fortschritt([], [], 3, HEUTE);
    expect(f.seit).toBeUndefined();
    expect(f.tage).toBe(0);
    expect(f.fehlend).toBe(3);
  });

  it("findet den frühesten Eintrag, egal in welcher Reihenfolge er kam", () => {
    const durcheinander = [a("2026-08-01", 10), a("2026-06-01", 10), a("2026-07-01", 10)];
    expect(fortschritt(durcheinander, [], 3, HEUTE).seit).toBe("2026-06-01");
  });
});

describe("neueste", () => {
  it("sortiert absteigend nach Datum", () => {
    const n = neueste(juniBisSeptember);
    expect(n[0].datum).toBe("2026-09-10");
    expect(n[n.length - 1].datum).toBe("2026-06-03");
  });

  it("begrenzt auf Wunsch", () => {
    expect(neueste(juniBisSeptember, 3)).toHaveLength(3);
  });

  it("lässt die Vorlage unberührt", () => {
    const vorher = juniBisSeptember.map((x) => x.datum);
    neueste(juniBisSeptember);
    expect(juniBisSeptember.map((x) => x.datum)).toEqual(vorher);
  });
});

describe("proTag", () => {
  it("gruppiert nach Tag, neueste zuerst", () => {
    const t = proTag(juniBisSeptember);
    expect(t[0].datum).toBe("2026-09-10");
    expect(t).toHaveLength(8); // hier hat jeder Eintrag seinen eigenen Tag
  });

  it("legt mehrere Einträge eines Tages zusammen", () => {
    const t = proTag([a("2026-09-10", 10), a("2026-09-10", 15), a("2026-09-09", 7)]);
    expect(t[0].datum).toBe("2026-09-10");
    expect(t[0].eintraege).toHaveLength(2);
    expect(t[0].summe).toBe(25);
  });

  it("die Tagessummen ergeben zusammen die Gesamtsumme", () => {
    const gesamt = juniBisSeptember.reduce((s, x) => s + x.betrag, 0);
    expect(proTag(juniBisSeptember).reduce((s, t) => s + t.summe, 0)).toBeCloseTo(gesamt, 8);
  });
});

describe("laufenderMonat", () => {
  it("gibt den Monat im selben Format zurück wie monatVon", () => {
    expect(laufenderMonat(HEUTE)).toBe("2026-09");
    expect(laufenderMonat(HEUTE)).toBe(monatVon("2026-09-11"));
  });
});

// ─────────────────────────────────────────────────── Wiederkehrende Ausgaben

const dauer = (
  name: string,
  betrag: number,
  rhythmus: number,
  ab: string,
  bis?: string,
  kategorie = "Fixkosten",
): Dauerausgabe => ({ id: `d${zaehler++}`, name, betrag, kategorie, rhythmus, ab, bis });

describe("faelligIn", () => {
  const miete = dauer("Miete", 820, 1, "2026-06");

  it("greift ab dem Startmonat, nicht davor", () => {
    expect(faelligIn(miete, "2026-05")).toBe(false);
    expect(faelligIn(miete, "2026-06")).toBe(true);
    expect(faelligIn(miete, "2026-09")).toBe(true);
  });

  it("trifft beim Quartalsrhythmus jeden dritten Monat", () => {
    const q = dauer("Versicherung", 300, 3, "2026-02");
    expect(["2026-02", "2026-05", "2026-08", "2026-11"].every((m) => faelligIn(q, m))).toBe(true);
    expect(["2026-03", "2026-04", "2026-06", "2026-07"].some((m) => faelligIn(q, m))).toBe(false);
  });

  it("trifft beim Jahresrhythmus denselben Monat im Folgejahr", () => {
    const j = dauer("KFZ-Steuer", 180, 12, "2026-03");
    expect(faelligIn(j, "2026-03")).toBe(true);
    expect(faelligIn(j, "2027-03")).toBe(true);
    expect(faelligIn(j, "2026-09")).toBe(false);
  });

  it("hört nach dem Endmonat auf", () => {
    const befristet = dauer("Fitness", 30, 1, "2026-01", "2026-06");
    expect(faelligIn(befristet, "2026-06")).toBe(true);
    expect(faelligIn(befristet, "2026-07")).toBe(false);
  });

  it("rechnet über den Jahreswechsel richtig", () => {
    const q = dauer("Abo", 60, 3, "2026-11");
    expect(faelligIn(q, "2027-02")).toBe(true);
    expect(faelligIn(q, "2027-01")).toBe(false);
  });

  it("behandelt einen unsinnigen Rhythmus als monatlich", () => {
    expect(faelligIn(dauer("X", 10, 0, "2026-01"), "2026-05")).toBe(true);
  });
});

describe("dauerFuerMonat", () => {
  it("gibt nur die fälligen zurück", () => {
    const liste = [dauer("Miete", 820, 1, "2026-01"), dauer("KFZ", 180, 12, "2026-03")];
    expect(dauerFuerMonat(liste, "2026-03").map((d) => d.name)).toEqual(["Miete", "KFZ"]);
    expect(dauerFuerMonat(liste, "2026-04").map((d) => d.name)).toEqual(["Miete"]);
  });
});

describe("proMonat mit wiederkehrenden Posten", () => {
  const miete = dauer("Miete", 820, 1, "2026-06");

  it("rechnet sie in jedem fälligen Monat mit", () => {
    const m = proMonat(juniBisSeptember, [miete], HEUTE);
    expect(m.find((x) => x.monat === "2026-06")!.summe).toBe(2200 + 820);
    expect(m.find((x) => x.monat === "2026-07")!.summe).toBe(1883 + 820);
  });

  it("weist aus, wie viel davon automatisch kommt", () => {
    const m = proMonat(juniBisSeptember, [miete], HEUTE);
    expect(m.find((x) => x.monat === "2026-06")!.dauerSumme).toBe(820);
    expect(proMonat(juniBisSeptember, [], HEUTE)[0].dauerSumme).toBe(0);
  });

  it("legt sie in dieselbe Kategorie wie die Einzelbuchungen", () => {
    const juni = proMonat(juniBisSeptember, [miete], HEUTE).find((x) => x.monat === "2026-06")!;
    const fix = juni.proKategorie.find((k) => k.kategorie === "Fixkosten")!;
    expect(fix.summe).toBe(1200 + 820); // Einzelbuchung plus Miete
  });

  it("erzeugt Monate, in denen es sonst keine Einträge gäbe", () => {
    const m = proMonat([], [dauer("Miete", 820, 1, "2026-07")], HEUTE);
    expect(m.map((x) => x.monat)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(m.every((x) => x.summe === 820)).toBe(true);
  });

  it("rechnet nicht in die Zukunft", () => {
    const m = proMonat([], [dauer("Miete", 820, 1, "2026-06")], HEUTE);
    expect(m[m.length - 1].monat).toBe("2026-09");
  });

  it("hört bei einem Endmonat auf", () => {
    const m = proMonat([], [dauer("Fitness", 30, 1, "2026-05", "2026-07")], HEUTE);
    expect(m.map((x) => x.monat)).toEqual(["2026-05", "2026-06", "2026-07"]);
  });

  it("zählt sie als Posten mit", () => {
    const juni = proMonat(juniBisSeptember, [miete], HEUTE).find((x) => x.monat === "2026-06")!;
    expect(juni.anzahl).toBe(3); // zwei getippte plus die Miete
  });
});

describe("schnitt mit wiederkehrenden Posten", () => {
  it("hebt den Durchschnitt um den vollen Monatsbetrag", () => {
    const ohne = schnitt(juniBisSeptember, [], 3, HEUTE);
    const mit = schnitt(juniBisSeptember, [dauer("Miete", 820, 1, "2026-06")], 3, HEUTE);
    expect(mit.wert! - ohne.wert!).toBeCloseTo(820, 8);
  });

  it("verteilt einen Jahresbeitrag nicht, sondern bucht ihn im Fälligkeitsmonat", () => {
    // Bewusst so: Die Nettomonatsausgaben sollen zeigen, was tatsächlich abfließt.
    const mit = schnitt(juniBisSeptember, [dauer("KFZ-Steuer", 180, 12, "2026-07")], 3, HEUTE);
    const juli = mit.genutzt.find((m) => m.monat === "2026-07")!;
    const juni = mit.genutzt.find((m) => m.monat === "2026-06")!;
    expect(juli.dauerSumme).toBe(180);
    expect(juni.dauerSumme).toBe(0);
  });

  it("wird allein durch Fixkosten belastbar", () => {
    const s = schnitt([], [dauer("Miete", 820, 1, "2026-06")], 3, HEUTE);
    expect(s.monate).toBe(3);
    expect(s.belastbar).toBe(true);
    expect(s.wert).toBe(820);
  });
});

describe("fortschritt mit wiederkehrenden Posten", () => {
  it("zählt ab dem Startmonat der Fixkosten", () => {
    const f = fortschritt([], [dauer("Miete", 820, 1, "2026-06")], 3, HEUTE);
    expect(f.seit).toBe("2026-06-01");
    expect(f.volleMonate).toBe(3);
    expect(f.fehlend).toBe(0);
  });

  it("nimmt den früheren von beiden Anfängen", () => {
    const f = fortschritt(juniBisSeptember, [dauer("Miete", 820, 1, "2026-01")], 3, HEUTE);
    expect(f.seit).toBe("2026-01-01");
  });
});
