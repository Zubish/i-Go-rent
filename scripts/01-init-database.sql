-- i.Go-rent Database Schema
-- Nigerian Peer-to-Peer Rental Marketplace with Escrow & Identity Verification

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone_number VARCHAR(20),
  user_type VARCHAR(20) CHECK (user_type IN ('renter', 'host', 'both')),
  profile_image_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Nigeria',
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Government Identity Verification Table
CREATE TABLE IF NOT EXISTS identity_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- NIN (National Identification Number)
  nin VARCHAR(11),
  nin_verified BOOLEAN DEFAULT FALSE,
  nin_verified_at TIMESTAMP,
  
  -- Driver's License
  drivers_license_number VARCHAR(50),
  drivers_license_verified BOOLEAN DEFAULT FALSE,
  drivers_license_verified_at TIMESTAMP,
  
  -- International Passport
  intl_passport_number VARCHAR(50),
  intl_passport_verified BOOLEAN DEFAULT FALSE,
  intl_passport_verified_at TIMESTAMP,
  
  -- BVN (Bank Verification Number)
  bvn VARCHAR(11),
  bvn_verified BOOLEAN DEFAULT FALSE,
  bvn_verified_at TIMESTAMP,
  
  -- CAC (Corporate Affairs Commission)
  cac_number VARCHAR(50),
  cac_verified BOOLEAN DEFAULT FALSE,
  cac_verified_at TIMESTAMP,
  
  verification_status VARCHAR(50) CHECK (verification_status IN ('pending', 'verified', 'rejected', 'expired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

-- Host Tier System Table
CREATE TABLE IF NOT EXISTS host_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Tier 1: NIN, Driver's License, Intl Passport
  tier_1_nin BOOLEAN DEFAULT FALSE,
  tier_1_drivers_license BOOLEAN DEFAULT FALSE,
  tier_1_intl_passport BOOLEAN DEFAULT FALSE,
  tier_1_completed BOOLEAN DEFAULT FALSE,
  tier_1_completed_at TIMESTAMP,
  
  -- Tier 2: BVN
  tier_2_bvn BOOLEAN DEFAULT FALSE,
  tier_2_completed BOOLEAN DEFAULT FALSE,
  tier_2_completed_at TIMESTAMP,
  
  -- Tier 3: CAC Certificate
  tier_3_cac BOOLEAN DEFAULT FALSE,
  tier_3_completed BOOLEAN DEFAULT FALSE,
  tier_3_completed_at TIMESTAMP,
  
  current_tier INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(user_id)
);

-- Rental Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rental Listings Table
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
  
  -- Item Details
  condition VARCHAR(50) CHECK (condition IN ('new', 'excellent', 'good', 'fair')),
  available BOOLEAN DEFAULT TRUE,
  total_quantity INTEGER DEFAULT 1,
  available_quantity INTEGER DEFAULT 1,
  
  -- Images
  image_urls TEXT[], -- Array of image URLs
  
  -- Ratings
  rating DECIMAL(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INTEGER NOT NULL,
  
  -- Pricing
  price_per_day DECIMAL(12, 2) NOT NULL,
  rental_fee DECIMAL(12, 2) DEFAULT 0,
  security_deposit_amount DECIMAL(12, 2) DEFAULT 0,
  delivery_type VARCHAR(30) CHECK (delivery_type IN ('self_pickup', 'igo_logistics')) DEFAULT 'self_pickup',
  delivery_fee DECIMAL(12, 2) DEFAULT 0,
  total_price DECIMAL(12, 2) NOT NULL,
  total_paid DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  
  -- Status
  status VARCHAR(50) CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed')) DEFAULT 'pending',
  
  -- Cancellation
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  cancellation_refund_percentage DECIMAL(5, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Escrow Transactions Table (Core Trust Mechanism)
CREATE TABLE IF NOT EXISTS escrow_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  renter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  host_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Amount Details
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  
  -- Escrow States
  status VARCHAR(50) CHECK (status IN ('held', 'returned_inspection_pending', 'released_to_host', 'deposit_refunded', 'refunded_to_renter', 'partial_release', 'disputed')) DEFAULT 'held',
  
  -- Release Details
  release_reason VARCHAR(255),
  released_at TIMESTAMP,
  
  -- Dispute Details
  dispute_raised_by UUID REFERENCES users(id),
  dispute_reason TEXT,
  dispute_resolved_at TIMESTAMP,
  dispute_resolution VARCHAR(50) CHECK (dispute_resolution IN ('full_host', 'full_renter', 'split_50_50', 'custom')),
  dispute_custom_host_amount DECIMAL(12, 2),
  dispute_custom_renter_amount DECIMAL(12, 2),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_transaction_id UUID NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  -- Payment Details
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  payment_method VARCHAR(50) CHECK (payment_method IN ('flutterwave', 'card', 'bank_transfer')),
  
  -- Flutterwave Reference
  flutterwave_transaction_id VARCHAR(255),
  flutterwave_reference VARCHAR(255) UNIQUE,
  
  -- Status
  status VARCHAR(50) CHECK (status IN ('initiated', 'pending', 'completed', 'failed', 'refunded')) DEFAULT 'initiated',
  failure_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews & Ratings Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  title VARCHAR(200),
  comment TEXT,
  
  -- Review Type
  review_type VARCHAR(20) CHECK (review_type IN ('renter', 'host')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  escrow_transaction_id UUID NOT NULL REFERENCES escrow_transactions(id) ON DELETE CASCADE,
  
  initiated_by UUID NOT NULL REFERENCES users(id),
  opposed_by UUID NOT NULL REFERENCES users(id),
  
  reason TEXT NOT NULL,
  description TEXT,
  
  -- Evidence
  evidence_urls TEXT[],
  
  status VARCHAR(50) CHECK (status IN ('open', 'under_review', 'resolved', 'escalated')) DEFAULT 'open',
  resolution_notes TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  type VARCHAR(100),
  title VARCHAR(200),
  message TEXT,
  
  related_booking_id UUID REFERENCES bookings(id),
  related_listing_id UUID REFERENCES listings(id),
  
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_listings_host_id ON listings(host_id);
CREATE INDEX idx_listings_category_id ON listings(category_id);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_available ON listings(available);
CREATE INDEX idx_bookings_renter_id ON bookings(renter_id);
CREATE INDEX idx_bookings_host_id ON bookings(host_id);
CREATE INDEX idx_bookings_listing_id ON bookings(listing_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_escrow_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_booking_id ON escrow_transactions(booking_id);
CREATE INDEX idx_escrow_renter_id ON escrow_transactions(renter_id);
CREATE INDEX idx_escrow_host_id ON escrow_transactions(host_id);
CREATE INDEX idx_payments_booking_id ON payments(booking_id);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_reviewed_user_id ON reviews(reviewed_user_id);
CREATE INDEX idx_reviews_listing_id ON reviews(listing_id);
CREATE INDEX idx_disputes_booking_id ON disputes(booking_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Backfill-friendly alterations for existing projects.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS security_deposit_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS rental_fee DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS security_deposit_amount DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(30) DEFAULT 'self_pickup';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(12, 2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS total_paid DECIMAL(12, 2) DEFAULT 0;
