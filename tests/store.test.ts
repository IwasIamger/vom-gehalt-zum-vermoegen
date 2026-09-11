import { describe, expect, it } from "vitest";
import {
  VERSION,
  exportieren,
  importieren,
  postenLoeschen,
  postenSetzen,
  vorlageBilanz,
  vorlageKontensystem,
  type Daten,
  type Posten,
} from "@/lib/store";

/**
 * Ein Stand, der nicht mehr gelesen werden kann, ist verlorene Arbeit. Diese
 * Tests decken jede Formatstufe ab, die je im Umlauf war.
 */

describe("importieren – alte Stände", () => {
  it("übernimmt Version 1 mit Konten und Depots", () => {
    const v1 = {
      version: 1,
      aktualisiert: "2026-01-01T00:00:00Z",
      nettomonatsausgaben: 2100,
      zufluesse: { gehalt: 3000 },
      konten: [
        { id: "a", typ: "konto", name: "Tagesgeld", bank: "ING" },
        { id: "b", typ: "kategorie", name: "Essen", betragMonat: 400 },
      ],
      anlagen: [{ id: "c", name: "ETF", sollAnteil: 0.8, wert: 500, kaufdatum: "2025-06-01" }],
      einstellungen: { notgroschenMonate: 3, renditeAnnahme: 0.06, inflationAnnahme: 0.025 },
    };
    const d = importieren(JSON.stringify(v1))!;
    expect(d).not.toBeNull();
    expect(d.version).toBe(VERSION);
    expect(d.nettomonatsausgaben).toBe(2100);
    expect(d.einstellungen.notgroschenMonate).toBe(3);
    expect(d.einstellungen.renditeAnnahme).toBe(0.06);
  });

  it("macht aus Konten und Depots eine Bilanz – ohne Beträge zu erfinden", () => {
    const v1 = {
      version: 1,
      zufluesse: {},
      konten: [
        { id: "a", typ: "konto", name: "Tagesgeld", bank: "ING", betragMonat: 200 },
        { id: "b", typ: "kategorie", name: "Essen", betragMonat: 400 },
      ],
      anlagen: [{ id: "c", name: "ETF", sollAnteil: 0.8 }],
      einstellungen: { notgroschenMonate: 4, renditeAnnahme: 0.07, inflationAnnahme: 0.02 },
    };
    const d = importieren(JSON.stringify(v1))!;
    // Kategorien sind Budgetposten, keine Bilanzposten.
    expect(d.bilanz.map((p) => p.name)).toEqual(["Tagesgeld", "ETF"]);
    expect(d.bilanz[0].anbieter).toBe("ING");
    // Im Kontensystem stehen monatliche Flüsse, in der Bilanz Stände –
    // der eine darf nicht als der andere gelesen werden.
    expect(d.bilanz[0].wert).toBeUndefined();
  });

  it("schaltet die Haltefrist ein, wenn ein Kaufdatum gepflegt war", () => {
    const v1 = {
      version: 1,
      zufluesse: {},
      konten: [],
      anlagen: [
        { id: "c", name: "Krypto", kaufdatum: "2026-03-15" },
        { id: "d", name: "ETF" },
      ],
      einstellungen: { notgroschenMonate: 4, renditeAnnahme: 0.07, inflationAnnahme: 0.02 },
    };
    const d = importieren(JSON.stringify(v1))!;
    expect(d.bilanz.find((p) => p.name === "Krypto")!.haltefrist).toBe(true);
    expect(d.bilanz.find((p) => p.name === "ETF")!.haltefrist).toBeUndefined();
  });

  it("lässt eine vorhandene Bilanz unangetastet", () => {
    const v2 = {
      version: 2,
      zufluesse: {},
      konten: [{ id: "x", typ: "konto", name: "Soll nicht auftauchen" }],
      anlagen: [],
      bilanz: [{ id: "b", art: "depot", name: "Krypto", wert: 900 }],
      verlauf: [{ datum: "2026-02-01", gesamt: 900, anlagen: 900, schulden: 0 }],
      erledigt: ["sparplan"],
      steuer: { freistellungsauftrag: 400 },
      einstellungen: { notgroschenMonate: 4, renditeAnnahme: 0.07, inflationAnnahme: 0.02 },
    };
    const d = importieren(JSON.stringify(v2))!;
    expect(d.bilanz).toHaveLength(1);
    expect(d.bilanz[0].name).toBe("Krypto");
    expect(d.verlauf).toHaveLength(1);
    expect(d.erledigt).toEqual(["sparplan"]);
    expect(d.steuer.freistellungsauftrag).toBe(400);
  });

  it("ergänzt fehlende Felder neuerer Versionen", () => {
    const v2 = {
      version: 2,
      zufluesse: {},
      konten: [],
      anlagen: [],
      bilanz: [],
      verlauf: [],
      erledigt: [],
      steuer: {},
      einstellungen: { notgroschenMonate: 4, renditeAnnahme: 0.07, inflationAnnahme: 0.02 },
    };
    const d = importieren(JSON.stringify(v2))!;
    expect(d.ausgaben).toEqual([]);
    expect(d.dauerausgaben).toEqual([]);
    expect(d.hinweise).toEqual([]);
    expect(d.kategorien.length).toBeGreaterThan(0);
    expect(d.einstellungen.prognoseJahre).toBeGreaterThan(0);
  });
});

