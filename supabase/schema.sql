-- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  avatar_url text,
  credits integer default 100,
  is_pro boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  name text default 'Untitled Project',
  canvas_data jsonb default '{}'::jsonb,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create generations table
create table public.generations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  project_id uuid references public.projects(id), -- Optional for now
  node_id text, -- ID of the node in tldraw
  prompt text,
  status text default 'PENDING', -- PENDING, COMPLETED, FAILED
  result_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.generations enable row level security;

-- RLS Policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can insert own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can view own generations" on public.generations
  for select using (auth.uid() = user_id);

-- Function to deduct credits safely
create or replace function deduct_user_credits(user_uuid uuid, amount_to_deduct int)
returns void as $$
declare
  current_credits int;
begin
  select credits into current_credits from public.profiles where id = user_uuid;
  
  if current_credits < amount_to_deduct then
    raise exception 'Insufficient credits';
  end if;
  
  update public.profiles
  set credits = credits - amount_to_deduct
  where id = user_uuid;
end;
$$ language plpgsql security definer;

-- Function to add credits (for payments)
create or replace function add_user_credits(user_uuid uuid, amount_to_add int)
returns void as $$
begin
  update public.profiles
  set credits = credits + amount_to_add
  where id = user_uuid;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
