-- 003_seed_data.sql
-- Seed data for OnePoint Loyalty Engine demo

-----------------------------------------------------------
-- Partner Programs (mock: Lazada, Central, The1)
-----------------------------------------------------------
INSERT INTO partner_programs (id, name, rate_to_onepoint, rate_from_onepoint, is_active) VALUES
  ('lazada',  'Lazada Bonus',   0.5,  0.4,  true),
  ('central', 'Central The1',   0.8,  0.75, true),
  ('the1',    'The 1 Card',     1.0,  0.9,  true);

-----------------------------------------------------------
-- Demo Merchant
-----------------------------------------------------------
INSERT INTO merchants (id, business_name, business_registration, settlement_balance, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Bangkok Coffee Co.',
  'REG-TH-2024-00123',
  0,
  true
);

-----------------------------------------------------------
-- Admin user (merchant_user with role='admin')
-- auth_user_id is a placeholder; replace with real Supabase Auth UID after first login
-----------------------------------------------------------
INSERT INTO merchant_users (id, merchant_id, auth_user_id, email, role, is_active)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'admin@onepoint.demo',
  'admin',
  true
);

-----------------------------------------------------------
-- Sample Loyalty Rules for demo merchant
-----------------------------------------------------------
INSERT INTO loyalty_rules (id, merchant_id, rule_type, purchase_threshold, points_value, is_active)
VALUES
  -- Earn rule: every 100 THB spent → 10 OnePoints
  (
    'd0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'earn',
    100,
    10,
    true
  ),
  -- Redeem rule: 50 points → 25 THB discount
  (
    'd0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'redeem',
    50,
    25,
    true
  );

-----------------------------------------------------------
-- Sample Promotions (future dates so they stay active)
-----------------------------------------------------------
INSERT INTO promotions (id, merchant_id, description, category, required_points, terms_conditions, valid_from, valid_until, is_active)
VALUES
  (
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Free Iced Latte with 200 OnePoints',
    'food_beverage',
    200,
    'Valid for one iced latte (regular size). Cannot be combined with other offers.',
    '2025-01-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    true
  ),
  (
    'e0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    '20% off any pastry with 100 OnePoints',
    'food_beverage',
    100,
    'Valid for one pastry item. One redemption per visit.',
    '2025-01-01T00:00:00Z',
    '2026-06-30T23:59:59Z',
    true
  ),
  (
    'e0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Buy 1 Get 1 Free Coffee — Weekend Special',
    'food_beverage',
    300,
    'Valid on Saturdays and Sundays only. Applies to drinks of equal or lesser value.',
    '2025-06-01T00:00:00Z',
    '2026-12-31T23:59:59Z',
    true
  );
