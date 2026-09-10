import type { Metadata } from "next";
import Ausgaben from "./Ausgaben";

export const metadata: Metadata = {
  title: "Ausgaben erfassen",
  description:
    "Ausgaben in zwei Sekunden erfassen und nach drei Monaten die durchschnittlichen Nettomonatsausgaben ablesen – die Zahl, die den Notgroschen bemisst.",
};

export default function Seite() {
  return <Ausgaben />;
}
