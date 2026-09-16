alter table public.profiles
  add column brand_color text not null default '#FE6731'
  check (brand_color ~ '^#[0-9A-Fa-f]{6}$');
