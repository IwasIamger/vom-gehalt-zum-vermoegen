import type { Metadata } from "next";
import Kontensystem from "./Kontensystem";

export const metadata: Metadata = {
  title: "Kontensystem",
  description:
    "Das Arbeitsblatt zum Ausfüllen: ein Hauptkonto als Drehscheibe, getrennte Konten für Notgroschen, Dauerausgaben und Urlaub – mit Gegenrechnung.",
};

export default function Seite() {
  return <Kontensystem />;
}
