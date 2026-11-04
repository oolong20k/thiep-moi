import Link from 'next/link';
import { TemplateThumb } from '@/templates/ui';
import { templates, type TemplateId } from '@/templates/registry';
import { CreateButton } from './create-button';
import s from './site.module.css';

export default function Home() {
  return (
    <div className={s.wrap}>
      <header className={s.head}>
        <h1>Thiệp mời tốt nghiệp</h1>
        <p>Chọn mẫu, điền thông tin, xem trước rồi gửi một đường link cho bạn bè. Sửa lại bất cứ lúc nào bằng link sửa bí mật của bạn.</p>
      </header>
      <nav className={s.nav}>
        <Link href="/">Mẫu thiệp</Link>
        <Link href="/my">Thiệp của tôi</Link>
      </nav>
      <main className={s.main}>
        <div className={s.grid}>
          {(Object.keys(templates) as TemplateId[]).map((id) => (
            <article key={id} className={s.tpl}>
              <div className={s.thumb}>
                <TemplateThumb template={id} data={templates[id].sample} />
              </div>
              <div className={s.info}>
                <h2>{templates[id].name}</h2>
                <p style={{ margin: 0 }}>{templates[id].desc}</p>
                <div className={s.actions}>
                  <Link className={s.btn2} href={`/demo/${id}`}>
                    Xem demo
                  </Link>
                  <CreateButton template={id} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
