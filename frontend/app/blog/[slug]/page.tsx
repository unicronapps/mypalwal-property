'use client';

import dynamic from 'next/dynamic';
import blogRegistry from '@/lib/blogRegistry';

export default function BlogSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const entry = blogRegistry[slug];

  if (!entry) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-4">
        <p className="text-6xl mb-4">📭</p>
        <h1 className="text-2xl font-bold text-white mb-2">Post not found</h1>
        <p className="text-gray-500 text-sm">This blog post doesn&apos;t exist or may have moved.</p>
        <a href="/blog" className="mt-6 text-sm text-[#e0c97f] underline">← Back to Blog</a>
      </div>
    );
  }

  const BlogComponent = dynamic(entry.component, {
    loading: () => (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#e0c97f] text-sm animate-pulse">Loading…</div>
      </div>
    ),
  });

  return <BlogComponent />;
}
