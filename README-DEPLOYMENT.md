# MetroBook API — Vercel deployment

## Deploy
1. Extract this release into a fresh folder. Push the files at the root (including `server.js`, `package.json`, and `vercel.json`) to a Git repository. Do not commit `.env` or secrets.
2. Import the repository in Vercel. Use the Express framework preset, project root `./` (or the actual backend subfolder), default install/build settings, and Node.js 22.x or a supported newer LTS. Do not set a static output directory. Vercel imports the exported Express app.
3. In Project Settings > Environment Variables, configure the following for Production and Preview as needed (values in Vercel do not need wrapping quotes):

```
DB_HOST=aws-1-ap-south-1.pooler.supabase.com
DB_PORT=5432
DB_USER=postgres.uhmjqzhsijzeyoxwxyhp
DB_PASSWORD=<actual Supabase database password>
DB_NAME=postgres
DB_SSL=true
DB_SSL_CA=<Supabase database certificate PEM, if required>
JWT_SECRET=<existing strong JWT secret>
STRIPE_SECRET_KEY=<existing Stripe secret key>
SMTP_HOST=<mail server>
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<SMTP username>
SMTP_PASS=<SMTP password>
SMTP_FROM_EMAIL=<sender email>
SMTP_FROM_NAME=MetroBook
```

Download the database SSL certificate from Supabase and copy its PEM contents into `DB_SSL_CA` if needed. TLS verification remains enabled. For local use you may instead set `DB_SSL_CA_PATH` to an existing certificate file. Do not set `DB_SSL_CA_PATH` in Vercel unless that file is bundled. The connection pool defaults to two connections per instance. If using a transaction-mode pooler instead, copy its host, username and port directly from Supabase and verify compatibility with the application's queries.

4. Deploy/redeploy after setting environment variables. Keep Vercel deployment protection off for any API deployment that must be publicly accessible by the frontend; preserve API authentication on protected routes. Wildcard CORS supports Bearer authorization but not credentialed cross-origin cookies. Existing routes and legacy aliases are preserved.
5. Visit `https://YOUR-PROJECT.vercel.app/api/health` to check HTTP availability. Then visit `/api/health/db` or `/api/test` to check database authentication. A database failure returns HTTP 503, not the underlying error details. `/api/hello` also checks the database. Root `/` returns service status.

No migrations or data imports are executed automatically. The database dump must already have been restored in Supabase. Check imported tables and the SequelizeMeta migration history before running migrations.

## Local testing
Copy `.env.example` to `.env` and replace placeholders with actual local or cloud settings. Run:

```
npm ci
npm test
npm start
```

Tests mock database authentication and check CORS and health behavior. They do not verify a real Supabase connection. Local start checks the database before opening port 5000 (or PORT). The Vercel app does not open its own listener. Example PowerShell smoke check after deployment:

```
curl.exe -i https://YOUR-PROJECT.vercel.app/api/health
curl.exe -i https://YOUR-PROJECT.vercel.app/api/health/db
curl.exe -i -X OPTIONS https://YOUR-PROJECT.vercel.app/api/users/me -H "Origin: https://example.com" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization,content-type"
```

Expected: health HTTP 200, DB health HTTP 200 if connected, preflight HTTP 204 with Access-Control-Allow-Origin: *. Rotate any genuine credentials previously distributed in an environment example. CORS is not a substitute for authentication or authorization.
