'use client';
import { createContext, useContext } from 'react';
import base from './tn13.module.css';
import brutal from './brutal.module.css';

export type Skin = 'collage' | 'brutal';

/** Gộp class của hai file CSS: cùng tên class thì brutal ghi đè (brutal.module.css viết với tiền tố [data-skin] nên luôn thắng). */
const merged: Record<string, string> = { ...base };
for (const k of Object.keys(brutal)) merged[k] = [base[k], brutal[k]].filter(Boolean).join(' ');

const SKINS: Record<Skin, Record<string, string>> = { collage: base, brutal: merged };
const Ctx = createContext<{ skin: Skin; s: Record<string, string> }>({ skin: 'collage', s: base });

export const classesFor = (skin: Skin) => SKINS[skin];

export function SkinProvider({ skin, children }: { skin: Skin; children: React.ReactNode }) {
  return <Ctx.Provider value={{ skin, s: SKINS[skin] }}>{children}</Ctx.Provider>;
}
export const useSkin = () => useContext(Ctx);
export const useS = () => useContext(Ctx).s;
