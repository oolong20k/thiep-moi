// Phần an toàn cho server/API (không kéo component client vào route handler).
import { tn13Schema } from './tn13/schema';
import { sample } from './tn13/sample';

/** Mẫu duy nhất TN13 thanh xuân vườn trường. */
export const templates = {
  tn13: {
    name: 'TN13 · Hẹn ngày tốt nghiệp',
    desc: 'Một lời hẹn ở sân trường, những tấm hình cùng bạn bè. Thiệp pastel dịu nhẹ cho ngày tốt nghiệp.',
    schema: tn13Schema,
    sample,
  },
} as const;
export type TemplateId = keyof typeof templates;
export const isTemplate = (id: string): id is TemplateId => id in templates;
