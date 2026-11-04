import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getStore } from '@/lib/store';
import { TemplateCard } from '@/templates/ui';
import type { Tn13Data } from '@/templates/tn13/schema';
import { dateParts } from '@/templates/tn13/date';

export const dynamic = 'force-dynamic';

// Luôn đọc published_json, không bao giờ đọc draft.
async function load(slug: string) {
  const row = await (await getStore()).cardBySlug(slug);
  return row?.published_json ? { data: JSON.parse(row.published_json) as Tn13Data, template: row.template } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const loaded = await load((await params).slug);
  if (!loaded) return {};
  const { data } = loaded;
  const { graduate: g, ceremony: c } = data;
  const title = `Thiệp mời tốt nghiệp của ${g.nickname}`;
  const description = `${c.title} · ${dateParts(c.date).short} · ${c.time} · ${c.venueName}`;
  const image = g.coverPhoto.startsWith('/uploads/') || g.coverPhoto.startsWith('https://') ? g.coverPhoto : undefined;
  return { title, description, openGraph: { title, description, type: 'website', images: image ? [image] : undefined } };
}

export default async function PublicCard({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ to?: string }> }) {
  const { slug } = await params;
  const loaded = await load(slug);
  if (!loaded) notFound();
  const to = (await searchParams).to?.trim().slice(0, 60);
  return <TemplateCard template={loaded.template} data={loaded.data} slug={slug} guest={to || undefined} />;
}
