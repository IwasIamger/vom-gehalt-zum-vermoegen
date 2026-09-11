/**
 * Die zehn Kapitel des Vortrags als Daten.
 *
 * Bewusst als Datenstruktur und nicht als JSX: So bleibt der Inhalt an einer
 * Stelle pflegbar, lässt sich durchsuchen und später auch in einer nativen App
 * wiederverwenden. Die Darstellung liegt komplett in `components/Bloecke.tsx`.
 */

export type Ton = "gruen" | "blau" | "rot" | "gold" | "neutral";

export type Block =
  | { art: "text"; inhalt: string }
  | { art: "rendite"; wert: string; hinweis?: string; ton?: Ton }
  | {
      art: "kennzahlen";
      werte: { zahl: string; label: string; text?: string; ton?: Ton }[];
    }
  | {
      art: "karten";
      karten: { nummer?: string; titel: string; zahl?: string; text: string; ton?: Ton }[];
    }
  | { art: "liste"; punkte: { titel: string; text?: string }[]; ton?: Ton }
  | { art: "hinweis"; titel?: string; text: string; ton?: Ton }
  | {
      art: "balken";
      titel?: string;
      daten: { label: string; wert: number; ton?: Ton }[];
      einheit?: string;
      quelle?: string;
    }
  | {
      art: "vergleich";
      spalten: {
        name: string;
        unter?: string;
        zahl: string;
        zahlHinweis?: string;
        ton: Ton;
        zeilen: { gut: boolean; text: string }[];
      }[];
    }
  | { art: "tabelle"; kopf: string[]; zeilen: string[][] }
  | { art: "cta"; text: string; label: string; href: string }
  /** Holt die aktuellen Werte direkt bei der EZB. */
  | { art: "live" };

export type Abschnitt = { titel: string; bloecke: Block[] };

export type Kapitel = {
  nr: number;
  slug: string;
  titel: string;
  kurz: string;
  ton: Ton;
  minuten: number;
  abschnitte: Abschnitt[];
};

