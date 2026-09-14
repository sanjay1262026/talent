# TalentOS — Resume Intelligence

TalentOS is a full-stack resume screening and hiring decision-support application built with Next.js, PostgreSQL, and Drizzle ORM. It parses resume documents, extracts qualifications, computes transparent multi-factor scores, ranks candidates, compares finalists, displays recruiting analytics, and exports committee-ready reports.

## Technology

- Next.js 16 App Router and React 19
- TypeScript
- PostgreSQL
- Drizzle ORM and Drizzle Kit
- JWT authentication in HTTP-only cookies
- PDF, DOCX, and TXT parsing, with automatic OCR fallback for scanned PDFs
- TF-IDF vectorization and cosine similarity
- Boundary-aware skill matching and synonym resolution
- Recharts visualizations
- Tailwind CSS 4

## Prerequisites

Install these before continuing:

1. Node.js 22.13 or newer: https://nodejs.org/
2. npm (included with Node.js)
3. Docker Desktop: https://www.docker.com/products/docker-desktop/

Docker is the easiest way to run PostgreSQL. You can use an existing PostgreSQL 14+ server instead.

## Local setup with Docker

### 1. Extract the archive

Extract `talentos-source.zip`, then open a terminal in the extracted `talentos` directory.

### 2. Install dependencies

```bash
npm install
```

### 3. Create the environment file

macOS or Linux:

```bash
cp .env.example .env
```

Windows Command Prompt:

