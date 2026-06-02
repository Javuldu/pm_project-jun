create table if not exists match_data (
  id text primary key,
  team_a_id text not null,
  team_b_id text not null,
  date text not null,
  stage text not null default 'Grupos',
  is_finished boolean default false,
  real_score_a int,
  real_score_b int,
  is_locked boolean default false
);

create table if not exists prediction_data (
  id bigint generated always as identity primary key,
  user_id text not null,
  match_id text not null references match_data(id),
  score_a int,
  score_b int,
  unique (user_id, match_id)
);

create table if not exists champion_data (
  user_id text primary key,
  champion_team_id text not null
);

create table if not exists app_config (
  key text primary key,
  value text not null
);

insert into match_data (id, team_a_id, team_b_id, date, stage)
values
  ('m1', 'mx', 'cr', '2026-06-11T14:00', 'Grupos'),
  ('m2', 'us', 'au', '2026-06-11T18:00', 'Grupos'),
  ('m3', 'ca', 'jp', '2026-06-12T11:00', 'Grupos'),
  ('m4', 'ec', 'sn', '2026-06-12T16:00', 'Grupos'),
  ('m5', 'br', 'fr', '2026-06-13T10:00', 'Grupos'),
  ('m6', 'ar', 'co', '2026-06-13T13:00', 'Grupos'),
  ('m7', 'es', 'en', '2026-06-13T16:00', 'Grupos'),
  ('m8', 'de', 'it', '2026-06-13T19:00', 'Grupos')
on conflict (id) do nothing;

alter table match_data enable row level security;
alter table prediction_data enable row level security;
alter table champion_data enable row level security;
alter table app_config enable row level security;

create policy "Public read match_data" on match_data for select using (true);
create policy "Service role write match_data" on match_data for all using (true) with check (true);

create policy "Public read prediction_data" on prediction_data for select using (true);
create policy "Service role write prediction_data" on prediction_data for all using (true) with check (true);

create policy "Public read champion_data" on champion_data for select using (true);
create policy "Service role write champion_data" on champion_data for all using (true) with check (true);

create policy "Public read app_config" on app_config for select using (true);
create policy "Service role write app_config" on app_config for all using (true) with check (true);
