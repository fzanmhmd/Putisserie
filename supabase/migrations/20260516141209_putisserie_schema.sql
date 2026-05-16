create extension if not exists pgcrypto;
create extension if not exists citext;

do $$
begin
  create type public.product_category as enum (
    'cakes',
    'fresh_bakes',
    'macarons',
    'gift_boxes',
    'gluten_free'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum (
    'pending_payment',
    'paid',
    'processing',
    'baking',
    'ready',
    'completed',
    'cancelled',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum (
    'pending',
    'capture',
    'settlement',
    'deny',
    'cancel',
    'expire',
    'failure',
    'refund',
    'partial_refund',
    'authorize'
  );
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_invoice_number()
returns text
language plpgsql
as $$
begin
  return 'INV-PUT-' || to_char(now(), 'YYYYMM') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
end;
$$;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  phone text not null check (length(trim(phone)) > 0),
  email citext,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists customers_phone_unique
  on public.customers (phone);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category public.product_category not null default 'cakes',
  short_description text not null,
  description text not null,
  price integer not null check (price >= 0),
  compare_at_price integer check (compare_at_price is null or compare_at_price >= price),
  image_url text not null,
  badge text,
  prep_time text not null default 'Siap hari ini',
  stock integer not null default 0 check (stock >= 0),
  rating numeric(2, 1) not null default 4.8 check (rating >= 0 and rating <= 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_category_idx
  on public.products (is_active, category);

create index if not exists products_name_search_idx
  on public.products using gin (to_tsvector('simple', name || ' ' || short_description || ' ' || description));

create table if not exists public.product_tags (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now(),
  unique (product_id, tag)
);

create index if not exists product_tags_product_id_idx
  on public.product_tags (product_id);

create table if not exists public.delivery_fees (
  province text primary key,
  fee integer not null check (fee >= 0),
  estimated_days text not null default '1-3 hari',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique default public.generate_invoice_number(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_email citext,
  delivery_address text not null,
  province text not null,
  city text not null,
  district text not null,
  village text not null,
  delivery_date date not null,
  note text,
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null check (delivery_fee >= 0),
  service_fee integer not null default 4500 check (service_fee >= 0),
  total integer not null check (total >= 0),
  status public.order_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total = subtotal + delivery_fee + service_fee)
);

create index if not exists orders_created_at_idx
  on public.orders (created_at desc);

create index if not exists orders_status_idx
  on public.orders (status);

create index if not exists orders_customer_phone_idx
  on public.orders (customer_phone);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_slug text not null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price integer not null check (unit_price >= 0),
  line_total integer not null check (line_total >= 0),
  image_url text,
  created_at timestamptz not null default now(),
  check (line_total = quantity * unit_price)
);

create index if not exists order_items_order_id_idx
  on public.order_items (order_id);

create index if not exists order_items_product_id_idx
  on public.order_items (product_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  midtrans_order_id text not null unique,
  transaction_id text,
  payment_type text,
  transaction_status public.payment_status not null default 'pending',
  fraud_status text,
  gross_amount integer not null check (gross_amount >= 0),
  currency text not null default 'IDR',
  snap_token text,
  redirect_url text,
  raw_result jsonb not null default '{}'::jsonb,
  paid_at timestamptz,
  expired_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_transaction_status_idx
  on public.payments (transaction_status);

create index if not exists payments_transaction_id_idx
  on public.payments (transaction_id);

create table if not exists public.payment_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete set null,
  midtrans_order_id text not null,
  transaction_id text,
  transaction_status text,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

create index if not exists payment_notifications_order_id_idx
  on public.payment_notifications (order_id);

create index if not exists payment_notifications_midtrans_order_id_idx
  on public.payment_notifications (midtrans_order_id);

create table if not exists public.store_socials (
  id uuid primary key default gen_random_uuid(),
  platform text not null unique,
  label text not null,
  url text not null,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_socials_active_sort_idx
  on public.store_socials (is_active, sort_order);

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists set_delivery_fees_updated_at on public.delivery_fees;
create trigger set_delivery_fees_updated_at
  before update on public.delivery_fees
  for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

drop trigger if exists set_store_socials_updated_at on public.store_socials;
create trigger set_store_socials_updated_at
  before update on public.store_socials
  for each row execute function public.set_updated_at();

create or replace function public.sync_order_status_from_payment()
returns trigger
language plpgsql
as $$
begin
  update public.orders
  set status = case
    when new.transaction_status in ('capture', 'settlement') then 'paid'::public.order_status
    when new.transaction_status = 'pending' then 'pending_payment'::public.order_status
    when new.transaction_status = 'expire' then 'expired'::public.order_status
    when new.transaction_status in ('deny', 'cancel', 'failure') then 'cancelled'::public.order_status
    else status
  end
  where id = new.order_id;

  return new;
end;
$$;

drop trigger if exists sync_order_status_from_payment on public.payments;
create trigger sync_order_status_from_payment
  after insert or update of transaction_status on public.payments
  for each row execute function public.sync_order_status_from_payment();

alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.product_tags enable row level security;
alter table public.delivery_fees enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.payment_notifications enable row level security;
alter table public.store_socials enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read product tags" on public.product_tags;
create policy "Public can read product tags"
  on public.product_tags
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.products
      where products.id = product_tags.product_id
        and products.is_active = true
    )
  );

drop policy if exists "Public can read active delivery fees" on public.delivery_fees;
create policy "Public can read active delivery fees"
  on public.delivery_fees
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Public can read active socials" on public.store_socials;
create policy "Public can read active socials"
  on public.store_socials
  for select
  to anon, authenticated
  using (is_active = true);

insert into public.delivery_fees (province, fee, estimated_days)
values
  ('DKI Jakarta', 15000, 'Hari yang sama'),
  ('Banten', 22000, '1 hari'),
  ('Jawa Barat', 25000, '1 hari'),
  ('Lampung', 38000, '1-2 hari'),
  ('Jawa Tengah', 42000, '1-2 hari'),
  ('DI Yogyakarta', 42000, '1-2 hari'),
  ('Jawa Timur', 48000, '1-2 hari'),
  ('Bali', 55000, '2 hari'),
  ('Sumatera Selatan', 56000, '2 hari'),
  ('Bengkulu', 58000, '2 hari'),
  ('Bangka Belitung', 58000, '2 hari'),
  ('Riau', 62000, '2-3 hari'),
  ('Jambi', 62000, '2-3 hari'),
  ('Sumatera Barat', 65000, '2-3 hari'),
  ('Sumatera Utara', 68000, '2-3 hari'),
  ('Kepulauan Riau', 70000, '2-3 hari'),
  ('Aceh', 72000, '3 hari'),
  ('Kalimantan Barat', 72000, '2-3 hari'),
  ('Kalimantan Tengah', 76000, '2-3 hari'),
  ('Kalimantan Selatan', 76000, '2-3 hari'),
  ('Kalimantan Timur', 82000, '3 hari'),
  ('Kalimantan Utara', 86000, '3 hari'),
  ('Nusa Tenggara Barat', 74000, '3 hari'),
  ('Nusa Tenggara Timur', 86000, '3-4 hari'),
  ('Sulawesi Selatan', 78000, '3 hari'),
  ('Sulawesi Barat', 80000, '3 hari'),
  ('Sulawesi Tenggara', 84000, '3-4 hari'),
  ('Sulawesi Tengah', 86000, '3-4 hari'),
  ('Gorontalo', 88000, '3-4 hari'),
  ('Sulawesi Utara', 90000, '3-4 hari'),
  ('Maluku', 98000, '4 hari'),
  ('Maluku Utara', 102000, '4 hari'),
  ('Papua Barat Daya', 110000, '4-5 hari'),
  ('Papua Barat', 112000, '4-5 hari'),
  ('Papua', 115000, '4-5 hari'),
  ('Papua Tengah', 118000, '4-5 hari'),
  ('Papua Pegunungan', 120000, '4-5 hari'),
  ('Papua Selatan', 120000, '4-5 hari')
on conflict (province) do update
set fee = excluded.fee,
    estimated_days = excluded.estimated_days,
    is_active = true,
    updated_at = now();

insert into public.store_socials (platform, label, url, sort_order)
values
  ('instagram', '@putisserie.id', 'https://www.instagram.com/putisserie.id/', 1),
  ('tiktok', '@putisserie.id', 'https://www.tiktok.com/@putisserie.id', 2),
  ('shopee', 'Putisserie Official', 'https://shopee.co.id/putisserie', 3)
on conflict (platform) do update
set label = excluded.label,
    url = excluded.url,
    sort_order = excluded.sort_order,
    is_active = true,
    updated_at = now();

insert into public.products (
  slug,
  name,
  category,
  short_description,
  description,
  price,
  compare_at_price,
  image_url,
  badge,
  prep_time,
  stock,
  rating
)
values
  (
    'signature-strawberry-rose',
    'Signature Strawberry Rose Cake',
    'cakes',
    'Rose chiffon, wild strawberry, vanilla cream',
    'Layer cake lembut dengan rosewater chiffon, kompot stroberi, Madagascar vanilla cream, dan blush ganache.',
    250000,
    315000,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDo3EZd0kh6AVjwiLyGDVAwPU53BvgZr9t_jE58Z1wdmtZNcpbsWEqjR30T96ADy0cv2a7x4t35JyIrUQvPgMOLVpngFk-PLqAxEC5Fj4whiPy0jNrljwq6qwp5sTOBKzewCdHNVksJlKdgnU3hmrSBSUVejErgM11569pg-vvY0G3benhA6FMLzEFEUDDNcR3-H3M6anynWbOz9--fVNPrHoC7ZLgMJ1XAQAHlEQqGAEKkzbPbvFK3YBIIan_cNVbGrNOLMfVXtRc',
    'Chef''s Choice',
    '4 jam',
    8,
    4.9
  ),
  (
    'classic-butter-croissant',
    'Belgian Chocolate Ganache Cake',
    'cakes',
    'Dark chocolate sponge, ganache, cocoa nibs',
    'Cake cokelat premium dengan sponge lembap, ganache Belgian chocolate, dan taburan cocoa nibs renyah.',
    275000,
    null,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCL2qZog9ypVG9lYzaiycyqT954KOu1Huk0qUmxiPIe0r_53k2MRIH4FIsamuRC1a0SsTVdXFyAm4EU8k66cENiII6xAi16437Wq4XD-FkMqt3ZOvJ8kfL1fMxv8vKsFl-qbygs56Av06DsifkaL_pRMhZEiiHZpaQTEIbKayBQRxmzO2MzNObHgkm4qXkXU7ablONkbrKFt8tH_UgnelvNWmNkeRVx68K7v0aa_gYmn5aRLi2jT4KwkqmxG4PECeTHeaw9LNdfjI4',
    'New',
    'Siap hari ini',
    24,
    4.8
  ),
  (
    'pain-au-chocolat',
    'Vanilla Berry Chantilly Cake',
    'cakes',
    'Vanilla sponge, berry compote, chantilly cream',
    'Layer cake vanilla lembut dengan berry compote segar, chantilly cream ringan, dan dekorasi buah musiman.',
    260000,
    null,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAya1Me5NTj71J3zhg0ncpsAvY2_auwXAADjj19MAvV42P3KCXK6Zor37OQWIQ9F6j5wuV1eU08ZnekVoOkoqiA-x2V7ex2pD_7xjgai9OR90ErpfAA9COU1-OxXZ3I_ZReUXQkDerKUWin5rPAOQB5YrabhD9bmFF7DyF_4_LGAgRt9v1Q-7fW5rj0BSygpI5GOenu5iIJx5XRpofknnzjZqqDfl9_NgXjsLtcvygQdEYgpBkFeklOY1Xl0FDclyDnoi6WNaJIMZ4',
    null,
    'Siap hari ini',
    18,
    4.7
  ),
  (
    'raspberry-crown',
    'Raspberry Crown Cheesecake',
    'cakes',
    'Cream cheese, raspberry glaze, biscuit base',
    'Cheesecake creamy dengan raspberry glaze glossy, base biskuit butter, dan crown berry sebagai centerpiece.',
    285000,
    null,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDwLUaS9tyJnCnNXEBpDIp6TeVehLlDNADRzjAPYJJ9oCbreoLqFbzXtbjzXHXMOWR9opMQDvxcwIv0BSMck5l7WyGW1_vr4t5JaxtvksziVdoxvCzW7pYHAUmx-RSFsjB_rvN5X-uaBO-ID2X4yOE_rUH1j2RsxSYQ1xpGNwiPz2ABxqTrQW0ReRs-MWzIXiMU8FbcSXxr8l5h8p5GUkNo8OnMJB8BjO8X18MIdx8qQAy4jEySIVobkaBv56Pox50IaE56pwhpKx4',
    'Chef''s Choice',
    'Siap hari ini',
    15,
    4.9
  ),
  (
    'spinach-feta-roll',
    'Matcha Pistachio Layer Cake',
    'cakes',
    'Matcha sponge, pistachio cream, white ganache',
    'Cake matcha dengan pistachio cream, white chocolate ganache, dan rasa earthy yang elegan.',
    295000,
    null,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAt6n9OZZt7Uot8WBgBRv3baYj5yiO_YU1tRV7rY1nY7aaPxy89x8hSnmo4veEl2-NidMpdu9N1-OUWtA0oAyn6AF2UWh3STjuCTInAPOQ4GXEPg_MSxlDRy7sYO_acuI7Pvfl1jQxULlS6SJBRlmlew2VDhI8JBAEfYN8n1vtoZjH2Gu1v-q3HUgG1fuWb9UkyyM7YZT-NygsZbqI5TuSPztGHSQJO-XhdMqp64Q5OtAcHRvT6kKQh3NEoeGEMb1j7OXz3mw3WHYQ',
    null,
    'Siap hari ini',
    14,
    4.6
  ),
  (
    'almond-frangipane',
    'Almond Frangipane Cake',
    'cakes',
    'Almond sponge, frangipane cream, apricot glaze',
    'Cake almond dengan frangipane lembut, almond panggang, dan apricot glaze yang memberi kilau hangat.',
    245000,
    null,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuD7xxyLnFryjV3Vh-wz3epSJ7Fk-t3SjE3mv-FR6FQSHPiom0Ub-55-hmOqg7QRNBO0hsYWFWtfENcSCFkXe1EdOAffacze2wjo5qLl8m8jEqNudUpJf_dwtuCXdVGtTd9D11dVvhE02qEIzJz7XbXuHy2VKJXMFhIlAcCvTwdsPjh-rN9TXwsY-L18Pipi2zZ6yAyXX-uMTYGhromGkRwP9mDM5Zs0OaCLl5ySETlJaovULgiqDSpMWsp69tSnyg11leBjCXTqKeI',
    null,
    '2 jam',
    10,
    4.8
  ),
  (
    'gluten-free-morning-bun',
    'Gluten-Free Cinnamon Apple Cake',
    'gluten_free',
    'Apple compote, cinnamon sponge, pecan crumble',
    'Cake bebas gluten dengan apple compote, cinnamon sponge, pecan crumble, dan tekstur moist.',
    255000,
    null,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCpqKCIwGqLTkMIiLnBwPhRMaSxaf7AqlcQPhZBPqTllHutYHYCRZ4I8TYSI6nq2GVnnKGaK_fvixA5BfflppgoGSbpvHrIuDY4xP6Zx32DETB3l0Z4dg_gSRNFrlCqC6vvV-vF8-fT4eKjzZr8jG7kh7_PeK5L7USZpY5582pxybKzXH7do81yCr8KiFgR8EoACeothtAYGQLc4hMX0rTXriB0W7ZBZLX0Vdekr2TzPYgpjuQrsBKKp9gAUOzz3SBTmXWYLE3F6xA',
    'GF',
    'Siap hari ini',
    9,
    4.7
  ),
  (
    'parisian-macaron-box',
    'Parisian Macaron Cake',
    'macarons',
    'Macaron shell, vanilla mousse, seasonal berries',
    'Cake bergaya macaron besar dengan vanilla mousse, seasonal berries, dan shell almond yang ringan.',
    235000,
    null,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAAy1qF4xghSa0do4raX8v1UdHDthjLj_v3UFyUHNr2N-y5C8Ulb-Cz5GLr4d6KFDiH9MtUL70zX2QTC-W8Vqe3M1uElz2zq5XIPF-ep1wifQbA0LonVZssMLZ-p-FiR-RG_07GvDV5PmyK5Eop60gOZOPujjq3Zi6czXaxLBj5pmU6KmCr5JV66SDi6TQa_QJ8MBDlEmsgr3cMc0iCAHoQjz73olrYhKcozcJLiLmbzGO-3_trL0dFaLYFWYaLNb501Amve-o-lWU',
    'Best Seller',
    '1 jam',
    12,
    4.9
  ),
  (
    'sweet-gift-box',
    'Sweet Celebration Gift Cake',
    'gift_boxes',
    'Mini cake set, greeting card, ribbon box',
    'Gift cake set berisi mini cake premium, kartu ucapan, pita blush, dan packaging rapi untuk hadiah.',
    250000,
    null,
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDmlZMgq5n4nBWZzDA_TKHbNjMlPeOL5Bxx6D4HoaAvfXDVP7lTOxu3VNNUYRA6oCNE8z1WChv8NyCBkdgiwuQxLd2dYQ4O8PgWnqga73tglKMY5RiGewBR3wvdxwkP2ooKq3Kf4xrZmJsyv_T8lU0GS9V9cwlJaKJ1lfsS5KdcOPgsekvBSInR8CzoyvXRPmGijjse3U7GJ6GGwdBCnKuRvfHObFYeUe-8lifcnP8NDgU6-mMm4NBYfig-vALM2PZZnP4cX_KpHe4',
    'Gift',
    '1 hari',
    7,
    4.8
  )
on conflict (slug) do update
set name = excluded.name,
    category = excluded.category,
    short_description = excluded.short_description,
    description = excluded.description,
    price = excluded.price,
    compare_at_price = excluded.compare_at_price,
    image_url = excluded.image_url,
    badge = excluded.badge,
    prep_time = excluded.prep_time,
    stock = excluded.stock,
    rating = excluded.rating,
    is_active = true,
    updated_at = now();

insert into public.product_tags (product_id, tag)
select products.id, tags.tag
from public.products
join (
  values
    ('signature-strawberry-rose', 'Limited Edition'),
    ('signature-strawberry-rose', 'Celebration'),
    ('signature-strawberry-rose', 'Best Seller'),
    ('classic-butter-croissant', 'Chocolate'),
    ('classic-butter-croissant', 'Birthday'),
    ('classic-butter-croissant', 'Best Seller'),
    ('pain-au-chocolat', 'Berry'),
    ('pain-au-chocolat', 'Celebration'),
    ('pain-au-chocolat', 'Soft Cream'),
    ('raspberry-crown', 'Cheesecake'),
    ('raspberry-crown', 'Berry'),
    ('raspberry-crown', 'Chef''s Choice'),
    ('spinach-feta-roll', 'Matcha'),
    ('spinach-feta-roll', 'Pistachio'),
    ('spinach-feta-roll', 'Premium'),
    ('almond-frangipane', 'Nutty'),
    ('almond-frangipane', 'Tea Time'),
    ('gluten-free-morning-bun', 'Gluten-Free'),
    ('gluten-free-morning-bun', 'Apple'),
    ('gluten-free-morning-bun', 'Cinnamon'),
    ('parisian-macaron-box', 'Macaron'),
    ('parisian-macaron-box', 'Giftable'),
    ('parisian-macaron-box', 'Elegant'),
    ('sweet-gift-box', 'Hampers'),
    ('sweet-gift-box', 'Greeting Card')
) as tags(slug, tag)
  on products.slug = tags.slug
on conflict (product_id, tag) do nothing;
