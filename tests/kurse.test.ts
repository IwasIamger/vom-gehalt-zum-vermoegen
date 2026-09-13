import { describe, expect, it } from "vitest";
import {
  benoetigteCoins,
  coinName,
  coinSymbol,
  istFrisch,
  kurseAus,
  mitKursen,
  postenWert,
  type Kurse,
} from "@/lib/kurse";
import type { Posten } from "@/lib/store";

const kurse: Kurse = {
  bitcoin: { eur: 66478, aenderung24h: -0.002, stand: "2026-09-13T10:00:00Z" },
  ethereum: { eur: 2170.42, stand: "2026-09-13T10:00:00Z" },
};

describe("postenWert", () => {
  it("rechnet Menge mal Kurs", () => {
    const p: Posten = { id: "a", art: "depot", name: "BTC", coin: "bitcoin", menge: 0.05, wert: 1 };
    expect(postenWert(p, kurse)).toBeCloseTo(0.05 * 66478, 6);
  });

  it("fällt ohne Kurs auf den eingetragenen Wert zurück", () => {
    const p: Posten = { id: "a", art: "depot", name: "SOL", coin: "solana", menge: 10, wert: 800 };
    expect(postenWert(p, kurse)).toBe(800);
  });

  it("lässt Posten ohne Coin unangetastet", () => {
    const p: Posten = { id: "a", art: "depot", name: "ETF", wert: 12000 };
    expect(postenWert(p, kurse)).toBe(12000);
  });

  it("braucht eine Menge, sonst gilt der Wert", () => {
    const p: Posten = { id: "a", art: "depot", name: "BTC", coin: "bitcoin", wert: 500 };
    expect(postenWert(p, kurse)).toBe(500);
  });

  it("eine Menge von null ist null Euro, nicht der alte Wert", () => {
    const p: Posten = { id: "a", art: "depot", name: "BTC", coin: "bitcoin", menge: 0, wert: 500 };
    expect(postenWert(p, kurse)).toBe(0);
  });
});

describe("mitKursen", () => {
  const bilanz: Posten[] = [
    { id: "1", art: "konto", name: "Giro", wert: 1200 },
    { id: "2", art: "depot", name: "BTC", coin: "bitcoin", menge: 0.1, wert: 5000 },
    { id: "3", art: "depot", name: "ETF", wert: 12000 },
  ];

  it("ersetzt nur die Werte mit Kurs", () => {
    const b = mitKursen(bilanz, kurse);
    expect(b[0].wert).toBe(1200);
    expect(b[1].wert).toBeCloseTo(6647.8, 6);
    expect(b[2].wert).toBe(12000);
  });

  it("gibt ohne Kurse dieselbe Bilanz zurück", () => {
    expect(mitKursen(bilanz, {})).toBe(bilanz);
  });

  it("verändert die Vorlage nicht", () => {
    const kopie = JSON.parse(JSON.stringify(bilanz));
    mitKursen(bilanz, kurse);
    expect(bilanz).toEqual(kopie);
  });
});

describe("benoetigteCoins", () => {
  it("sammelt jeden Coin einmal", () => {
    const b: Posten[] = [
      { id: "1", art: "depot", name: "a", coin: "bitcoin" },
      { id: "2", art: "depot", name: "b", coin: "bitcoin" },
      { id: "3", art: "depot", name: "c", coin: "ethereum" },
      { id: "4", art: "depot", name: "d" },
    ];
    expect(benoetigteCoins(b).sort()).toEqual(["bitcoin", "ethereum"]);
  });
});

describe("kurseAus", () => {
  it("liest die CoinGecko-Antwort", () => {
    const k = kurseAus(
      { bitcoin: { eur: 66478, eur_24h_change: -0.2069 }, ethereum: { eur: 2170.42 } },
      "2026-09-13T10:00:00Z",
    );
    expect(k.bitcoin.eur).toBe(66478);
    expect(k.bitcoin.aenderung24h).toBeCloseTo(-0.002069, 8);
    expect(k.ethereum.aenderung24h).toBeUndefined();
    expect(k.ethereum.stand).toBe("2026-09-13T10:00:00Z");
  });

  it("überspringt Unbrauchbares", () => {
    expect(kurseAus({ x: { eur: "nan" }, y: null, z: { eur: Infinity } })).toEqual({});
    expect(kurseAus(null)).toEqual({});
    expect(kurseAus("fehler")).toEqual({});
  });
});

describe("istFrisch", () => {
  const jetzt = new Date("2026-09-13T10:05:00Z").getTime();

  it("hält fünf Minuten alte Kurse für frisch", () => {
    expect(istFrisch(kurse, ["bitcoin", "ethereum"], jetzt)).toBe(true);
  });

  it("hält eine Stunde alte Kurse für alt", () => {
    expect(istFrisch(kurse, ["bitcoin"], jetzt + 60 * 60 * 1000)).toBe(false);
  });

  it("ist nicht frisch, wenn ein Coin fehlt", () => {
    expect(istFrisch(kurse, ["bitcoin", "solana"], jetzt)).toBe(false);
  });

  it("ohne Coins gibt es nichts zu holen", () => {
    expect(istFrisch({}, [], jetzt)).toBe(true);
  });
});

describe("Namen", () => {
  it("kennt die gängigen Coins", () => {
    expect(coinName("bitcoin")).toBe("Bitcoin");
    expect(coinSymbol("ethereum")).toBe("ETH");
  });

  it("zeigt Unbekanntes so, wie es eingetragen wurde", () => {
    expect(coinName("pepe")).toBe("pepe");
    expect(coinSymbol("pepe")).toBe("PEPE");
  });
});
