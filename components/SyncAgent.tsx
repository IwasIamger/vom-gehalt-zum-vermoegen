"use client";

import { useEffect } from "react";
import { laden, speichern } from "@/lib/store";
import {
  abdruck,
  ablegen,
  blockAusStand,
  holen,
  neuerIst,
  standAusBlock,
  syncstand,
  syncstandSetzen,
} from "@/lib/sync";

/**
 * Gleicht im Hintergrund ab, sobald ein Sync-Satz hinterlegt ist.
 *
 * Beim Öffnen: den Server fragen. Ist dort ein neuerer Stand, wird er
 * übernommen und die Seite neu geladen – die einfachste Art, jede Ansicht
 * auf einmal zu aktualisieren. Bei jedem Speichern: kurz warten, dann
 * hochladen. Wer zuletzt geändert hat, gewinnt; das ist bewusst schlicht.
 */
export default function SyncAgent() {
  useEffect(() => {
    let timer: number | undefined;
    let laeuft = false;
    let nochmal = false;

    async function hochladen() {
      const s = syncstand();
      if (!s) return;
      if (laeuft) {
        nochmal = true;
        return;
      }
      laeuft = true;
      try {
        const lokal = laden();
        const fingerabdruck = await abdruck(lokal);
        if (fingerabdruck === s.abdruck) return; // nichts Neues – kein Schreibvorgang
        const block = await blockAusStand(s.schluessel, lokal);
        const ergebnis = await ablegen(s.kennung, block, s.version);
        if (ergebnis.ok) {
          syncstandSetzen({ ...s, version: ergebnis.version, zuletzt: new Date().toISOString(), fehler: undefined, abdruck: fingerabdruck });
        } else if (ergebnis.veraltet) {
          // Jemand anders war schneller. Wer ist neuer?
          const fremd = ergebnis.block ? await standAusBlock(s.schluessel, ergebnis.block) : null;
          if (fremd && neuerIst(fremd, lokal)) {
            speichern(fremd, { stempel: false, still: true });
            syncstandSetzen({ ...s, version: ergebnis.version, zuletzt: new Date().toISOString(), fehler: undefined, abdruck: await abdruck(fremd) });
            window.location.reload();
          } else {
            // Unser Stand ist neuer – mit der aktuellen Versionsnummer noch einmal.
            const zweiter = await ablegen(s.kennung, block, ergebnis.version);
            if (zweiter.ok) {
              syncstandSetzen({ ...s, version: zweiter.version, zuletzt: new Date().toISOString(), fehler: undefined, abdruck: fingerabdruck });
            }
          }
        } else {
          syncstandSetzen({ ...s, fehler: ergebnis.fehler });
        }
      } catch (e) {
        const s2 = syncstand();
        if (s2) syncstandSetzen({ ...s2, fehler: e instanceof Error ? e.message : "Kein Netz" });
      } finally {
        laeuft = false;
        if (nochmal) {
          nochmal = false;
          void hochladen();
        }
      }
    }

    async function abholen() {
      const s = syncstand();
      if (!s) return;
      try {
        const fern = await holen(s.kennung);
        if (!fern) {
          // Noch nichts auf dem Server: den eigenen Stand hinlegen.
          await hochladen();
          return;
        }
        const fremd = await standAusBlock(s.schluessel, fern.block);
        if (!fremd) {
          syncstandSetzen({ ...s, fehler: "Der Block auf dem Server passt nicht zum Satz." });
          return;
        }
        const lokal = laden();
        if (neuerIst(fremd, lokal)) {
          speichern(fremd, { stempel: false, still: true });
          syncstandSetzen({ ...s, version: fern.version, zuletzt: new Date().toISOString(), fehler: undefined, abdruck: await abdruck(fremd) });
          window.location.reload();
        } else {
          syncstandSetzen({ ...s, version: fern.version, zuletzt: new Date().toISOString(), fehler: undefined, abdruck: await abdruck(fremd) });
          if (neuerIst(lokal, fremd)) await hochladen();
        }
      } catch (e) {
        syncstandSetzen({ ...s, fehler: e instanceof Error ? e.message : "Kein Netz" });
      }
    }

    const beiSpeichern = () => {
      if (!syncstand()) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => void hochladen(), 1500);
    };
    const beiSichtbar = () => {
      if (document.visibilityState === "visible") void abholen();
    };

    void abholen();
    window.addEventListener("finanzcockpit:gespeichert", beiSpeichern);
    document.addEventListener("visibilitychange", beiSichtbar);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("finanzcockpit:gespeichert", beiSpeichern);
      document.removeEventListener("visibilitychange", beiSichtbar);
    };
  }, []);

  return null;
}
