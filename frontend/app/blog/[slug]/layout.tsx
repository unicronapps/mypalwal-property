import type { Metadata } from 'next';
import blogRegistry from '@/lib/blogRegistry';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;
  const entry = blogRegistry[slug];

  if (!entry) {
    return {
      title: 'Blog — MyPalwal',
      description: 'Read articles about Palwal real estate, infrastructure and investment.',
    };
  }

  const { meta } = entry;

  return {
    title: `${meta.title} | MyPalwal Blog`,
    description: meta.description,
    keywords: meta.keywords,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'article',
      publishedTime: meta.publishedAt,
      url: `https://mypalwal.com/blog/${slug}`,
      siteName: 'MyPalwal',
    },
    alternates: {
      canonical: `https://mypalwal.com/blog/${slug}`,
    },
  };
}

export default function BlogSlugLayout({ children }: { children: React.ReactNode }) {
  return children;
}
