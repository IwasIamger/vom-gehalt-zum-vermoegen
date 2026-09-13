/**
 * Sync-Ablage für "Vom Gehalt zum Vermögen".
 *
 * Der Worker kennt keine Nutzer. Er verwahrt Blöcke unter einer Kennung, die
 * der Browser aus dem Sync-Satz ableitet, und was in den Blöcken steht, ist
 * auf dem Gerät verschlüsselt worden. Hier liegen also weder Namen noch
 * Zahlen noch E-Mail-Adressen – nur Zufallsbuchstaben unter Zufallsbuchstaben.
 *
 * Wer die Kennung nicht kennt, findet nichts; wer sie kennt, kann ohne den
 * Schlüssel nichts lesen. Beides folgt aus demselben Satz, den nur der Nutzer
 * hat.
 */

const MAX_BYTES = 1_000_000; // Ein Stand ist ein paar Kilobyte. Eine Million ist grosszuegig.
const KENNUNG = /^[0-9a-f]{64}$/;

const ERLAUBTE_URSPRUENGE = [
  "https://iwasiamger.github.io",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

function cors(request) {
  const ursprung = request.headers.get("Origin") ?? "";
  const erlaubt = ERLAUBTE_URSPRUENGE.includes(ursprung) ? ursprung : ERLAUBTE_URSPRUENGE[0];
  return {
    "Access-Control-Allow-Origin": erlaubt,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, If-Match",
    "Access-Control-Expose-Headers": "ETag",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function antwort(request, body, status = 200, extra = {}) {
  return new Response(body === null ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...cors(request),
      ...extra,
    },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    const url = new URL(request.url);
    const teile = url.pathname.split("/").filter(Boolean);

    if (teile.length === 0) {
      return antwort(request, { dienst: "vgzv-sync", hinweis: "Hier liegen nur verschluesselte Bloecke." });
    }
    if (teile.length !== 2 || teile[0] !== "v1" || !KENNUNG.test(teile[1])) {
      return antwort(request, { fehler: "Unbekannter Pfad." }, 404);
    }
    const kennung = teile[1];

    if (request.method === "GET") {
      const eintrag = await env.STAENDE.getWithMetadata(kennung);
      if (eintrag.value === null) return antwort(request, { fehler: "Nichts abgelegt." }, 404);
      const meta = eintrag.metadata ?? {};
      return antwort(
        request,
        { block: eintrag.value, version: meta.version ?? 1, abgelegt: meta.abgelegt ?? null },
        200,
        { ETag: `"${meta.version ?? 1}"` },
      );
    }

    if (request.method === "PUT") {
      const laenge = Number(request.headers.get("Content-Length") ?? "0");
      if (laenge > MAX_BYTES) return antwort(request, { fehler: "Zu gross." }, 413);
      const block = await request.text();
      if (block.length > MAX_BYTES) return antwort(request, { fehler: "Zu gross." }, 413);
      // Der Block muss aussehen wie das, was die App erzeugt - sonst ist es Muell.
      if (!/^v1\.[A-Za-z0-9+/=]+\.[A-Za-z0-9+/=]+$/.test(block)) {
        return antwort(request, { fehler: "Kein gueltiger Block." }, 400);
      }

      // Optimistisches Sperren: Wer eine alte Version ueberschreiben will, wird gestoppt.
      const bisher = await env.STAENDE.getWithMetadata(kennung);
      const bisherVersion = bisher.value === null ? 0 : (bisher.metadata?.version ?? 1);
      const erwartet = request.headers.get("If-Match");
      if (erwartet !== null && erwartet !== "*" && erwartet.replace(/"/g, "") !== String(bisherVersion)) {
        return antwort(
          request,
          { fehler: "Veraltet.", version: bisherVersion, block: bisher.value },
          409,
          { ETag: `"${bisherVersion}"` },
        );
      }

      const version = bisherVersion + 1;
      const abgelegt = new Date().toISOString();
      await env.STAENDE.put(kennung, block, { metadata: { version, abgelegt } });
      return antwort(request, { version, abgelegt }, 200, { ETag: `"${version}"` });
    }

    if (request.method === "DELETE") {
      await env.STAENDE.delete(kennung);
      return antwort(request, null, 204);
    }

    return antwort(request, { fehler: "Methode nicht erlaubt." }, 405);
  },
};
