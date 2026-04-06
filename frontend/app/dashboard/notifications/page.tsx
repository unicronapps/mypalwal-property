// 'use client';

// import { useEffect, useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import api from '@/lib/api';
// import { formatRelativeDate } from '@/lib/format';

// const NOTIFICATION_ICONS: Record<string, string> = {
//   new_enquiry: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
//   enquiry_replied: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6',
//   listing_approved: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
//   listing_rejected: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
//   boost_expired: 'M13 10V3L4 14h7v7l9-11h-7z',
//   listing_expiring: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
//   boost_granted: 'M13 10V3L4 14h7v7l9-11h-7z',
// };

// const NOTIFICATION_COLORS: Record<string, string> = {
//   new_enquiry: 'bg-blue-100 text-blue-600',
//   enquiry_replied: 'bg-green-100 text-green-600',
//   listing_approved: 'bg-green-100 text-green-600',
//   listing_rejected: 'bg-red-100 text-red-600',
//   boost_expired: 'bg-orange-100 text-orange-600',
//   listing_expiring: 'bg-yellow-100 text-yellow-600',
//   boost_granted: 'bg-purple-100 text-purple-600',
// };

// function getNotifLink(n: any): string | null {
//   const d = n.data || {};
//   if (d.property_id) return `/property/${d.property_pid || d.property_id}`;
//   if (d.enquiry_id) return '/dashboard/enquiries/received';
//   return null;
// }

// export default function NotificationsPage() {
//   const router = useRouter();
//   const [notifications, setNotifications] = useState<any[]>([]);
//   const [total, setTotal] = useState(0);
//   const [page, setPage] = useState(1);
//   const [loading, setLoading] = useState(true);
//   const limit = 20;

//   const fetchNotifications = useCallback(async () => {
//     setLoading(true);
//     try {
//       const { data } = await api.get('/api/notifications', { params: { page, limit } });
//       setNotifications(data.data.notifications);
//       setTotal(data.data.total);
//     } catch (err) { console.error(err); }
//     finally { setLoading(false); }
//   }, [page]);

//   useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

//   // Register FCM token on mount
//   useEffect(() => {
//     registerFcmToken();
//   }, []);

//   async function registerFcmToken() {
//     try {
//       if (typeof window === 'undefined' || !('Notification' in window)) return;
//       if (!('serviceWorker' in navigator)) return;

//       // Request permission
//       const permission = await Notification.requestPermission();
//       if (permission !== 'granted') return;

//       // Dynamic import firebase modules to avoid SSR issues
//       const { initializeApp } = await import('firebase/app');
//       const { getMessaging, getToken } = await import('firebase/messaging');

//       const firebaseConfig = {
//         apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//         authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//         projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//         messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//         appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//       };

//       // Only proceed if firebase config is available
//       if (!firebaseConfig.apiKey) return;

//       const app = initializeApp(firebaseConfig);
//       const messaging = getMessaging(app);
//       const token = await getToken(messaging, {
//         vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
//       });

//       if (token) {
//         await api.post('/api/notifications/device-token', { token, platform: 'web' });
//       }
//     } catch (err) {
//       console.warn('FCM registration failed (non-critical):', err);
//     }
//   }

//   async function handleMarkAllRead() {
//     try {
//       await api.patch('/api/notifications/read-all');
//       setNotifications(prev => prev.map(n => ({ ...n, read: true })));
//     } catch (err) { console.error(err); }
//   }

//   async function handleClick(notif: any) {
//     // Mark as read
//     if (!notif.read) {
//       try {
//         await api.patch(`/api/notifications/${notif.id}/read`);
//         setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
//       } catch {}
//     }
//     // Navigate
//     const link = getNotifLink(notif);
//     if (link) router.push(link);
//   }

//   const totalPages = Math.ceil(total / limit);
//   const unreadCount = notifications.filter(n => !n.read).length;

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
//           {unreadCount > 0 && (
//             <p className="text-sm text-gray-500 mt-1">{unreadCount} unread on this page</p>
//           )}
//         </div>
//         <button onClick={handleMarkAllRead}
//           className="px-4 py-2 text-sm text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50">
//           Mark all as read
//         </button>
//       </div>

//       {loading ? (
//         <div className="space-y-3">
//           {[1, 2, 3, 4, 5].map(i => (
//             <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
//               <div className="flex gap-3">
//                 <div className="w-10 h-10 rounded-full bg-gray-100" />
//                 <div className="flex-1 space-y-2">
//                   <div className="h-4 bg-gray-100 rounded w-1/3" />
//                   <div className="h-3 bg-gray-100 rounded w-2/3" />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : notifications.length === 0 ? (
//         <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
//           <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
//           </svg>
//           <p className="text-gray-500 text-sm">No notifications yet</p>
//         </div>
//       ) : (
//         <div className="space-y-2">
//           {notifications.map(n => {
//             const iconPath = NOTIFICATION_ICONS[n.type] || NOTIFICATION_ICONS.new_enquiry;
//             const colorClass = NOTIFICATION_COLORS[n.type] || 'bg-gray-100 text-gray-600';
//             return (
//               <button
//                 key={n.id}
//                 onClick={() => handleClick(n)}
//                 className={`w-full text-left bg-white rounded-xl border p-4 transition-colors hover:bg-gray-50 ${
//                   !n.read ? 'border-primary-200 bg-primary-50/30' : 'border-gray-200'
//                 }`}
//               >
//                 <div className="flex gap-3 items-start">
//                   <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
//                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
//                     </svg>
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="flex items-center justify-between gap-2">
//                       <p className={`text-sm font-medium ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>
//                         {n.title}
//                       </p>
//                       <span className="text-xs text-gray-400 shrink-0">{formatRelativeDate(n.created_at)}</span>
//                     </div>
//                     <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
//                   </div>
//                   {!n.read && (
//                     <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-2" />
//                   )}
//                 </div>
//               </button>
//             );
//           })}
//         </div>
//       )}

//       {totalPages > 1 && (
//         <div className="flex items-center justify-between">
//           <p className="text-sm text-gray-500">Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}</p>
//           <div className="flex gap-1">
//             <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
//               className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Prev</button>
//             <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
//               className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Next</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

export default function NotificationsPage() {
  return (
    <div className="p-6 text-center text-gray-500">
      Notifications coming soon.
    </div>
  );
}