describe("importieren – unbrauchbare Eingaben", () => {
  it("weist zurück, was kein Stand ist", () => {
    expect(importieren("kein JSON")).toBeNull();
    expect(importieren("null")).toBeNull();
    expect(importieren("[]")).toBeNull();
    expect(importieren("42")).toBeNull();
    expect(importieren('"text"')).toBeNull();
    expect(importieren("{}")).toBeNull();
  });

  it("weist eine unbekannte Zukunftsversion zurück, statt sie falsch zu lesen", () => {
    expect(importieren(JSON.stringify({ version: VERSION + 1, bilanz: [] }))).toBeNull();
    expect(importieren(JSON.stringify({ version: 0 }))).toBeNull();
  });
});

describe("Export und Import", () => {
  it("verlieren im Rundlauf nichts", () => {
    const voll: Daten = {
      version: VERSION,
      aktualisiert: "2026-09-11T10:00:00.000Z",
      nettomonatsausgaben: 2350,
      zufluesse: { gehalt: 3400, rueckfluss: 120 },
      konten: [],
      anlagen: [],
      bilanz: [
        { id: "1", art: "konto", name: "Hauptkonto", wert: 1200, rendite: 0 },
        {
          id: "2",
          art: "depot",
          name: "Krypto",
          anbieter: "BSDEX",
          wert: 4000,
          sparrate: 50,
          sollAnteil: 0.1,
          kaufdatum: "2026-03-15",
          haltefrist: true,
        },
        { id: "3", art: "schuld", name: "Auto", wert: 8000, sparrate: 250, rendite: 0.069 },
      ],
      verlauf: [{ datum: "2026-08-01", gesamt: 5000, anlagen: 4000, schulden: 8000 }],
      ausgaben: [{ id: "a", datum: "2026-08-05", betrag: 24.9, kategorie: "Freizeit", notiz: "Kino" }],
      dauerausgaben: [
        { id: "d", name: "Miete", betrag: 820, kategorie: "Fixkosten", rhythmus: 1, ab: "2026-01" },
      ],
      kategorien: ["Freizeit", "Sonstiges"],
      hinweise: [
        { id: "h", datum: "2026-08-06T10:00:00Z", art: "fehler", seite: "/cockpit/", text: "Test" },
      ],
      erledigt: ["sparplan"],
      steuer: { ertraegeJahr: 800, freistellungsauftrag: 200, kirchensteuer: 0.09 },
      einstellungen: {
        notgroschenMonate: 5,
        renditeAnnahme: 0.065,
        inflationAnnahme: 0.022,
        kartenumsatzMonat: 650,
        prognoseJahre: 25,
      },
    };
    const zurueck = importieren(exportieren(voll))!;
    expect(zurueck).toEqual(voll);
  });

  it("liefert lesbares JSON", () => {
    const text = exportieren(vorlageKontensystem());
    expect(text).toContain("\n");
    expect(() => JSON.parse(text)).not.toThrow();
  });
});

