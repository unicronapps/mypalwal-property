import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import PropertyCard from '@/components/property/PropertyCard';
import PropertyCardSkeleton from '@/components/property/PropertyCardSkeleton';

const PROPERTY_TYPES = [
  { type: 'flat', label: 'Flat', icon: '🏢' },
  { type: 'plot', label: 'Plot', icon: '📐' },
  { type: 'house', label: 'House', icon: '🏠' },
  { type: 'commercial', label: 'Commercial', icon: '🏪' },
  { type: 'agricultural', label: 'Land', icon: '🌾' },
  { type: 'farmhouse', label: 'Farmhouse', icon: '🌳' },
  { type: 'villa', label: 'Villa', icon: '🏡' },
  { type: 'pg', label: 'PG', icon: '🛏' },
];

const CITIES = ['Gurugram','Faridabad','Panipat','Karnal','Rohtak','Ambala','Sonipat','Hisar'];

async function getFeaturedListings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/properties/featured`, {
      next: { revalidate: 300 }, // revalidate every 5 min
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.listings || [];
  } catch {
    return [];
  }
}

async function getRecentListings() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/properties?sort=newest&limit=8`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.listings || [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, recent] = await Promise.all([getFeaturedListings(), getRecentListings()]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Find Your Property in Haryana
          </h1>
          <p className="text-primary-100 text-lg mb-8">
            Verified listings across tier 2 cities. Direct owner &amp; dealer contact.
          </p>
          <div className="bg-white rounded-2xl p-4 shadow-xl">
            <SearchBar size="lg" />
          </div>
        </div>
      </section>

      {/* Browse by type */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Type</h2>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
          {PROPERTY_TYPES.map(t => (
            <Link
              key={t.type}
              href={`/search?type=${t.type}`}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 hover:border-primary-400 hover:shadow-sm transition-all text-center"
            >
              <span className="text-2xl">{t.icon}</span>
              <span className="text-xs font-medium text-gray-700">{t.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured listings */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Listings</h2>
            <Link href="/search?sort=newest" className="text-sm text-primary-600 hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featured.map((p: any) => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}

      {/* Recent listings */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recently Added</h2>
          <Link href="/search" className="text-sm text-primary-600 hover:underline">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">No listings yet</p>
            <Link href="/post" className="text-primary-600 font-medium hover:underline">Be the first to post a property →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recent.map((p: any) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>

      {/* Browse by city */}
      <section className="bg-gray-50 border-t border-gray-200 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Cities</h2>
          <div className="flex flex-wrap gap-3">
            {CITIES.map(city => (
              <Link
                key={city}
                href={`/search?city=${encodeURIComponent(city)}`}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-primary-400 hover:text-primary-700 transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
