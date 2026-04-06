export const runtime = 'edge';
'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/format';

interface Plan {
  id: string;
  name: string;
  price: number;
  listing_limit: number;
  duration_days: number;
  features: string[];
}

interface SubStatus {
  plan_name: string;
  listings_used: number;
  listing_limit: number;
  subscription: any;
}

interface Payment {
  id: string;
  type: string;
  amount: number;
  status: string;
  metadata: any;
  created_at: string;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, subRes, histRes] = await Promise.all([
          api.get('/api/payments/plans'),
          api.get('/api/payments/subscription/status'),
          api.get('/api/payments/history?limit=10'),
        ]);
        setPlans(plansRes.data.data.plans);
        setSubStatus(subRes.data.data);
        setPayments(histRes.data.data.payments);
      } catch (err) {
        console.error('Failed to load subscription data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleSubscribe(plan: Plan) {
    if (plan.price <= 0) return;
    setPaying(plan.id);
    setMessage(null);

    try {
      const { data: orderData } = await api.post('/api/payments/order', {
        type: 'subscription',
        plan_id: plan.id,
      });

      const { orderId, amountPaise, currency, keyId } = orderData.data;

      await loadRazorpayScript();

      const options = {
        key: keyId,
        amount: amountPaise,
        currency,
        order_id: orderId,
        name: 'PropertyX',
        description: `${plan.name} Plan — ${plan.duration_days} days`,
        handler: async function (response: any) {
          try {
            await api.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setMessage({ type: 'success', text: `${plan.name} plan activated!` });
            // Refresh
            const [subRes, histRes] = await Promise.all([
              api.get('/api/payments/subscription/status'),
              api.get('/api/payments/history?limit=10'),
            ]);
            setSubStatus(subRes.data.data);
            setPayments(histRes.data.data.payments);
          } catch {
            setMessage({ type: 'error', text: 'Payment verification failed.' });
          }
        },
        modal: { ondismiss: () => setPaying(null) },
        theme: { color: '#4F46E5' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to create payment' });
    } finally {
      setPaying(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const currentPlan = subStatus?.plan_name || 'Free';
  const daysRemaining = subStatus?.subscription
    ? Math.max(0, Math.ceil((new Date(subStatus.subscription.expires_at).getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Current Plan Banner */}
      <div className="bg-primary-50 border border-primary-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-600 font-medium">Current Plan</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{currentPlan}</p>
            <p className="text-sm text-gray-600 mt-1">
              {subStatus?.listing_limit === -1
                ? 'Unlimited listings'
                : `${subStatus?.listings_used || 0} / ${subStatus?.listing_limit || 5} listings used`}
              {daysRemaining > 0 && ` · ${daysRemaining} days remaining`}
            </p>
          </div>
          {subStatus?.subscription && (
            <div className="text-right">
              <p className="text-xs text-gray-500">Expires</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(subStatus.subscription.expires_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.name === currentPlan;
          const features = Array.isArray(plan.features)
            ? plan.features
            : JSON.parse(plan.features as any || '[]');

          return (
            <div
              key={plan.id}
              className={`bg-white rounded-xl border-2 p-6 flex flex-col ${
                isCurrent ? 'border-primary-600 ring-2 ring-primary-100' : 'border-gray-200'
              }`}
            >
              {isCurrent && (
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Current</span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2">
                {plan.price > 0 ? (
                  <>
                    <span className="text-3xl font-bold text-gray-900">{formatPrice(plan.price)}</span>
                    <span className="text-sm text-gray-500">/month</span>
                  </>
                ) : (
                  <span className="text-3xl font-bold text-gray-900">Free</span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {plan.listing_limit === -1 ? 'Unlimited' : plan.listing_limit} listings
              </p>
              <ul className="mt-4 space-y-2 flex-1">
                {features.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent || plan.price <= 0 || paying === plan.id}
                className={`mt-4 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isCurrent
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : plan.price <= 0
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : 'btn-primary'
                }`}
              >
                {paying === plan.id ? 'Processing...' : isCurrent ? 'Current Plan' : plan.price <= 0 ? 'Free' : 'Upgrade'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Payment History */}
      {payments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        p.type === 'subscription' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{formatPrice(p.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        p.status === 'paid' ? 'bg-green-100 text-green-700' :
                        p.status === 'failed' ? 'bg-red-100 text-red-700' :
                        p.status === 'refunded' ? 'bg-amber-100 text-amber-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
