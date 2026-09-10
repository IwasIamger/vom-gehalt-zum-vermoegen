import type { Metadata } from "next";
import Hinweise from "./Hinweise";

export const metadata: Metadata = {
  title: "Anmerkungen",
  description:
    "Fehler, Wünsche und Fragen zur App – lokal gesammelt und auf Knopfdruck zum Weitergeben.",
};

export default function Seite() {
  return <Hinweise />;
}
