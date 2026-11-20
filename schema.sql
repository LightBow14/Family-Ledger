-- Run this once in Supabase: Project -> SQL Editor -> New query -> paste -> Run

create table if not exists users (
  id serial primary key,
  name text unique not null,
  password_hash text
);

create table if not exists categories (
  id serial primary key,
  name text unique not null
);

create table if not exists expenses (
  id serial primary key,
  user_id integer not null references users(id) on delete cascade,
  category_id integer not null references categories(id) on delete cascade,
  amount numeric(10, 2) not null,
  note text default '',
  expense_date date not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_expenses_date on expenses (expense_date);
create index if not exists idx_expenses_category on expenses (category_id);
create index if not exists idx_expenses_user on expenses (user_id);

insert into categories (name) values
  ('Groceries'),
  ('Dining Out'),
  ('Gas/Transportation'),
  ('Shopping'),
  ('Health'),
  ('Home Maintenance'),
  ('Other')
on conflict (name) do nothing;
