"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { formatRelativeDate } from "@/lib/format";

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await api.get("/api/notifications/unread-count");
      setUnreadCount(data.data.unread_count);
    } catch {}
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchUnreadCount]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function openDropdown() {
    setDropdownOpen(true);
    setNotifLoading(true);
    try {
      const { data } = await api.get("/api/notifications", {
        params: { limit: 5 },
      });
      setRecentNotifs(data.data.notifications);
    } catch {}
    setNotifLoading(false);
  }

  async function handleNotifClick(n: any) {
    if (!n.read) {
      try {
        await api.patch(`/api/notifications/${n.id}/read`);
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {}
    }
    setDropdownOpen(false);
    const d = n.data || {};
    if (d.property_id) {
      router.push(`/property/${d.property_pid || d.property_id}`);
    } else {
      router.push("/dashboard/notifications");
    }
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[60px]">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {/* Icon mark */}
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center shadow-sm group-hover:bg-primary-700 transition-colors">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              Property<span className="text-primary-600">X</span>
            </span>
          </Link>

          {/* Center nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/search"
              className="text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all duration-150"
            >
              Browse
            </Link>
            {isAuthenticated && (
              <Link
                href="/post"
                className="text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all duration-150"
              >
                Post Property
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                <div className="w-20 h-7 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ) : isAuthenticated && user ? (
              <>
                {/* Notification Bell */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() =>
                      dropdownOpen ? setDropdownOpen(false) : openDropdown()
                    }
                    className="relative w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-150"
                    aria-label="Notifications"
                  >
                    <svg
                      className="w-[18px] h-[18px]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-red-500 px-[3px] text-[9px] font-bold leading-none text-white ring-2 ring-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-[340px] rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/80 overflow-hidden z-50">
                      {/* Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50/80 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-gray-800">
                            Notifications
                          </span>
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center text-[10px] font-bold bg-red-100 text-red-600 rounded-full px-1.5 py-0.5 leading-none">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        <Link
                          href="/dashboard/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="text-[11px] font-medium text-primary-600 hover:text-primary-700"
                        >
                          See all
                        </Link>
                      </div>

                      {/* Body */}
                      <div className="max-h-[320px] overflow-y-auto divide-y divide-gray-50">
                        {notifLoading ? (
                          <div className="flex items-center justify-center py-10">
                            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : recentNotifs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg
                                className="w-5 h-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                                />
                              </svg>
                            </div>
                            <p className="text-[13px] text-gray-400">
                              You're all caught up!
                            </p>
                          </div>
                        ) : (
                          recentNotifs.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => handleNotifClick(n)}
                              className={`group w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-100 ${
                                !n.read ? "bg-primary-50/50" : "bg-white"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                {/* Unread dot or placeholder */}
                                <div className="mt-[5px] shrink-0">
                                  {!n.read ? (
                                    <span className="block w-2 h-2 rounded-full bg-primary-500" />
                                  ) : (
                                    <span className="block w-2 h-2 rounded-full bg-transparent" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`text-[13px] truncate ${!n.read ? "font-semibold text-gray-900" : "font-medium text-gray-700"}`}
                                  >
                                    {n.title}
                                  </p>
                                  <p className="text-[12px] text-gray-400 truncate mt-0.5">
                                    {n.body}
                                  </p>
                                  <p className="text-[11px] text-gray-300 mt-1 font-medium">
                                    {formatRelativeDate(n.created_at)}
                                  </p>
                                </div>
                                <svg
                                  className="w-3.5 h-3.5 text-gray-300 mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </div>
                            </button>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      {recentNotifs.length > 0 && (
                        <Link
                          href="/dashboard/notifications"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-center gap-1.5 py-3 text-[12px] font-medium text-gray-500 hover:text-primary-600 bg-gray-50/80 border-t border-gray-100 hover:bg-gray-100 transition-colors"
                        >
                          View all notifications
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-5 bg-gray-200 mx-1" />

                {/* Dashboard */}
                <Link
                  href="/dashboard"
                  className="text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all duration-150"
                >
                  Dashboard
                </Link>

                {/* Admin badge */}
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    className="text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Admin
                  </Link>
                )}

                {/* User chip */}
                <div className="flex items-center gap-2 pl-1">
                  <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-primary-700 uppercase leading-none">
                      {(user.name || user.phone || "?")[0]}
                    </span>
                  </div>
                  <span className="hidden lg:block text-[13px] font-medium text-gray-700 max-w-[100px] truncate">
                    {user.name || user.phone}
                  </span>
                </div>

                {/* Logout */}
                <button
                  onClick={() => logout()}
                  className="text-[13px] font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-all duration-150"
                  title="Sign out"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-all duration-150"
                >
                  Sign In
                </Link>
                <Link
                  href="/post"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 px-4 py-1.5 rounded-xl shadow-sm shadow-primary-200 transition-all duration-150"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Post Property
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
