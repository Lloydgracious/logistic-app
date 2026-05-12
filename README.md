# GarageFlow

GarageFlow is a Next.js logistics and inventory dashboard backed by Supabase Auth and Postgres.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor and run [supabase/schema.sql](supabase/schema.sql).
3. Copy [.env.example](.env.example) to `.env.local`.
4. Fill in your project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

You can also use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for older projects, but a publishable key is preferred for new Supabase apps.
The service-role key is required for the admin page to create and delete Supabase Auth users. Keep it server-side only; never expose it with a `NEXT_PUBLIC_` prefix.

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If Supabase env vars are missing, the app keeps using its built-in demo data. Once Supabase is configured and you sign in, the Zustand store hydrates from Supabase and syncs changes back to the database.

## Build

```bash
npm run build
```
