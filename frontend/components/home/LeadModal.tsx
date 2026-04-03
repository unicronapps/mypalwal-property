'use client';

import { useEffect } from 'react';
import PaperWorkForm from './PaperWorkForm';
import FindPropertyForm from './FindPropertyForm';

type ModalType = 'paperwork' | 'find-property';

const MODAL_META = {
  paperwork: {
    title: 'Property Paper Completion',
    subtitle: 'Registry, mutation, NOC — we handle it all. Our experts will call you.',
  },
  'find-property': {
    title: 'Find a Property For Me',
    subtitle: 'Tell us what you need. We\'ll shortlist matching properties and call back.',
  },
};

export default function LeadModal({ type, onClose }: { type: ModalType; onClose: () => void }) {
  const meta = MODAL_META[type];

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-bold">{meta.title}</h2>
              <p className="text-primary-100 text-sm mt-0.5">{meta.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors ml-4 mt-0.5"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {type === 'paperwork'
            ? <PaperWorkForm onClose={onClose} />
            : <FindPropertyForm onClose={onClose} />
          }
        </div>
      </div>
    </div>
  );
}
