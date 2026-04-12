'use client';
export const runtime = 'edge';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatRelativeDate, PROPERTY_TYPE_LABELS } from '@/lib/format';

const STATUS_TABS = ['all', 'active', 'pending', 'sold', 'inactive'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

export default function MyListingsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<StatusTab>('all');
  const [listings, setListings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit: 12 };
      if (tab !== 'all') params.status = tab;
      const { data } = await api.get('/api/properties/my/listings', { params });
      setListings(data.data.listings);
      setTotal(data.data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await api.delete(`/api/properties/${id}`);
      setDeleteModal(null);
      fetchListings();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  async function handleMarkSold(id: string) {
    try {
      await api.put(`/api/properties/${id}`, { status: 'sold' });
      fetchListings();
    } catch (err) {
      console.error(err);
    }
  }

  const totalPages = Math.ceil(total / 12);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Link href="/post" className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
          + New Listing
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              tab === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-white rounded-xl border animate-pulse" />
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-4">No listings found</p>
          <Link href="/post" className="inline-block px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
            Post Your First Property
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l.id} className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
              {/* Thumbnail */}
              <div className="w-full sm:w-32 h-24 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                {l.cover_photo ? (
                  <img src={l.cover_photo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No photo</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium text-gray-900 truncate">{l.title}</h3>
                    <p className="text-sm text-gray-500">
                      {PROPERTY_TYPE_LABELS[l.property_type] || l.property_type}
                      {l.city && ` \u00b7 ${l.city}`}{l.locality && `, ${l.locality}`}
                    </p>
                  </div>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded shrink-0">{l.property_id}</span>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="font-semibold text-primary-600">{formatPrice(l.price, l.price_unit)}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    l.status === 'active' ? 'bg-green-100 text-green-700' :
                    l.status === 'sold' ? 'bg-purple-100 text-purple-700' :
                    l.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{l.status}</span>
                  <span className="text-gray-400">{l.view_count} views</span>
                  <span className="text-gray-400">{formatRelativeDate(l.listed_at)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <Link
                    href={`/dashboard/listings/${l.id}/edit`}
                    className="px-3 py-1.5 text-xs font-medium text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50"
                  >
                    Edit
                  </Link>
                  <Link
                    href={`/dashboard/listings/${l.id}/photos`}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-1"
                  >
                    📷 {l.cover_photo ? 'Manage Photos' : 'Upload Photos'}
                  </Link>
                  {l.status === 'active' && (
                    <button
                      onClick={() => handleMarkSold(l.id)}
                      className="px-3 py-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg hover:bg-purple-50"
                    >
                      Mark Sold
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteModal(l.id)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Delete
                  </button>
                  {user?.role === 'dealer' && l.status === 'active' && (
                    <button className="px-3 py-1.5 text-xs font-medium text-amber-600 border border-amber-200 rounded-lg hover:bg-amber-50">
                      Boost
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDeleteModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Listing</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will remove the listing from search results. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                disabled={deleting}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
