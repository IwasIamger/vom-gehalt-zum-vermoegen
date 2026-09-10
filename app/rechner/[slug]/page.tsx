import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RECHNER, rechnerNach } from "@/lib/rechner";
import Rechner from "./Rechner";

export function generateStaticParams() {
  return RECHNER.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const def = rechnerNach(slug);
  if (!def) return {};
  return { title: `${def.titel} berechnen`, description: def.kurz };
}

export default async function Seite({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const def = rechnerNach(slug);
  if (!def) notFound();
  return <Rechner slug={def.slug} />;
}
