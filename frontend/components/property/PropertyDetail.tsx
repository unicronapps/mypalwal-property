'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, formatArea, formatDate, PROPERTY_TYPE_LABELS, CATEGORY_LABELS } from '@/lib/format';
import PropertyCard from './PropertyCard';
import api from '@/lib/api';

interface Props { property: any; }

export default function PropertyDetail({ property: p }: Props) {
  const { user, isAuthenticated } = useAuth();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [enquirySent, setEnquirySent] = useState(false);
  const [enquiryLoading, setEnquiryLoading] = useState(false);

  const photos = (p.media || []).filter((m: any) => m.media_type === 'photo');
  const amenities: string[] = p.amenities || [];
  const attrs = p.attributes || {};
  const attrEntries = Object.entries(attrs).filter(([, v]) => v !== null && v !== undefined && v !== '');

  async function submitEnquiry() {
    if (!enquiryMsg.trim()) return;
    setEnquiryLoading(true);
    try {
      await api.post('/api/enquiries', {
        property_id: p.id,
        message: enquiryMsg,
      });
      setEnquirySent(true);
    } catch {}
    setEnquiryLoading(false);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Photos + Details */}
        <div className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="text-xs text-gray-500 mb-3 flex items-center gap-1">
            <Link href="/" className="hover:text-gray-700">Home</Link> /
            <Link href="/search" className="hover:text-gray-700">Properties</Link> /
            {p.location?.city && <Link href={`/search?city=${p.location.city}`} className="hover:text-gray-700">{p.location.city}</Link>}
            {p.location?.city && '/'}
            <span className="text-gray-700">{p.title}</span>
          </div>

          {/* Photo gallery */}
          {photos.length > 0 ? (
            <div className="mb-4">
              <div className="relative h-72 md:h-96 rounded-xl overflow-hidden bg-gray-100">
                <Image src={photos[photoIndex]?.url} alt={p.title} fill className="object-cover" />
                {photos.length > 1 && (
                  <>
                    <button onClick={() => setPhotoIndex(i => Math.max(0, i - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70">‹</button>
                    <button onClick={() => setPhotoIndex(i => Math.min(photos.length - 1, i + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70">›</button>
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full">{photoIndex + 1} / {photos.length}</div>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {photos.map((m: any, i: number) => (
                    <button key={i} onClick={() => setPhotoIndex(i)}
                      className={`shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-colors ${i === photoIndex ? 'border-primary-600' : 'border-transparent'}`}>
                      <Image src={m.url} alt="" width={64} height={48} className="object-cover w-full h-full" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="h-72 bg-gray-100 rounded-xl flex items-center justify-center mb-4 text-gray-300">
              <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg>
            </div>
          )}

          {/* Title row */}
          <div className="flex flex-wrap items-start gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 flex-1">{p.title}</h1>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">{CATEGORY_LABELS[p.category] || p.category}</span>
              {p.is_verified && <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">✓ Verified</span>}
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-mono">{p.property_id}</span>
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-3">
            {PROPERTY_TYPE_LABELS[p.property_type]} · {p.location?.locality}, {p.location?.city}
            {p.location?.pincode && ` - ${p.location.pincode}`}
          </p>

          {/* Price + Area */}
          <div className="flex flex-wrap gap-6 mb-5 p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="text-xs text-gray-500 mb-1">Price</p>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(p.price, p.price_unit)}</p>
              {p.price_negotiable && <p className="text-xs text-green-600 font-medium">Negotiable</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Area</p>
              <p className="text-xl font-semibold text-gray-800">
                {p.area_display_value && p.area_display_unit
                  ? formatArea(p.area_display_value, p.area_display_unit)
                  : formatArea(p.area_sqft, 'sqft')}
              </p>
            </div>
            {p.possession_status && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Possession</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{p.possession_status.replace('_', ' ')}</p>
              </div>
            )}
          </div>

          {/* Description */}
          {p.description && (
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 mb-2">About this property</h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{p.description}</p>
            </div>
          )}

          {/* Attributes */}
          {attrEntries.length > 0 && (
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 mb-3">Property Details</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {attrEntries.map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg px-3 py-2.5">
                    <p className="text-xs text-gray-500 capitalize">{k.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">
                      {typeof v === 'boolean' ? (v ? 'Yes' : 'No') : String(v)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities */}
          {amenities.length > 0 && (
            <div className="mb-5">
              <h2 className="font-semibold text-gray-900 mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {amenities.map((a: string) => (
                  <span key={a} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full capitalize">{a.replace(/_/g, ' ')}</span>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="text-xs text-gray-400 flex gap-4 mb-6">
            <span>Listed: {formatDate(p.listed_at)}</span>
            {p.updated_at !== p.created_at && <span>Updated: {formatDate(p.updated_at)}</span>}
          </div>

          {/* Similar listings */}
          {p.similar?.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">Similar Listings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {p.similar.map((s: any) => <PropertyCard key={s.id} property={s} />)}
              </div>
            </div>
          )}
        </div>

        {/* Right: Contact Card (sticky) */}
        <aside className="lg:w-80 shrink-0">
          <div className="sticky top-20 bg-white rounded-xl border border-gray-200 p-5">
            {/* Owner info */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                {p.owner?.name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{p.owner?.name || 'Owner'}</p>
                <div className="flex gap-1 flex-wrap">
                  {p.owner?.verified_dealer && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full">✓ Verified Dealer</span>
                  )}
                  {p.owner?.agency_name && (
                    <span className="text-xs text-gray-500">{p.owner.agency_name}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Contact buttons */}
            {!isAuthenticated ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600 mb-3">Login to view contact details</p>
                <Link href={`/auth/login?redirect=/property/${p.property_id}`} className="btn-primary w-full block text-center py-2.5">
                  Login to Contact
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {p.contact_info?.can_call && p.contact_info?.phone && (
                  <a href={`tel:+91${p.contact_info.phone}`}
                    className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    📞 Call: +91 {p.contact_info.phone}
                  </a>
                )}
                {p.contact_info?.can_whatsapp && p.contact_info?.whatsapp_url && (
                  <a href={p.contact_info.whatsapp_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-green-700 transition-colors">
                    💬 WhatsApp
                  </a>
                )}
                {p.contact_enquiry && (
                  <button onClick={() => setShowEnquiry(true)}
                    className="flex items-center justify-center gap-2 w-full btn-primary py-2.5 text-sm">
                    ✉️ Send Enquiry
                  </button>
                )}
              </div>
            )}

            {/* Views */}
            <p className="text-xs text-gray-400 text-center mt-4">{p.view_count} views</p>
          </div>
        </aside>
      </div>

      {/* Enquiry modal */}
      {showEnquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            {enquirySent ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-2">✅</p>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Enquiry Sent!</h3>
                <p className="text-sm text-gray-500 mb-4">The owner will contact you soon.</p>
                <button onClick={() => { setShowEnquiry(false); setEnquirySent(false); setEnquiryMsg(''); }}
                  className="btn-primary px-6 py-2">Close</button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Send Enquiry</h3>
                <p className="text-sm text-gray-500 mb-4">About: {p.title}</p>
                <textarea
                  value={enquiryMsg}
                  onChange={e => setEnquiryMsg(e.target.value)}
                  placeholder="Hi, I am interested in this property. Please share more details…"
                  rows={4}
                  className="input-field resize-none mb-4"
                />
                <div className="flex gap-3">
                  <button onClick={() => setShowEnquiry(false)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                  <button onClick={submitEnquiry} disabled={enquiryLoading || !enquiryMsg.trim()} className="flex-1 btn-primary py-2 text-sm">
                    {enquiryLoading ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
