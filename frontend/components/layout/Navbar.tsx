'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-xl font-bold text-primary-600">
            PropertyX
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
              Properties
            </Link>
            {/* TODO: [PHASE-2] Add city/type filter links */}
          </div>

          {/* Auth actions */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                {/* Role-aware links */}
                {user.role === 'dealer' && (
                  <Link
                    href="/dealer/listings"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    My Listings
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Admin
                  </Link>
                )}
                <span className="text-sm text-gray-700 font-medium">
                  {user.name || user.phone}
                </span>
                <button
                  onClick={() => logout()}
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign In
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
