// Phần UI của registry (component client). Tách khỏi registry.ts để API route không phải import component.
import { skinOf } from './skins';
import Card, { HeroThumb, type CardProps } from './tn13/Card';
import { Tn13Fields, type Upload } from './tn13/Fields';
import type { Tn13Data } from './tn13/schema';

export function TemplateCard({ template, ...props }: { template: string } & Omit<CardProps, 'skin'>) {
  return <Card {...props} skin={skinOf(template)} />;
}

export function TemplateFields({ template, ...props }: { template: string; data: Tn13Data; onChange: (d: Tn13Data) => void; upload: Upload }) {
  return <Tn13Fields {...props} skin={skinOf(template)} />;
}

export function TemplateThumb({ template, data }: { template: string; data: Tn13Data }) {
  return <HeroThumb data={data} skin={skinOf(template)} />;
}
