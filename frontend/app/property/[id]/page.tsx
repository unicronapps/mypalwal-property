export const runtime = "edge";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import PropertyDetail from "@/components/property/PropertyDetail";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://9h4oapssea.execute-api.us-east-1.amazonaws.com/dev";

async function getProperty(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/properties/${id}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

const TYPE_LABELS: Record<string, string> = {
  flat: "Flat",
  house: "House",
  plot: "Plot",
  commercial: "Commercial Space",
  agricultural: "Agricultural Land",
  farmhouse: "Farmhouse",
  villa: "Villa",
  pg: "PG",
};
const CATEGORY_LABELS: Record<string, string> = {
  sale: "Sale",
  rent: "Rent",
  lease: "Lease",
  pg: "PG",
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const p = await getProperty(params.id);
  if (!p) return { title: "Property Not Found — PropertyX" };

  const typeLabel = TYPE_LABELS[p.property_type] || p.property_type;
  const catLabel = CATEGORY_LABELS[p.category] || p.category;
  const locality = p.location?.locality || "";
  const city = p.location?.city || "";
  const locationStr = [locality, city].filter(Boolean).join(", ");
  const title = `${p.title} — ${typeLabel} for ${catLabel} in ${locationStr} | PropertyX`;
  const description =
    p.description?.slice(0, 150) ||
    `${typeLabel} for ${catLabel} in ${locationStr}. View details, photos, and contact the owner on PropertyX.`;
  const coverPhoto =
    p.media?.find((m: any) => m.is_cover)?.url || p.media?.[0]?.url || null;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(coverPhoto
        ? { images: [{ url: coverPhoto, width: 1200, height: 630 }] }
        : {}),
    },
  };
}

export default async function PropertyPage({
  params,
}: {
  params: { id: string };
}) {
  const property = await getProperty(params.id);
  if (!property) notFound();
  return <PropertyDetail property={property} />;
}
