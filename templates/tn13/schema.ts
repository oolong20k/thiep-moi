import { z } from 'zod';

export const HERO_LAYOUTS = ['sticker', 'torn', 'polaroid'] as const;
export const ALBUM_LAYOUTS = ['stack', 'grid', 'slider', 'scatter', 'tape'] as const;

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || '';

// Chỉ nhận ảnh đã upload hoặc https: chặn javascript:/data: ở ranh giới tin cậy.
const url = z
  .string()
  .max(500)
  .refine(
    (u) =>
      u === '' ||
      u.startsWith('/uploads/') ||
      u.startsWith('/sample/') ||
      (BASE && (u.startsWith(`${BASE}/uploads/`) || u.startsWith(`${BASE}/sample/`))) ||
      /^https:\/\//.test(u),
    'url không hợp lệ',
  );
const text = (n: number) => z.string().max(n);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const tn13Schema = z.object({
  graduate: z.object({
    fullName: text(80),
    nickname: text(40),
    school: text(100),
    classInfo: text(100),
    year: text(10),
    headline1: text(30).optional().default(''),
    headline2: text(30).optional().default(''),
    greeting: text(300),
    coverPhoto: url,
    coverTransform: z.object({
      zoom: z.number().finite().min(0.25).max(3),
      rotation: z.number().finite().min(-180).max(180),
      x: z.number().finite().min(-100).max(100),
      y: z.number().finite().min(-100).max(100),
    }).optional(),
    mainColor: hexColor.optional(),
    accentColor: hexColor.optional(),
    textColor: hexColor.optional(),
    pageColor: hexColor.optional(),
    cardColor: hexColor.optional(),
    envelopeColor: hexColor.optional(),
    guestNote: text(300).optional(),
  }),
  hero: z.object({ layout: z.enum(HERO_LAYOUTS) }).optional().default({ layout: 'torn' }),
  messages: z.object({
    visible: z.boolean().optional().default(true),
    invitation: text(1200),
    quote: text(300),
    thanks: text(600),
    guestPersonalNote: text(300).optional(),
  }),
  album: z.object({
    visible: z.boolean(),
    layout: z.enum(ALBUM_LAYOUTS),
    photos: z.array(url).max(24),
  }),
  ceremony: z.object({
    visible: z.boolean().optional().default(true),
    title: text(100),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    time: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')).optional(),
    mapsUrl: z.string().max(500).refine((u) => u === '' || /^https:\/\//.test(u), 'chỉ nhận https').optional(),
    venueName: text(100),
    address: text(200),
  }),
  schedule: z.object({
    visible: z.boolean(),
    title: text(100).optional(),
    items: z.array(z.object({ time: text(10), content: text(120), description: text(240).optional() })).max(20),
  }),
  interact: z.object({
    visible: z.boolean().optional().default(true),
    rsvp: z.boolean(),
    wishes: z.boolean(),
    rsvpNote: text(300),
  }),
  gift: z.object({
    visible: z.boolean(),
    title: text(100).optional(),
    note: text(300),
    bank: text(40),
    bankName: text(120).optional(),
    accountName: text(80),
    accountNumber: text(30),
  }),
  faq: z.object({
    visible: z.boolean(),
    items: z.array(z.object({ q: text(120), a: text(400) })).max(12),
  }),
  music: z.object({
    visible: z.boolean().optional().default(true),
    url: z.string().max(500).refine((u) => u === '' || /^https:\/\//.test(u), 'chỉ nhận https'),
  }),
  guests: z.array(text(80)).max(500).optional(),
});

export type Tn13Data = z.infer<typeof tn13Schema>;
export type HeroLayout = (typeof HERO_LAYOUTS)[number];
export type AlbumLayout = (typeof ALBUM_LAYOUTS)[number];
