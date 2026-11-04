// "Thiệp của tôi": lưu {id, token} ở localStorage của trình duyệt này (không có tài khoản, mất token = mất quyền sửa).
export type MyCard = { id: string; slug: string; token: string; createdAt: number };
const KEY = 'thiep-moi:cards';

export function getCards(): MyCard[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function saveCard(c: MyCard) {
  try {
    const old = getCards().find((x) => x.id === c.id);
    localStorage.setItem(KEY, JSON.stringify([{ ...c, createdAt: old?.createdAt ?? c.createdAt }, ...getCards().filter((x) => x.id !== c.id)]));
  } catch {}
}

export function removeCard(id: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify(getCards().filter((x) => x.id !== id)));
  } catch {}
}

export const tokenFor = (id: string) => getCards().find((c) => c.id === id)?.token;
