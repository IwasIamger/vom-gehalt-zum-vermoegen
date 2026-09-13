/**
 * Abgleich zwischen Geräten – ohne Konto.
 *
 * Statt einer Anmeldung gibt es einen Sync-Satz. Aus ihm leitet der Browser
 * zwei Dinge ab: einen Schlüssel, mit dem der Stand verschlüsselt wird, und
 * eine Kennung, unter der der verschlüsselte Block abgelegt wird. Der Server
 * bekommt nur Kennung und Block – aus keinem von beiden lässt sich der Satz
 * oder der Inhalt zurückrechnen.
 *
 * Wer den Satz vergisst, hat seine Daten trotzdem noch auf jedem Gerät. Nur
 * der Abgleich ist dann weg – neuer Satz, neu hochladen.
 */

import { type Daten, exportieren, importieren } from "@/lib/store";

export const SYNC_URL = "https://vgzv-sync.lukas-ackermann04.workers.dev/v1";
const SPEICHER = "finanzcockpit.sync";
/** Feste Beimischung, damit derselbe Satz woanders einen anderen Schlüssel ergäbe. */
const SALZ = "vom-gehalt-zum-vermoegen/sync/v1";
const RUNDEN = 600_000;

export type Syncstand = {
  kennung: string;
  /** AES-Schlüssel, roh, base64 – auf dem Gerät liegt der Stand ohnehin unverschlüsselt. */
  schluessel: string;
  /** Zuletzt gesehene Version auf dem Server. 0 = noch nie hochgeladen. */
  version: number;
  zuletzt?: string;
  fehler?: string;
  /** Fingerabdruck des zuletzt hochgeladenen Stands – gleicher Inhalt wird nicht erneut gesendet. */
  abdruck?: string;
};

// ─────────────────────────────────────────────────────────── Sync-Satz

/**
 * Kurze, eindeutige, gut tippbare Wörter. Sechs davon ergeben rund 50 Bit –
 * gegen einen Server, der nichts verrät, und 600.000 Ableitungsrunden reicht
 * das, um Raten unpraktisch zu machen.
 */
export const WOERTER = (
  "apfel ampel anker arzt bach ball bank baum berg bett biene birne blatt blitz boot brot " +
  "brief brille brücke buch burg dach decke dorf drache eiche eimer eis elch ente erde esel eule " +
  "fahne falke feder feld fels feuer fisch flasche fluss fuchs garten geige gipfel glas glocke " +
  "gras hafen hahn hammer hase haus hecke herbst herz himmel hirsch honig hose hund hut igel " +
  "insel jacke jahr kamm kanne karte katze kegel kerze kessel kette kirsche kiste kleid knopf " +
  "kohl korb kran kreide krone kuchen kugel kuh lampe laterne leiter licht linde löwe luft " +
  "mantel maus meer melone mond motor mühle münze nadel nagel nase nebel nest netz nuss ofen " +
  "onkel orgel palme papier perle pfad pferd pilz pinsel pirat pumpe quelle rabe rad regen " +
  "reh ring rose rübe sack salz sand schaf schiff schlitten schnee schuh see segel sessel " +
  "sonne spiegel stein stern stuhl sturm tafel tanne tasse taube teich tiger tinte tisch topf " +
  "tor traube turm uhr ufer vogel wagen wald wange wasser welle wiese wind wolke wolle wurzel " +
  "zange zaun zebra zelt ziege zimmer zucker zwerg " +
  "affe adler ameise bagger banane besen bohne bär dackel delfin diamant donner drossel fenster " +
  "flöte frosch gabel gans giraffe gurke hafer hering hummel kaktus kamel kanu kiwi koffer " +
  "kompass krabbe kürbis lachs lasso lava leuchtturm libelle magnet marmor möwe mütze orange " +
  "otter panda pfau pflaume pudel puppe qualle rakete robbe roller sattel schere schnecke schwan " +
  "sieb spatz spinne storch tapir teller tomate trommel tulpe vulkan waage wal walnuss wespe " +
  "zitrone zug"
).split(" ");

export function neuerSatz(anzahl = 6): string {
  const zufall = new Uint32Array(anzahl);
  crypto.getRandomValues(zufall);
  return Array.from(zufall, (z) => WOERTER[z % WOERTER.length]).join(" ");
}

/** Leerzeichen, Groß- und Kleinschreibung sollen keine Rolle spielen. */
export function normalisiere(satz: string): string {
  return satz.trim().toLowerCase().split(/\s+/).join(" ");
}

// ─────────────────────────────────────────────────────────── Schlüssel

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of u) s += String.fromCharCode(b);
  return btoa(s);
}

function ausB64(text: string): Uint8Array<ArrayBuffer> {
  const s = atob(text);
  const u = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
  return u;
}

