'use client';

/*
 * BACKEND API REQUIRED:
 * POST /api/leads/paperwork
 * Body (JSON):
 *   name        string   required
 *   phone       string   required  (10-digit Indian mobile)
 *   city        string   required
 *   service     string   required  enum: registry | mutation | noc | loan_noc | other
 *   message     string   optional  free-text details
 * Response: { success: true, id: <uuid> }
 * Auth: none (public endpoint)
 * Notes:
 *   - Store in a `paperwork_leads` table (id, name, phone, city, service, message, created_at)
 *   - Send WhatsApp / notification to admin on new submission
 */

import { useState } from 'react';
import api from '@/lib/api';

const SERVICES = [
  { value: 'registry', label: 'Property Registry' },
  { value: 'mutation', label: 'Mutation (Intkal)' },
  { value: 'noc', label: 'NOC / Clearance' },
  { value: 'loan_noc', label: 'Loan NOC' },
  { value: 'other', label: 'Other / Not Sure' },
];

const CITIES = ['Gurugram', 'Faridabad', 'Panipat', 'Karnal', 'Rohtak', 'Ambala', 'Sonipat', 'Hisar', 'Other'];

export default function PaperWorkForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', phone: '', city: '', service: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/api/leads/paperwork', form);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">We'll reach out shortly</h3>
        <p className="text-sm text-gray-500 mb-4">Our team will call you within 24 hours.</p>
        <button onClick={onClose} className="text-sm text-primary-600 hover:underline">Close</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Your Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Ramesh Kumar"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number *</label>
          <input
            required
            type="tel"
            pattern="[6-9][0-9]{9}"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="9876543210"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">City *</label>
          <select
            required
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select city</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Service Needed *</label>
          <select
            required
            value={form.service}
            onChange={(e) => set('service', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select service</option>
            {SERVICES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Additional Details</label>
        <textarea
          value={form.message}
          onChange={(e) => set('message', e.target.value)}
          rows={2}
          placeholder="Any specific details about your property or requirement…"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
        />
      </div>
      {status === 'error' && (
        <p className="text-xs text-red-500">Something went wrong. Please try again.</p>
      )}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-primary-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-primary-700 transition-colors disabled:opacity-60"
      >
        {status === 'loading' ? 'Submitting…' : 'Submit Request'}
      </button>
    </form>
  );
}
