# CampusFlow

CampusFlow is a multi-tenant project management workspace for companies and professional teams, built with the Next.js App Router, TypeScript, Tailwind CSS, and Supabase.

## Supabase setup

1. Create a Supabase project.
2. Copy `.env.local.example` to `.env.local` only if `.env.local` does not already exist. Set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

   These are the only Supabase values used by browser code. Never put a database password, service-role key, or secret key in a `NEXT_PUBLIC_` variable.
3. Open Supabase Dashboard → **SQL Editor**, create a new query, paste the complete contents of `supabase/migrations/20261101170000_initial_workspace_backend.sql`, and run it once. Check the editor response for errors before continuing. The migration creates the schema, RLS policies, and private Storage bucket. For an existing installation, apply each unapplied migration in `supabase/migrations/` once and in filename order; do not rerun the initial migration after it succeeds.
4. Open **Table Editor** and verify `public.workspaces` exists. Then verify the Data API schema is available; if PostgREST reports `PGRST205`, use **Project Settings → API → Reload schema cache** (or run `NOTIFY pgrst, 'reload schema';` in SQL Editor), then retry the check. Do not run the initial migration a second time after it succeeds.
5. In Supabase Authentication settings:
   - Set the local development Site URL to `http://localhost:3000` while developing.
   - Add `http://localhost:3000/auth/callback` and `https://YOUR_PRODUCTION_DOMAIN/auth/callback` to the redirect URL allowlist.
   - Turn on email confirmation and configure production SMTP before launch. Password reset uses the same callback endpoint with `next=/reset-password`.
   - After you choose a production domain, change Site URL to `https://YOUR_PRODUCTION_DOMAIN`.
6. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000). Registration creates a profile and initial owner workspace when the Auth user is created. If a pending invitation matches the registration email, the invitee can instead accept it from the in-app invitation inbox. If email confirmation is enabled, verify the address before signing in.

## Vercel deployment

1. Apply and verify the Supabase migration first. Do not point a production deployment at a database that still returns `PGRST205` for `public.workspaces`.
2. Import this repository into Vercel and keep the project root at the repository root. Use the detected Next.js build command (`npm run build`) and output settings.
3. Add these environment variables in Vercel for **Production** (and separately for Preview if previews should use a non-production Supabase project):

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   ```

   Use values from the intended Supabase project. Do not add a service-role key, database password, or secret key to the frontend deployment.
4. Deploy a preview first. Verify login, signup/confirmation, password reset, session refresh, invitations, and workspace isolation against a test Supabase project.
5. Add the final Vercel domain to Supabase Auth's URL allowlist as `https://YOUR_PRODUCTION_DOMAIN/auth/callback`, set the Supabase Site URL to the production origin, and configure SMTP for production verification/reset messages.
6. Promote/deploy to production only after the preview build and backend checks pass. Confirm private Storage bucket visibility and RLS using separate test company accounts.

Deployment is not automatic from this repository. There is no Vercel CLI or verified production environment configured here.

## Database and security

- The SQL migration creates the workspace, membership, project, task, collaboration, calendar, notification, document, and private Storage schema.
- Workspace tables use PostgreSQL RLS. Document objects are stored in the private `workspace-documents` bucket.
- `supabase/tests/rls.test.sql` contains pgTAP tenant-isolation and role checks. It is not run by the frontend build.
- Run the database tests against a local Supabase/PostgreSQL test project with pgTAP after applying the migration; do not treat frontend checks as evidence that RLS tests passed.
- Invitation records are stored in the workspace, and verified invitees can review and accept them in the in-app invitation inbox. This implementation does not send invitation emails.
- Notification records are database-backed, but delivery is not real-time and no emails are sent.
- Existing browser demo records are not imported, read, overwritten, or deleted. Only UI preferences (such as theme and active-workspace selection) remain in localStorage.
- Authenticated users can read teammate names and avatars within shared workspaces; profile email addresses are not granted to client queries.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Project structure

- `src/app/` — App Router routes, root layout, and global styles.
- `src/components/` — Shared UI and workspace modules.
- `src/hooks/` — Reusable React hooks.
- `src/lib/` — Supabase clients, database types, and workspace data services.
- `supabase/migrations/` — Version-controlled database schema and policies.
- `supabase/tests/` — Database authorization tests.

## Included libraries

TypeScript, Tailwind CSS, Lucide React, Supabase JavaScript client, Supabase SSR, and Framer Motion.
