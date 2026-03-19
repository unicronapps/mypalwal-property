import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        Find Your Perfect Property
      </h1>
      <p className="text-lg text-gray-600 mb-8 max-w-xl">
        Verified listings across tier 2 Indian cities. Connect directly with owners and dealers.
      </p>
      <div className="flex gap-4">
        <Link href="/auth/register" className="btn-primary">
          Get Started
        </Link>
        <Link
          href="/auth/login"
          className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Sign In
        </Link>
      </div>
      {/* TODO: [PHASE-2] Add property search bar and featured listings */}
    </div>
  );
}
