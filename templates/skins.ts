// Ánh xạ mẫu → skin. Tách riêng (không kéo zod/sample) để client import nhẹ.
export const SKIN_OF = { tn13: 'brutal' } as const;
export const skinOf = (_template?: string) => 'brutal' as const;
