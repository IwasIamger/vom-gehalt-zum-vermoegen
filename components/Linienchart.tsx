"use client";

import { useId } from "react";
import { euro } from "@/lib/format";

export type Reihe = {
  name: string;
  farbe: string;
  werte: number[];
  /** Gestrichelt zeichnen – für Vergleichslinien wie „real" oder „eingezahlt". */
  gestrichelt?: boolean;
  /** Fläche unter der Linie füllen. Nur für die Hauptreihe sinnvoll. */
  flaeche?: boolean;
};

type Props = {
  labels: string[];
  reihen: Reihe[];
  hoehe?: number;
  /** Beschriftung der Y-Achse formatieren. */
  yFormat?: (n: number) => string;
};

const B = 720; // Zeichenbreite im viewBox-System
const PAD = { oben: 16, rechts: 12, unten: 30, links: 62 };

/**
 * Kleines SVG-Liniendiagramm ohne Bibliothek.
 *
 * Bewusst selbst gezeichnet: eine Charting-Bibliothek wäre hier größer als die
 * ganze App und würde für zwei Diagramme Rendering-Ballast mitbringen.
 */
// Achsenbeschriftung immer ohne Cent - sonst steht "0,00 EUR" neben "25.000 EUR".
const ohneCent = (n: number) => euro(n, false);

export default function Linienchart({ labels, reihen, hoehe = 260, yFormat = ohneCent }: Props) {
  const uid = useId().replace(/:/g, "");
  const H = hoehe;
  const alle = reihen.flatMap((r) => r.werte).filter((n) => Number.isFinite(n));
  if (labels.length < 2 || alle.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-linie2 p-6 text-center text-sm text-tinte3">
        Noch zu wenig Daten für eine Kurve.
      </p>
    );
  }

  const max = Math.max(...alle, 0);
  const min = Math.min(...alle, 0);
  const spanne = max - min || 1;
  // Auf eine runde Zahl aufrunden, damit die Achse ruhig aussieht.
  const stufe = Math.pow(10, Math.floor(Math.log10(spanne))) / 2;
  const obenWert = Math.ceil(max / stufe) * stufe;
  const untenWert = Math.floor(min / stufe) * stufe;
  const bereich = obenWert - untenWert || 1;

  const x = (i: number) =>
    PAD.links + (i * (B - PAD.links - PAD.rechts)) / Math.max(1, labels.length - 1);
  const y = (w: number) =>
    PAD.oben + ((obenWert - w) / bereich) * (H - PAD.oben - PAD.unten);

  const gitter = [0, 0.25, 0.5, 0.75, 1].map((f) => obenWert - f * bereich);
  // Bei vielen Stützpunkten nicht jedes Label zeichnen.
  const jedes = Math.ceil(labels.length / 8);

  return (
    <svg
      viewBox={`0 0 ${B} ${H}`}
      className="w-full"
      style={{ height: hoehe }}
      role="img"
      aria-label={`Diagramm: ${reihen.map((r) => r.name).join(", ")}`}
    >
      {reihen.map((r, i) =>
        r.flaeche ? (
          <defs key={i}>
            <linearGradient id={`${uid}-f${i}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={r.farbe} stopOpacity="0.22" />
              <stop offset="100%" stopColor={r.farbe} stopOpacity="0.02" />
            </linearGradient>
          </defs>
        ) : null,
      )}

      {/* Gitter und Y-Achse */}
      {gitter.map((w, i) => (
        <g key={i}>
          <line
            x1={PAD.links}
            x2={B - PAD.rechts}
            y1={y(w)}
            y2={y(w)}
            stroke="var(--color-linie)"
            strokeWidth="1"
          />
          <text
            x={PAD.links - 8}
            y={y(w) + 4}
            textAnchor="end"
            fontSize="11"
            fill="var(--color-tinte3)"
          >
            {yFormat(w)}
          </text>
        </g>
      ))}

      {/* Nulllinie hervorheben, falls sie im Bild liegt */}
      {untenWert < 0 && obenWert > 0 && (
        <line
          x1={PAD.links}
          x2={B - PAD.rechts}
          y1={y(0)}
          y2={y(0)}
          stroke="var(--color-linie2)"
          strokeWidth="1.5"
        />
      )}

      {/* X-Beschriftung */}
      {labels.map((l, i) =>
        i % jedes === 0 || i === labels.length - 1 ? (
          <text
            key={i}
            x={x(i)}
            y={H - 9}
            textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"}
            fontSize="11"
            fill="var(--color-tinte3)"
          >
            {l}
          </text>
        ) : null,
      )}

      {reihen.map((r, i) => {
        const punkte = r.werte.map((w, k) => `${x(k)},${y(w)}`).join(" ");
        return (
          <g key={i}>
            {r.flaeche && (
              <polygon
                points={`${x(0)},${y(Math.max(0, untenWert))} ${punkte} ${x(r.werte.length - 1)},${y(Math.max(0, untenWert))}`}
                fill={`url(#${uid}-f${i})`}
              />
            )}
            <polyline
              points={punkte}
              fill="none"
              stroke={r.farbe}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={r.gestrichelt ? "6 5" : undefined}
            />
            {r.werte.length <= 14 &&
              r.werte.map((w, k) => (
                <circle key={k} cx={x(k)} cy={y(w)} r="3.5" fill="var(--color-flaeche)" stroke={r.farbe} strokeWidth="2" />
              ))}
          </g>
        );
      })}
    </svg>
  );
}
