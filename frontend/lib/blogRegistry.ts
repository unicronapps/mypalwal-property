import { ComponentType } from 'react';

export interface BlogMeta {
  title: string;
  description: string;
  publishedAt: string;         // ISO date string
  category: string;
  keywords: string[];
}

export interface BlogEntry {
  meta: BlogMeta;
  component: () => Promise<{ default: ComponentType }>;
}

// ─── Add new blog posts here ───────────────────────────────────────────────
// Key = URL slug (must match /blog/[slug])
const blogRegistry: Record<string, BlogEntry> = {
  'palwal-to-jewar-airport-connectivity-routes-distance-timeline-2026': {
    meta: {
      title: 'Palwal to Jewar Airport — Connectivity Routes, Distance & Timeline 2026',
      description:
        'Complete guide to Palwal–Jewar Airport connectivity: Greenfield Expressway, Railway, Metro, EPE, and Yamuna Expressway routes. Distances, timelines, and real estate impact for Palwal.',
      publishedAt: '2026-04-11',
      category: 'Infrastructure',
      keywords: [
        'palwal jewar airport',
        'palwal to jewar distance',
        'jewar airport connectivity',
        'greenfield expressway palwal',
        'palwal airport route 2026',
        'haryana ncr airport',
      ],
    },
    component: () =>
      import('@/components/blog/PalwalJewarBlog').then((m) => ({ default: m.default })),
  },

  'palwal-vs-faridabad-property-investment-guide-2026': {
    meta: {
      title: 'Palwal vs Faridabad — Where to Buy Property in 2026? Complete Comparison',
      description:
        'In-depth comparison of Palwal and Faridabad property markets in 2026. Compare prices, appreciation, airport distance, metro access, pros & cons — and find out which city is the better investment for you.',
      publishedAt: '2026-04-11',
      category: 'Property Guide',
      keywords: [
        'palwal vs faridabad property',
        'buy property palwal or faridabad',
        'palwal real estate 2026',
        'faridabad property prices 2026',
        'best place to invest in haryana',
        'palwal investment guide',
        'ncr property comparison',
      ],
    },
    component: () =>
      import('@/components/blog/PalwalVsFaridabadBlog').then((m) => ({ default: m.default })),
  },

  'haryana-property-transfer-after-death-legal-process-mutation-guide': {
    meta: {
      title: 'How to Transfer Property After Death in Haryana — Mutation, Legal Heirs & Documents Guide',
      description:
        'Step-by-step guide to transfer inherited property in Haryana after death. Learn about mutation (intaqal), legal heir certificate, jamabandi update, stamp duty rules, and required documents. Available in Hindi & English.',
      publishedAt: '2025-04-01',
      category: 'Property Law',
      keywords: [
        'property transfer after death haryana',
        'mutation haryana after death',
        'intaqal haryana',
        'legal heir certificate haryana',
        'jamabandi mutation palwal',
        'haryana property inheritance process',
        'varisan praman patra haryana',
      ],
    },
    component: () =>
      import('@/components/blog/HaryanaPropertyTransferBlog').then((m) => ({ default: m.default })),
  },
};
// ───────────────────────────────────────────────────────────────────────────

export default blogRegistry;
