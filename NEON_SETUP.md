# Setting Up Neon Database

## Step 1: Add Environment Variables

Create the following environment variables locally and in Vercel. Never commit real values to Git.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
AUTH_SECRET=replace-with-a-random-string-of-at-least-32-characters
NEXT_PUBLIC_APP_URL=https://your-production-domain.example
FLUTTERWAVE_SECRET_KEY=replace-with-flutterwave-secret-key
FLUTTERWAVE_SECRET_HASH=replace-with-flutterwave-webhook-secret-hash
```

If a database URL has ever been committed or reported by GitGuardian/Neon, rotate that database password in Neon and replace every environment using the old value.

`FLUTTERWAVE_SECRET_KEY` and `FLUTTERWAVE_SECRET_HASH` are required before `/api/health` reports the marketplace as fully healthy. Without them, browse, listing, and pending bookings can work, but payment checkout must stay blocked.

## Step 2: Run Database Schema on Neon

Use the SQL editor in the Neon Console and execute the contents of:

```text
scripts/02-production-auth-and-marketplace.sql
scripts/03-marketplace-persistence.sql
```

Or run it with `psql` using your private connection string:

```bash
npm run db:seed
```

## Step 3: Configure Vercel

Add the rotated `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `FLUTTERWAVE_SECRET_KEY`, and `FLUTTERWAVE_SECRET_HASH` in Vercel Project Settings under Environment Variables for Production, Preview, and Development as needed.

## Step 4: Verify Production

Run:

```bash
npm run smoke:production
npm run smoke:production-booking
npm run smoke:production-vendor
npm run smoke:production-payment
```

The payment smoke may return `providerConfigured: false` until Flutterwave is configured. After payment env is present, it should return a payment link and production `/api/health` should report `paymentProviderConfigured: true`.
