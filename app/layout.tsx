import type { Metadata, Viewport } from "next";
import Link from "next/link";
import Anmerkung from "@/components/Anmerkung";
import Designwahl from "@/components/Designwahl";
import Offline from "@/components/Offline";
import Speicherhinweis from "@/components/Speicherhinweis";
import Tableiste from "@/components/Tableiste";
import "./globals.css";

const bp = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: {
    default: "Vom Gehalt zum Vermögen",
    template: "%s · Vom Gehalt zum Vermögen",
  },
  description:
    "Ein Fahrplan von der ersten Sparrate bis zum eigenen Portfolio: rechnen, aufteilen, automatisieren. Kostenlos, ohne Anmeldung, alle Daten bleiben auf deinem Gerät.",
  applicationName: "Vom Gehalt zum Vermögen",
  manifest: `${bp}/manifest.webmanifest`,
  icons: {
    icon: `${bp}/icon-192.png`,
    apple: `${bp}/icon-192.png`,
  },
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Gehalt→Vermögen" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f1a17" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1210" },
  ],
  width: "device-width",
  initialScale: 1,
};

const navigation = [
  { href: "/methode", label: "Methode" },
  { href: "/ausgaben", label: "Ausgaben" },
  { href: "/rechner", label: "Rechner" },
  { href: "/kontensystem", label: "Kontensystem" },
  { href: "/cockpit", label: "Cockpit" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        {/* Gewähltes Design vor dem ersten Zeichnen setzen – sonst blitzt es hell auf. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var w=localStorage.getItem("finanzcockpit.design");if(w==="light"||w==="dark")document.documentElement.setAttribute("data-theme",w)}catch(e){}',
          }}
        />
      </head>
      <body className="min-h-dvh flex flex-col">
        <header className="kein-druck sticky top-0 z-40 border-b border-linie bg-papier/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
            <Link href="/" className="flex items-baseline gap-2 shrink-0">
              <span className="font-serif text-lg font-bold text-tinte">Vom Gehalt</span>
              <span className="font-serif text-lg font-bold text-gruen">zum Vermögen</span>
            </Link>
            <nav className="ml-auto hidden items-center gap-1 text-sm sm:flex">
              {navigation.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-md px-3 py-2 text-tinte2 transition-colors hover:bg-gruen-hell hover:text-gruen-tief"
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <Speicherhinweis />

        <main className="flex-1">{children}</main>

        <Offline />
        <Anmerkung />
        <Tableiste />

        <footer className="kein-druck border-t border-linie bg-flaeche pb-16 sm:pb-0">
          <div className="mx-auto max-w-6xl px-5 py-10 text-sm text-tinte2">
            <div className="flex flex-wrap items-start justify-between gap-8">
              <div className="max-w-md">
                <p className="font-serif text-base font-bold text-tinte">
                  Finanzen einfach. Leben besser.
                </p>
                <p className="mt-2 leading-relaxed">
                  Kostenlos und ohne Anmeldung. Alle Eingaben bleiben auf deinem Gerät und werden
                  nirgendwo hochgeladen.
                </p>
              </div>
              <div className="text-xs leading-relaxed text-tinte3">
                <p className="max-w-sm">
                  Keine Anlageberatung. Die Inhalte dienen der Information und ersetzen keine
                  individuelle Beratung. Stand der Angaben: September 2026.
                </p>
                <p className="mt-3">
                  <Link href="/testen" className="underline transition-colors hover:text-gruen">
                    Mittesten
                  </Link>
                  {" · "}
                  <Link href="/hinweise" className="underline transition-colors hover:text-gruen">
                    Anmerkungen zur App
                  </Link>
                </p>
                <p className="mt-3">© 2026 M. Ackermann</p>
                <div className="mt-4">
                  <Designwahl />
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
