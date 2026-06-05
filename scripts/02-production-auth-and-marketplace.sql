-- Batch 3 production auth and marketplace migration.
-- Safe to rerun: all new columns/tables/indexes are guarded where PostgreSQL supports it.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'id'
      AND data_type = 'text'
  ) THEN
    EXECUTE 'ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()::text';
  ELSE
    EXECUTE 'ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()';
  END IF;
END $$;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'renter';
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'not_started';
ALTER TABLE users ADD COLUMN IF NOT EXISTS reporter_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Nigeria';
ALTER TABLE users ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
UPDATE users
SET user_type = CASE
      WHEN user_type IN ('renter', 'host', 'vendor', 'logistics', 'both') THEN user_type
      WHEN role IN ('host', 'vendor') THEN 'vendor'
      WHEN role = 'logistics' THEN 'logistics'
      ELSE 'renter'
    END,
    first_name = COALESCE(first_name, split_part(COALESCE(full_name, name, email), ' ', 1)),
    last_name = COALESCE(last_name, NULLIF(regexp_replace(COALESCE(full_name, name, ''), '^[^ ]+ ?', ''), '')),
    full_name = COALESCE(full_name, name, email),
    name = COALESCE(name, full_name, email),
    role = CASE
      WHEN role IN ('host', 'vendor') THEN 'vendor'
      WHEN role = 'logistics' THEN 'logistics'
      ELSE 'renter'
    END,
    status = COALESCE(status, 'active'),
    kyc_status = COALESCE(kyc_status, 'not_started'),
    country = COALESCE(country, 'Nigeria')
WHERE user_type IS NULL
  OR user_type NOT IN ('renter', 'host', 'vendor', 'logistics', 'both')
  OR first_name IS NULL
  OR full_name IS NULL
  OR name IS NULL
  OR country IS NULL;
ALTER TABLE users ADD CONSTRAINT users_user_type_check CHECK (user_type IN ('renter', 'host', 'vendor', 'logistics', 'both'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS legal_use_accepted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS residential_area VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_name VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact_phone VARCHAR(30);

CREATE TABLE IF NOT EXISTS identity_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nin VARCHAR(11),
  nin_verified BOOLEAN DEFAULT FALSE,
  nin_verified_at TIMESTAMP,
  drivers_license_number VARCHAR(50),
  drivers_license_verified BOOLEAN DEFAULT FALSE,
  drivers_license_verified_at TIMESTAMP,
  intl_passport_number VARCHAR(50),
  intl_passport_verified BOOLEAN DEFAULT FALSE,
  intl_passport_verified_at TIMESTAMP,
  bvn VARCHAR(11),
  bvn_verified BOOLEAN DEFAULT FALSE,
  bvn_verified_at TIMESTAMP,
  cac_number VARCHAR(50),
  cac_verified BOOLEAN DEFAULT FALSE,
  cac_verified_at TIMESTAMP,
  verification_status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS host_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier_1_nin BOOLEAN DEFAULT FALSE,
  tier_1_drivers_license BOOLEAN DEFAULT FALSE,
  tier_1_intl_passport BOOLEAN DEFAULT FALSE,
  tier_1_completed BOOLEAN DEFAULT FALSE,
  tier_1_completed_at TIMESTAMP,
  tier_2_bvn BOOLEAN DEFAULT FALSE,
  tier_2_completed BOOLEAN DEFAULT FALSE,
  tier_2_completed_at TIMESTAMP,
  tier_3_cac BOOLEAN DEFAULT FALSE,
  tier_3_completed BOOLEAN DEFAULT FALSE,
  tier_3_completed_at TIMESTAMP,
  current_tier INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(200),
  cac_number VARCHAR(50),
  pickup_area VARCHAR(150),
  pickup_address TEXT,
  verification_level VARCHAR(50) DEFAULT 'vendor_draft',
  can_publish BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS logistics_provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_name VARCHAR(200),
  license_number VARCHAR(100),
  vehicle_type VARCHAR(100),
  plate_number VARCHAR(50),
  coverage_areas TEXT[],
  verification_level VARCHAR(50) DEFAULT 'logistics_draft',
  can_receive_dispatch BOOLEAN DEFAULT FALSE,
  completed_dispatches INTEGER DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id),
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  price_per_day DECIMAL(12, 2) NOT NULL,
  security_deposit_amount DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  condition VARCHAR(50),
  available BOOLEAN DEFAULT TRUE,
  total_quantity INTEGER DEFAULT 1,
  available_quantity INTEGER DEFAULT 1,
  image_urls TEXT[],
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE listings ADD COLUMN IF NOT EXISTS known_defects TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS accessories TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS usage_limits TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS replacement_value DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS late_return_fee DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS max_rental_days INTEGER DEFAULT 7;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS photo_count INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INTEGER NOT NULL,
  price_per_day DECIMAL(12, 2) NOT NULL,
  rental_fee DECIMAL(12, 2) DEFAULT 0,
  security_deposit_amount DECIMAL(12, 2) DEFAULT 0,
  delivery_type VARCHAR(30) DEFAULT 'self_pickup',
  delivery_fee DECIMAL(12, 2) DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL,
  total_paid DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'pending',
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancellation_refund_percentage DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS renter_phone VARCHAR(30);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS legal_use_accepted BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS condition_acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS condition_snapshot JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'bookings_no_active_overlap'
  ) THEN
    ALTER TABLE bookings
      ADD CONSTRAINT bookings_no_active_overlap
      EXCLUDE USING gist (
        listing_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
      )
      WHERE (status IN ('pending', 'confirmed', 'active', 'disputed'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  renter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50) DEFAULT 'held',
  release_reason VARCHAR(255),
  released_at TIMESTAMP,
  dispute_raised_by TEXT REFERENCES users(id),
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMP,
  dispute_resolution VARCHAR(50),
  dispute_custom_host_amount DECIMAL(12, 2),
  dispute_custom_renter_amount DECIMAL(12, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id UUID REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  payment_method VARCHAR(50) DEFAULT 'flutterwave',
  status VARCHAR(50) DEFAULT 'initiated',
  flutterwave_transaction_id VARCHAR(255),
  flutterwave_reference VARCHAR(255) UNIQUE,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payments ALTER COLUMN escrow_transaction_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS dispatch_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  vendor_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  renter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  logistics_provider_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  provider_contact_snapshot JSONB,
  pickup_area VARCHAR(150),
  delivery_area VARCHAR(150),
  pickup_window VARCHAR(150),
  delivery_window VARCHAR(150),
  return_pickup_window VARCHAR(150),
  dispatch_fee DECIMAL(12, 2) DEFAULT 0,
  dispatch_status VARCHAR(50) DEFAULT 'pending_assignment',
  handover_code VARCHAR(30),
  proof_of_pickup TEXT,
  proof_of_delivery TEXT,
  proof_of_return TEXT,
  issue_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_logistics_profiles_user_id ON logistics_provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing_dates_status ON bookings(listing_id, start_date, end_date, status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_dispatch_booking_id ON dispatch_assignments(booking_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_provider_id ON dispatch_assignments(logistics_provider_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_status ON dispatch_assignments(dispatch_status);
