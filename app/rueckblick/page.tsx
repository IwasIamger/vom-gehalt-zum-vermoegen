import type { Metadata } from "next";
import Rueckblick from "./Rueckblick";

export const metadata: Metadata = {
  title: "Rückblick",
  description:
    "Was sich seit Jahresanfang getan hat: Vermögen, Ausgaben, erledigte Punkte – aus den Daten, die die App ohnehin sammelt.",
};

export default function Seite() {
  return <Rueckblick />;
}
