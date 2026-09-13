import { describe, expect, it } from "vitest";
import {
  WOERTER,
  abdruck,
  ableiten,
  entschluesseln,
  neuerIst,
  neuerSatz,
  normalisiere,
  verschluesseln,
} from "@/lib/sync";
import { LEER } from "@/lib/store";

/**
 * Der Server sieht nur Kennung und Block. Diese Tests stellen sicher, dass aus
 * beidem nichts zurückzurechnen ist, dass Tippvarianten des Satzes egal sind
 * und dass ein falscher Satz sauber scheitert statt Müll zu liefern.
 */

describe("Sync-Satz", () => {
  it("besteht aus sechs Wörtern der Liste", () => {
    const s = neuerSatz();
    const w = s.split(" ");
    expect(w).toHaveLength(6);
    expect(w.every((x) => WOERTER.includes(x))).toBe(true);
  });

  it("ist jedes Mal ein anderer", () => {
    const menge = new Set(Array.from({ length: 20 }, () => neuerSatz()));
    expect(menge.size).toBe(20);
  });

  it("die Wortliste hat keine Dubletten und keine Umlaut-Fallen", () => {
    expect(new Set(WOERTER).size).toBe(WOERTER.length);
    expect(WOERTER.length).toBeGreaterThan(200);
    expect(WOERTER.every((w) => /^[a-zäöüß]+$/.test(w))).toBe(true);
  });

  it("normalisiert Groß-/Kleinschreibung und Leerzeichen", () => {
    expect(normalisiere("  Löwe   Blitz  \n pferd ")).toBe("löwe blitz pferd");
  });
});

describe("ableiten", () => {
  it("liefert dieselben Werte für Tippvarianten desselben Satzes", async () => {
    const a = await ableiten("löwe blitz pferd kanne kette zwerg");
    const b = await ableiten("Löwe  BLITZ pferd kanne kette zwerg ");
    expect(a).toEqual(b);
  }, 20_000);

  it("liefert für einen anderen Satz eine andere Kennung und einen anderen Schlüssel", async () => {
    const a = await ableiten("löwe blitz pferd kanne kette zwerg");
    const b = await ableiten("löwe blitz pferd kanne kette zebra");
    expect(a.kennung).not.toBe(b.kennung);
    expect(a.schluessel).not.toBe(b.schluessel);
  }, 20_000);

  it("die Kennung ist 64 Hex-Zeichen, wie der Server es verlangt", async () => {
    const a = await ableiten("apfel ampel anker arzt bach ball");
    expect(a.kennung).toMatch(/^[0-9a-f]{64}$/);
  }, 20_000);

  it("Kennung und Schlüssel sehen einander nicht ähnlich", async () => {
    // Beide stammen aus verschiedenen Hälften der Ableitung; die Kennung ist zusätzlich gehasht.
    const a = await ableiten("apfel ampel anker arzt bach ball");
    expect(a.kennung).not.toContain(a.schluessel.slice(0, 8).toLowerCase());
  }, 20_000);
});

describe("verschlüsseln / entschlüsseln", () => {
  const schluessel = "EwaT8Z1W4ZgqhHLZJJFy+yvwhC66XEQEo/As2avP3lY=";

  it("kommt im Rundlauf unverändert heraus – auch mit Umlauten", async () => {
    const klar = JSON.stringify({ name: "Täglicher Bedarf", betrag: 24.9, notiz: "Kino – „Dune“" });
    const block = await verschluesseln(schluessel, klar);
    expect(await entschluesseln(schluessel, block)).toBe(klar);
  });

  it("hat das Format, das der Server prüft", async () => {
    const block = await verschluesseln(schluessel, "x");
    expect(block).toMatch(/^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/);
  });

  it("ergibt für denselben Klartext jedes Mal einen anderen Block", async () => {
    const a = await verschluesseln(schluessel, "gleich");
    const b = await verschluesseln(schluessel, "gleich");
    expect(a).not.toBe(b);
  });

  it("verrät nichts vom Klartext", async () => {
    const block = await verschluesseln(schluessel, "Notgroschen 6000 Euro bei der ING");
    expect(block).not.toContain("Notgroschen");
    expect(block).not.toContain("6000");
    expect(block).not.toContain("ING");
  });

  it("scheitert mit falschem Schlüssel sauber", async () => {
    const block = await verschluesseln(schluessel, "geheim");
    const falsch = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
    expect(await entschluesseln(falsch, block)).toBeNull();
  });

  it("scheitert bei manipuliertem Block sauber", async () => {
    const block = await verschluesseln(schluessel, "geheim");
    const kaputt = block.slice(0, -4) + "AAAA";
    expect(await entschluesseln(schluessel, kaputt)).toBeNull();
    expect(await entschluesseln(schluessel, "kein.block")).toBeNull();
    expect(await entschluesseln(schluessel, "")).toBeNull();
  });
});

describe("Abgleich", () => {
  it("neuerIst vergleicht die Zeitstempel", () => {
    const alt = { ...LEER, aktualisiert: "2026-09-01T10:00:00Z" };
    const neu = { ...LEER, aktualisiert: "2026-09-02T10:00:00Z" };
    expect(neuerIst(neu, alt)).toBe(true);
    expect(neuerIst(alt, neu)).toBe(false);
    expect(neuerIst(alt, alt)).toBe(false);
  });

  it("der Fingerabdruck ignoriert den Zeitstempel, aber nicht den Inhalt", async () => {
    const a = { ...LEER, aktualisiert: "2026-09-01T10:00:00Z", nettomonatsausgaben: 2000 };
    const b = { ...a, aktualisiert: "2026-09-02T10:00:00Z" };
    const c = { ...a, nettomonatsausgaben: 2001 };
    expect(await abdruck(a)).toBe(await abdruck(b));
    expect(await abdruck(a)).not.toBe(await abdruck(c));
  });
});
