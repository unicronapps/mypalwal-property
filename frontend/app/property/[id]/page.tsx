import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PropertyDetail from '@/components/property/PropertyDetail';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getProperty(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/properties/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const property = await getProperty(params.id);
  if (!property) return { title: 'Property Not Found — PropertyX' };
  return {
    title: `${property.title} — ${property.location?.city || ''} | PropertyX`,
    description: property.description?.slice(0, 160) || `${property.property_type} for ${property.category} in ${property.location?.city}`,
  };
}

export default async function PropertyPage({ params }: { params: { id: string } }) {
  const property = await getProperty(params.id);
  if (!property) notFound();
  return <PropertyDetail property={property} />;
}