describe("postenSetzen", () => {
  const start: Posten[] = [{ id: "1", art: "konto", name: "Notgroschen", wert: 6000 }];

  it("legt an, was es noch nicht gibt", () => {
    const b = postenSetzen(start, "konto", "Urlaub", { wert: 900 });
    expect(b).toHaveLength(2);
    expect(b[1].name).toBe("Urlaub");
    expect(b[1].wert).toBe(900);
    expect(b[1].id).toBeTruthy();
  });

  it("ergänzt, was es schon gibt, statt zu verdoppeln", () => {
    const b = postenSetzen(start, "konto", "Notgroschen", { sparrate: 200 });
    expect(b).toHaveLength(1);
    expect(b[0].wert).toBe(6000); // bleibt erhalten
    expect(b[0].sparrate).toBe(200);
    expect(b[0].id).toBe("1"); // dieselbe Kennung
  });

  it("erkennt den Namen unabhängig von Groß- und Kleinschreibung", () => {
    expect(postenSetzen(start, "konto", "notgroschen", { wert: 1 })).toHaveLength(1);
    expect(postenSetzen(start, "konto", "  NOTGROSCHEN  ", { wert: 1 })).toHaveLength(1);
  });

  it("unterscheidet gleiche Namen verschiedener Art", () => {
    const b = postenSetzen(start, "depot", "Notgroschen", { wert: 1 });
    expect(b).toHaveLength(2);
  });

  it("lässt die Vorlage unverändert", () => {
    const kopie = JSON.parse(JSON.stringify(start));
    postenSetzen(start, "konto", "Urlaub", { wert: 900 });
    expect(start).toEqual(kopie);
  });
});

describe("postenLoeschen", () => {
  const start: Posten[] = [
    { id: "1", art: "konto", name: "Notgroschen" },
    { id: "2", art: "depot", name: "ETF" },
  ];

  it("entfernt genau einen Posten", () => {
    expect(postenLoeschen(start, "konto", "Notgroschen")).toHaveLength(1);
  });

  it("lässt gleichnamige Posten anderer Art stehen", () => {
    expect(postenLoeschen(start, "depot", "Notgroschen")).toHaveLength(2);
  });

  it("stört sich nicht an Unbekanntem", () => {
    expect(postenLoeschen(start, "konto", "Gibt es nicht")).toHaveLength(2);
  });
});

describe("Vorlagen", () => {
  it("die Bilanzvorlage setzt das Hauptkonto ausdrücklich auf null Zins", () => {
    const haupt = vorlageBilanz().find((p) => p.name === "Hauptkonto")!;
    expect(haupt.rendite).toBe(0);
  });

  it("die Bilanzvorlage ergibt zusammen 100 % Soll", () => {
    const summe = vorlageBilanz().reduce((s, p) => s + (p.sollAnteil ?? 0), 0);
    expect(summe).toBeCloseTo(1, 10);
  });

  it("die Bilanzvorlage verfolgt die Haltefrist nur bei Krypto", () => {
    expect(vorlageBilanz().filter((p) => p.haltefrist).map((p) => p.name)).toEqual(["Krypto"]);
  });

  it("jede Vorlage vergibt eindeutige Kennungen", () => {
    const ids = vorlageBilanz().map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    const k = vorlageKontensystem();
    const kids = [...k.konten, ...k.anlagen].map((x) => x.id);
    expect(new Set(kids).size).toBe(kids.length);
  });

  it("zwei Aufrufe teilen sich keine Objekte", () => {
    const a = vorlageBilanz();
    const b = vorlageBilanz();
    a[0].wert = 999;
    expect(b[0].wert).toBeUndefined();
  });
});
