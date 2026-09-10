const eur0 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const eur2 = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const proz1 = new Intl.NumberFormat("de-DE", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const proz0 = new Intl.NumberFormat("de-DE", { style: "percent", maximumFractionDigits: 0 });
// Zinssätze: so genau wie nötig, ohne "7,00 %" zu schreiben, wo "7 %" gemeint ist.
const prozKurz = new Intl.NumberFormat("de-DE", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Große Beträge ohne Cent, kleine mit – so liest es sich am ruhigsten. */
export function euro(betrag: number, cent?: boolean): string {
  if (!Number.isFinite(betrag)) return "–";
  // Negative Null gibt es in der Buchhaltung nicht, in IEEE 754 schon.
  if (betrag === 0) betrag = 0;
  const mitCent = cent ?? Math.abs(betrag) < 100;
  return (mitCent ? eur2 : eur0).format(betrag);
}

export function prozent(anteil: number, stellen: 0 | 1 = 1): string {
  if (!Number.isFinite(anteil)) return "–";
  return (stellen === 0 ? proz0 : proz1).format(anteil);
}

export function prozentKurz(anteil: number): string {
  return Number.isFinite(anteil) ? prozKurz.format(anteil) : "–";
}

/** "1 Tag" statt "1 Tage" – kleine Sache, aber sonst liest es sich schlampig. */
export function plural(anzahl: number, ein: string, viele: string): string {
  return `${anzahl.toLocaleString("de-DE")} ${anzahl === 1 ? ein : viele}`;
}

export function datum(d: Date | string): string {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Liest "1.234,56", "1234.56" und "1 234" gleichermaßen. */
export function zahlAusEingabe(text: string): number | undefined {
  const bereinigt = text.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", ".");
  if (bereinigt === "" || bereinigt === "-") return undefined;
  const n = Number(bereinigt);
  return Number.isFinite(n) ? n : undefined;
}
