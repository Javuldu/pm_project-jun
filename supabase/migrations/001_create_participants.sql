create table if not exists participants (
  id int primary key,
  name text not null,
  code text not null unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table participants enable row level security;

create policy "Anyone can read participants"
  on participants for select
  using (true);

create policy "Service role can manage participants"
  on participants for all
  using (true)
  with check (true);
