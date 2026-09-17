# Contributing to LifeBar

LifeBar is a self-hosted, open source personal health record. Contributions
are welcome — bug fixes, new measurement types, accessibility fixes,
self-hosting docs, and so on.

## Setup

See [README.md](./README.md) for creating a Supabase project, running the
schema, and starting the dev server.

## Ground rules

- **Self-reported data is trusted.** LifeBar deliberately has no validation
  workflow for what a person logs about their own health. Don't add gating
  that second-guesses the user's own entries.
- **Every health table is owner-scoped by Row Level Security.** If you add a
  table that stores a person's data, it needs RLS policies before it ships
  — see `supabase/migrations/0001_init.sql` for the pattern (owner-only
  read, or owner-or-`has_shared_access`, on select; owner-only on write).
- **Sharing is read-only.** Share links and access grants let someone view
  a person's record, never edit it. If a feature needs a shared viewer to
  write something, that's a deliberate scope change — raise it as an issue
  first.
- **No landing page, no marketing copy.** The app is the product; keep
  `app/` focused on the tool itself.

## Pull requests

Keep PRs focused on one change. Note any schema change in the PR
description, and add a new numbered file under `supabase/migrations/` rather
than editing an existing one.
