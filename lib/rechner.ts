import {
  endkapitalSparplan,
  kostenVergleich,
  notgroschenZiel,
  realerWert,
  realeRendite,
  savebackEffekt,
  sparplanAufteilung,
  SAVEBACK,
} from "./finance";
import { euro, prozent } from "./format";

export type Feld = {
  key: string;
  label: string;
  start: number;
  art: "euro" | "prozent" | "jahre" | "monate";
  min?: number;
  max?: number;
  schritt?: number;
  hinweis?: string;
};

export type Ergebnis = {
  label: string;
  wert: string;
  gross?: boolean;
  ton?: "gruen" | "rot" | "blau" | "gold" | "neutral";
  hinweis?: string;
};

export type RechnerDef = {
  slug: string;
  titel: string;
  kurz: string;
  einleitung: string;
  felder: Feld[];
  rechne: (v: Record<string, number>) => Ergebnis[];
  fussnote?: string;
};

const j = (label: string, start: number, hinweis?: string): Feld => ({
  key: "jahre",
  label,
  start,
  art: "jahre",
  min: 1,
  max: 60,
  hinweis,
});

export const RECHNER: RechnerDef[] = [
  {
    slug: "notgroschen",
    titel: "Notgroschen",
    kurz: "Wie viel Rücklage brauchst du wirklich?",
    einleitung:
      "Der Notgroschen ist keine Geldanlage, sondern eine Versicherung gegen den Zwang, zum falschen Zeitpunkt verkaufen zu müssen. Als Bezugsgröße nehme ich die Ausgaben, nicht das Gehalt – sie beschreiben, was du wirklich brauchst.",
    felder: [
      { key: "ausgaben", label: "Nettomonatsausgaben", start: 2000, art: "euro", schritt: 50 },
      {
        key: "monate",
        label: "Sicherheitspuffer",
        start: 4,
        art: "monate",
        min: 3,
        max: 6,
        hinweis: "Faustregel: 3 bis 5 Monatsausgaben. Bei unsicherem Einkommen eher mehr.",
      },
      { key: "rate", label: "Monatlich zurücklegen", start: 200, art: "euro", schritt: 25 },
    ],
    rechne: (v) => {
      const ziel = notgroschenZiel(v.ausgaben, v.monate);
      const monate = v.rate > 0 ? Math.ceil(ziel / v.rate) : Infinity;
      return [
        { label: "Zielbetrag", wert: euro(ziel), gross: true, ton: "gruen" },
        {
          label: "Dauer bis zum Ziel",
          wert: Number.isFinite(monate)
            ? `${monate} Monate`
            : "–",
          hinweis: Number.isFinite(monate)
            ? `Das sind rund ${(monate / 12).toFixed(1)} Jahre.`
            : "Trag eine monatliche Rate ein.",
        },
        {
          label: "Zinsertrag bei 2,25 % Tagesgeld",
          wert: `${euro((ziel * 0.0225) / 12)} pro Monat`,
          hinweis:
            "Dauerhaft zahlbar ist etwa der EZB-Einlagenzins. Angebote mit 4 % sind meist Aktionszinsen über vier Monate.",
        },
      ];
    },
    fussnote: "EZB-Einlagenzins 2,25 %, Stand 09/2026.",
  },
  {
    slug: "sparrate",
    titel: "Sparrate",
    kurz: "Was bleibt am Ende des Monats übrig?",
    einleitung:
      "Die Formel für den Vermögensaufbau ist unspektakulär: Einnahmen minus Ausgaben. Alles Weitere hängt an dieser einen Zahl – und an den beiden Stellschrauben, an denen du drehen kannst.",
    felder: [
      { key: "einnahmen", label: "Einnahmen netto", start: 3400, art: "euro", schritt: 100 },
      { key: "ausgaben", label: "Ausgaben gesamt", start: 2400, art: "euro", schritt: 50 },
    ],
    rechne: (v) => {
      const rate = v.einnahmen - v.ausgaben;
      const quote = v.einnahmen > 0 ? rate / v.einnahmen : 0;
      const in30 = sparplanAufteilung(Math.max(0, rate), 30, 0.07);
      return [
        {
          label: "Deine Sparrate",
          wert: euro(rate),
          gross: true,
          ton: rate > 0 ? "gruen" : "rot",
        },
        {
          label: "Sparquote",
          wert: prozent(quote),
          hinweis:
            quote >= 0.2
              ? "Über 20 % – das ist eine sehr solide Quote."
              : quote > 0
                ? "Unter 20 %. Beide Stellschrauben prüfen: Einnahmen steigern, Ausgaben senken."
                : "Aktuell bleibt nichts übrig. Zuerst die Ausgaben tracken.",
        },
        {
          label: "Daraus in 30 Jahren bei 7 %",
          wert: euro(in30.endkapital),
          ton: "blau",
          hinweis: `Davon ${euro(in30.zinsen)} Zinsen.`,
        },
      ];
    },
  },
  {
    slug: "zinseszins",
    titel: "Zinseszins",
    kurz: "Was wird aus deiner Sparrate über die Jahre?",
    einleitung:
      "Zinseszins braucht vor allem eines: Zeit. Die ersten zehn Jahre sehen nach wenig aus, die letzten zehn machen oft mehr als die Hälfte des Ergebnisses aus.",
    felder: [
      { key: "rate", label: "Monatliche Sparrate", start: 50, art: "euro", schritt: 25 },
      { key: "start", label: "Startkapital", start: 0, art: "euro", schritt: 500 },
      j("Anlagedauer", 40),
      { key: "rendite", label: "Rendite pro Jahr", start: 7, art: "prozent", schritt: 0.5, max: 15 },
    ],
    rechne: (v) => {
      const a = sparplanAufteilung(v.rate, v.jahre, v.rendite / 100, v.start);
      const real = endkapitalSparplan(v.rate, v.jahre, realeRendite(v.rendite / 100, 0.02), v.start);
      return [
        { label: "Endkapital", wert: euro(a.endkapital), gross: true, ton: "gruen" },
        { label: "Davon eingezahlt", wert: euro(a.einzahlungen) },
        {
          label: "Davon Zinsen",
          wert: euro(a.zinsen),
          ton: "blau",
          hinweis: `${prozent(a.zinsanteil, 0)} des Endkapitals – ohne eigenes Zutun.`,
        },
        {
          label: "Kaufkraft nach 2 % Inflation",
          wert: euro(real),
          ton: "gold",
          hinweis: "Das ist der Betrag in heutigem Geld. Vor Kosten und Steuern.",
        },
      ];
    },
    fussnote: "Monatliche Einzahlung, Zinsen werden wieder angelegt. Vor Kosten und Steuern.",
  },
  {
    slug: "saveback",
    titel: "Saveback",
    kurz: "Was 1 % Cashback über die Jahre ausmacht.",
    einleitung:
      "Trade Republic legt 1 % jeder Kartenzahlung automatisch in deinen Sparplan. Das Geld gibst du ohnehin aus – der Betrag kostet dich also keinen zusätzlichen Euro Sparleistung.",
    felder: [
      { key: "umsatz", label: "Kartenzahlungen pro Monat", start: 650, art: "euro", schritt: 50 },
      { key: "rate", label: "Dein Sparplan", start: 50, art: "euro", schritt: 25 },
      j("Anlagedauer", 40),
      { key: "rendite", label: "Rendite pro Jahr", start: 7, art: "prozent", schritt: 0.5, max: 15 },
    ],
    rechne: (v) => {
      const e = savebackEffekt(v.umsatz, v.rate, v.jahre, v.rendite / 100);
      const eingezahlt = e.proMonat * v.jahre * 12;
      return [
        {
          label: "Saveback pro Monat",
          wert: euro(e.proMonat),
          gross: true,
          ton: e.berechtigt ? "gold" : "rot",
          hinweis: !e.berechtigt
            ? `Kein Saveback: dafür braucht es einen Sparplan von mindestens ${euro(SAVEBACK.mindestSparplan)}.`
            : e.deckelErreicht
              ? `Deckel erreicht – mehr als ${euro(SAVEBACK.deckelMonat)} im Monat gibt es nicht.`
              : `1 % von ${euro(v.umsatz)}.`,
        },
        {
          label: `Daraus nach ${v.jahre} Jahren`,
          wert: euro(e.extra?.endkapital ?? 0),
          ton: "gruen",
          hinweis: `Aus ${euro(eingezahlt)}, die du nie selbst eingezahlt hast.`,
        },
        {
          label: "Depot mit Saveback",
          wert: euro(e.gesamt),
          hinweis: `Ohne Saveback wären es ${euro(e.ohne.endkapital)}.`,
        },
        {
          label: "Mehr Endkapital",
          wert: prozent(e.zuwachsAnteil, 0),
          ton: "blau",
          hinweis: "Ohne einen Euro zusätzliche Sparleistung.",
        },
      ];
    },
    fussnote:
      "Saveback: 1 % je Kartenzahlung, höchstens 15 € pro Monat, Voraussetzung ist ein laufender Sparplan ab 50 €. Stand 09/2026.",
  },
  {
    slug: "kosten",
    titel: "Kosten",
    kurz: "Was ein Gebührenunterschied wirklich kostet.",
    einleitung:
      "1,3 Prozentpunkte klingen nach nichts. Über dreißig Jahre sind sie ein halbes Vermögen. Hier siehst du, was die laufenden Fondskosten mit deinem Ergebnis machen.",
    felder: [
      { key: "rate", label: "Monatliche Sparrate", start: 200, art: "euro", schritt: 25 },
      j("Anlagedauer", 30),
      { key: "brutto", label: "Rendite vor Kosten", start: 7, art: "prozent", schritt: 0.5, max: 15 },
      { key: "terA", label: "Günstiger ETF (TER)", start: 0.2, art: "prozent", schritt: 0.05, max: 3 },
      { key: "terB", label: "Teurer Fonds (TER)", start: 1.5, art: "prozent", schritt: 0.05, max: 3 },
    ],
    rechne: (v) => {
      const k = kostenVergleich(v.rate, v.jahre, v.brutto / 100, v.terA / 100, v.terB / 100);
      return [
        { label: "Unterschied", wert: euro(k.differenz), gross: true, ton: "rot" },
        { label: `Mit ${v.terA} % Kosten`, wert: euro(k.a), ton: "gruen" },
        { label: `Mit ${v.terB} % Kosten`, wert: euro(k.b) },
        {
          label: "Eingezahlt in beiden Fällen",
          wert: euro(k.einzahlungen),
          hinweis: "Gleiche Einzahlung, gleiche Marktrendite – nur die Kosten unterscheiden sich.",
        },
      ];
    },
  },
  {
    slug: "inflation",
    titel: "Kaufkraft",
    kurz: "Was aus 100 € in zwanzig Jahren wird.",
    einleitung:
      "Nichtstun fühlt sich sicher an. Auf dem Girokonto ist es ein garantierter realer Verlust – nur einer, den man auf dem Kontoauszug nicht sieht.",
    felder: [
      { key: "betrag", label: "Betrag heute", start: 10000, art: "euro", schritt: 500 },
      j("Zeitraum", 20),
      { key: "inflation", label: "Inflation pro Jahr", start: 2, art: "prozent", schritt: 0.1, max: 10 },
      { key: "zins", label: "Zins auf dem Konto", start: 0, art: "prozent", schritt: 0.25, max: 10 },
    ],
    rechne: (v) => {
      const nominal = v.betrag * Math.pow(1 + v.zins / 100, v.jahre);
      const real = realerWert(nominal, v.inflation / 100, v.jahre);
      const verlust = v.betrag - real;
      return [
        {
          label: `Kaufkraft nach ${v.jahre} Jahren`,
          wert: euro(real),
          gross: true,
          ton: verlust > 0 ? "rot" : "gruen",
        },
        {
          label: "Verlust an Kaufkraft",
          wert: euro(Math.max(0, verlust)),
          hinweis:
            verlust > 0
              ? `Das sind ${prozent(verlust / v.betrag, 0)} deines heutigen Geldes.`
              : "Der Zins gleicht die Inflation aus.",
        },
        {
          label: "Nominal auf dem Konto",
          wert: euro(nominal),
          hinweis: "Die Zahl, die dir dein Kontoauszug zeigt.",
        },
        {
          label: "Reale Rendite",
          wert: prozent(realeRendite(v.zins / 100, v.inflation / 100)),
          ton: "blau",
        },
      ];
    },
    fussnote: "Inflation Deutschland im Schnitt 2016–2025: 2,6 % pro Jahr.",
  },
];

export const rechnerNach = (slug: string) => RECHNER.find((r) => r.slug === slug);
