import { notFound } from 'next/navigation';
import { TemplateCard } from '@/templates/ui';
import { isTemplate, templates } from '@/templates/registry';
import { ALBUM_LAYOUTS, type AlbumLayout } from '@/templates/tn13/schema';

type SP = { album?: string; skip?: string; to?: string };

const pick = <T extends string>(list: readonly T[], v?: string) => list.find((x) => x === v);

export default async function Demo({ params, searchParams }: { params: Promise<{ template: string }>; searchParams: Promise<SP> }) {
  const { template } = await params;
  const resolvedTemplate = template === 'tn13-brutal' ? 'tn13' : template;
  if (!isTemplate(resolvedTemplate)) notFound();
  const sample = templates[resolvedTemplate].sample;
  const sp = await searchParams;
  const album: AlbumLayout | undefined = pick(ALBUM_LAYOUTS, sp.album);

  return (
    <TemplateCard
      template={resolvedTemplate}
      data={sample}
      albumLayout={album}
      skipOpening={sp.skip === '1'}
      guest={sp.to?.slice(0, 60) || 'Lê Phương Thảo'}
    />
  );
}
