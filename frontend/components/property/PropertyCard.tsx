import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatArea, formatRelativeDate, PROPERTY_TYPE_LABELS, CATEGORY_LABELS } from '@/lib/format';

interface PropertyCardProps {
  property: {
    id: string;
    property_id: string;
    title: string;
    property_type: string;
    category: string;
    price: number;
    price_unit: string;
    price_negotiable?: boolean;
    area_sqft: number;
    area_display_value?: number;
    area_display_unit?: string;
    cover_photo: string | null;
    city?: string;
    locality?: string;
    is_verified?: boolean;
    is_verified_dealer?: boolean;
    listed_at: string;
    owner_name?: string;
  };
}

export default function PropertyCard({ property: p }: PropertyCardProps) {
  return (
    <Link href={`/property/${p.property_id}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
        {/* Photo */}
        <div className="relative h-48 bg-gray-100">
          {p.cover_photo ? (
            <Image src={p.cover_photo} alt={p.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
          )}
          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {CATEGORY_LABELS[p.category] || p.category}
            </span>
            {p.is_verified && (
              <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">Verified</span>
            )}
          </div>
          <div className="absolute top-2 right-2">
            <span className="bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">{p.property_id}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 flex-1">{p.title}</h3>
          </div>

          <p className="text-xs text-gray-500 mb-2">
            {PROPERTY_TYPE_LABELS[p.property_type] || p.property_type}
            {p.locality && ` · ${p.locality}`}
            {p.city && `, ${p.city}`}
          </p>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">
                {formatPrice(p.price, p.price_unit)}
              </p>
              {p.area_display_value && p.area_display_unit && (
                <p className="text-xs text-gray-500">
                  {formatArea(p.area_display_value, p.area_display_unit)}
                </p>
              )}
            </div>
            {p.is_verified_dealer && (
              <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full">Dealer</span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">{formatRelativeDate(p.listed_at)}</span>
            {p.owner_name && <span className="text-xs text-gray-500">{p.owner_name}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
