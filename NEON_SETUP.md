# Setting Up Neon Database

## Step 1: Add Environment Variables
Go to the **Vars** section in v0 and add:
```
DATABASE_URL=postgresql://neondb_owner:npg_DFl6oLWZNS1t@ep-dark-glade-a4mjcgdr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
AUTH_SECRET=generate-a-random-string-here-min-32-chars
```

## Step 2: Run Database Schema on Neon
You have two options:

### Option A: Using Neon Console (Easiest)
1. Go to https://console.neon.tech
2. Login and select your project
3. Click "SQL Editor"
4. Copy-paste the entire content of `scripts/01-init-database.sql`
5. Click "Execute"

### Option B: Using psql from Terminal
```bash
psql 'postgresql://neondb_owner:npg_DFl6oLWZNS1t@ep-dark-glade-a4mjcgdr-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' -f scripts/01-init-database.sql
```

## Step 3: Done!
Your app will now use Neon as the database. All tables will be created and ready to use.