function hex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Aus dem Satz werden 512 Bit: die erste Hälfte verschlüsselt, die zweite adressiert. */
export async function ableiten(satz: string): Promise<{ kennung: string; schluessel: string }> {
  const enc = new TextEncoder();
  const grund = await crypto.subtle.importKey("raw", enc.encode(normalisiere(satz)), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: enc.encode(SALZ), iterations: RUNDEN },
    grund,
    512,
  );
  const schluessel = bits.slice(0, 32);
  const kennung = await crypto.subtle.digest("SHA-256", bits.slice(32, 64));
  return { kennung: hex(kennung), schluessel: b64(schluessel) };
}

async function aesSchluessel(schluesselB64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", ausB64(schluesselB64), "AES-GCM", false, ["encrypt", "decrypt"]);
}

/** Block-Format: v1.<iv>.<ciphertext>, beides base64. */
export async function verschluesseln(schluesselB64: string, klartext: string): Promise<string> {
  const key = await aesSchluessel(schluesselB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(klartext));
  return `v1.${b64(iv)}.${b64(ct)}`;
}

export async function entschluesseln(schluesselB64: string, block: string): Promise<string | null> {
  const [v, ivB64, ctB64] = block.split(".");
  if (v !== "v1" || !ivB64 || !ctB64) return null;
  try {
    const key = await aesSchluessel(schluesselB64);
    const klar = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ausB64(ivB64) }, key, ausB64(ctB64));
    return new TextDecoder().decode(klar);
  } catch {
    // Falscher Schlüssel oder beschädigter Block – AES-GCM merkt beides.
    return null;
  }
}

// ─────────────────────────────────────────────────────────── Zustand

export function syncstand(): Syncstand | null {
  if (typeof window === "undefined") return null;
  try {
    const roh = window.localStorage.getItem(SPEICHER);
    return roh ? (JSON.parse(roh) as Syncstand) : null;
  } catch {
    return null;
  }
}

export function syncstandSetzen(s: Syncstand | null): void {
  try {
    if (s) window.localStorage.setItem(SPEICHER, JSON.stringify(s));
    else window.localStorage.removeItem(SPEICHER);
    window.dispatchEvent(new Event("finanzcockpit:sync"));
  } catch {
    /* ohne Speicher kein Sync */
  }
}

// ─────────────────────────────────────────────────────────── Server

type Serverstand = { block: string; version: number; abgelegt: string | null };

export async function holen(kennung: string): Promise<Serverstand | null> {
  const r = await fetch(`${SYNC_URL}/${kennung}`, { cache: "no-store" });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Server: ${r.status}`);
  return (await r.json()) as Serverstand;
}

export type Ablegen =
  | { ok: true; version: number }
  | { ok: false; veraltet: true; version: number; block: string | null }
  | { ok: false; veraltet: false; fehler: string };

export async function ablegen(kennung: string, block: string, erwarteteVersion: number): Promise<Ablegen> {
  const r = await fetch(`${SYNC_URL}/${kennung}`, {
    method: "PUT",
    headers: { "Content-Type": "text/plain", "If-Match": String(erwarteteVersion) },
    body: block,
  });
  if (r.status === 409) {
    const j = (await r.json()) as { version: number; block: string | null };
    return { ok: false, veraltet: true, version: j.version, block: j.block };
  }
  if (!r.ok) return { ok: false, veraltet: false, fehler: `Server: ${r.status}` };
  const j = (await r.json()) as { version: number };
  return { ok: true, version: j.version };
}

export async function loeschenAufServer(kennung: string): Promise<void> {
  await fetch(`${SYNC_URL}/${kennung}`, { method: "DELETE" });
}

// ─────────────────────────────────────────────────────────── Abgleich

/**
 * Wer ist neuer? Entschieden wird über `aktualisiert` im Stand selbst –
 * die Uhr des Geräts, das zuletzt etwas geändert hat.
 */
export function neuerIst(a: Daten, b: Daten): boolean {
  return new Date(a.aktualisiert).getTime() > new Date(b.aktualisiert).getTime();
}

export async function standAusBlock(schluessel: string, block: string): Promise<Daten | null> {
  const klar = await entschluesseln(schluessel, block);
  return klar === null ? null : importieren(klar);
}

/** Kurzer Fingerabdruck über den Inhalt, ohne den Zeitstempel – der ändert sich bei jedem Speichern. */
export async function abdruck(daten: Daten): Promise<string> {
  const ohneStempel = exportieren({ ...daten, aktualisiert: "" });
  const h = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ohneStempel));
  return hex(h).slice(0, 16);
}

export async function blockAusStand(schluessel: string, daten: Daten): Promise<string> {
  return verschluesseln(schluessel, exportieren(daten));
}
