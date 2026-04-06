'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { formatPrice } from '@/lib/format';

interface Listing {
  id: string;
  property_id: string;
  title: string;
  is_boosted?: boolean;
  boost_expires_at?: string;
  city?: string;
}

const BOOST_PACKS = [
  { days: 7, price: 199, label: '7 Days', desc: 'Quick visibility boost' },
  { days: 15, price: 349, label: '15 Days', desc: 'Extended reach', popular: true },
  { days: 30, price: 599, label: '30 Days', desc: 'Maximum exposure' },
];

export default function BoostPage() {
  const searchParams = useSearchParams();
  const preselected = searchParams.get('property');

  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedId, setSelectedId] = useState<string>(preselected || '');
  const [selectedPack, setSelectedPack] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadListings() {
      try {
        const { data } = await api.get('/api/properties/my/listings?status=active&limit=50');
        setListings(data.data.listings);
        if (!selectedId && data.data.listings.length > 0) {
          setSelectedId(preselected || data.data.listings[0].id);
        }
      } catch (err) {
        console.error('Failed to load listings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  const selectedListing = listings.find(l => l.id === selectedId);
  const isBoosted = selectedListing?.is_boosted;
  const boostExpiry = selectedListing?.boost_expires_at
    ? new Date(selectedListing.boost_expires_at)
    : null;
  const isBoostActive = boostExpiry && boostExpiry > new Date();

  async function handleBoost() {
    if (!selectedId) return;
    setPaying(true);
    setMessage(null);

    try {
      // Create order
      const { data: orderData } = await api.post('/api/payments/order', {
        type: 'boost',
        property_id: selectedId,
        duration_days: selectedPack,
      });

      const { orderId, amountPaise, currency, keyId } = orderData.data;

      // Load Razorpay script
      await loadRazorpayScript();

      const options = {
        key: keyId,
        amount: amountPaise,
        currency,
        order_id: orderId,
        name: 'PropertyX',
        description: `Boost listing for ${selectedPack} days`,
        handler: async function (response: any) {
          try {
            await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setMessage({ type: 'success', text: `Listing boosted for ${selectedPack} days!` });
            // Refresh listings
            const { data: refreshed } = await api.get('/api/properties/my/listings?status=active&limit=50');
            setListings(refreshed.data.listings);
          } catch {
            setMessage({ type: 'error', text: 'Payment verification failed. Contact support.' });
          }
        },
        modal: { ondismiss: () => setPaying(false) },
        theme: { color: '#4F46E5' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create payment' });
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">No active listings to boost.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Boost a Listing</h1>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Step 1: Select Listing */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Step 1: Select Listing</h2>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="input-field"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title} ({l.property_id}) — {l.city}
            </option>
          ))}
        </select>
        {isBoostActive && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              This listing is already boosted until{' '}
              <span className="font-medium">
                {boostExpiry!.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Choose Pack */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Step 2: Choose Boost Pack</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BOOST_PACKS.map((pack) => (
            <button
              key={pack.days}
              onClick={() => setSelectedPack(pack.days)}
              className={`relative p-4 rounded-xl border-2 text-left transition-colors ${
                selectedPack === pack.days
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {pack.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                  Popular
                </span>
              )}
              <p className="text-lg font-bold text-gray-900">{pack.label}</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{formatPrice(pack.price)}</p>
              <p className="text-sm text-gray-500 mt-1">{pack.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: Pay */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Step 3: Complete Payment</h2>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Boost: {selectedPack} days</p>
            <p className="text-sm text-gray-500">Property: {selectedListing?.title}</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(BOOST_PACKS.find(p => p.days === selectedPack)?.price || 199)}
          </p>
        </div>
        <button
          onClick={handleBoost}
          disabled={paying || !selectedId}
          className="btn-primary w-full py-3 text-base"
        >
          {paying ? 'Processing...' : 'Pay & Boost Now'}
        </button>
      </div>
    </div>
  );
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}