```bat
copy .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

The default `.env.example` values work with the included Docker Compose database. Before deploying publicly, replace `JWT_SECRET` with a long random value.

Generate a secure secret on macOS or Linux:

```bash
openssl rand -base64 32
```

### 4. Start PostgreSQL

Make sure Docker Desktop is running, then execute:

```bash
docker compose up -d database
```

Confirm that the database is healthy:

```bash
docker compose ps
```

The `database` service should eventually show `healthy`.

### 5. Create the database tables

```bash
npx drizzle-kit push
```

Approve the changes if Drizzle asks for confirmation.

### 6. Start the application

```bash
npm run dev
```

Open this address in your browser:

```text
http://localhost:3000
```

### 7. Sign in

You can create your own recruiter account or select **Explore with demonstration data** on the login screen. Accounts and screening sessions are stored in PostgreSQL, so signing into the same account on another device restores saved screening history.

## Password recovery (forgot password)

TalentOS includes a complete password-reset flow:

1. On the login screen, select **Forgot password?**
2. Enter the account email address.
3. Open the reset link (valid for 60 minutes, single use) and choose a new password.
4. Sign in with the new password. All old reset links are automatically invalidated.

### How reset links are delivered

**Without SMTP (development):** reset links are printed to the server console. When running `npm run dev`, the page also displays the link in a clearly marked "Development mode" panel so you can test the flow end-to-end without a mail server.

**With SMTP (production):** configure these variables in `.env` (or your hosting platform's environment settings) so real users receive branded reset emails:

```env
APP_URL=https://your-domain.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM="TalentOS <you@gmail.com>"
```

Notes:

- For Gmail, create an **App Password** (requires 2-Step Verification enabled) at https://myaccount.google.com/apppasswords — never use your normal Gmail password.
- Any SMTP provider works (Mailgun, SendGrid SG, Amazon SES, Outlook, Resend SMTP, etc.).
- `APP_URL` must be your public site URL in production so emailed links point to the deployed application.
- For security, reset links are never returned to the browser in production, and the API responds identically whether or not the email address is registered.

### Reset token security model

- Tokens are 32 random bytes (256-bit), stored only as SHA-256 hashes in the `password_reset_tokens` table.
- Each token expires after 60 minutes and becomes invalid immediately after use.
- Requesting a new link invalidates every previous link for that account.

## Using an existing PostgreSQL server

If you do not want Docker, create an empty PostgreSQL database and update `.env`:

```env
DATABASE_URL=postgresql://USERNAME:PASSWORD@HOST:5432/DATABASE_NAME
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
```

Then run:

```bash
npx drizzle-kit push
npm run dev
```

For hosted PostgreSQL providers, the connection URL may require `?sslmode=require`.

## Production mode on your computer or server

After configuring `.env` and applying the database schema:

```bash
npm install
npx drizzle-kit push
npm run build
npm run start
```

The production server listens on port 3000 by default. To select another port:

macOS or Linux:

```bash
PORT=8080 npm run start
```

Windows PowerShell:

```powershell
$env:PORT=8080; npm run start
```

## Deploying to Vercel

### 1. Create a hosted PostgreSQL database

Use Neon, Supabase, Railway, Render, or another PostgreSQL provider. Copy its PostgreSQL connection URL.

### 2. Push the project to GitHub

Create a new GitHub repository and push the extracted source files. Do not commit `.env`.

### 3. Import the repository in Vercel

1. Go to https://vercel.com/new
2. Import the GitHub repository.
3. Vercel should detect Next.js automatically.
4. Keep the default build command: `npm run build`.

### 4. Add environment variables in Vercel

Add these under **Project Settings → Environment Variables**:

- `DATABASE_URL`: your hosted PostgreSQL connection URL
- `JWT_SECRET`: a long random secret

Add both variables to Production, Preview, and Development if needed.

### 5. Apply the production database schema

On your computer, temporarily place the hosted database URL in `.env`, then run:

```bash
npx drizzle-kit push
```

Restore your local URL afterward if you still use the local Docker database.

### 6. Deploy

Select **Deploy** in Vercel. After deployment, open the assigned URL, register an account, and run a sample screening.

#### OCR deployment caveats

PDFs with a text layer continue to use `pdf-parse` and do not start OCR. Image-only PDFs are rendered page-by-page with `pdf-to-img` and recognized with `tesseract.js`. The English LSTM language data is bundled at `public/tesseract/eng.traineddata`, so OCR does not depend on a jsDelivr download or a writable function cache.

- The `/api/screen` route uses the Node.js runtime and allows up to 60 seconds. OCR is CPU- and memory-intensive; a large or multi-page scan, or a batch containing many scans, can exceed a host's function timeout even though the 10 MB-per-file and 50-file limits remain enforced. The API reports the affected file instead of silently accepting it.
- Vercel Node.js functions have a deployment bundle-size limit (250 MB compressed for standard functions). `tesseract.js` and its WASM core consume a meaningful part of that budget; check the generated function size during deployment.
- Vercel Hobby limits function duration to 10 seconds, so scanned-PDF OCR is not dependable there. Use a plan with a longer Node.js function duration, reduce scan size/page count, or run OCR in a dedicated worker/service for production-scale batches.
- OCR still requires a Node.js function with enough CPU and memory to render and recognize every page. The bundled language data fixes the common cold-start/network failure, but does not make multi-page OCR reliable within Hobby's 10-second function limit.

## Deploying with Railway or Render

1. Create a PostgreSQL service.
2. Create a Node.js web service from this repository.
3. Set `DATABASE_URL` and `JWT_SECRET`.
4. Use `npm run build` as the build command.
5. Use `npm run start` as the start command.
6. Apply the schema once with `npx drizzle-kit push` using the production `DATABASE_URL`.

## Resume upload limits

- Supported file extensions: PDF, DOCX, and TXT. Legacy `.doc` files must be saved as PDF or DOCX first.
- Maximum size per file: 10 MB
- Maximum resumes per screening run: 50
- Scanned image-only PDFs are automatically OCR'd when no readable PDF text layer is found
- Password-protected or corrupted documents are rejected with an error

## Main workflow

1. Open **New screening**.
2. Add a role title and job description, or select a role template.
3. Upload resumes or enable the demonstration dataset.
4. Select **Run screening**.
5. Review the candidate leaderboard.
6. Adjust scoring weights in the sidebar to recalculate rankings immediately.
7. Inspect profiles, compare two finalists, review analytics, and export reports.

## Scoring model

The composite score uses four independent dimensions:

```text
Fit = (Skill × Wₛ) + (Semantic × Wᵥ) + (Experience × Wₑ) + (Education × Wₑd)
```

Default weights:

- Skill alignment: 40%
- Semantic TF-IDF relevance: 35%
- Experience match: 15%
- Education match: 10%

Status thresholds:

- Top match: 75–100%
- Potential fit: 60–74%
- Low match: below 60%

The application is a recruiter decision-support tool. Scores should be reviewed by a qualified human and must not be used as the sole basis for an employment decision.

## Useful commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Production server
npm run start

# TypeScript validation
npm run typecheck

# ESLint
npm run lint

# Apply current Drizzle schema
npx drizzle-kit push

# Open Drizzle Studio
npx drizzle-kit studio

# Stop the local database
docker compose down

# Stop and delete local database data
docker compose down -v
```

## Common issues

### `DATABASE_URL is required`

Create `.env` from `.env.example` and restart the application.

### `ECONNREFUSED 127.0.0.1:5432`

PostgreSQL is not running. Start Docker Desktop and execute:

```bash
docker compose up -d database
```

### Port 5432 is already in use

Another PostgreSQL server is already running. Either stop it or change the Docker port in `docker-compose.yml` and update `DATABASE_URL` to match.

### PDF reports no readable text

The document is probably a scanned image. Run OCR in Adobe Acrobat, Google Drive, Microsoft Lens, or another OCR tool, then upload the searchable PDF.

### Login works locally but fails after deployment

Verify that `DATABASE_URL` and `JWT_SECRET` are configured in the hosting platform and redeploy after saving them.

### Database tables do not exist

Run this using the correct target database URL:

```bash
npx drizzle-kit push
```

## Security notes

- Never commit `.env` or production database credentials.
- Always use a unique, high-entropy `JWT_SECRET` in production.
- Use a managed PostgreSQL provider with encrypted connections and backups.
- Restrict production database access and rotate leaked credentials immediately.
- Resume files are processed during the request; extracted candidate data and screening results are stored in PostgreSQL.
"# talent" 
