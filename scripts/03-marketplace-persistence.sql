-- Batch 4 database-first marketplace seed and constraints.
-- Safe to rerun.

INSERT INTO categories (name, description)
VALUES
  ('Events', 'Sound, lighting, canopies, furniture, and crowd-control essentials.'),
  ('Transport', 'Cars, vans, bikes, boats, and chauffeur-ready rentals.'),
  ('Gear', 'Cameras, production kits, tools, and creator equipment.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO users (
  id, email, password_hash, full_name, name, role, status, kyc_status,
  first_name, last_name, phone_number, user_type, city, state, country,
  residential_area, is_verified, legal_use_accepted_at
)
VALUES
  (
    'vendor-soundpro',
    'seed-soundpro@igorent.test',
    '$2b$12$uC9mPMqz0P9hzR57vRF3IeO9MfQ56qVv8s9Ulq4R.dZAJfP3KjRuW',
    'SoundPro Lagos',
    'SoundPro Lagos',
    'vendor',
    'active',
    'verified',
    'SoundPro',
    'Lagos',
    '0800 VENDOR',
    'vendor',
    'Lekki Phase 1',
    'Lagos',
    'Nigeria',
    'Lekki Phase 1',
    TRUE,
    NOW()
  ),
  (
    'vendor-lenshub',
    'seed-lenshub@igorent.test',
    '$2b$12$uC9mPMqz0P9hzR57vRF3IeO9MfQ56qVv8s9Ulq4R.dZAJfP3KjRuW',
    'LensHub VI',
    'LensHub VI',
    'vendor',
    'active',
    'verified',
    'LensHub',
    'VI',
    '0800 VENDOR',
    'vendor',
    'Victoria Island',
    'Lagos',
    'Nigeria',
    'Victoria Island',
    TRUE,
    NOW()
  ),
  (
    'vendor-mobility',
    'seed-mobility@igorent.test',
    '$2b$12$uC9mPMqz0P9hzR57vRF3IeO9MfQ56qVv8s9Ulq4R.dZAJfP3KjRuW',
    'Island Mobility Co.',
    'Island Mobility Co.',
    'vendor',
    'active',
    'verified',
    'Island',
    'Mobility',
    '0800 VENDOR',
    'vendor',
    'Ikoyi',
    'Lagos',
    'Nigeria',
    'Ikoyi',
    TRUE,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  kyc_status = EXCLUDED.kyc_status,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone_number = EXCLUDED.phone_number,
  user_type = EXCLUDED.user_type,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  country = EXCLUDED.country,
  residential_area = EXCLUDED.residential_area,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

INSERT INTO identity_verification (user_id, nin, nin_verified, nin_verified_at, bvn, bvn_verified, bvn_verified_at, verification_status)
VALUES
  ('vendor-soundpro', '10000000001', TRUE, NOW(), '20000000001', TRUE, NOW(), 'verified'),
  ('vendor-lenshub', '10000000002', TRUE, NOW(), '20000000002', TRUE, NOW(), 'verified'),
  ('vendor-mobility', '10000000003', TRUE, NOW(), '20000000003', TRUE, NOW(), 'verified')
ON CONFLICT (user_id) DO UPDATE SET
  nin_verified = TRUE,
  bvn_verified = TRUE,
  verification_status = 'verified',
  updated_at = NOW();

INSERT INTO vendor_profiles (user_id, business_name, pickup_area, pickup_address, verification_level, can_publish)
VALUES
  ('vendor-soundpro', 'SoundPro Lagos', 'Lekki Phase 1', 'Admiralty Way, Lekki Phase 1', 'basic_verified', TRUE),
  ('vendor-lenshub', 'LensHub VI', 'Victoria Island', 'Adeola Odeku, Victoria Island', 'basic_verified', TRUE),
  ('vendor-mobility', 'Island Mobility Co.', 'Ikoyi', 'Bourdillon Road, Ikoyi', 'basic_verified', TRUE)
ON CONFLICT (user_id) DO UPDATE SET
  business_name = EXCLUDED.business_name,
  pickup_area = EXCLUDED.pickup_area,
  pickup_address = EXCLUDED.pickup_address,
  verification_level = EXCLUDED.verification_level,
  can_publish = EXCLUDED.can_publish,
  updated_at = NOW();

INSERT INTO users (
  id, email, password_hash, full_name, name, role, status, kyc_status,
  first_name, last_name, phone_number, user_type, city, state, country,
  residential_area, is_verified, legal_use_accepted_at
)
VALUES
  (
    'logistics-island-runner',
    'dispatch@islandrunner.ng',
    '$2b$12$uC9mPMqz0P9hzR57vRF3IeO9MfQ56qVv8s9Ulq4R.dZAJfP3KjRuW',
    'Island Runner Dispatch',
    'Island Runner Dispatch',
    'logistics',
    'active',
    'verified',
    'Island Runner',
    'Dispatch',
    '0803 555 0198',
    'logistics',
    'Lekki Phase 1',
    'Lagos',
    'Nigeria',
    'Lekki Phase 1',
    TRUE,
    NOW()
  ),
  (
    'logistics-mainland-link',
    'ops@mainlandlink.ng',
    '$2b$12$uC9mPMqz0P9hzR57vRF3IeO9MfQ56qVv8s9Ulq4R.dZAJfP3KjRuW',
    'Mainland Link Logistics',
    'Mainland Link Logistics',
    'logistics',
    'active',
    'verified',
    'Mainland Link',
    'Logistics',
    '0812 404 7788',
    'logistics',
    'Yaba',
    'Lagos',
    'Nigeria',
    'Yaba',
    TRUE,
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  phone_number = EXCLUDED.phone_number,
  user_type = EXCLUDED.user_type,
  is_verified = EXCLUDED.is_verified,
  updated_at = NOW();

INSERT INTO logistics_provider_profiles (
  user_id, provider_name, license_number, vehicle_type, plate_number,
  coverage_areas, verification_level, can_receive_dispatch, completed_dispatches, rating
)
VALUES
  ('logistics-island-runner', 'Island Runner Dispatch', 'DRV-ISLAND-001', 'Van', 'LSR-482-KJ', ARRAY['Lekki Phase 1', 'Victoria Island', 'Ikoyi', 'Ajah'], 'logistics_verified', TRUE, 214, 4.9),
  ('logistics-mainland-link', 'Mainland Link Logistics', 'DRV-MAINLAND-001', 'Cargo Bike', 'KJA-771-QP', ARRAY['Yaba', 'Surulere', 'Ikeja', 'Maryland'], 'logistics_verified', TRUE, 167, 4.8)
ON CONFLICT (user_id) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  license_number = EXCLUDED.license_number,
  vehicle_type = EXCLUDED.vehicle_type,
  plate_number = EXCLUDED.plate_number,
  coverage_areas = EXCLUDED.coverage_areas,
  verification_level = EXCLUDED.verification_level,
  can_receive_dispatch = EXCLUDED.can_receive_dispatch,
  completed_dispatches = EXCLUDED.completed_dispatches,
  rating = EXCLUDED.rating,
  updated_at = NOW();

INSERT INTO listings (
  host_id, category_id, title, description, price_per_day, security_deposit_amount,
  location, city, state, condition, total_quantity, available_quantity, image_urls,
  rating, total_reviews, available, known_defects, accessories, usage_limits,
  replacement_value, late_return_fee, max_rental_days, photo_count
)
SELECT
  seed.host_id,
  c.id,
  seed.title,
  seed.description,
  seed.price_per_day,
  seed.security_deposit_amount,
  seed.location,
  seed.city,
  seed.state,
  seed.condition,
  1,
  1,
  seed.image_urls,
  seed.rating,
  seed.total_reviews,
  TRUE,
  seed.known_defects,
  seed.accessories,
  seed.usage_limits,
  seed.replacement_value,
  seed.late_return_fee,
  seed.max_rental_days,
  array_length(seed.image_urls, 1)
FROM (
  VALUES
    (
      'vendor-soundpro',
      'Events',
      'Professional Sound System',
      'A full event-ready audio setup for weddings, birthdays, panels, and outdoor brand activations. Includes two powered speakers, mixer, two wireless microphones, stands, and cables.',
      45000::DECIMAL,
      80000::DECIMAL,
      'Admiralty Way, Lekki Phase 1',
      'Lekki Phase 1',
      'Lagos',
      'Excellent',
      ARRAY['https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80', 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&w=1200&q=80'],
      4.9::DECIMAL,
      41,
      'Minor scuff marks on speaker stands; mixer and microphones are fully functional.',
      '2 powered speakers, mixer, 2 wireless microphones, stands, XLR cables, power cables.',
      'Indoor or covered outdoor use only. Not for rain exposure or generator overload.',
      650000::DECIMAL,
      15000::DECIMAL,
      5
    ),
    (
      'vendor-lenshub',
      'Gear',
      'Cinema Bundle for Shoots',
      'Sony cinema camera bundle with tripod, monitor, gimbal, LED panel, and two lenses. Ideal for music videos, interviews, podcasts, and commercial shoots.',
      65000::DECIMAL,
      150000::DECIMAL,
      'Adeola Odeku, Victoria Island',
      'Victoria Island',
      'Lagos',
      'Excellent',
      ARRAY['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80'],
      4.8::DECIMAL,
      29,
      'Small cosmetic scratch on monitor casing; camera body and lenses tested clean.',
      'Camera body, 2 lenses, tripod, gimbal, monitor, LED panel, charger, batteries.',
      'No beach shoots, rain exposure, or unsupervised overnight outdoor use.',
      1200000::DECIMAL,
      25000::DECIMAL,
      4
    ),
    (
      'vendor-mobility',
      'Transport',
      'Executive Sienna with Driver',
      'Clean, air-conditioned Toyota Sienna for airport pickup, production movement, family events, and executive city runs.',
      70000::DECIMAL,
      50000::DECIMAL,
      'Bourdillon Road, Ikoyi',
      'Ikoyi',
      'Lagos',
      'Good',
      ARRAY['https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80'],
      4.7::DECIMAL,
      63,
      'Rear bumper has light paint wear; AC and doors are working.',
      'Professional driver, spare tire, phone support, agreed fuel policy.',
      'Lagos routes only unless vendor approves interstate movement.',
      8500000::DECIMAL,
      30000::DECIMAL,
      7
    )
) AS seed(
  host_id, category_name, title, description, price_per_day, security_deposit_amount,
  location, city, state, condition, image_urls, rating, total_reviews, known_defects,
  accessories, usage_limits, replacement_value, late_return_fee, max_rental_days
)
JOIN categories c ON c.name = seed.category_name
WHERE NOT EXISTS (
  SELECT 1 FROM listings existing
  WHERE existing.host_id = seed.host_id AND existing.title = seed.title
);

CREATE INDEX IF NOT EXISTS idx_listings_title_search ON listings USING gin (to_tsvector('english', title || ' ' || description));
