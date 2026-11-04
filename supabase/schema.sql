-- Chạy một lần trong Supabase → SQL Editor. Chạy lại nhiều lần cũng an toàn.

create table if not exists cards (
  id text primary key,
  slug text unique not null,
  template text not null,
  edit_token_hash text not null,
  draft_json text not null,
  published_json text,
  created_at bigint not null,
  updated_at bigint not null,
  published_at bigint
);

create table if not exists rsvps (
  id bigserial primary key,
  card_id text not null references cards(id) on delete cascade,
  guest_name text not null,
  status text not null check (status in ('yes','no','maybe')),
  note text not null default '',
  created_at bigint not null
);

create table if not exists wishes (
  id bigserial primary key,
  card_id text not null references cards(id) on delete cascade,
  name text not null,
  message text not null,
  hidden smallint not null default 0,
  created_at bigint not null
);

create index if not exists rsvps_card on rsvps(card_id);
create index if not exists wishes_card on wishes(card_id);

-- Bật RLS và KHÔNG tạo policy: chỉ service_role key (server) truy cập được, anon key thì không.
alter table cards enable row level security;
alter table rsvps enable row level security;
alter table wishes enable row level security;

-- Rate-limit dùng chung cho mọi instance serverless.
create table if not exists rate_hits (key text not null, at timestamptz not null default now());
create index if not exists rate_hits_key on rate_hits(key, at);
alter table rate_hits enable row level security;

create or replace function rate_hit(k text, win_ms int) returns int
language plpgsql security definer set search_path = public as $$
begin
  delete from rate_hits where at < now() - interval '1 hour';
  insert into rate_hits(key) values (k);
  return (select count(*) from rate_hits where key = k and at > now() - (win_ms || ' milliseconds')::interval);
end $$;
revoke all on function rate_hit(text, int) from public, anon, authenticated;

-- Bucket ảnh: đọc công khai (ảnh nằm trong thiệp), ghi chỉ qua service_role. Server luôn chuyển ảnh sang webp.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('uploads', 'uploads', true, 5242880, array['image/webp'])
on conflict (id) do nothing;
