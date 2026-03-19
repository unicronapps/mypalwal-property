'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl font-bold text-primary-600">PropertyX</Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/search" className="text-sm text-gray-600 hover:text-gray-900">Browse</Link>
            {isAuthenticated && (
              <Link href="/post" className="text-sm text-gray-600 hover:text-gray-900">Post Property</Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : isAuthenticated && user ? (
              <>
                {user.role === 'dealer' && (
                  <Link href="/dealer/listings" className="text-sm text-gray-600 hover:text-gray-900">My Listings</Link>
                )}
                {user.role === 'admin' && (
                  <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">Admin</Link>
                )}
                <span className="text-sm text-gray-700 font-medium">{user.name || user.phone}</span>
                <button onClick={() => logout()} className="text-sm text-gray-500 hover:text-gray-900">Logout</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Sign In</Link>
                <Link href="/post" className="btn-primary text-sm">Post Property</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
