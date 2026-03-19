-- 001_initial_schema.sql
-- OnePoint Loyalty Engine — initial database schema
-- Tables: consumers, partner_programs, partner_links, redemption_transactions,
--         point_award_events, swap_transactions, merchants, merchant_users,
--         loyalty_rules, promotions, notifications

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------------------------
-- 1. consumers
-----------------------------------------------------------
CREATE TABLE consumers (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number    text NOT NULL UNIQUE,
    display_name    text,
    onepoint_balance decimal NOT NULL DEFAULT 0,
    qr_code_data    text,
    is_active       boolean NOT NULL DEFAULT true,
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT chk_balance_non_negative CHECK (onepoint_balance >= 0)
);

-----------------------------------------------------------
-- 2. partner_programs
-----------------------------------------------------------
CREATE TABLE partner_programs (
    id                 text PRIMARY KEY,
    name               text NOT NULL,
    rate_to_onepoint   decimal NOT NULL,
    rate_from_onepoint decimal NOT NULL,
    is_active          boolean NOT NULL DEFAULT true
);

-----------------------------------------------------------
-- 3. partner_links
-----------------------------------------------------------
CREATE TABLE partner_links (
    id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id    uuid NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    program_id     text NOT NULL REFERENCES partner_programs(id) ON DELETE CASCADE,
    cached_balance decimal NOT NULL DEFAULT 0,
    linked_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT uq_consumer_program UNIQUE (consumer_id, program_id)
);

-----------------------------------------------------------
-- 4. merchants
-----------------------------------------------------------
CREATE TABLE merchants (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name         text NOT NULL,
    business_registration text,
    settlement_balance    decimal NOT NULL DEFAULT 0,
    is_active             boolean NOT NULL DEFAULT true,
    created_at            timestamptz NOT NULL DEFAULT now()
);

-----------------------------------------------------------
-- 5. merchant_users
-----------------------------------------------------------
CREATE TABLE merchant_users (
    id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id  uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    auth_user_id uuid NOT NULL,
    email        text NOT NULL,
    role         text NOT NULL DEFAULT 'merchant_user',
    is_active    boolean NOT NULL DEFAULT true,
    created_at   timestamptz NOT NULL DEFAULT now()
);

-----------------------------------------------------------
-- 6. loyalty_rules
-----------------------------------------------------------
CREATE TABLE loyalty_rules (
    id                 uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id        uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    rule_type          text NOT NULL,
    purchase_threshold decimal NOT NULL,
    points_value       decimal NOT NULL,
    is_active          boolean NOT NULL DEFAULT true,
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT chk_threshold_positive CHECK (purchase_threshold > 0),
    CONSTRAINT chk_points_positive    CHECK (points_value > 0)
);

-----------------------------------------------------------
-- 7. redemption_transactions
-----------------------------------------------------------
CREATE TABLE redemption_transactions (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_ref text NOT NULL UNIQUE,
    consumer_id     uuid NOT NULL REFERENCES consumers(id),
    merchant_id     uuid NOT NULL REFERENCES merchants(id),
    points_redeemed decimal NOT NULL,
    monetary_value  decimal NOT NULL,
    method          text NOT NULL,
    status          text NOT NULL DEFAULT 'pending',
    created_at      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT chk_redemption_status CHECK (status IN ('pending', 'approved', 'failed', 'reversed'))
);

-----------------------------------------------------------
-- 8. point_award_events
-----------------------------------------------------------
CREATE TABLE point_award_events (
    id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id     uuid NOT NULL REFERENCES consumers(id),
    merchant_id     uuid NOT NULL REFERENCES merchants(id),
    purchase_amount decimal NOT NULL,
    points_awarded  decimal NOT NULL,
    loyalty_rule_id uuid NOT NULL REFERENCES loyalty_rules(id),
    created_at      timestamptz NOT NULL DEFAULT now()
);

-----------------------------------------------------------
-- 9. swap_transactions
-----------------------------------------------------------
CREATE TABLE swap_transactions (
    id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id           uuid NOT NULL REFERENCES consumers(id),
    source_program_id     text NOT NULL,
    target_program_id     text NOT NULL,
    source_amount         decimal NOT NULL,
    onepoint_intermediate decimal NOT NULL,
    target_amount         decimal NOT NULL,
    status                text NOT NULL DEFAULT 'pending',
    created_at            timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT chk_swap_status CHECK (status IN ('pending', 'completed', 'failed', 'reversed'))
);

-----------------------------------------------------------
-- 10. promotions
-----------------------------------------------------------
CREATE TABLE promotions (
    id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id      uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
    description      text NOT NULL,
    category         text,
    required_points  decimal NOT NULL,
    terms_conditions text,
    valid_from       timestamptz NOT NULL,
    valid_until      timestamptz NOT NULL,
    is_active        boolean NOT NULL DEFAULT true,
    created_at       timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT chk_valid_period CHECK (valid_from < valid_until)
);

-----------------------------------------------------------
-- 11. notifications
-----------------------------------------------------------
CREATE TABLE notifications (
    id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    consumer_id uuid NOT NULL REFERENCES consumers(id) ON DELETE CASCADE,
    category    text NOT NULL,
    title       text NOT NULL,
    body        text NOT NULL,
    is_read     boolean NOT NULL DEFAULT false,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-----------------------------------------------------------
-- Indexes for common query patterns
-----------------------------------------------------------

-- Consumer lookups
CREATE INDEX idx_consumers_phone ON consumers(phone_number);
CREATE INDEX idx_consumers_active ON consumers(is_active) WHERE is_active = true;

-- Partner links by consumer
CREATE INDEX idx_partner_links_consumer ON partner_links(consumer_id);

-- Redemption transactions
CREATE INDEX idx_redemption_consumer ON redemption_transactions(consumer_id);
CREATE INDEX idx_redemption_merchant ON redemption_transactions(merchant_id);
CREATE INDEX idx_redemption_created ON redemption_transactions(created_at DESC);
CREATE INDEX idx_redemption_status ON redemption_transactions(status);

-- Point award events
CREATE INDEX idx_award_consumer ON point_award_events(consumer_id);
CREATE INDEX idx_award_merchant ON point_award_events(merchant_id);
CREATE INDEX idx_award_created ON point_award_events(created_at DESC);

-- Swap transactions
CREATE INDEX idx_swap_consumer ON swap_transactions(consumer_id);
CREATE INDEX idx_swap_created ON swap_transactions(created_at DESC);

-- Merchant users
CREATE INDEX idx_merchant_users_merchant ON merchant_users(merchant_id);
CREATE INDEX idx_merchant_users_auth ON merchant_users(auth_user_id);

-- Loyalty rules by merchant
CREATE INDEX idx_loyalty_rules_merchant ON loyalty_rules(merchant_id);
CREATE INDEX idx_loyalty_rules_active ON loyalty_rules(merchant_id, is_active) WHERE is_active = true;

-- Promotions
CREATE INDEX idx_promotions_merchant ON promotions(merchant_id);
CREATE INDEX idx_promotions_active ON promotions(is_active, valid_until) WHERE is_active = true;

-- Notifications
CREATE INDEX idx_notifications_consumer ON notifications(consumer_id);
CREATE INDEX idx_notifications_unread ON notifications(consumer_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