export const KAPITEL: Kapitel[] = [
  // ────────────────────────────────────────────────────────── 1
  {
    nr: 1,
    slug: "warum-investieren",
    titel: "Warum investieren?",
    kurz: "Inflation, Rentenlücke, passives Einkommen – drei Gründe, die unabhängig voneinander wirken.",
    ton: "gruen",
    minuten: 4,
    abschnitte: [
      {
        titel: "Drei Gründe",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Drei Gründe, die unabhängig voneinander wirken – und sich gegenseitig verstärken.",
          },
          {
            art: "karten",
            karten: [
              {
                nummer: "01",
                titel: "Inflation",
                zahl: "2,0 %",
                text: "Geld auf dem Konto verliert jedes Jahr an Kaufkraft. Wer nicht investiert, verliert real – auch ohne etwas zu tun.",
                ton: "gruen",
              },
              {
                nummer: "02",
                titel: "Rentenlücke",
                zahl: "48 %",
                text: "Die gesetzliche Rente ersetzt nur einen Teil des letzten Nettoeinkommens. Der Rest muss privat kommen.",
                ton: "blau",
              },
              {
                nummer: "03",
                titel: "Passives Einkommen",
                zahl: "∞",
                text: "Investiertes Geld arbeitet weiter, auch wenn du es nicht tust. Das schafft Wahlfreiheit – im Job und danach.",
                ton: "rot",
              },
            ],
          },
        ],
      },
      {
        titel: "Inflation",
        bloecke: [
          {
            art: "balken",
            titel: "Inflationsrate Deutschland – Veränderung zum Vorjahr in Prozent",
            daten: [
              { label: "2016", wert: 0.5, ton: "neutral" },
              { label: "2017", wert: 1.5, ton: "neutral" },
              { label: "2018", wert: 1.8, ton: "neutral" },
              { label: "2019", wert: 1.4, ton: "neutral" },
              { label: "2020", wert: 0.5, ton: "neutral" },
              { label: "2021", wert: 3.1, ton: "rot" },
              { label: "2022", wert: 6.9, ton: "rot" },
              { label: "2023", wert: 5.9, ton: "rot" },
              { label: "2024", wert: 2.2, ton: "gruen" },
              { label: "2025", wert: 2.2, ton: "gruen" },
              { label: "2026*", wert: 2.5, ton: "gruen" },
            ],
            quelle:
              "* 2026: vorläufiger Wert auf Basis der Monate bis August. Quelle: Statistisches Bundesamt",
          },
          {
            art: "kennzahlen",
            werte: [
              {
                zahl: "2,0 %",
                label: "Zielwert der EZB",
                text: "Im Schnitt der letzten zehn Jahre lag Deutschland mit 2,6 % darüber.",
                ton: "gruen",
              },
              {
                zahl: "82 €",
                label: "100 € nach 10 Jahren",
                text: "So viel Kaufkraft bleibt bei 2 % Inflation von heute 100 € übrig.",
                ton: "gold",
              },
              {
                zahl: "67 €",
                label: "100 € nach 20 Jahren",
                text: "Ein Drittel der Kaufkraft ist weg – ohne dass etwas passiert ist.",
                ton: "rot",
              },
              {
                zahl: "2,6 %",
                label: "Ø 2016 – 2025",
                text: "Der tatsächliche Durchschnitt der letzten zehn Jahre in Deutschland.",
                ton: "blau",
              },
            ],
          },
          { art: "live" },
          {
            art: "hinweis",
            ton: "rot",
            titel: "Nichtstun ist keine sichere Option",
            text: "Auf dem Girokonto ist Nichtstun kein neutraler Zustand, sondern ein garantierter realer Verlust.",
          },
          {
            art: "cta",
            text: "Was deine Sparsumme real wert ist, hängt nur an zwei Zahlen: Zeit und Inflationsrate. Rechne es für deinen Betrag durch.",
            label: "Inflationsrechner öffnen",
            href: "/rechner/inflation",
          },
        ],
      },
      {
        titel: "Rentenlücke",
        bloecke: [
          {
            art: "text",
            inhalt: "Was die gesetzliche Rente leistet – und was sie nicht leistet.",
          },
          {
            art: "kennzahlen",
            werte: [
              {
                zahl: "48 %",
                label: "Rentenniveau 2026",
                text: "Gesetzlich festgeschrieben bis 2031.",
                ton: "blau",
              },
              {
                zahl: "1.835 €",
                label: "Standardrente brutto",
                text: "45 Beitragsjahre, Durchschnittsverdienst. Netto bleiben rund 1.630 €. Stand 07/2025.",
                ton: "blau",
              },
              {
                zahl: "1.154 €",
                label: "tatsächliche Ø-Rente",
                text: "Zahlbetrag: Männer 1.405 €, Frauen 955 €. Stand 2024.",
                ton: "blau",
              },
              {
                zahl: "80 %",
                label: "Faustregel Bedarf",
                text: "Vom letzten Nettoeinkommen im Alter.",
                ton: "blau",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "blau",
            titel: "Die Lücke ist der Teil, den niemand für dich schließt.",
            text: "Zwischen dem, was die gesetzliche Rente zahlt, und dem, was du zum Leben brauchst, liegt ein Betrag, der privat aufgebaut werden muss. Je früher, desto kleiner die nötige Sparrate.",
          },
        ],
      },
      {
        titel: "Passives Einkommen",
        bloecke: [
          { art: "text", inhalt: "Das Ziel ist nicht Reichtum. Das Ziel ist Wahlfreiheit." },
          {
            art: "liste",
            ton: "gruen",
            punkte: [
              {
                titel: "Stufe 1 · Abhängig",
                text: "Das Einkommen kommt ausschließlich aus deiner Arbeitszeit. Fällt die Zeit weg, fällt das Einkommen weg.",
              },
              {
                titel: "Stufe 2 · Puffer",
                text: "Notgroschen und erste Investments federn ab. Du kannst Nein sagen, ohne dass es existenziell wird.",
              },
              {
                titel: "Stufe 3 · Wahlfreiheit",
                text: "Die Kapitalerträge decken einen spürbaren Teil der Fixkosten. Teilzeit, Wechsel oder Auszeit werden möglich.",
              },
              {
                titel: "Stufe 4 · Finanzielle Freiheit",
                text: "Die Erträge decken die Lebenshaltung dauerhaft. Arbeit wird zur Entscheidung, nicht zur Notwendigkeit.",
              },
            ],
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 2
  {
    nr: 2,
    slug: "wie-viel",
    titel: "Wie viel können wir investieren?",
    kurz: "Die Formel hat nur zwei Stellschrauben. Beide lassen sich messen und steuern.",
    ton: "blau",
    minuten: 3,
    abschnitte: [
      {
        titel: "Die Formel",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Alles, was investiert werden kann, ist der Rest aus einer einzigen Rechnung. Es gibt keinen dritten Hebel.",
          },
          {
            art: "kennzahlen",
            werte: [
              {
                zahl: "Einnahmen",
                label: "was reinkommt",
                text: "Gehalt, Nebeneinkünfte, Kapitalerträge, Erstattungen.",
                ton: "gruen",
              },
              {
                zahl: "− Ausgaben",
                label: "was rausgeht",
                text: "Fixkosten, täglicher Bedarf, Dauerausgaben, Rücklagen.",
                ton: "rot",
              },
              {
                zahl: "= Sparrate",
                label: "was investierbar ist",
                text: "Der Betrag, der jeden Monat verlässlich übrig bleibt.",
                ton: "blau",
              },
              {
                zahl: "× Zeit",
                label: "was daraus wird",
                text: "Der einzige Faktor, den man nicht nachträglich vergrößern kann.",
                ton: "gold",
              },
            ],
          },
        ],
      },
      {
        titel: "Die beiden Stellschrauben",
        bloecke: [
          {
            art: "karten",
            karten: [
              {
                nummer: "Stellschraube 1",
                titel: "Einnahmen erhöhen",
                text: "Gehaltsverhandlung, Wechsel, Nebentätigkeit, Weiterbildung. Wirkt stark, braucht aber Zeit und ist nicht immer in der eigenen Hand.",
                ton: "gruen",
              },
              {
                nummer: "Stellschraube 2",
                titel: "Ausgaben senken",
                text: "Verträge, Abos, Versicherungen, Alltagskosten. Wirkt sofort und dauerhaft – jeder eingesparte Euro ist ein investierbarer Euro.",
                ton: "rot",
              },
              {
                nummer: "Und dann",
                titel: "Die Differenz sichern",
                text: "Was übrig bleibt, muss automatisch abfließen, bevor es ausgegeben werden kann. Sonst verschwindet es im Monat.",
                ton: "blau",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "blau",
            text: "Eine gesenkte Ausgabe wirkt doppelt: Sie erhöht die Sparrate und senkt gleichzeitig den Notgroschen, den du brauchst – der bemisst sich schließlich an den Ausgaben.",
          },
        ],
      },
      {
        titel: "Beides messen und steuern",
        bloecke: [
          {
            art: "liste",
            ton: "blau",
            punkte: [
              {
                titel: "Erst messen, dann entscheiden",
                text: "Ohne Zahlen wird geschätzt – und geschätzt wird fast immer zu günstig.",
              },
              {
                titel: "Monatlich statt jährlich denken",
                text: "Ein Abo für 12,99 € ist eine Entscheidung über 155,88 € im Jahr.",
              },
              {
                titel: "Die Sparrate zuerst abbuchen",
                text: "Dauerauftrag am Tag nach dem Gehaltseingang. Was nicht da ist, wird nicht ausgegeben.",
              },
              {
                titel: "Einmal im Jahr nachschärfen",
                text: "Gehalt, Miete und Verträge ändern sich. Die Sparrate sollte mitwachsen.",
              },
            ],
          },
          {
            art: "cta",
            text: "Trag Einnahmen und Ausgaben in dein Kontensystem ein – die Sparrate rechnet sich dann von selbst aus.",
            label: "Zum Kontensystem",
            href: "/kontensystem",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 3
  {
    nr: 3,
    slug: "ausgaben",
    titel: "Ausgaben",
    kurz: "Drei Monate tracken, dann steht die wichtigste Zahl: die Nettomonatsausgaben.",
    ton: "rot",
    minuten: 3,
    abschnitte: [
      {
        titel: "Tracking",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Was nicht gemessen wird, lässt sich nicht steuern. Drei Monate reichen für ein belastbares Bild.",
          },
          {
            art: "liste",
            ton: "rot",
            punkte: [
              {
                titel: "Banking-Apps mit Kategorien",
                text: "Automatisch, aber oft ungenau bei Bargeld.",
              },
              {
                titel: "Haushaltsbuch-Apps",
                text: "z. B. Finanzguru, Outbank, MoneyMoney.",
              },
              {
                titel: "Eigene Excel-Tabelle",
                text: "Volle Kontrolle, keine Datenweitergabe an Dritte.",
              },
              {
                titel: "Drei Monate am Stück",
                text: "Erst dann sind Ausreißer als Ausreißer erkennbar.",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "rot",
            titel: "Ziel: die durchschnittlichen Nettomonatsausgaben.",
            text: "Diese eine Zahl brauchen wir gleich für den Notgroschen – und später für jede Prognose.",
          },
          {
            art: "cta",
            text: "Wenn du keine App dafür einrichten willst: Hier kannst du direkt erfassen. Betrag, Kategorie, fertig – nach drei vollen Monaten steht dein Schnitt.",
            label: "Ausgaben erfassen",
            href: "/ausgaben",
          },
        ],
      },
      {
        titel: "Kontomodell",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Meine Empfehlung: ein Hauptkonto als Drehscheibe, getrennte Konten für Notgroschen, Dauerausgaben und Urlaub. Das Gehalt läuft vollständig durch das Hauptkonto und wird von dort verteilt.",
          },
          {
            art: "liste",
            ton: "rot",
            punkte: [
              {
                titel: "Hauptkonto = Durchlauf",
                text: "Hier kommt das Gehalt an, von hier gehen alle Daueraufträge ab. Am Monatsende soll wenig übrig bleiben – der Rest ist bereits verteilt.",
              },
              {
                titel: "Notgroschen getrennt",
                text: "Auf einem eigenen Tagesgeldkonto, am besten bei einer anderen Bank. Was man nicht sieht, gibt man nicht aus.",
              },
              {
                titel: "Dauerausgaben ansparen",
                text: "Versicherungen, KFZ-Steuer, Rundfunkbeitrag: jährliche Posten monatlich zurücklegen, statt sie als Überraschung zu erleben.",
              },
              {
                titel: "Investitionen als eigener Topf",
                text: "Der Betrag, der in die Depots fließt, verlässt das Hauptkonto genauso automatisch wie die Miete.",
              },
            ],
          },
          {
            art: "cta",
            text: "Das Kontensystem gibt es hier als ausfüllbares Arbeitsblatt – mit Gegenrechnung, die sofort anzeigt, ob deine Aufteilung aufgeht.",
            label: "Kontensystem ausfüllen",
            href: "/kontensystem",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 4
  {
    nr: 4,
    slug: "reihenfolge",
    titel: "Sparrate → Investieren",
    kurz: "Erst teure Schulden, dann der Notgroschen, dann die Regeln – und dann erst die erste Order.",
    ton: "gruen",
    minuten: 5,
    abschnitte: [
      {
        titel: "Drei Ziele in dieser Reihenfolge",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Aus der Sparrate wird erst dann Vermögen, wenn drei Dinge geklärt sind.",
          },
          {
            art: "karten",
            karten: [
              {
                nummer: "Ziel 1",
                titel: "Notgroschen aufbauen",
                text: "Erst die Sicherheit, dann die Rendite. Separates Konto, jederzeit verfügbar, Ziel: 3–5 Nettomonatsausgaben.",
                ton: "gruen",
              },
              {
                nummer: "Ziel 2",
                titel: "Investitionsphilosophie festlegen",
                text: "Regeln vor der ersten Order. Welche Assetklassen, welche Gewichtung, welches Risiko – und der Anlagehorizont schriftlich.",
                ton: "blau",
              },
              {
                nummer: "Ziel 3",
                titel: "Investieren automatisieren",
                text: "Der Dauerauftrag schlägt die Disziplin. Sparplan am Tag nach dem Gehaltseingang, feste Rate statt Reste am Monatsende.",
                ton: "gold",
              },
            ],
          },
        ],
      },
      {
        titel: "Zuerst: teure Schulden",
        bloecke: [
          {
            art: "rendite",
            ton: "rot",
            wert: "= dein Kreditzins",
            hinweis: "Garantiert und steuerfrei. Kein Investment kann das versprechen.",
          },
          {
            art: "liste",
            ton: "rot",
            punkte: [
              {
                titel: "Dispokredit",
                text: "10 – 13 % Zinsen. Der teuerste Kredit, den es gibt. Sofort ablösen.",
              },
              {
                titel: "Kreditkarten-Teilzahlung",
                text: "Oft über 15 %. Immer auf volle Abbuchung umstellen.",
              },
              {
                titel: "Konsumkredite",
                text: "Auto, Möbel, Ratenkäufe – meist 6 – 10 %. Tilgen schlägt jedes Investment.",
              },
              {
                titel: "Ausnahme: Immobilienkredit",
                text: "Läuft er unter 3 %, ist paralleles Investieren vertretbar.",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "rot",
            titel: "Die Rechnung: 9 % Kredit tilgen = 9 % sichere Rendite",
            text: "Ein ETF liefert im Schnitt 7 % – aber nur im Schnitt und nur langfristig. Die Tilgung liefert deinen Kreditzins, jedes Jahr, ohne Schwankung. Erst Schulden, dann Notgroschen, dann investieren.",
          },
        ],
      },
      {
        titel: "Notgroschen",
        bloecke: [
          {
            art: "rendite",
            ton: "gruen",
            wert: "≈ EZB-Einlagenzins",
            hinweis:
              "Der Notgroschen ist keine Geldanlage – aber er soll auch nicht schrumpfen.",
          },
          {
            art: "hinweis",
            ton: "gruen",
            titel: "Wie hoch? 3 – 5 Nettomonatsausgaben",
            text: "Die Faustregel nennt Nettomonatsgehälter. Ich halte die Ausgaben für die bessere Bezugsgröße – sie beschreiben, was du brauchst, nicht was du verdienst. Diese Zahl haben wir in Kapitel 3 ermittelt.",
          },
          {
            art: "liste",
            ton: "gruen",
            punkte: [
              {
                titel: "Separates Konto",
                text: "Nicht auf dem Hauptkonto – sonst wird es ausgegeben.",
              },
              { titel: "Keine Gebühren", text: "Sonst frisst die Kontoführung die Rücklage an." },
              {
                titel: "Schnell verfügbar",
                text: "Tagesgeld statt Festgeld. Im Notfall zählen Stunden, nicht Wochen.",
              },
              {
                titel: "Einlagensicherung",
                text: "Innerhalb der EU bis 100.000 € je Bank und Kunde.",
              },
              {
                titel: "Zinsen möglichst hoch",
                text: "So viel wie der EZB-Einlagenzins – den aktuellen Satz zeigt der Kasten unten. Höhere Angebote sind meist Aktionszinsen: oft vier Monate, begrenzt auf 25.000 €.",
              },
            ],
          },
          { art: "live" },
          {
            art: "cta",
            text: "Wie viel dein Notgroschen haben muss, hängt allein an deinen Nettomonatsausgaben.",
            label: "Notgroschen berechnen",
            href: "/rechner/notgroschen",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 5
  {
    nr: 5,
    slug: "anlageklassen",
    titel: "Die Anlageklassen",
    kurz: "Aktien, ETF, Festgeld, Krypto, P2P, Immobilien – was sie leisten und was sie kosten.",
    ton: "blau",
    minuten: 9,
    abschnitte: [
      {
        titel: "Überblick",
        bloecke: [
          {
            art: "tabelle",
            kopf: ["Anlageklasse", "Erwartete Rendite", "Rolle im Portfolio"],
            zeilen: [
              ["ETF (Welt)", "≈ 7 % p. a.", "Core – der Kern jedes Portfolios, 70 – 90 %"],
              ["Einzelaktien", "≈ 7 % p. a. Markt", "Satellit – klein und klar begrenzt"],
              ["Festgeld / Anleihen", "≈ 2,4 – 3,5 % p. a.", "Empfehle ich nicht – Bindung ohne Mehrwert"],
              ["Kryptowährungen", "−100 % bis +200 %", "Satellit – 10 – 20 %, nur entbehrliches Kapital"],
              ["P2P-Kredite", "6 – 12 % p. a.", "Satellit – 10 – 20 %, ohne Einlagensicherung"],
              ["Immobilien", "1 – 10 % p. a.", "Kein Einstiegsinvestment, ab ca. 15.000 € Eigenkapital"],
            ],
          },
        ],
      },
      {
        titel: "Aktien",
        bloecke: [
          {
            art: "rendite",
            ton: "blau",
            wert: "≈ 7 % p. a. Markt",
            hinweis:
              "Einzelwerte: −100 % bis offen. Mehr Risiko, aber keine höhere erwartete Rendite.",
          },
          {
            art: "liste",
            ton: "blau",
            punkte: [
              {
                titel: "Klumpenrisiko",
                text: "Einzelne Titel bündeln das Risiko auf wenige Unternehmen. Ein Fehlgriff kostet überproportional.",
              },
              {
                titel: "Zeitaufwand",
                text: "Wer ein Unternehmen wirklich verstehen will, braucht Bilanzen, Branche, Wettbewerb – dauerhaft.",
              },
              {
                titel: "Die Gegenseite ist Profi",
                text: "Investmentbanken und Fondsmanager machen das hauptberuflich, mit Datenzugang und Teams.",
              },
              {
                titel: "Deshalb: nur als Satellit",
                text: "Einzelaktien gehören für mich in einen kleinen, klar begrenzten Teil des Portfolios.",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "blau",
            titel: "Core-Satellite-Portfolio",
            text: "70 – 90 % Welt-ETF als Kern, 10 – 30 % verteilt auf Satelliten wie Einzelaktien, Krypto, P2P oder Immobilien. Der Kern trägt die Rendite, die Satelliten sind die bewusst dosierte Abweichung.",
          },
        ],
      },
      {
        titel: "ETF",
        bloecke: [
          {
            art: "rendite",
            ton: "gruen",
            wert: "≈ 7 % p. a.",
            hinweis:
              "Nominal, vor Kosten und Steuern. Real nach 2 % Inflation bleiben rund 5 %.",
          },
          {
            art: "liste",
            ton: "blau",
            punkte: [
              { titel: "1. Einzelaktien haben ein Klumpenrisiko." },
              { titel: "2. Also streuen – auf mehrere Aktien." },
              { titel: "3. Warum dann nicht gleich auf alle?" },
              { titel: "4. Genau das macht ein Welt-ETF." },
            ],
          },
          {
            art: "karten",
            karten: [
              {
                nummer: "Weg 1",
                titel: "All-in-One",
                text: "Ein einziger ETF auf den Weltmarkt – z. B. FTSE All-World oder MSCI ACWI. Maximal einfach, kein Rebalancing nötig.",
                ton: "blau",
              },
              {
                nummer: "Weg 2 · meine Empfehlung",
                titel: "50 / 30 / 20",
                text: "50 % MSCI World, 30 % MSCI Emerging Markets, 20 % STOXX Europe 600. Mehr Steuerung, dafür einmal im Jahr Rebalancing.",
                ton: "gruen",
              },
              {
                nummer: "In beiden Fällen",
                titel: "ETFs bilden den Core",
                text: "Alles andere ist Beiwerk um diesen Kern herum. Erst steht der Kern, dann kommen die Satelliten.",
                ton: "gold",
              },
            ],
          },
        ],
      },
      {
        titel: "Festgeld & Staatsanleihen",
        bloecke: [
          {
            art: "rendite",
            ton: "gold",
            wert: "≈ 2,4 – 3,5 % p. a.",
            hinweis:
              "Heute. Über die letzten zehn Jahre lag der Zins meist unter der Inflation.",
          },
          {
            art: "liste",
            ton: "gold",
            punkte: [
              {
                titel: "Planbarkeit",
                text: "Der Zins steht bei Abschluss fest. Keine Kursschwankungen, wenn bis Laufzeitende gehalten wird.",
              },
              {
                titel: "Einlagensicherung",
                text: "Beim Festgeld innerhalb der EU bis 100.000 € je Bank und Kunde.",
              },
              {
                titel: "Der Zins schwankt mit der EZB",
                text: "2016 bis 2021 gab es faktisch nichts. Erst seit 2023 lohnt es sich wieder.",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "rot",
            titel: "Meine Einschätzung: Ich empfehle es nicht.",
            text: "Nicht wegen der Rendite, sondern wegen der Bindung: Das Geld ist über die Laufzeit fest und kommt vorzeitig nicht oder nur mit Abschlag heraus. Inflation Ø 2016 – 2025: 2,6 % p. a. – über weite Strecken dieses Zeitraums lag der Festgeldzins nahe null. Real war das ein Verlust, trotz garantierter Verzinsung. Tagesgeld erfüllt denselben Zweck und bleibt verfügbar.",
          },
        ],
      },
      {
        titel: "Kryptowährungen",
        bloecke: [
          {
            art: "rendite",
            ton: "rot",
            wert: "−100 % bis +200 %",
            hinweis:
              "Totalverlust ist möglich, ebenso eine Verdreifachung im selben Jahr.",
          },
          {
            art: "liste",
            ton: "rot",
            punkte: [
              {
                titel: "10 – 20 % vom Portfolio",
                text: "Genug, um zu wirken. Wenig genug, um einen Totalausfall zu verkraften.",
              },
              {
                titel: "Nur die Top 10",
                text: "Die zehn größten Coins decken rund 82 % der gesamten Marktkapitalisierung ab, Bitcoin allein über 50 %.",
              },
              {
                titel: "Hohe Volatilität aushalten",
                text: "Rücksetzer von 50 % und mehr sind in dieser Assetklasse normal, nicht außergewöhnlich.",
              },
              {
                titel: "Nur Geld, das entbehrlich ist",
                text: "Kein Notgroschen, kein kurzfristig benötigtes Kapital.",
              },
            ],
          },
          {
            art: "balken",
            titel: "Marktkonzentration",
            einheit: " %",
            daten: [
              { label: "Top 10", wert: 82, ton: "rot" },
              { label: "Bitcoin", wert: 50, ton: "gold" },
            ],
            quelle: "Anteil an der gesamten Kryptomarktkapitalisierung, Stand 09/2026.",
          },
        ],
      },
      {
        titel: "P2P-Kredite",
        bloecke: [
          {
            art: "rendite",
            ton: "gruen",
            wert: "6 – 12 % p. a.",
            hinweis: "Höhere Rendite als Entschädigung für ein reales Ausfallrisiko.",
          },
          {
            art: "text",
            inhalt:
              "Peer to Peer: Privatpersonen leihen Geld direkt an Kreditnehmer – ohne dass eine Bank dazwischensteht. Die Zinsen, die sonst die Bank verdient, gehen an dich. Kreditnehmer sind Unternehmen und Start-ups, die kurzfristig Kapital brauchen, sowie Privatpersonen mit Konsumkrediten.",
          },
          {
            art: "hinweis",
            ton: "rot",
            titel: "Das Risiko: keine Einlagensicherung.",
            text: "Die 100.000-€-Garantie der Banken greift hier nicht. Fällt ein Kredit aus, ist das Geld weg. Genau dafür gibt es den Aufschlag auf die Rendite. Meine Empfehlung: 10 – 20 % vom Portfolio – und innerhalb davon auf zwei Anbieter aufteilen.",
          },
          {
            art: "vergleich",
            spalten: [
              {
                name: "monefit",
                unter: "SmartSaver",
                zahl: "7,5 %",
                zahlHinweis: "p. a., täglich gutgeschrieben",
                ton: "gruen",
                zeilen: [
                  { gut: true, text: "1.000 € sofort verfügbar" },
                  { gut: false, text: "Rest: bis zu 10 Werktage" },
                  { gut: true, text: "Keine Auszahlungsgebühr" },
                  { gut: true, text: "Vaults: bis rund 10,5 % p. a." },
                  { gut: true, text: "Mindestanlage 10 €" },
                  { gut: false, text: "Vaults binden 6 – 24 Monate" },
                ],
              },
              {
                name: "Go & Grow",
                unter: "von Bondora",
                zahl: "6,0 %",
                zahlHinweis: "p. a., täglich gutgeschrieben",
                ton: "blau",
                zeilen: [
                  { gut: true, text: "Alles sofort verfügbar" },
                  { gut: true, text: "Keine Wartezeit" },
                  { gut: false, text: "1 € Gebühr je Auszahlung" },
                  { gut: false, text: "Keine höheren Zinsstufen" },
                  { gut: true, text: "Mindestanlage 1 €" },
                  { gut: false, text: "Kaum neue Funktionen" },
                ],
              },
            ],
          },
          {
            art: "hinweis",
            ton: "neutral",
            text: "Konditionen Stand 09/2026 – bitte vor dem Einstieg auf den Anbieterseiten gegenprüfen. Meine Aufteilung: 50 / 50 auf beide Anbieter, das streut das Plattformrisiko.",
          },
        ],
      },
      {
        titel: "Immobilien",
        bloecke: [
          {
            art: "rendite",
            ton: "gold",
            wert: "1 – 10 % p. a.",
            hinweis:
              "Die Spanne ist groß – sie hängt an Objekt, Finanzierung und Erfahrung.",
          },
          {
            art: "liste",
            ton: "gold",
            punkte: [
              {
                titel: "Geduld",
                text: "Kauf, Finanzierung, Vermietung – das dauert Monate, nicht Tage.",
              },
              {
                titel: "Erfahrung am Markt",
                text: "Lage, Zustand, Nebenkosten und Mietrecht lassen sich nicht überfliegen.",
              },
              {
                titel: "Vorerfahrung im Investieren",
                text: "Nicht als erstes Investment. Erst Aktien, ETF, Krypto oder P2P kennenlernen.",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "gold",
            titel: "Startkapital: ab 15.000 €",
            text: "Darunter wird es schwierig: Nebenkosten, Rücklagen und Finanzierungsanforderungen fressen kleinere Beträge auf. Immobilien sind ein gutes Investment – aber kein Einstiegsinvestment.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 6
  {
    nr: 6,
    slug: "portfolio",
    titel: "Portfolio & Kosten",
    kurz: "Anlagehorizont, Rebalancing und die 1,3 %, die über 30 Jahre ein halbes Vermögen kosten.",
    ton: "blau",
    minuten: 5,
    abschnitte: [
      {
        titel: "Horizont & Rebalancing",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Die Aufteilung entscheidet mehr über das Ergebnis als die Auswahl einzelner Titel.",
          },
          {
            art: "tabelle",
            kopf: ["Baustein", "Mindester Anlagehorizont"],
            zeilen: [
              ["Notgroschen", "jederzeit verfügbar"],
              ["Festgeld / Anleihen", "bis Laufzeitende"],
              ["ETF / Aktien", "ab 10 Jahren"],
              ["Krypto / P2P", "nur entbehrliches Kapital"],
            ],
          },
          {
            art: "hinweis",
            ton: "blau",
            text: "Wer sein Geld in drei Jahren braucht, gehört nicht in den Aktienmarkt. Das ist keine Meinung, das ist Risikomanagement.",
          },
          {
            art: "balken",
            titel: "Rebalancing – Soll gegen Ist nach einem starken Kryptojahr",
            einheit: " %",
            daten: [
              { label: "ETF Soll", wert: 80, ton: "blau" },
              { label: "ETF Ist", wert: 72, ton: "blau" },
              { label: "Krypto Soll", wert: 10, ton: "gold" },
              { label: "Krypto Ist", wert: 20, ton: "gold" },
              { label: "P2P Soll", wert: 10, ton: "gruen" },
              { label: "P2P Ist", wert: 8, ton: "gruen" },
            ],
            quelle:
              "Mindestens einmal im Jahr: verkaufen, was zu groß geworden ist, nachkaufen, was zu klein ist.",
          },
        ],
      },
      {
        titel: "Kosten",
        bloecke: [
          {
            art: "rendite",
            ton: "rot",
            wert: "1,3 % Unterschied",
            hinweis:
              "klingt nach nichts – und kostet über 30 Jahre ein halbes Vermögen.",
          },
          {
            art: "liste",
            ton: "blau",
            punkte: [
              {
                titel: "TER – laufende Fondskosten",
                text: "Breite Welt-ETFs liegen bei 0,10 – 0,25 %. Aktive Fonds oft bei 1,5 – 2 %.",
              },
              {
                titel: "Sparplan- und Ordergebühren",
                text: "Bei vielen Brokern 0 €. Bei Filialbanken schnell 1 – 1,5 % je Ausführung.",
              },
              {
                titel: "Spread",
                text: "Die Spanne zwischen Kauf- und Verkaufskurs. Zu Handelszeiten der Heimatbörse am engsten.",
              },
              {
                titel: "Depotgebühren",
                text: "Sollten 0 € sein. Alles andere ist verhandelbar oder ein Wechselgrund.",
              },
            ],
          },
          {
            art: "kennzahlen",
            werte: [
              {
                zahl: "234.600 €",
                label: "bei 0,20 % TER",
                text: "200 € monatlich, 30 Jahre, 7 % brutto.",
                ton: "gruen",
              },
              {
                zahl: "182.700 €",
                label: "bei 1,50 % TER",
                text: "Gleiche Einzahlung, gleicher Markt, gleicher Zeitraum.",
                ton: "rot",
              },
              {
                zahl: "51.900 €",
                label: "Unterschied",
                text: "Bei identischer Einzahlung von 72.000 €.",
                ton: "rot",
              },
              {
                zahl: "72.000 €",
                label: "eingezahlt",
                text: "In beiden Fällen exakt derselbe Betrag.",
                ton: "neutral",
              },
            ],
          },
          {
            art: "cta",
            text: "Rechne den Kostenunterschied für deine eigene Sparrate und Laufzeit durch.",
            label: "Kostenrechner öffnen",
            href: "/rechner/kosten",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 7
  {
    nr: 7,
    slug: "steuern",
    titel: "Steuern",
    kurz: "Abgeltungsteuer, Sparerpauschbetrag, Teilfreistellung – und was je Anlageklasse gilt.",
    ton: "gold",
    minuten: 4,
    abschnitte: [
      {
        titel: "Überblick",
        bloecke: [
          {
            art: "hinweis",
            ton: "gold",
            text: "Wichtig: Alle Renditeangaben in diesem Kapitel und im ganzen Vortrag sind Bruttoangaben – vor Steuern und Abgaben.",
          },
          {
            art: "kennzahlen",
            werte: [
              {
                zahl: "26,375 %",
                label: "Abgeltungsteuer",
                text: "25 % plus 5,5 % Soli. Mit Kirchensteuer bis 27,99 %.",
                ton: "gold",
              },
              {
                zahl: "1.000 €",
                label: "Sparerpauschbetrag",
                text: "Pro Person, 2.000 € für Paare. Nur mit Freistellungsauftrag!",
                ton: "gold",
              },
              {
                zahl: "30 %",
                label: "Teilfreistellung",
                text: "Bei Aktien-ETFs. Senkt die effektive Last auf rund 18,46 %.",
                ton: "gold",
              },
              {
                zahl: "3,20 %",
                label: "Basiszins 2026",
                text: "Grundlage der Vorabpauschale bei thesaurierenden ETFs.",
                ton: "gold",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "gruen",
            titel: "Der einfachste Steuervorteil, den es gibt",
            text: "Der Freistellungsauftrag ist kostenlos, dauert zwei Minuten und spart bis zu 264 € Steuern pro Jahr und Person – und ist trotzdem der am häufigsten vergessene.",
          },
        ],
      },
      {
        titel: "Je Anlageklasse",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Nicht jede Anlageklasse wird gleich besteuert – und ein Unterschied ist erheblich.",
          },
          {
            art: "tabelle",
            kopf: ["Anlageklasse", "Besteuerung", "Besonderheit"],
            zeilen: [
              [
                "ETF & Aktien",
                "26,375 %",
                "Aktien-ETF: Teilfreistellung 30 % → effektiv rund 18,46 %.",
              ],
              [
                "Kryptowährungen",
                "0 % nach 12 Monaten",
                "§ 23 EStG. Darunter persönlicher Steuersatz, Freigrenze 1.000 € pro Jahr.",
              ],
              [
                "P2P-Kredite",
                "26,375 %",
                "Ausländische Plattformen führen nicht ab – Anlage KAP nicht vergessen.",
              ],
              ["Tages- & Festgeld", "26,375 %", "Inländische Banken führen automatisch ab."],
              [
                "Immobilien (privat)",
                "0 % nach 10 Jahren",
                "Spekulationsfrist. Mieteinnahmen laufend mit dem persönlichen Satz.",
              ],
            ],
          },
          {
            art: "hinweis",
            ton: "gold",
            text: "Die einjährige Haltefrist bei Krypto steht seit 2026 politisch zur Diskussion. Stand 09/2026 gilt sie – verlassen würde ich mich langfristig nicht darauf.",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 8
  {
    nr: 8,
    slug: "fehler",
    titel: "Die häufigsten Fehler",
    kurz: "Nicht die Auswahl kostet Rendite, sondern das Verhalten.",
    ton: "rot",
    minuten: 3,
    abschnitte: [
      {
        titel: "Sechs Fehler",
        bloecke: [
          {
            art: "karten",
            karten: [
              {
                titel: "Market Timing",
                text: "Auf den perfekten Einstieg warten. Wer die zehn besten Börsentage verpasst, halbiert seine Rendite.",
                ton: "rot",
              },
              {
                titel: "FOMO",
                text: "Kaufen, weil alle kaufen. Wer erst einsteigt, wenn es in den Nachrichten ist, kauft meist teuer.",
                ton: "rot",
              },
              {
                titel: "Panikverkauf",
                text: "Im Minus verkaufen macht den Buchverlust zum echten. Ein Rücksetzer ist kein Verlust, solange nicht verkauft wird.",
                ton: "rot",
              },
              {
                titel: "Zu hohe Kosten",
                text: "1,5 % statt 0,2 % klingt harmlos und kostet über 30 Jahre ein halbes Vermögen.",
                ton: "rot",
              },
              {
                titel: "Kein Notgroschen",
                text: "Wer ohne Rücklage investiert, muss im Notfall verkaufen – oft zum schlechtesten Zeitpunkt.",
                ton: "rot",
              },
              {
                titel: "Heimatmarkt-Bias",
                text: "Deutsche Aktien fühlen sich vertraut an. Deutschland ist rund 2 % des Weltmarkts.",
                ton: "rot",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "neutral",
            titel: "„Time in the market beats timing the market – almost always.“",
            text: "Kenneth Fisher, USA Today 2018",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 9
  {
    nr: 9,
    slug: "wie-weiter",
    titel: "Wie geht es jetzt weiter?",
    kurz: "Vier Schritte, der Sparplan und der Saveback-Effekt.",
    ton: "gruen",
    minuten: 5,
    abschnitte: [
      {
        titel: "Vier Schritte",
        bloecke: [
          { art: "text", inhalt: "Vier Schritte. In dieser Reihenfolge." },
          {
            art: "liste",
            ton: "gruen",
            punkte: [
              {
                titel: "1 · Ausgaben tracken",
                text: "Drei Monate lang, App oder Excel. Ergebnis: deine Nettomonatsausgaben.",
              },
              {
                titel: "2 · Vermögen bilanzieren",
                text: "Alles auflisten, was da ist: Konten, Depots, Verträge, Schulden.",
              },
              {
                titel: "3 · 50-€-Sparplan starten",
                text: "Heute – nicht erst, wenn alles durchdacht ist.",
              },
              {
                titel: "4 · Fahrplan festlegen",
                text: "Aufteilung, Sparrate, Zeitpunkt. Schriftlich, damit es verbindlich wird.",
              },
            ],
          },
        ],
      },
      {
        titel: "Der Sparplan",
        bloecke: [
          {
            art: "text",
            inhalt:
              "50 € im Monat, 40 Jahre, 7 % pro Jahr – so entwickelt sich das Depot. Die ersten zehn Jahre sehen nach wenig aus. Die letzten zehn machen mehr als die Hälfte aus.",
          },
          {
            art: "balken",
            titel: "Depotwert nach Jahren, in Tausend Euro",
            einheit: " T€",
            daten: [
              { label: "5 J.", wert: 3.6, ton: "gruen" },
              { label: "10 J.", wert: 8.6, ton: "gruen" },
              { label: "15 J.", wert: 15.8, ton: "gruen" },
              { label: "20 J.", wert: 25.9, ton: "gruen" },
              { label: "25 J.", wert: 40.3, ton: "gruen" },
              { label: "30 J.", wert: 60.7, ton: "gruen" },
              { label: "35 J.", wert: 89.6, ton: "gruen" },
              { label: "40 J.", wert: 130.5, ton: "gruen" },
            ],
            quelle:
              "Rechengrundlage: 50 € monatlich, 7 % p. a., Zinsen thesauriert. Vor Kosten und Steuern.",
          },
          {
            art: "kennzahlen",
            werte: [
              {
                zahl: "130.517 €",
                label: "nach 40 Jahren",
                text: "Aus 50 € im Monat.",
                ton: "gruen",
              },
              {
                zahl: "24.000 €",
                label: "davon eingezahlt",
                text: "480 Raten à 50 €.",
                ton: "neutral",
              },
              {
                zahl: "106.517 €",
                label: "davon Zinsen",
                text: "82 % des Endwerts stammen nicht aus deiner Einzahlung.",
                ton: "gruen",
              },
              {
                zahl: "40 Jahre",
                label: "Zeit",
                text: "Der einzige Faktor, den man nicht nachkaufen kann.",
                ton: "gold",
              },
            ],
          },
          {
            art: "cta",
            text: "Rechne es mit deiner Rate, deiner Laufzeit und deiner Renditeerwartung durch.",
            label: "Zinseszinsrechner öffnen",
            href: "/rechner/zinseszins",
          },
        ],
      },
      {
        titel: "Der Saveback-Effekt",
        bloecke: [
          {
            art: "text",
            inhalt:
              "1 % jeder Kartenzahlung wandert automatisch in den Sparplan – ohne einen Euro zusätzlich zu sparen. Bei 650 € Kartenzahlungen im Monat sind das 6,50 €, die du ohnehin ausgegeben hättest.",
          },
          {
            art: "kennzahlen",
            werte: [
              {
                zahl: "6,50 €",
                label: "pro Monat",
                text: "1 % von 650 € Kartenzahlungen.",
                ton: "gold",
              },
              {
                zahl: "3.120 €",
                label: "über 40 Jahre",
                text: "Summe der Saveback-Beträge, ohne Zinsen.",
                ton: "gold",
              },
              {
                zahl: "+ 17.061 €",
                label: "Effekt im Depot",
                text: "Daraus werden bei 7 % über 40 Jahre gut 17.000 €.",
                ton: "gold",
              },
              {
                zahl: "13 %",
                label: "mehr Endkapital",
                text: "Ohne einen Euro mehr zu sparen.",
                ton: "gruen",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "gold",
            text: "Deckel: 15 € pro Monat. Voraussetzung ist ein laufender Sparplan ab 50 €. Rechengrundlage: 7 % p. a., monatliche Einzahlung über 40 Jahre, vor Kosten und Steuern.",
          },
          {
            art: "cta",
            text: "Setz deine eigenen Kartenumsätze ein und sieh, was der Effekt bei dir ausmacht.",
            label: "Saveback-Rechner öffnen",
            href: "/rechner/saveback",
          },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────── 10
  {
    nr: 10,
    slug: "mein-setup",
    titel: "Mein Setup als Beispiel",
    kurz: "Dieselbe Systematik wie das Arbeitsblatt – mit echten Konten und Beträgen.",
    ton: "gruen",
    minuten: 3,
    abschnitte: [
      {
        titel: "Wie es bei mir aussieht",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Ein Beispiel, kein Vorbild: Das Gehalt läuft vollständig über ein Hauptkonto und wird von dort per Dauerauftrag verteilt. Am Monatsende bleibt dort nichts liegen – alles ist bereits einem Zweck zugeordnet.",
          },
          {
            art: "tabelle",
            kopf: ["Topf", "Zweck", "Wo"],
            zeilen: [
              ["Hauptkonto", "Gehaltseingang und Verteilung, täglicher Bedarf", "Kreissparkasse"],
              ["Notgroschen", "3 – 5 Nettomonatsausgaben, jederzeit verfügbar", "ING Tagesgeld"],
              ["Dauerausgaben", "Jährliche Posten monatlich angespart", "ING"],
              ["Auto", "Reparatur, Steuer, Versicherung", "ING"],
              ["Urlaub", "Zweckgebunden angespart", "ING"],
              ["Investitionen", "Der Betrag, der monatlich in die Depots geht", "ING"],
            ],
          },
          {
            art: "tabelle",
            kopf: ["Depot", "Anlageklasse", "Anbieter"],
            zeilen: [
              ["ETF-Depot", "Welt-ETF als Core", "Trade Republic"],
              ["Krypto", "Top-10-Coins als Satellit", "BSDEX · Binance"],
              ["P2P", "Zwei Plattformen, 50 / 50", "Go & Grow · Monefit"],
              ["Überblick", "Alle Depots an einer Stelle", "Finanzfluss App"],
            ],
          },
          {
            art: "hinweis",
            ton: "gold",
            titel: "Warum ich das zeige",
            text: "Nicht damit du es kopierst. Sondern damit sichtbar wird, dass die Systematik aus den Kapiteln 3 und 4 im Alltag tatsächlich trägt – mit ganz normalen Konten bei ganz normalen Banken.",
          },
          {
            art: "cta",
            text: "Bau dir dein eigenes Setup: dieselben Felder, deine Zahlen, mit sofortiger Gegenrechnung.",
            label: "Eigenes Kontensystem anlegen",
            href: "/kontensystem",
          },
        ],
      },
      {
        titel: "Bevor du loslegst",
        bloecke: [
          {
            art: "text",
            inhalt:
              "Diese Seiten zeigen, wie ich es mache. Sie ersetzen keine Beratung.",
          },
          {
            art: "liste",
            ton: "gold",
            punkte: [
              {
                titel: "Keine Anlageberatung",
                text: "Eine private Meinungsäußerung zu Informationszwecken – weder Anlageberatung noch Anlageempfehlung im Sinne des Wertpapierhandelsgesetzes.",
              },
              {
                titel: "Keine Empfehlung für deine Situation",
                text: "Ob eine Anlage passt, hängt von Einkommen, Vermögen, Zielen und Risikotragfähigkeit ab. Diese Faktoren kenne ich nicht.",
              },
              {
                titel: "Vergangenheit ist keine Zukunft",
                text: "Alle genannten Renditen sind historische oder erwartete Werte und kein verlässlicher Indikator für die künftige Entwicklung.",
              },
              {
                titel: "Verlustrisiko bis zum Totalverlust",
                text: "Besonders bei Kryptowährungen, P2P-Krediten und Einzelaktien. P2P-Kredite haben keine Einlagensicherung.",
              },
              {
                titel: "Werbung: Empfehlungslinks",
                text: "Einige Links sind Empfehlungslinks. Eröffnest du darüber ein Konto, erhalte ich eine Provision. Für dich ändert sich nichts.",
              },
              {
                titel: "Stand der Angaben",
                text: "Alle Zahlen, Zinssätze und steuerlichen Angaben: September 2026, ohne Gewähr. Steuerrecht ändert sich – im Zweifel Steuerberater fragen.",
              },
            ],
          },
          {
            art: "hinweis",
            ton: "gold",
            text: "Kurz: Denk selbst nach, rechne nach, und investiere nur, was du verstehst.",
          },
        ],
      },
    ],
  },
];

export function kapitelNach(slug: string): Kapitel | undefined {
  return KAPITEL.find((k) => k.slug === slug);
}

export function nachbarn(slug: string): { vorher?: Kapitel; nachher?: Kapitel } {
  const i = KAPITEL.findIndex((k) => k.slug === slug);
  if (i < 0) return {};
  return { vorher: KAPITEL[i - 1], nachher: KAPITEL[i + 1] };
}
