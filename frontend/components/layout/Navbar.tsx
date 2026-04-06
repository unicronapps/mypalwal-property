"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { formatRelativeDate } from "@/lib/format";

/* ─── Dropdown hook ─────────────────────────────────────────────────── */
function useDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);
  return {
    open,
    setOpen,
    ref,
    toggle: () => setOpen((p) => !p),
    close: () => setOpen(false),
  };
}

export default function Navbar() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const router = useRouter();

  /* Dropdowns */
  const userDd = useDropdown();
  const browseDd = useDropdown();
  const sellDd = useDropdown();

  /* Shared dropdown menu styles */
  const ddPanel =
    "absolute right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50";
  const ddItem =
    "flex items-center gap-3 w-full px-4 py-2.5 text-left text-[13px] font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors";
  const ddItemIcon = "w-4 h-4 text-gray-400";

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[60px]">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              My<span className="text-primary-600">Palwal</span>
            </span>
          </Link>

          {/* ── Center nav ── */}
          <div className="flex items-center gap-1">
            {/* Browse dropdown */}
            <div className="relative" ref={browseDd.ref}>
              <button
                onClick={browseDd.toggle}
                className="flex items-center gap-1 text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Browse
                <svg
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${browseDd.open ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {browseDd.open && (
                <div className={`${ddPanel} w-[220px]`}>
                  <div className="py-1.5">
                    <Link
                      href="/search"
                      onClick={browseDd.close}
                      className={ddItem}
                    >
                      <svg
                        className={ddItemIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
                      </svg>
                      Search Properties
                    </Link>
                    <Link
                      href="/circle-rate"
                      onClick={browseDd.close}
                      className={ddItem}
                    >
                      <svg
                        className={ddItemIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Circle Rate — Palwal
                    </Link>
                    <div className="my-1.5 mx-3 border-t border-gray-100" />
                    <Link
                      href="/about"
                      onClick={browseDd.close}
                      className={ddItem}
                    >
                      <svg
                        className={ddItemIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      About Us
                    </Link>
                    <Link
                      href="/contact"
                      onClick={browseDd.close}
                      className={ddItem}
                    >
                      <svg
                        className={ddItemIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Contact Us
                    </Link>
                    <Link
                      href="/advertise"
                      onClick={browseDd.close}
                      className={ddItem}
                    >
                      <svg
                        className={ddItemIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                        />
                      </svg>
                      Advertise With Us
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sell / Post dropdown */}
            <div className="relative" ref={sellDd.ref}>
              <button
                onClick={sellDd.toggle}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3.5 py-1.5 rounded-lg transition-colors"
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
                Sell
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${sellDd.open ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {sellDd.open && (
                <div className={`${ddPanel} w-[240px]`}>
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <p className="text-[12px] font-bold text-primary-700">
                      List your property
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Reach thousands of buyers in Palwal
                    </p>
                  </div>
                  <div className="py-1.5">
                    <Link
                      href="/post"
                      onClick={sellDd.close}
                      className={ddItem}
                    >
                      <svg
                        className={ddItemIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Post for Sale
                    </Link>
                    <Link
                      href="/post?listing=rent"
                      onClick={sellDd.close}
                      className={ddItem}
                    >
                      <svg
                        className={ddItemIcon}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                        />
                      </svg>
                      Post for Rent
                    </Link>
                    {!isAuthenticated && (
                      <>
                        <div className="my-1.5 mx-3 border-t border-gray-100" />
                        <Link
                          href="/auth/login"
                          onClick={sellDd.close}
                          className={`${ddItem} text-primary-600`}
                        >
                          <svg
                            className="w-4 h-4 text-primary-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                            />
                          </svg>
                          Sign in to post
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-1.5">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full animate-pulse" />
                <div className="w-20 h-7 bg-gray-100 rounded-lg animate-pulse" />
              </div>
            ) : isAuthenticated && user ? (
              /* User dropdown */
              <div className="relative" ref={userDd.ref}>
                <button
                  onClick={userDd.toggle}
                  className="flex items-center gap-2 hover:bg-gray-100 pl-1 pr-2 py-1 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <span className="text-[12px] font-bold text-primary-700 uppercase leading-none">
                      {(user.name || user.phone || "?")[0]}
                    </span>
                  </div>
                  <span className="hidden sm:block text-[13px] font-medium text-gray-700 max-w-[100px] truncate">
                    {user.name || user.phone}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${userDd.open ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {userDd.open && (
                  <div className={`${ddPanel} w-[240px]`}>
                    {/* User info header */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                          <span className="text-[14px] font-bold text-primary-700 uppercase">
                            {(user.name || user.phone || "?")[0]}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">
                            {user.name || "User"}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate">
                            {user.phone || user.email || ""}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="py-1.5">
                      <Link
                        href="/dashboard"
                        onClick={userDd.close}
                        className={ddItem}
                      >
                        <svg
                          className={ddItemIcon}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
                          />
                        </svg>
                        Dashboard
                      </Link>
                      <Link
                        href="/dashboard/listings"
                        onClick={userDd.close}
                        className={ddItem}
                      >
                        <svg
                          className={ddItemIcon}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={1.8}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
                          />
                        </svg>
                        My Listings
                      </Link>
                      <Link
                        href="/dashboard/notifications"
                        onClick={userDd.close}
                        className={ddItem}
                      >
                        <svg
                          className={ddItemIcon}
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
                        Notifications
                      </Link>
                      {user.role === "admin" && (
                        <Link
                          href="/admin"
                          onClick={userDd.close}
                          className={ddItem}
                        >
                          <svg
                            className="w-4 h-4 text-amber-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={1.8}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                            />
                          </svg>
                          <span className="text-amber-700">Admin Panel</span>
                        </Link>
                      )}
                      <div className="my-1.5 mx-3 border-t border-gray-100" />
                      <button
                        onClick={() => {
                          userDd.close();
                          logout();
                        }}
                        className={`${ddItem} text-red-500 hover:text-red-600 hover:bg-red-50`}
                      >
                        <svg
                          className="w-4 h-4 text-red-400"
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
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Not authenticated */
              <Link
                href="/auth/login"
                className="text-[13px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
