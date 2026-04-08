export const runtime = "edge";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  formatPrice,
  formatArea,
  PROPERTY_TYPE_LABELS,
  CATEGORY_LABELS,
  formatRelativeDate,
} from "@/lib/format";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://9h4oapssea.execute-api.us-east-1.amazonaws.com/dev";

async function getDealer(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/users/${id}/profile`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const dealer = await getDealer(params.id);
  if (!dealer) return { title: "Dealer Not Found — PropertyX" };
  const name = dealer.name || "Dealer";
  const agency = dealer.agency_name ? ` (${dealer.agency_name})` : "";
  const title = `${name}${agency} — Real Estate Dealer | PropertyX`;
  const description = `${name}${agency} — ${dealer.total_listings} active listings on PropertyX. View properties and contact directly.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(dealer.avatar_url ? { images: [{ url: dealer.avatar_url }] } : {}),
    },
  };
}

export default async function DealerProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const dealer = await getDealer(params.id);
  if (!dealer) notFound();

  const memberSince = new Date(dealer.created_at).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Dealer Info Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold flex-shrink-0 overflow-hidden">
            {dealer.avatar_url ? (
              <img
                src={dealer.avatar_url}
                alt={dealer.name}
                className="w-full h-full object-cover"
              />
            ) : (
              (dealer.name || "D")[0].toUpperCase()
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">
                {dealer.name || "Dealer"}
              </h1>
              {dealer.verified_dealer && (
                <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  <svg
                    className="w-3 h-3"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            {dealer.agency_name && (
              <p className="text-gray-600 mt-1">{dealer.agency_name}</p>
            )}
            {dealer.bio && (
              <p className="text-gray-500 text-sm mt-2">{dealer.bio}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
              <span>Member since {memberSince}</span>
              <span>
                {dealer.total_listings} active listing
                {dealer.total_listings !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Active Listings</h2>
      {dealer.listings.length === 0 ? (
        <p className="text-gray-500">No active listings.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dealer.listings.map((listing: any) => (
            <Link
              key={listing.id}
              href={`/property/${listing.property_id}`}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Photo */}
              <div className="aspect-[4/3] bg-gray-100 relative">
                {listing.cover_photo ? (
                  <img
                    src={listing.cover_photo}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                    No Photo
                  </div>
                )}
                <span className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-0.5 rounded">
                  {CATEGORY_LABELS[listing.category] || listing.category}
                </span>
                {listing.is_verified && (
                  <span className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                    Verified
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <p className="text-lg font-bold text-gray-900">
                  {formatPrice(listing.price, listing.price_unit)}
                </p>
                <p className="text-sm text-gray-700 font-medium mt-1 line-clamp-1">
                  {listing.title}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <span>
                    {PROPERTY_TYPE_LABELS[listing.property_type] ||
                      listing.property_type}
                  </span>
                  {listing.area_display_value && listing.area_display_unit && (
                    <>
                      <span>&middot;</span>
                      <span>
                        {formatArea(
                          listing.area_display_value,
                          listing.area_display_unit,
                        )}
                      </span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {listing.city}
                  {listing.locality
                    ? `, ${listing.locality}`
                    : ""} &middot; {formatRelativeDate(listing.listed_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
