import type { Metadata } from "next";
import Start from "./Start";

export const metadata: Metadata = {
  title: "Einstieg",
  description:
    "Fünf Fragen, dann steht dein Ausgangspunkt: Ausgaben, Einnahmen, Konten, Anlagen, Schulden – und die nächsten Schritte.",
};

export default function Seite() {
  return <Start />;
}
