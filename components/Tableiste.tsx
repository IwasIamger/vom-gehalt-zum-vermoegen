"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Untere Navigationsleiste – nur auf schmalen Bildschirmen.
 * Oben im Header ist für vier Punkte plus Wortmarke kein Platz; als installierte
 * PWA ist die Daumenzone unten ohnehin der richtige Ort.
 */
const punkte = [
  {
    href: "/methode",
    label: "Methode",
    pfad: "M4 5.5A1.5 1.5 0 0 1 5.5 4H10a2 2 0 0 1 2 2 2 2 0 0 1 2-2h4.5A1.5 1.5 0 0 1 20 5.5v11a1.5 1.5 0 0 1-1.5 1.5H14a2 2 0 0 0-2 2 2 2 0 0 0-2-2H5.5A1.5 1.5 0 0 1 4 16.5v-11ZM12 6v14",
  },
  {
    href: "/rechner",
    label: "Rechner",
    pfad: "M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm2 4h8M8 12h2m3 0h3m-8 4h2m3 0h3",
  },
  {
    href: "/kontensystem",
    label: "Konten",
    pfad: "M3 7h18M3 7l9-4 9 4M5 7v10m4-10v10m6-10v10m4-10v10M3 20h18",
  },
  {
    href: "/cockpit",
    label: "Cockpit",
    pfad: "M4 19h16M7 19v-6m5 6V8m5 11v-9",
  },
];

export default function Tableiste() {
  const pfad = usePathname();

  return (
    <nav
      aria-label="Hauptbereiche"
      className="kein-druck fixed inset-x-0 bottom-0 z-40 border-t border-linie bg-papier/95 backdrop-blur sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex">
        {punkte.map((p) => {
          const aktiv = pfad === p.href || pfad.startsWith(p.href + "/");
          return (
            <li key={p.href} className="flex-1">
              <Link
                href={p.href}
                aria-current={aktiv ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                  aktiv ? "text-gruen" : "text-tinte3"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={aktiv ? 2 : 1.6}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={p.pfad} />
                </svg>
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
