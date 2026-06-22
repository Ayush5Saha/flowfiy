# Performance — production latency fixes

## Root cause (measured 2026-06-22)

The live site felt slow (5–10s per click) **not** because of the database or the
frontend, but because of **geography**:

| Layer            | Location                         |
| ---------------- | -------------------------------- |
| Vercel functions | `iad1` (US East) — *the default* |
| Supabase DB      | `ap-south-1` (Mumbai, India)     |

Every dashboard page uses `export const dynamic = "force-dynamic"`, so each
navigation is an **uncached server render** that makes several **sequential**
round-trips (`auth.getUser()` → org membership → page queries). With functions in
the US and the DB in India, each round-trip costs ~250 ms across ~12,000 km, and a
cold serverless function compounds it. Warm DB queries themselves are ~8–10 ms — the
DB was never the problem.

## Fixes applied in code (this pass)

1. **`vercel.json` → `"regions": ["bom1"]`** — pins all serverless functions to
   Mumbai, co-located with Supabase. Turns ~250 ms cross-continent round-trips into
   ~5–20 ms. This is the single biggest win. **Takes effect on the next deploy.**
2. **`next.config.ts` → `experimental.optimizePackageImports`** — tree-shakes
   `lucide-react`, `framer-motion`, and the Radix packages so a single icon import
   doesn't ship the whole library. Smaller client JS → faster hydration.

## Manual steps required in the Vercel dashboard (cannot be done from code)

These touch production secrets / project settings, so apply them by hand:

### 1. Confirm the function region took effect
After the next deploy, Vercel → Project → **Settings → Functions → Region** should
read **Mumbai (bom1)**. (`vercel.json` sets it; just verify.)

### 2. Switch `DATABASE_URL` to the Supabase **transaction pooler**
Currently `DATABASE_URL` and `DIRECT_URL` are effectively **swapped** —
`DATABASE_URL` (used for every runtime query) points at the *direct* connection
(`db.<ref>.supabase.co:5432`). On serverless this opens a fresh, unpooled
connection per invocation and can exhaust the direct-connection limit under load.

In Vercel → Project → **Settings → Environment Variables**, set:

```
# Runtime queries — transaction pooler (pgBouncer), built for serverless
DATABASE_URL=postgresql://postgres.hnevbrnxwanuvqdydsyt:<DB_PASSWORD>@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

# Migrations only — direct connection
DIRECT_URL=postgresql://postgres.hnevbrnxwanuvqdydsyt:<DB_PASSWORD>@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
```

Copy the exact strings from Supabase → Project → **Settings → Database →
Connection string** ("Transaction" for `DATABASE_URL`, "Session"/"Direct" for
`DIRECT_URL`). Then **redeploy**.

## Deeper follow-ups (next pass — not yet done)

- **Reduce `force-dynamic`**: cache or statically render pages that don't need
  per-request data (marketing `/blog`, `/pricing` should be ISR/static for speed +
  SEO). 18 routes currently force dynamic.
- **Trim auth round-trips** in the dashboard hot path (layout + page each resolve
  user/membership; middleware already gates access).
- **Full responsive pass** across dashboard + marketing (audit at 360/768/1024 px).
