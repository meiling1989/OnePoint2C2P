-- 002_rls_policies.sql
-- Row-Level Security policies for all tables

-----------------------------------------------------------
-- Enable RLS on all tables
-----------------------------------------------------------
ALTER TABLE consumers ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemption_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_award_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-----------------------------------------------------------
-- Helper: check if current user is an admin
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM merchant_users
    WHERE auth_user_id = auth.uid() AND role = 'admin' AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-----------------------------------------------------------
-- Helper: get merchant_id(s) for current user
-----------------------------------------------------------
CREATE OR REPLACE FUNCTION my_merchant_ids()
RETURNS SETOF uuid AS $$
  SELECT merchant_id FROM merchant_users
  WHERE auth_user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-----------------------------------------------------------
-- consumers
-----------------------------------------------------------
-- Consumers can read their own row
CREATE POLICY "consumers_own_data" ON consumers
  FOR SELECT USING (id = auth.uid());

-- Consumers can update their own row
CREATE POLICY "consumers_update_own" ON consumers
  FOR UPDATE USING (id = auth.uid());

-- Admins can read all consumers
CREATE POLICY "admin_read_consumers" ON consumers
  FOR SELECT USING (is_admin());

-----------------------------------------------------------
-- partner_programs (public read for all authenticated users)
-----------------------------------------------------------
CREATE POLICY "partner_programs_read" ON partner_programs
  FOR SELECT USING (true);

-- Only admins can manage partner programs
CREATE POLICY "admin_manage_partner_programs" ON partner_programs
  FOR ALL USING (is_admin());

-----------------------------------------------------------
-- partner_links
-----------------------------------------------------------
-- Consumers can read their own links
CREATE POLICY "consumer_read_own_links" ON partner_links
  FOR SELECT USING (consumer_id = auth.uid());

-- Consumers can insert their own links
CREATE POLICY "consumer_insert_own_links" ON partner_links
  FOR INSERT WITH CHECK (consumer_id = auth.uid());

-- Consumers can delete their own links
CREATE POLICY "consumer_delete_own_links" ON partner_links
  FOR DELETE USING (consumer_id = auth.uid());

-- Admins can read all links
CREATE POLICY "admin_read_partner_links" ON partner_links
  FOR SELECT USING (is_admin());

-----------------------------------------------------------
-- redemption_transactions
-----------------------------------------------------------
-- Consumers can read their own transactions
CREATE POLICY "consumer_own_transactions" ON redemption_transactions
  FOR SELECT USING (consumer_id = auth.uid());

-- Merchant users can see their merchant's transactions
CREATE POLICY "merchant_transactions" ON redemption_transactions
  FOR SELECT USING (
    merchant_id IN (SELECT my_merchant_ids())
  );

-- Admins can see all transactions
CREATE POLICY "admin_all_transactions" ON redemption_transactions
  FOR SELECT USING (is_admin());

-----------------------------------------------------------
-- point_award_events
-----------------------------------------------------------
-- Consumers can read their own award events
CREATE POLICY "consumer_own_awards" ON point_award_events
  FOR SELECT USING (consumer_id = auth.uid());

-- Merchant users can see their merchant's award events
CREATE POLICY "merchant_award_events" ON point_award_events
  FOR SELECT USING (
    merchant_id IN (SELECT my_merchant_ids())
  );

-- Admins can see all award events
CREATE POLICY "admin_all_awards" ON point_award_events
  FOR SELECT USING (is_admin());

-----------------------------------------------------------
-- swap_transactions
-----------------------------------------------------------
-- Consumers can read their own swaps
CREATE POLICY "consumer_own_swaps" ON swap_transactions
  FOR SELECT USING (consumer_id = auth.uid());

-- Admins can see all swaps
CREATE POLICY "admin_all_swaps" ON swap_transactions
  FOR SELECT USING (is_admin());

-----------------------------------------------------------
-- merchants
-----------------------------------------------------------
-- Admins have full access to merchants
CREATE POLICY "admin_all_merchants" ON merchants
  FOR ALL USING (is_admin());

-- Merchant users can read their own merchant
CREATE POLICY "merchant_user_read_own" ON merchants
  FOR SELECT USING (
    id IN (SELECT my_merchant_ids())
  );

-----------------------------------------------------------
-- merchant_users
-----------------------------------------------------------
-- Admins have full access to merchant_users
CREATE POLICY "admin_all_merchant_users" ON merchant_users
  FOR ALL USING (is_admin());

-- Merchant users can read their own record
CREATE POLICY "merchant_user_read_self" ON merchant_users
  FOR SELECT USING (auth_user_id = auth.uid());

-----------------------------------------------------------
-- loyalty_rules
-----------------------------------------------------------
-- Merchant users can manage their own merchant's rules
CREATE POLICY "merchant_manage_own_rules" ON loyalty_rules
  FOR ALL USING (
    merchant_id IN (SELECT my_merchant_ids())
  );

-- Admins have full access to loyalty rules
CREATE POLICY "admin_all_loyalty_rules" ON loyalty_rules
  FOR ALL USING (is_admin());

-- Consumers can read active rules (needed for point calculations display)
CREATE POLICY "consumer_read_active_rules" ON loyalty_rules
  FOR SELECT USING (is_active = true);

-----------------------------------------------------------
-- promotions
-----------------------------------------------------------
-- Merchant users can manage their own merchant's promotions
CREATE POLICY "merchant_manage_own_promotions" ON promotions
  FOR ALL USING (
    merchant_id IN (SELECT my_merchant_ids())
  );

-- Admins have full access to promotions
CREATE POLICY "admin_all_promotions" ON promotions
  FOR ALL USING (is_admin());

-- Consumers can read active promotions
CREATE POLICY "consumer_read_active_promotions" ON promotions
  FOR SELECT USING (is_active = true AND valid_until > now());

-----------------------------------------------------------
-- notifications
-----------------------------------------------------------
-- Consumers can read their own notifications
CREATE POLICY "consumer_own_notifications" ON notifications
  FOR SELECT USING (consumer_id = auth.uid());

-- Consumers can update their own notifications (mark as read)
CREATE POLICY "consumer_update_own_notifications" ON notifications
  FOR UPDATE USING (consumer_id = auth.uid());

-- Admins can read all notifications
CREATE POLICY "admin_all_notifications" ON notifications
  FOR SELECT USING (is_admin());
