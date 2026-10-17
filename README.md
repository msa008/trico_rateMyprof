# TriCo Reviews

TriCo Reviews is a public professor, course, and academic Q&A platform for Haverford, Bryn Mawr, and Swarthmore. It uses Next.js, TypeScript, Tailwind CSS, Supabase PostgreSQL, Zod, React Hook Form, and Lucide icons.

The current product intentionally has **no login or account system**. Anyone can browse or contribute anonymously. Contributions are not student-verified, and the interface says so clearly.

## What works

- College, department, professor, course, and historical offering directories
- Database-backed search across colleges, departments, courses, and professors
- Anonymous professor-course reviews with calculated aggregate ratings
- Public questions, threaded answers, helpful votes, reports, and course interest
- A fresh public alias for each review
- Reviewer alias reuse when the same browser answers a question attached to its review
- Server-side validation, database rate limits, duplicate prevention, and public-safe views
- Demonstration mode when Supabase environment variables are missing
- Responsive, accessible loading, empty, and error states

There are no login, signup, dashboard, notification, account settings, or authenticated admin pages. Moderation is handled by the deployment operator in Supabase.

## Local development

Requirements: Node.js 20.9 or later and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without valid Supabase values, the site runs with clearly labeled fictional demonstration catalog data. Submissions require Supabase.

Before committing changes, run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Supabase setup

1. Create a Supabase project.
2. Install and sign in to the Supabase CLI.
3. Link this folder to the project and apply all migrations in `supabase/migrations`.

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

4. Copy the project URL, publishable key, and service-role key into `.env.local`.
5. Generate a long random `RATE_LIMIT_SECRET` value.

The service-role key and rate-limit secret are server-only. Never add `NEXT_PUBLIC_` to either variable and never expose them in browser code. Supabase Authentication does not need to be enabled or configured.

## Anonymous contribution model

On the first contribution, the server sets a random HTTP-only, same-site browser cookie. The raw value is never stored in PostgreSQL. The server creates an HMAC hash and uses it to enforce duplicate reviews, duplicate votes, duplicate reports, course-interest uniqueness, and submission rate limits.

Public views exclude the contributor hash, former ownership fields, email addresses, and individual course-interest history. Review aliases are random and not derived from personal information.

This is anonymity from other visitors, not guaranteed anonymity from the deployment operator, infrastructure providers, technical logs, or lawful requests. Clearing cookies creates a new browser session, so this mechanism reduces casual abuse but is not strong identity verification.

## Catalog import

Use `data/catalog.example.json` as the format for verified public catalog information, then run:

```bash
npm run catalog:import -- /absolute/path/to/catalog.json
```

The importer requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. Verify catalog licensing and accuracy before importing. Demo names are fictional and demo seed data does not invent reviews.

## Moderation

Reports are stored in the `reports` table. Operators can review reports and change a post's `status` between `published`, `hidden`, and `removed` in the Supabase dashboard or SQL editor. Do not remove critical reviews merely because someone disagrees with them.

Because accounts do not exist, contributors cannot edit or delete their own posts from a dashboard. Publish a contact and retention policy before a real launch so people can request removal.

## Deploy to Vercel

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. Import it into Vercel as a Next.js project.
3. Add all variables from `.env.example` in Vercel Project Settings → Environment Variables.
4. Apply the Supabase migrations before accepting submissions.
5. Deploy and test browsing, search, review submission, Q&A, votes, reports, and course interest in an incognito browser.

No authentication callback URL is required.

## Known limitations

- Supabase credentials are not committed, so persistent submissions require external configuration.
- Anonymous browser sessions can be reset by clearing cookies and are not a substitute for user verification.
- There is no contributor edit/delete workflow, notification system, or web-based admin dashboard.
- Production moderation, retention, abuse monitoring, backups, and legal policies remain the deployment operator's responsibility.
- Run the migrations and end-to-end flows against a staging Supabase project before public launch.
