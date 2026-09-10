import type { NextConfig } from "next";

/**
 * Statischer Export. Die App ist bewusst rein clientseitig – dadurch läuft sie
 * auf jedem einfachen Webspace, offline und ohne Server, der Nutzerdaten sehen
 * könnte. `BASE_PATH` setzt der Deploy-Workflow, lokal bleibt es leer.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  images: { unoptimized: true },
};

export default nextConfig;
