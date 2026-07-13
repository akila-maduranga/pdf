# Vault — view-only PDF & image site

Next.js 14 app. PDFs render page-by-page to a `<canvas>` (not the browser's
native PDF viewer, which has its own download button). Images and PDFs are
streamed through server routes from **private** Supabase Storage buckets —
the browser never gets a direct, cacheable link to the original file.

**Read this once:** nothing served over the web can be made truly
undownloadable — a screenshot always works, and anyone using browser dev
tools can inspect network responses. What's implemented here removes every
one-click path (no download button, no native viewer, no direct file URL,
right-click/print/Ctrl+S blocked, no-cache headers). Treat it as a strong
deterrent, not a DRM guarantee.

## 1. Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL editor** → paste and run `supabase/schema.sql` from this repo.
3. **Storage** → create two buckets, both set to **Private**:
   - `pdf-files`
   - `images`
   (Names must match `SUPABASE_PDF_BUCKET` / `SUPABASE_IMAGE_BUCKET` below if you rename them.)
4. **Project Settings → API** → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY` (not actually used for
     any database access in this app, since everything goes through the
     service key on the server, but Supabase's client requires one)
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY` — **never expose
     this in client code**, it's used only in server routes.

## 2. Environment variables

Copy `.env.example` to `.env.local` and fill it in:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_PDF_BUCKET=pdf-files
SUPABASE_IMAGE_BUCKET=images
ADMIN_PASSWORD=pick-a-real-password
ADMIN_SESSION_SECRET=any-long-random-string
```

Generate a random secret quickly with: `openssl rand -hex 32`

## 3. Run locally

```
npm install
npm run dev
```

Visit `http://localhost:3000` for the public site, `/admin/login` to sign in
as admin.

## 4. Deploy to Netlify

1. Push this project to a GitHub repo.
2. In Netlify: **Add new site → Import an existing project**, pick the repo.
   `netlify.toml` already sets the build command and the
   `@netlify/plugin-nextjs` plugin, so build settings are auto-detected.
3. **Site settings → Environment variables** → add all the variables from
   step 2 (same names).
4. Deploy. Netlify's Next.js plugin runs the app's API routes as serverless
   functions automatically — no extra config needed.

## How it's organized

- `/` `/files` `/images` — public browsing, no login required.
- `/view/[shareId]` — the actual view-only viewer + reactions. This is also
  the shareable link (copy it from the admin panel).
- `/admin/login` — single-password admin login.
- `/admin` — dashboard: total documents/images, total views, link clicks,
  reactions, most-viewed list.
- `/admin/files`, `/admin/images` — upload new files (with optional
  thumbnail), copy share links, view per-item stats, delete.

### Views vs. link clicks

Every open of `/view/[shareId]` is logged. If the visitor arrived from your
own `/files` or `/images` gallery, it's counted as a **gallery view**. If
they arrived any other way (a bookmarked or shared link, opened directly),
it's counted as a **link click**. The dashboard shows both, plus the total.

## Extending it

- Swap the emoji set in `components/ReactionBar.tsx`.
- PDF render quality/zoom defaults live in `components/PdfViewer.tsx`.
- To add real user accounts instead of anonymous device IDs, swap
  `lib/deviceId.ts` for your auth of choice — the `reactions`/`events` tables
  already key on an arbitrary `device_id` string.
