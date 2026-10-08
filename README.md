# TriCo Reviews

A production-oriented MVP for public professor/course discovery and verified-student contributions across Haverford, Bryn Mawr, and Swarthmore. Built with Next.js App Router, TypeScript, Tailwind CSS, shadcn-style Radix primitives, Supabase Auth/PostgreSQL/RLS, Zod, React Hook Form, and Lucide.

The repository runs without credentials in an explicitly labeled demonstration mode. Demonstration names and content are fictional. With Supabase configured, all public discovery queries, reviews, Q&A, voting, course interest, notifications, dashboards, and moderation use PostgreSQL.

## Product surface

- Public homepage, live database search, college directories, professor profiles, course pages, student Q&A, community guidelines, and privacy explanation
- Email/password authentication restricted to configurable Tri-Co domains, with required email confirmation
- Professor-course-offering reviews with server validation, duplicate prevention, ownership-based editing/deletion, and calculated aggregate ratings
- A separate random alias for every review; public views omit emails, auth IDs, owner IDs, and private course-interest history
- Public review follow-ups, questions, answers, threaded replies, helpful votes, reporting, and pagination UI
- Private course interest with public aggregate counts
- Private student dashboard, notification preferences, review management, notifications, sign-out, and full account/content deletion
- Protected moderation queue with server-side role checks, hide/restore state, suspension-ready schema, and logged actions
- JSON catalog importer for verified public data; demo seed data never creates fictional reviews

## Local setup

Requirements: Node.js 20.9+ and npm. A Supabase project is required for authenticated and persistent features.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without `.env.local`, the public product remains browsable in demonstration mode and contribution actions explain that Supabase must be connected.

## Supabase setup

1. Create a Supabase project.
2. Install the Supabase CLI, authenticate it, and link this directory:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   supabase db push
   ```

3. Optional for local-only Supabase: run `supabase start`, then `supabase db reset` to apply the migration and demo catalog seed.
4. In Supabase Authentication, keep email confirmation enabled. Add the production callback URL (`https://YOUR_DOMAIN/auth/callback`) to Redirect URLs.
5. Copy the project URL and publishable key into `.env.local`. The service-role key is server-only and is used solely for account deletion and catalog administration. Never prefix it with `NEXT_PUBLIC_`.
6. Confirm the allowed domains in both [`lib/config.ts`](./lib/config.ts) and the `is_verified_student` / `handle_new_user` functions in the migration. The initial values are `haverford.edu`, `brynmawr.edu`, and `swarthmore.edu`; verify actual student aliases before launch.

The database migration creates normalized catalog, offering, review, Q&A, vote, interest, notification, report, moderation, role, and private-profile tables. It enables RLS on every private/UGC table, exposes only public-safe views, prevents duplicate votes/reviews, and performs privileged review creation through a verified-student RPC.

### First admin

Roles cannot be assigned by a browser client. After creating the administrator account, set the role from the Supabase SQL editor using the auth UUID:

```sql
update public.user_roles set role = 'admin' where user_id = 'AUTH_USER_UUID';
```

Keep this an operator-only procedure. Never add a public role-change endpoint.

## Import verified catalog data

Prepare JSON shaped like [`docs/catalog-import.example.json`](./docs/catalog-import.example.json), including `source_url` and `source_updated_at`, then run from a trusted operator environment:

```bash
set -a
source .env.local
set +a
npm run catalog:import -- ./path/to/catalog.json
```

The importer uses the service role and must never run in the browser. Confirm the relevant colleges' reuse terms and validate records before import.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Tests cover domain verification, validation/character limits, enrollment confirmation, duplicate constraints, private-vs-public access boundaries, absence of ownership identifiers in public views, alias separation, voting/reporting policies, moderation authorization, and role-escalation protection. A production launch should additionally run the migration in a staging Supabase project and execute authenticated end-to-end tests against that project.

## Deploy to Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket and import it into Vercel as a Next.js project.
2. Add all values from `.env.example` in Vercel Project Settings → Environment Variables. Use the production Supabase URL, publishable key, service-role key, site URL, and a strong random rate-limit secret.
3. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS domain.
4. Add the Vercel domain's `/auth/callback` URL to Supabase Auth Redirect URLs.
5. Run `supabase db push` against the production project before the first deployment.
6. Deploy, then test signup, email confirmation, sign-in, review creation, Q&A, report moderation, account deletion, and public API responses with an incognito browser.

## Security and privacy notes

- Public views intentionally omit `author_id`, `user_id`, email, roles, and profile data. Base UGC tables are not readable anonymously.
- RLS is defense in depth; server actions also verify the user and confirmed email.
- Per-review aliases are random and separate from account/profile identity. Reviewer replies to review-linked questions reuse that review alias.
- Rate limiting is persisted in PostgreSQL for review/question/answer creation. For larger traffic, add an edge/WAF rate limit in Vercel as a second layer.
- React renders text safely by default; the product does not accept HTML/Markdown in UGC.
- Account deletion deletes the Supabase auth user through a server-only admin client; foreign-key cascades remove owned reviews, questions, answers, votes, interests, notifications, reports, roles, and aliases.
- Anonymity is from other users, not from authorized platform administrators.

## Known limitations before a public launch

- Supabase credentials were not available in this workspace, so the SQL migration and live authenticated flows could not be executed against a real project here. The UI, TypeScript, unit/security assertions, and production build are verified locally.
- Reviewable professor-course-semester choices come from the database assignment view; the disconnected preview uses the single labeled demonstration offering.
- Email notification delivery is not implemented; the preference is stored for a future provider. In-app notifications are implemented.
- Moderation includes report triage and content visibility changes; the schema supports suspension, but a dedicated suspension control should be added after operator policy is finalized.
- Typo tolerance uses PostgreSQL `pg_trgm`; ranking is intentionally simple for the MVP.
- Legal terms, formal retention periods, institutional approval, and a production abuse-response policy require founder/legal review.
# tr-co-review
