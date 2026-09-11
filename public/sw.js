/*
 * Service Worker – macht die App offline benutzbar.
 *
 * Bewusst netzwerkzuerst für Seiten: Wer online ist, sieht immer den neuesten
 * Stand. Das ist während der Testphase wichtiger als der letzte Millisekunde
 * Ladezeit – ein Cache, der alte Seiten ausliefert, kostet mehr Nerven als er
 * bringt. Erst wenn das Netz wegbleibt, kommt die Kopie aus dem Speicher.
 *
 * Fertige Bundles unter /_next/static tragen einen Hash im Namen und ändern
 * sich nie – die dürfen direkt aus dem Cache kommen.
 */

const CACHE = "vgzv-v1";

self.addEventListener("install", () => {
  // Keine Warteschleife: Ein neuer Worker soll sofort übernehmen.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const namen = await caches.keys();
      await Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  const anfrage = e.request;
  if (anfrage.method !== "GET") return;

  const url = new URL(anfrage.url);
  if (url.origin !== self.location.origin) return;

  // Unveränderliche Bundles: Cache zuerst.
  if (url.pathname.includes("/_next/static/")) {
    e.respondWith(
      caches.match(anfrage).then(
        (treffer) =>
          treffer ||
          fetch(anfrage).then((antwort) => {
            const kopie = antwort.clone();
            caches.open(CACHE).then((c) => c.put(anfrage, kopie));
            return antwort;
          }),
      ),
    );
    return;
  }

  // Alles andere: Netz zuerst, Kopie als Rückfallebene.
  e.respondWith(
    fetch(anfrage)
      .then((antwort) => {
        if (antwort.ok) {
          const kopie = antwort.clone();
          caches.open(CACHE).then((c) => c.put(anfrage, kopie));
        }
        return antwort;
      })
      .catch(async () => {
        const treffer = await caches.match(anfrage);
        if (treffer) return treffer;
        // Eine Seite, die noch nie geladen wurde: wenigstens die Startseite zeigen.
        if (anfrage.mode === "navigate") {
          const start = await caches.match(new URL("./", self.registration.scope).href);
          if (start) return start;
        }
        return new Response("Offline und nicht im Speicher.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }),
  );
});
