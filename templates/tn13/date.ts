const WEEKDAYS = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
const WEEKDAYS_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

/** Chỉ dùng UTC để kết quả giống nhau ở server và mọi múi giờ client. */
export function dateParts(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dayIdx = dt.getUTCDay();
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return {
    y,
    m,
    d,
    dd,
    mm,
    weekday: WEEKDAYS[dayIdx],
    weekdayShort: WEEKDAYS_SHORT[dayIdx],
    short: `${dd}.${mm}.${y}`,
  };
}

/** Lưới tháng bắt đầu từ Thứ Hai: mảng ngày (null = ô trống đầu tháng). */
export function monthGrid(iso: string) {
  const { y, m } = dateParts(iso);
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const lead = (first + 6) % 7;
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
}

/** Giờ buổi lễ luôn hiểu theo giờ Việt Nam (UTC+7). */
export const targetMs = (date: string, time: string) => Date.parse(`${date}T${time || '00:00'}:00+07:00`);

/** Tên riêng tối đa 2 chữ cuối, dùng làm mặc định cho nickname. */
export const lastTwo = (name: string) => name.trim().split(/\s+/).slice(-2).join(' ');

/** 2 chữ cái đầu của tên gọi để hiện khi chưa có ảnh. */
export const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => Array.from(w)[0]?.toUpperCase() || '')
    .join('');

/** Class độ dài tên gọi cho màn mở thiệp giống bản gốc. */
export function nameLenClass(name: string) {
  const len = Array.from(name || '').length;
  if (len > 26) return 'is-len-xl';
  if (len > 20) return 'is-len-l';
  if (len > 14) return 'is-len-m';
  return '';
}
