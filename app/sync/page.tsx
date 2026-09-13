import type { Metadata } from "next";
import Sync from "./Sync";

export const metadata: Metadata = {
  title: "Sync",
  description:
    "Dieselben Daten auf Handy und Laptop – ohne Konto. Ein Satz, auf dem Gerät verschlüsselt, als unlesbarer Block abgelegt.",
};

export default function Seite() {
  return <Sync />;
}
