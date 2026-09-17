# LifeBar

An open source, self-hosted personal health record. Log your own doctor
visits, medications, and vitals; hand a read-only summary to a doctor with a
link, or grant ongoing access to family or a family doctor. Self-reported,
no validation workflow — LifeBar trusts what you enter.

LifeBar is self-hosted: you run your own copy against your own Supabase
project. There is no central server holding your data but the one you
deploy yourself.

## Stack

- [Next.js](https://nextjs.org) (App Router)
- [Supabase](https://supabase.com) — Postgres, Auth (Google sign-in), Row
  Level Security for access control
- [Tailwind CSS](https://tailwindcss.com)

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Enable Google sign-in**: Authentication → Providers → Google. Follow
   Supabase's [Google OAuth guide](https://supabase.com/docs/guides/auth/social-login/auth-google)
   to create OAuth credentials, and add your Supabase project's callback URL
   as an authorized redirect URI in the Google Cloud console.
3. **Run the schema**: open the SQL Editor in your Supabase dashboard and run
   `supabase/migrations/0001_init.sql`. This creates every table, its Row
   Level Security policies, and the two functions the sharing features rely
   on (`has_shared_access`, `get_shared_summary`).
4. **Copy the environment file**:
   ```bash
   cp .env.example .env.local
   ```
   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   from Project Settings → API.
5. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) and sign in with
   Google.

For production, set the same environment variables on your host and add its
URL as an authorized redirect URI for the Google OAuth client.

## How data and sharing work

- Every table (`visits`, `medications`, `medication_logs`, `measurements`)
  is scoped by Row Level Security to `owner_id = auth.uid()` — Postgres
  enforces this at the database layer, not in application code.
- **Share links** (`share_links`) are unauthenticated, tokenized, read-only
  links, optionally expiring, that resolve through the `get_shared_summary`
  Postgres function. Good for handing to a doctor on the spot.
- **Access grants** (`share_grants`) give a specific Google account
  (matched by email) standing read access to your data via a `has_shared_access`
  check inside each table's Row Level Security policy. Good for family or a
  family doctor who should keep seeing updates. Revoke either at any time
  from `/dashboard/sharing`.

## License

[AGPL-3.0](./LICENSE). If you run a modified version of LifeBar as a network
service, you must make your modified source available to its users.
