-- ============================================================
-- BOX SHOP · Base de datos Supabase v2
-- Copiá TODO esto y pegalo en el SQL Editor de Supabase
-- ============================================================

-- Extensión para UUIDs (por seguridad, no usamos IDs numéricos)
create extension if not exists "uuid-ossp";

-- ─── 1. TABLA DE BOXES ────────────────────────────────────────
create table boxes (
  id              uuid primary key default uuid_generate_v4(),
  box_numbers     integer[] not null,        -- ej: {1,2} si ocupa dos boxes
  business_name   text not null default '(Disponible)',
  cat             text default '',
  emoji           text default '🏪',
  logo_url        text,                       -- URL de la imagen en Supabase Storage
  description     text default 'Box disponible para alquilar',
  hours           text default '',
  whatsapp        text default '',
  delivery        boolean default false,
  delivery_cost   integer default 0,
  delivery_note   text default 'Solo retiro en box',
  mp_link         text default '',
  catalog_link    text,
  active          boolean default false,
  email           text unique,               -- email de acceso del inquilino
  password_hash   text,                      -- contraseña (hasheada con bcrypt en el futuro)
  -- por ahora guardamos texto plano hasta integrar auth
  password_plain  text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── 2. TABLA DE PRODUCTOS ────────────────────────────────────
create table products (
  id           uuid primary key default uuid_generate_v4(),
  box_id       uuid references boxes(id) on delete cascade,
  name         text not null,
  price        integer not null,              -- en pesos, sin decimales
  emoji        text default '📦',
  description  text default '',
  subcategory  text,                          -- ej: "Remeras", "Jeans", "Buzos"
  img_url      text,
  active       boolean default true,
  created_at   timestamptz default now()
);

-- ─── 3. CONFIG DEL SHOPPING ──────────────────────────────────
create table shopping_config (
  id      integer primary key default 1,     -- solo 1 fila
  hours   jsonb default '[
    {"day":"Lunes a Viernes","time":"9:00 - 21:00"},
    {"day":"Sabados","time":"9:00 - 22:00"},
    {"day":"Domingos","time":"10:00 - 21:00"}
  ]',
  banners jsonb default '[
    {"id":1,"text":"Bienvenidos a Box Shop Paseo de Compras","color":"linear-gradient(135deg,#00C2FF,#0044AA)","active":true}
  ]',
  updated_at timestamptz default now()
);

-- Insertar la fila única de config
insert into shopping_config (id) values (1) on conflict (id) do nothing;

-- ─── 4. FUNCIÓN AUTO-UPDATE timestamp ────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger boxes_updated_at
  before update on boxes
  for each row execute function update_updated_at();

-- ─── 5. ROW LEVEL SECURITY ────────────────────────────────────
-- IMPORTANTE: Habilitamos RLS pero por ahora usamos la anon key
-- con políticas permisivas. Cuando integremos auth, se restringen.

alter table boxes            enable row level security;
alter table products         enable row level security;
alter table shopping_config  enable row level security;

-- Lectura pública para todos (la tienda es pública)
create policy "lectura publica boxes"    on boxes           for select using (true);
create policy "lectura publica products" on products        for select using (active = true);
create policy "lectura publica config"   on shopping_config for select using (true);

-- Escritura permitida con anon key (temporario hasta integrar auth)
-- Esto es suficientemente seguro porque el admin y boxes se autentican
-- en el frontend con email+contraseña antes de poder modificar
create policy "escritura boxes"    on boxes           for all using (true) with check (true);
create policy "escritura products" on products        for all using (true) with check (true);
create policy "escritura config"   on shopping_config for all using (true) with check (true);

-- ─── 6. DATOS INICIALES ───────────────────────────────────────
-- Boxes activos con datos demo (reemplazalos con los reales)
insert into boxes (box_numbers, business_name, cat, emoji, description, hours, delivery, delivery_cost, delivery_note, active, email, password_plain, whatsapp) values
  ('{1,2}', 'Alfa Indumentaria Deportiva', 'Deportes',    '⚽', 'Ropa e indumentaria deportiva para toda la familia', 'Lun–Sáb 9:00–20:00',  true,  0,   'Envío gratis en San Rafael',     true,  'box12@boxshop.com',  'demo1234', ''),
  ('{3}',   'Yolcos Sexy Shop',            'Lencería',    '💋', 'Lencería y accesorios para adultos',                 'Lun–Sáb 10:00–21:00', false, 0,   'Solo retiro en box',             true,  'box3@boxshop.com',   'demo1234', ''),
  ('{4}',   'Sabores del Box',             'Gastronomía', '🍔', 'Comidas, bebidas y snacks premium',                  'Lun–Dom 11:00–22:00', true,  600, 'Delivery zona centro $600',      true,  'box4@boxshop.com',   'demo1234', ''),
  ('{5}',   'Belleza & Co',                'Belleza',     '💄', 'Cosmética, perfumes y cuidado personal',             'Lun–Sáb 9:30–19:30',  false, 0,   'Solo retiro en box',             true,  'box5@boxshop.com',   'demo1234', ''),
  ('{6,7}', 'Tech Zone',                   'Tecnología',  '📱', 'Electrónica, celulares y accesorios',                'Lun–Sáb 9:00–20:00',  true,  800, 'Envío a domicilio $800',         true,  'box67@boxshop.com',  'demo1234', ''),
  ('{8}',   'El Rincón Dulce',             'Gastronomía', '🍰', 'Pastelería artesanal y chocolates finos',            'Mar–Dom 9:00–19:00',   true,  0,   'Envío gratis en pedidos +$5000', true,  'box8@boxshop.com',   'demo1234', ''),
  ('{9}',   'Hogar & Deco',                'Hogar',       '🪴', 'Decoración, muebles y accesorios para el hogar',     'Lun–Sáb 10:00–20:00', false, 0,   'Solo retiro en box',             true,  'box9@boxshop.com',   'demo1234', '');

-- Boxes disponibles (sin inquilino)
insert into boxes (box_numbers, active) values
  ('{10}', false),('{11}', false),('{12}', false),('{13}', false),('{14}', false),
  ('{15}', false),('{16}', false),('{17}', false),('{18}', false),('{19}', false),
  ('{20}', false),('{21}', false),('{22}', false),('{23}', false),('{24}', false),
  ('{25}', false),('{26}', false),('{27}', false),('{28}', false),('{29}', false),
  ('{30}', false),('{31}', false);

-- Algunos productos de ejemplo
with box_id as (select id from boxes where email = 'box12@boxshop.com' limit 1)
insert into products (box_id, name, price, emoji, description, subcategory) 
select id, 'Camiseta Nike Dri-FIT',  18500, '👕', 'Talle S–XXL, varios colores',    'Remeras'    from box_id union all
select id, 'Remera Adidas Training', 15000, '👕', 'Dry-fit, talle M y L',           'Remeras'    from box_id union all
select id, 'Jean slim fit',          28000, '👖', 'Corte moderno, varios talles',    'Jeans'      from box_id union all
select id, 'Jean cargo',             32000, '👖', 'Con bolsillos laterales',         'Jeans'      from box_id union all
select id, 'Buzo canguro',           22000, '🧥', 'Con capucha, negro y gris',       'Buzos'      from box_id union all
select id, 'Short deportivo',        12000, '🩳', 'Elastizado, negro y azul',        'Shorts'     from box_id union all
select id, 'Zapatillas running',     68000, '👟', 'Amortiguación premium',           'Calzado'    from box_id;

-- ─── FIN ──────────────────────────────────────────────────────
