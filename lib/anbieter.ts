/**
 * Anbieter mit Empfehlungslinks.
 *
 * Eine Stelle für alle Links, damit sie sich pflegen lassen, ohne Kapitel
 * anzufassen. Empfehlungslinks sind Werbung und werden überall so genannt –
 * das ist keine Höflichkeit, sondern Kennzeichnungspflicht.
 */
export type Anbieter = {
  name: string;
  was: string;
  url: string;
  /** Kurzform der Adresse zum Anzeigen. */
  kurz: string;
  bonus?: string;
  hinweis?: string;
};

export const ANBIETER: Anbieter[] = [
  {
    name: "Trade Republic",
    was: "ETF-Sparplan, Karte mit 1 % Saveback, Tagesgeld zum EZB-Zins.",
    url: "https://refnocode.trade.re/wpftvpbt",
    kurz: "refnocode.trade.re/wpftvpbt",
    bonus: "Willkommensbonus über den Link.",
  },
  {
    name: "Bondora Go & Grow",
    was: "P2P-Kredite mit täglicher Verfügbarkeit.",
    url: "https://goandgrow.eu/ref/maximiliana29",
    kurz: "goandgrow.eu/ref/maximiliana29",
    hinweis: "Kein Einlagenschutz – nur entbehrliches Kapital.",
  },
];
