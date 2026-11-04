'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getCards, removeCard, type MyCard } from '@/lib/mycards';
import s from '../site.module.css';

export default function My() {
  const [cards, setCards] = useState<MyCard[] | null>(null);
  useEffect(() => setCards(getCards()), []);
  return (
    <div className={s.wrap}>
      <header className={s.head}>
        <h1>Thiệp của tôi</h1>
      </header>
      <nav className={s.nav}>
        <Link href="/">Mẫu thiệp</Link>
        <Link href="/my">Thiệp của tôi</Link>
      </nav>
      <main className={s.main}>
        <p className={s.note}>Danh sách này chỉ lưu trong trình duyệt này. Hãy lưu lại link sửa của từng thiệp: mất link là không sửa lại được.</p>
        {cards === null ? null : cards.length === 0 ? (
          <p>
            Bạn chưa có thiệp nào. <Link href="/">Chọn mẫu để bắt đầu</Link>.
          </p>
        ) : (
          <ul className={s.list}>
            {cards.map((c) => (
              <li key={c.id}>
                <span>
                  Thiệp tạo {new Date(c.createdAt).toLocaleDateString('vi-VN')} · <Link href={`/t/${c.slug}`}>/t/{c.slug}</Link>
                </span>
                <span className={s.actions}>
                  <Link className={s.btn} href={`/edit/${c.id}#${c.token}`}>
                    Sửa
                  </Link>
                  <button className={s.btn2} onClick={() => setCards((removeCard(c.id), getCards()))}>
                    Bỏ khỏi danh sách
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
