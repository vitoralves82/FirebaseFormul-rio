-- Habilite as extensões necessárias para geração de UUID e carimbo de data/hora
create extension if not exists "pgcrypto";

-- Função auxiliar para manter a coluna updated_at sincronizada
create or replace function public.set_current_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_name text not null,
  client_name text not null,
  status text not null check (status in ('draft', 'in-progress', 'completed')),
  notification_message text,
  notification_is_comprehensive boolean,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger set_timestamp_projects
before update on public.projects
for each row
execute procedure public.set_current_timestamp();

create table if not exists public.recipients (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position text not null,
  email text not null,
  questions jsonb not null default '[]'::jsonb,
  status text not null check (status in ('pending', 'sent', 'completed')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists recipients_project_id_idx on public.recipients(project_id);

create trigger set_timestamp_recipients
before update on public.recipients
for each row
execute procedure public.set_current_timestamp();

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  recipient_id uuid not null references public.recipients(id) on delete cascade,
  answers jsonb not null default '[]'::jsonb,
  submitted_at timestamptz not null default timezone('utc', now()),
  constraint submissions_recipient_unique unique (recipient_id)
);

create index if not exists submissions_project_id_idx on public.submissions(project_id);

create trigger set_timestamp_submissions
before update on public.submissions
for each row
execute procedure public.set_current_timestamp();
