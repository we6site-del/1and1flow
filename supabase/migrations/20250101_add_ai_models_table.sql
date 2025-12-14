-- Migration: Add ai_models table for server-driven UI
-- This table stores model configurations and parameter schemas
-- that drive the dynamic rendering of generator nodes

-- Create ai_models table
create table if not exists public.ai_models (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null check (type in ('IMAGE', 'VIDEO')),
  provider text not null check (provider in ('REPLICATE', 'FAL', 'CUSTOM')),
  api_path text not null, -- e.g., "kling-ai/kling-video-v2" for Replicate
  cost_per_gen integer not null default 0,
  is_active boolean default true,
  parameters_schema jsonb default '[]'::jsonb, -- JSON Schema for UI rendering
  description text,
  icon_url text, -- Optional icon for UI
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for faster queries
create index if not exists ai_models_type_idx on public.ai_models(type);
create index if not exists ai_models_is_active_idx on public.ai_models(is_active);
create index if not exists ai_models_provider_idx on public.ai_models(provider);

-- Enable RLS
alter table public.ai_models enable row level security;

-- RLS Policies: Everyone can read active models, only service role can write
create policy "Anyone can view active models" on public.ai_models
  for select using (is_active = true);

create policy "Service role can manage models" on public.ai_models
  for all using (auth.jwt() ->> 'role' = 'service_role');

-- Add trigger to update updated_at
create or replace function update_ai_models_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_ai_models_updated_at
  before update on public.ai_models
  for each row
  execute function update_ai_models_updated_at();

-- Insert some default models (examples)
insert into public.ai_models (name, type, provider, api_path, cost_per_gen, parameters_schema, description) values
  (
    'Nano Banana Pro',
    'IMAGE',
    'FAL',
    'fal-ai/flux-pro',
    22,
    '[
      {
        "key": "aspect_ratio",
        "label": "Aspect Ratio",
        "type": "grid_select",
        "options": [
          {"label": "21:9", "value": "21:9", "desc": "1568×672"},
          {"label": "16:9", "value": "16:9", "desc": "1456×816"},
          {"label": "4:3", "value": "4:3", "desc": "1232×928"},
          {"label": "3:2", "value": "3:2", "desc": "1344×896"},
          {"label": "1:1", "value": "1:1", "desc": "1024×1024"},
          {"label": "9:16", "value": "9:16", "desc": "816×1456"},
          {"label": "3:4", "value": "3:4", "desc": "928×1232"},
          {"label": "2:3", "value": "2:3", "desc": "896×1344"},
          {"label": "5:4", "value": "5:4", "desc": "1280×1024"},
          {"label": "4:5", "value": "4:5", "desc": "1024×1280"}
        ],
        "default": "3:4"
      }
    ]'::jsonb,
    'High-quality image generation model'
  ),
  (
    'Kling 2.1 Master',
    'VIDEO',
    'REPLICATE',
    'kling-ai/kling-video-v2',
    160,
    '[
      {
        "key": "duration",
        "label": "Duration",
        "type": "select",
        "options": [
          {"label": "4s", "value": "4s"},
          {"label": "5s", "value": "5s"},
          {"label": "6s", "value": "6s"},
          {"label": "8s", "value": "8s"}
        ],
        "default": "5s"
      },
      {
        "key": "aspect_ratio",
        "label": "Aspect Ratio",
        "type": "select",
        "options": [
          {"label": "16:9", "value": "16:9", "desc": "1080p"},
          {"label": "9:16", "value": "9:16", "desc": "1080p"}
        ],
        "default": "16:9"
      }
    ]'::jsonb,
    'Professional video generation model'
  ),
  (
    'Veo 3.1 Fast',
    'VIDEO',
    'REPLICATE',
    'google/veo-3.1-fast',
    192,
    '[
      {
        "key": "duration",
        "label": "Duration",
        "type": "select",
        "options": [
          {"label": "4s", "value": "4s"},
          {"label": "6s", "value": "6s"},
          {"label": "8s", "value": "8s"}
        ],
        "default": "8s"
      },
      {
        "key": "aspect_ratio",
        "label": "Aspect Ratio",
        "type": "select",
        "options": [
          {"label": "16:9", "value": "16:9", "desc": "1080p"},
          {"label": "9:16", "value": "9:16", "desc": "1080p"}
        ],
        "default": "16:9"
      }
    ]'::jsonb,
    'Fast video generation model'
  )
on conflict do nothing;


