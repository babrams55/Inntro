
create table if not exists public.verification_codes (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone default timezone('utc'::text, now() + interval '15 minutes') not null,
  used boolean default false
);

-- Add index for faster lookups
create index if not exists verification_codes_email_idx on public.verification_codes(email);

-- Add RLS policies
alter table public.verification_codes enable row level security;

-- Allow anyone to insert verification codes (needed for signup)
create policy "Anyone can insert verification codes"
  on public.verification_codes
  for insert
  to anon
  with check (true);

-- Allow anyone to update their own verification code
create policy "Anyone can update their own verification code"
  on public.verification_codes
  for update
  to anon
  using (email = current_user);
