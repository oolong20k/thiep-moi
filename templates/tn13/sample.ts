import type { Tn13Data } from './schema';
import { DEFAULT_COLORS } from '@/lib/color';

export const sample: Tn13Data = {
  graduate: {
    fullName: 'Võ Thị Ngọc Hiền',
    nickname: 'Ngọc Hiền',
    school: 'Trường Đại học Mở Thành phố Hồ Chí Minh',
    classInfo: 'Chuyên ngành: Quản trị Nhân lực',
    year: '2026',
    headline1: 'Tốt nghiệp',
    headline2: 'rồi!',
    greeting:
      'Mình tốt nghiệp rồi! Ghé sảnh trường chung vui và chụp hình cùng mình nha.',
    coverPhoto: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/sample/person.svg`,
    ...DEFAULT_COLORS,
    guestNote: 'Hẹn bạn ở sảnh chính của trường, tụi mình chụp thật nhiều hình kỷ niệm nha!',
  },
  hero: { layout: 'torn' },
  messages: {
    visible: true,
    invitation:
      'Mình tốt nghiệp rồi! Ghé sảnh trường chung vui và chụp hình cùng mình nha.\nBạn cứ mặc bộ đồ mình thích nhất, mang theo nụ cười thật tươi là được!',
    quote: '',
    thanks:
      'Có bạn chung vui, ngày tốt nghiệp của mình sẽ vui hơn nhiều. Cảm ơn bạn đã luôn ở bên mình nha!\nĐến nơi cứ gọi mình: 0834 509 305 – Ngọc Hiền.',
  },
  album: {
    visible: false,
    layout: 'grid',
    photos: [],
  },
  ceremony: {
    visible: true,
    title: 'Lễ tốt nghiệp cử nhân',
    date: '2026-11-21',
    time: '16:00',
    endTime: '17:00',
    venueName: 'Sảnh chính, Cơ sở 1 – Trường Đại học Mở TP.HCM',
    address: '97 Võ Văn Tần, Quận 3, TP.HCM',
    mapsUrl: '',
  },
  schedule: {
    visible: true,
    title: 'Lịch trình buổi lễ',
    items: [
      { time: '16:00', content: 'Đón tiếp bạn bè & người thân tại Sảnh chính (LH: 0834 509 305 – Ngọc Hiền)' },
      { time: '16:15', content: 'Giao lưu & chụp hình kỷ niệm cùng tân cử nhân' },
      { time: '16:45', content: '1, 2, 3… Lên hình tập thể cùng gia đình và bạn bè' },
      { time: '17:00', content: 'Khép lại buổi lễ & hẹn kèo ăn mừng' },
    ],
  },
  interact: {
    visible: true,
    rsvp: true,
    wishes: false,
    rsvpNote: 'Bạn ghé được thì nhắn mình một tiếng nha, để mình biết đường đón bạn. Đến nơi gọi mình: 0834 509 305.',
  },
  gift: {
    visible: false,
    title: 'Quà mừng tốt nghiệp',
    note: 'Sự hiện diện của bạn là niềm vinh hạnh và là món quà ý nghĩa nhất đối với mình. Bạn đến chung vui là mình vui rồi!',
    bank: 'VCB',
    bankName: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    accountName: 'VO THI NGOC HIEN',
    accountNumber: '0123456789',
  },
  faq: {
    visible: true,
    items: [
      {
        q: 'Chỉ dẫn gửi xe ở đâu?',
        a: 'Bạn đến 97 Võ Văn Tần rồi hỏi bảo vệ chỗ gửi xe nha. Nếu bãi đầy, gọi mình để mình chỉ chỗ gần đó nhé!',
      },
      {
        q: 'Số điện thoại đón tiếp khi đến nơi?',
        a: 'Đến sảnh chính rồi gọi mình qua 0834 509 305 nha. Mình là Ngọc Hiền, mình ra đón bạn!',
      },
      {
        q: 'Khách mời nên chuẩn bị trang phục gì?',
        a: 'Mặc bộ đồ bạn thấy thoải mái và tự tin nhất nha. Màu sáng hay pastel lên hình cùng áo tốt nghiệp sẽ xinh lắm!',
      },
    ],
  },
  music: { visible: true, url: 'https://www.youtube.com/watch?v=sctrgmZ_JNM&list=RDsctrgmZ_JNM&start_radio=1' },
};

export const sampleBrutal: Tn13Data = sample;
