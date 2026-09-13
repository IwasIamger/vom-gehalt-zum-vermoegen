/**
 * Kryptokurse von CoinGecko.
 *
 * Wer bei Krypto den Eurowert eintippt, hat morgen eine falsche Zahl. Die
 * Menge dagegen ändert sich nur, wenn man kauft oder verkauft. Deshalb trägt
 * ein Posten Coin und Menge, und der Wert wird aus dem aktuellen Kurs gerechnet.
 *
 * Kein Server, kein Schlüssel: Die öffentliche Schnittstelle erlaubt Zugriffe
 * aus dem Browser. Ergebnisse liegen im Zwischenspeicher – ohne Netz zählt
 * der zuletzt geholte Kurs, und wenn es nie einen gab, der von Hand
 * eingetragene Wert.
 */

import type { Posten } from "@/lib/store";

export type Coin = { id: string; symbol: string; name: string };

/** Die gängigen Coins. Weitere lassen sich über die CoinGecko-Kennung eintragen. */
export const COINS: Coin[] = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "binancecoin", symbol: "BNB", name: "BNB" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
  { id: "litecoin", symbol: "LTC", name: "Litecoin" },
];

export type Kurs = { eur: number; aenderung24h?: number; stand: string };
export type Kurse = Record<string, Kurs>;

const SPEICHER = "finanzcockpit.kurse";
/** Zehn Minuten – Kurse ändern sich ständig, aber niemand handelt hier. */
const HALTBAR_MS = 10 * 60 * 1000;

// ─────────────────────────────────────────────────────── reine Rechnung

export function coinName(id: string): string {
  return COINS.find((c) => c.id === id)?.name ?? id;
}

export function coinSymbol(id: string): string {
  return COINS.find((c) => c.id === id)?.symbol ?? id.toUpperCase();
}

/** Wert eines Postens: Menge × Kurs, wenn beides da ist – sonst der eingetragene Wert. */
export function postenWert(p: Posten, kurse: Kurse): number | undefined {
  if (p.coin && p.menge !== undefined && kurse[p.coin]) {
    return p.menge * kurse[p.coin].eur;
  }
  return p.wert;
}

/** Die Bilanz mit eingerechneten Kursen – Grundlage für alles, was rechnet. */
export function mitKursen(bilanz: Posten[], kurse: Kurse): Posten[] {
  if (Object.keys(kurse).length === 0) return bilanz;
  return bilanz.map((p) => {
    const w = postenWert(p, kurse);
    return w === p.wert ? p : { ...p, wert: w };
  });
}

/** Welche Coins in der Bilanz vorkommen. */
export function benoetigteCoins(bilanz: Posten[]): string[] {
  return [...new Set(bilanz.filter((p) => p.coin).map((p) => p.coin!))];
}

/** Aus der CoinGecko-Antwort die Kurse herauslösen. */
export function kurseAus(json: unknown, stand = new Date().toISOString()): Kurse {
  const aus: Kurse = {};
  if (!json || typeof json !== "object") return aus;
  for (const [id, wert] of Object.entries(json as Record<string, unknown>)) {
    const w = wert as { eur?: unknown; eur_24h_change?: unknown };
    if (typeof w?.eur === "number" && Number.isFinite(w.eur)) {
      aus[id] = {
        eur: w.eur,
        aenderung24h: typeof w.eur_24h_change === "number" ? w.eur_24h_change / 100 : undefined,
        stand,
      };
    }
  }
  return aus;
}

export function istFrisch(kurse: Kurse, ids: string[], jetzt = Date.now()): boolean {
  return ids.every((id) => {
    const k = kurse[id];
    return k && jetzt - new Date(k.stand).getTime() < HALTBAR_MS;
  });
}

// ─────────────────────────────────────────────────────── Zwischenspeicher

function ausSpeicher(): Kurse {
  if (typeof window === "undefined") return {};
  try {
    const roh = window.localStorage.getItem(SPEICHER);
    return roh ? (JSON.parse(roh) as Kurse) : {};
  } catch {
    return {};
  }
}

function inSpeicher(k: Kurse): void {
  try {
    window.localStorage.setItem(SPEICHER, JSON.stringify(k));
  } catch {
    /* dann eben ohne */
  }
}

// ─────────────────────────────────────────────────────── Laden

/**
 * Holt die Kurse für die angegebenen Coins. Frische Werte kommen aus dem
 * Zwischenspeicher; schlägt das Netz fehl, bleiben die alten stehen.
 */
export async function ladeKurse(ids: string[], erzwingen = false): Promise<Kurse> {
  const gespeichert = ausSpeicher();
  if (ids.length === 0) return gespeichert;
  if (!erzwingen && istFrisch(gespeichert, ids)) return gespeichert;

  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?vs_currencies=eur&include_24hr_change=true&ids=" +
      encodeURIComponent(ids.join(","));
    const r = await fetch(url);
    if (!r.ok) throw new Error(String(r.status));
    const neu = { ...gespeichert, ...kurseAus(await r.json()) };
    inSpeicher(neu);
    return neu;
  } catch {
    return gespeichert;
  }
}
