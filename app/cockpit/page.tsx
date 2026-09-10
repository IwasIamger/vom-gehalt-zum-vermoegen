import type { Metadata } from "next";
import Cockpit from "./Cockpit";

export const metadata: Metadata = {
  title: "Cockpit",
  description:
    "Vermögensbilanz, Entwicklung, Prognose, Soll-Ist mit Rebalancing-Hinweis, Haltefristen und offene To-dos – alles lokal in deinem Browser.",
};

export default function Seite() {
  return <Cockpit />;
}
