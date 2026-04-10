import { createClient } from '@supabase/supabase-js'

// Required Supabase table setup (run once in SQL editor):
//
// create table sessions (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid references auth.users(id) not null,
//   created_at timestamptz default now(),
//   duration_seconds int not null,
//   category text default 'focus'
// );
//
// create table tiles (
//   id uuid default gen_random_uuid() primary key,
//   user_id uuid references auth.users(id) not null,
//   date date not null,
//   growth_level int default 0,
//   total_seconds int default 0,
//   unique (user_id, date)
// );
//
// alter table sessions enable row level security;
// alter table tiles enable row level security;
//
// create policy "own sessions" on sessions for all using (auth.uid() = user_id);
// create policy "own tiles"    on tiles    for all using (auth.uid() = user_id);

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
