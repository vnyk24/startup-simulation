create extension if not exists "pgcrypto";

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  cash numeric not null,
  engineers integer not null check (engineers >= 0),
  sales_staff integer not null check (sales_staff >= 0),
  quality numeric not null check (quality >= 0 and quality <= 100),
  competitors integer not null default 2,
  year integer not null check (year >= 1),
  quarter integer not null check (quarter >= 1 and quarter <= 4),
  is_over boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.quarterly_history (
  id bigserial primary key,
  game_id uuid not null references public.games(id) on delete cascade,
  year integer not null check (year >= 1),
  quarter integer not null check (quarter >= 1 and quarter <= 4),
  revenue numeric not null,
  net_income numeric not null,
  cash numeric not null,
  engineers integer not null check (engineers >= 0),
  sales_staff integer not null check (sales_staff >= 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_games_user_id on public.games(user_id);
create index if not exists idx_history_game_id on public.quarterly_history(game_id);
create index if not exists idx_history_game_year_quarter
  on public.quarterly_history(game_id, year desc, quarter desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_games_updated_at on public.games;
create trigger set_games_updated_at
before update on public.games
for each row
execute function public.set_updated_at();

alter table public.games enable row level security;
alter table public.quarterly_history enable row level security;

drop policy if exists "games_owner_select" on public.games;
create policy "games_owner_select"
  on public.games
  for select
  using (auth.uid() = user_id);

drop policy if exists "games_owner_insert" on public.games;
create policy "games_owner_insert"
  on public.games
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "games_owner_update" on public.games;
create policy "games_owner_update"
  on public.games
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "history_owner_select" on public.quarterly_history;
create policy "history_owner_select"
  on public.quarterly_history
  for select
  using (
    exists (
      select 1
      from public.games g
      where g.id = quarterly_history.game_id
        and g.user_id = auth.uid()
    )
  );

drop policy if exists "history_owner_insert" on public.quarterly_history;
create policy "history_owner_insert"
  on public.quarterly_history
  for insert
  with check (
    exists (
      select 1
      from public.games g
      where g.id = quarterly_history.game_id
        and g.user_id = auth.uid()
    )
  );

create or replace function public.advance_game_tx(
  p_game_id uuid,
  p_history_year integer,
  p_history_quarter integer,
  p_revenue numeric,
  p_net_income numeric,
  p_cash numeric,
  p_engineers integer,
  p_sales_staff integer,
  p_quality numeric,
  p_year integer,
  p_quarter integer,
  p_is_over boolean
)
returns public.games
language plpgsql
security invoker
as $$
declare
  updated_game public.games;
begin
  update public.games
  set
    cash = p_cash,
    engineers = p_engineers,
    sales_staff = p_sales_staff,
    quality = p_quality,
    year = p_year,
    quarter = p_quarter,
    is_over = p_is_over
  where id = p_game_id
    and user_id = auth.uid()
    and is_over = false
  returning * into updated_game;

  if updated_game is null then
    raise exception 'Game update failed or not allowed';
  end if;

  insert into public.quarterly_history (
    game_id, year, quarter, revenue, net_income, cash, engineers, sales_staff
  ) values (
    p_game_id,
    p_history_year,
    p_history_quarter,
    p_revenue,
    p_net_income,
    p_cash,
    p_engineers,
    p_sales_staff
  );

  return updated_game;
end;
$$;

grant execute on function public.advance_game_tx(
  uuid, integer, integer, numeric, numeric, numeric, integer, integer, numeric, integer, integer, boolean
) to authenticated;
