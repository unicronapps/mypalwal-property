'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { formatRelativeDate } from '@/lib/format';

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Poll unread count every 30s
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnreadCount(data.data.unread_count);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function openDropdown() {
    setDropdownOpen(true);
    setNotifLoading(true);
    try {
      const { data } = await api.get('/api/notifications', { params: { limit: 5 } });
      setRecentNotifs(data.data.notifications);
    } catch {}
    setNotifLoading(false);
  }

  async function handleNotifClick(n: any) {
    if (!n.read) {
      try {
        await api.patch(`/api/notifications/${n.id}/read`);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {}
    }
    setDropdownOpen(false);
    const d = n.data || {};
    if (d.property_id) {
      router.push(`/property/${d.property_pid || d.property_id}`);
    } else {
      router.push('/dashboard/notifications');
    }
  }

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
                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => dropdownOpen ? setDropdownOpen(false) : openDropdown()}
                    className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                        {unreadCount > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifLoading ? (
                          <div className="p-6 text-center">
                            <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                          </div>
                        ) : recentNotifs.length === 0 ? (
                          <div className="p-6 text-center text-sm text-gray-400">No notifications</div>
                        ) : (
                          recentNotifs.map(n => (
                            <button
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                                !n.read ? 'bg-primary-50/40' : ''
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 shrink-0" />}
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                                  <p className="text-xs text-gray-500 truncate">{n.body}</p>
                                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(n.created_at)}</p>
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <Link
                        href="/dashboard/notifications"
                        onClick={() => setDropdownOpen(false)}
                        className="block text-center py-2.5 text-sm text-primary-600 font-medium hover:bg-gray-50 border-t border-gray-100"
                      >
                        View all notifications
                      </Link>
                    </div>
                  )}
                </div>

                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-gray-900">Dashboard</Link>
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
