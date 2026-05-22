# Setting Up Neon Database

## Step 1: Add Environment Variables

Create the following environment variables locally and in Vercel. Never commit real values to Git.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
AUTH_SECRET=replace-with-a-random-string-of-at-least-32-characters
```

If a database URL has ever been committed or reported by GitGuardian/Neon, rotate that database password in Neon and replace every environment using the old value.

## Step 2: Run Database Schema on Neon

Use the SQL editor in the Neon Console and execute the contents of:

```text
scripts/01-init-database.sql
```

Or run it with `psql` using your private connection string:

```bash
psql "$DATABASE_URL" -f scripts/01-init-database.sql
```

## Step 3: Configure Vercel

Add the rotated `DATABASE_URL` and `AUTH_SECRET` in Vercel Project Settings under Environment Variables for Production, Preview, and Development as needed.
