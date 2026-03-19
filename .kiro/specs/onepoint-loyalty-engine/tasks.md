# Implementation Plan: OnePoint Loyalty Engine

## Overview

2-day hackathon MVP. Backend-first approach: Supabase schema → C# API services → Blazor Dashboard → React Native App. Each task builds incrementally so there's always a runnable demo.

## Tasks

- [x] 1. Supabase database schema and seed data
  - [x] 1.1 Create Supabase SQL migration with all 11 tables, constraints, and indexes
    - Tables: consumers, partner_programs, partner_links, redemption_transactions, point_award_events, swap_transactions, merchants, merchant_users, loyalty_rules, promotions, notifications
    - Include all CHECK constraints (chk_balance_non_negative, chk_threshold_positive, chk_points_positive, chk_valid_period, chk_redemption_status, chk_swap_status) and UNIQUE constraints (uq_consumer_program, transaction_ref)
    - _Requirements: 15.1, 15.9, 16.7, 18.6, 14.4, 14.5, 20.3_

  - [x] 1.2 Create RLS policies for row-level security
    - consumers_own_data: consumers can only read their own row
    - merchant_transactions: merchant_users see only their merchant's transactions
    - admin_all_merchants: admin role has full access to merchants table
    - Corresponding policies for partner_links, notifications, promotions, loyalty_rules
    - _Requirements: 10.4, 12.1, 12.6, 13.6, 20.6_

  - [x] 1.3 Create seed data SQL for demo
    - Seed partner_programs with mock programs (Lazada, Central, The1) and static conversion rates
    - Seed a demo merchant, admin user, and sample loyalty rules
    - Seed sample promotions with valid date ranges
    - _Requirements: 7.5, 18.2_

- [x] 2. C# project scaffolding and Supabase integration
  - [x] 2.1 Create ASP.NET Core Minimal API project with Blazor Server
    - Create solution with `src/OnePoint.Api` project
    - Add NuGet packages: Supabase, Npgsql, Dapper (or raw Npgsql), Microsoft.AspNetCore.Authentication.JwtBearer
    - Configure Program.cs with Supabase client registration, JWT auth middleware, role-based authorization policies ("Admin", "MerchantUser", "Consumer")
    - _Requirements: 10.1, 10.4, 17.2_

  - [x] 2.2 Define C# data models and DTOs
    - Create Models/ folder with record types for all 11 entities (Consumer, Merchant, RedemptionTransaction, etc.)
    - Create DTOs for API requests/responses (RedemptionRequest, AwardRequest, SwapRequest, etc.)
    - Create shared result types: PagedResult<T>, RedemptionResult, AwardResult, SwapPreview, SwapResult
    - Create standard error response model matching the design error format
    - _Requirements: 15.7, 16.3, 18.2_

  - [x] 2.3 Create test project with FsCheck generators
    - Create `tests/OnePoint.Tests` project with xUnit + FsCheck.Xunit
    - Create Generators/DomainGenerators.cs with FsCheck Arbitrary instances for Consumer, Merchant, LoyaltyRule, RedemptionRequest, SwapRequest, Promotion
    - _Requirements: all (testing infrastructure)_

- [x] 3. Implement core API services — Redemption and Point Award
  - [x] 3.1 Implement RedemptionService
    - ProcessRedemption: validate consumer balance, execute debit/credit in a single DB transaction, generate unique transaction_ref, insert notification
    - GetTransactions: paginated query with filter support (date range, status, min amount), sorting (date, amount, status)
    - Handle insufficient balance (return available balance), invalid consumer/QR, and failure reversal
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.7, 15.8, 15.9, 5.1, 5.2, 5.3, 12.2, 12.3_

  - [ ]* 3.2 Write property tests for RedemptionService
    - **Property 26: Redemption balance debit and merchant credit**
    - **Property 27: Redemption insufficient balance rejection**
    - **Property 28: Redemption failure reversal**
    - **Validates: Requirements 15.1, 15.3, 15.4, 15.7, 15.8**

  - [x] 3.3 Implement PointAwardService
    - AwardPoints: look up active loyalty rule for merchant, calculate points as floor(purchaseAmount / threshold) * value, credit consumer balance, insert point_award_event, insert notification
    - Reject if no active rule or invalid consumer
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.7_

  - [ ]* 3.4 Write property tests for PointAwardService
    - **Property 29: Point award calculation**
    - **Validates: Requirements 16.1, 16.2**

  - [ ]* 3.5 Write property test for event logging
    - **Property 30: Event logging completeness**
    - **Validates: Requirements 15.9, 16.7, 18.6**

- [x] 4. Implement API services — Swap, Consumer, Merchant, Loyalty Rules, Promotions, Notifications
  - [x] 4.1 Implement SwapService
    - CalculateSwap: look up conversion rates, compute target_amount = source_amount × rate_to_onepoint × rate_from_onepoint, return SwapPreview
    - ExecuteSwap: debit source partner_link cached_balance, credit target partner_link cached_balance in single transaction; reverse on failure
    - Reject if insufficient source balance
    - _Requirements: 18.2, 18.3, 18.4, 18.5, 7.5, 7.6, 7.7_

  - [ ]* 4.2 Write property tests for SwapService
    - **Property 12: Swap conversion calculation**
    - **Property 13: Swap balance conservation**
    - **Property 14: Swap insufficient balance rejection**
    - **Validates: Requirements 7.5, 7.6, 7.7, 18.2, 18.3, 18.4, 18.5**

  - [x] 4.3 Implement consumer account operations (auth endpoints)
    - Register: verify OTP (mock for MVP), create consumer, assign User_ID, generate QR code data
    - Login: validate credentials via Supabase Auth, return JWT
    - Profile update: validate and save display_name changes
    - Account deletion: set is_active = false, revoke sessions
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 2.2, 2.5_

  - [ ]* 4.4 Write property tests for consumer operations
    - **Property 1: Registration round-trip**
    - **Property 2: Duplicate phone rejection**
    - **Property 3: QR code encodes User ID**
    - **Property 4: QR code refresh produces distinct codes**
    - **Property 5: Balance retrieval includes all linked partners**
    - **Property 15: Profile update round-trip**
    - **Property 16: Account deactivation**
    - **Property 33: Generic authentication error**
    - **Validates: Requirements 2.2, 2.4, 2.5, 3.2, 3.4, 4.1, 4.3, 8.2, 8.5, 17.1, 17.3, 17.4, 17.5**

  - [x] 4.5 Implement MerchantService
    - CreateMerchant: validate input, insert merchant record (admin only)
    - DeactivateMerchant: set is_active = false on merchant and all associated merchant_users
    - CreateMerchantUser: create user, associate with merchant
    - List/edit merchant users
    - _Requirements: 20.1, 20.2, 20.6, 13.1, 13.2, 13.4, 13.5_

  - [ ]* 4.6 Write property tests for MerchantService
    - **Property 23: Merchant creation round-trip**
    - **Property 24: Merchant deactivation cascade**
    - **Property 31: Validation error specificity**
    - **Validates: Requirements 13.1, 13.3, 13.4, 13.6, 20.1, 20.5, 20.6**

  - [x] 4.7 Implement LoyaltyRuleService
    - CreateRule / UpdateRule: validate positive numbers for purchase_threshold and points_value, save rule
    - GetActiveRule: return active rule for a merchant
    - _Requirements: 20.3, 20.4, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [ ]* 4.8 Write property test for LoyaltyRuleService
    - **Property 25: Loyalty rule validation**
    - **Validates: Requirements 14.2, 14.3, 14.4, 14.5, 20.3**

  - [x] 4.9 Implement PromotionService
    - CreatePromotion: validate description, validity period (valid_from < valid_until), required_points > 0
    - GetActivePromotions: return only promotions where is_active = true and valid_until > now, with optional merchant/category filter
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 6.1_

  - [ ]* 4.10 Write property tests for PromotionService
    - **Property 9: Active promotions filtering**
    - **Property 10: Promotion response contains required fields**
    - **Property 32: Promotion creation round-trip**
    - **Validates: Requirements 6.1, 6.2, 21.1, 21.3, 21.4, 21.5**

  - [x] 4.11 Implement NotificationService
    - CreateNotification: insert notification record, check consumer notification preferences before creating
    - GetUnread: return unread notifications for consumer
    - MarkAsRead: set is_read = true
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 9.1, 9.3, 9.4_

  - [ ]* 4.12 Write property tests for NotificationService
    - **Property 17: Notifications created on business events**
    - **Property 18: Notification retrieval round-trip**
    - **Validates: Requirements 9.1, 9.3, 9.4, 19.1, 19.3, 19.4, 19.5**

  - [x] 4.13 Implement partner link operations
    - Link partner: store partner_link record with cached_balance
    - Unlink partner: remove partner_link record
    - Get linked partners: return all partner_links for consumer
    - _Requirements: 18.1, 7.2, 7.4, 7.8_

  - [ ]* 4.14 Write property tests for partner operations
    - **Property 11: Partner linking round-trip**
    - **Validates: Requirements 7.2, 7.4, 7.8, 18.1**

- [x] 5. Wire up all API endpoints
  - [x] 5.1 Register all Minimal API endpoints in Program.cs
    - Map all ~28 endpoints from the design endpoint summary table
    - Apply authorization policies: Consumer endpoints require "Consumer" policy, Merchant endpoints require "MerchantUser" policy, Admin endpoints require "Admin" policy
    - Wire each endpoint to the corresponding service method
    - Apply consistent error handling middleware that maps exceptions to the standard error response format
    - _Requirements: 15.1, 15.2, 16.1, 17.1, 17.2, 18.1, 18.2, 19.4, 20.1, 20.6, 21.1_

  - [ ]* 5.2 Write property tests for API-level concerns
    - **Property 6: Transaction history scoped to consumer**
    - **Property 7: Transaction response contains required fields**
    - **Property 8: Pagination completeness**
    - **Property 19: Role-based data scoping**
    - **Property 20: Dashboard overview stats accuracy**
    - **Property 21: Transaction filtering invariant**
    - **Property 22: Transaction sorting invariant**
    - **Validates: Requirements 5.1, 5.2, 5.3, 10.4, 11.1, 12.1, 12.2, 12.3**

- [x] 6. Checkpoint — Backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Blazor Server Dashboard
  - [x] 7.1 Create Dashboard Login page
    - Implement Supabase SSO redirect flow (Google)
    - On successful auth, read role from JWT claims and redirect to Overview
    - Handle auth failure with error message on login screen
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 7.2 Create Dashboard Overview page
    - Display summary stats: total transaction count, total points redeemed, total monetary value for selected period
    - Period selector: daily, weekly, monthly
    - For admin: show system-wide stats; for merchant_user: show merchant-scoped stats
    - Call DashboardService / direct DB query using the same service layer
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 7.3 Create Transactions page
    - Filterable table: date range, status, min amount
    - Sortable columns: date, amount, status
    - For admin: show all merchants with merchant name column; for merchant_user: show own merchant only
    - _Requirements: 12.1, 12.2, 12.3, 12.5, 12.6_

  - [x] 7.4 Create Admin Merchants management page
    - Create/edit/deactivate merchants
    - Create/list/deactivate merchant_users per merchant
    - Validation errors for incomplete input
    - Restrict to admin role only
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 7.5 Create Loyalty Rules configuration page
    - Form to define earn rules (purchase threshold → points) and redeem rules (points → monetary discount)
    - Validate positive numbers, reject zero/negative/non-numeric
    - List active rules with edit/deactivate
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

  - [x] 7.6 Create Promotions management page
    - Form to create promotions: description, category, validity period, required points, terms
    - List active promotions with edit capability
    - Validation for invalid dates and negative points
    - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5_

- [x] 8. Checkpoint — Dashboard complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. React Native (Expo) mobile app
  - [x] 9.1 Initialize Expo project and configure Supabase client
    - Create Expo project with TypeScript template
    - Install and configure @supabase/supabase-js
    - Set up auth context provider for session management (JWT token storage)
    - Set up React Navigation with bottom tab navigator
    - _Requirements: 1.5, 17.2_

  - [x] 9.2 Implement LoginScreen and RegisterScreen
    - LoginScreen: email/password form + Google SSO button via Supabase Auth
    - RegisterScreen: phone number input → OTP verification (Supabase magic link for MVP)
    - Handle auth errors with generic error messages
    - On success, navigate to HomeScreen
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4_

  - [x] 9.3 Implement HomeScreen with balance display
    - Fetch and display OnePoint balance prominently at top
    - Display linked partner program balances below
    - Show stale-data indicator with timestamp if API unreachable (use cached value)
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 9.4 Implement QRScreen
    - Generate QR code encoding consumer's User_ID using a QR code library (e.g., react-native-qrcode-svg)
    - Display User_ID as text
    - Refresh button to regenerate QR code
    - Brightness-optimized display (white background, high contrast)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 9.5 Implement HistoryScreen
    - Paginated list of redemption transactions
    - Each item shows: merchant name, date/time, points redeemed, transaction ref
    - Tap to view full details (merchant location, redemption method)
    - Infinite scroll pagination
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 9.6 Implement PromotionsScreen
    - List active promotions with merchant name, description, validity, required points
    - Tap to view full details with terms and conditions
    - Empty state message when no promotions available
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

  - [x] 9.7 Implement SwapScreen
    - List linked partner programs with balances
    - Link new partner (mock OAuth flow for MVP)
    - Swap form: select source/target program, enter amount, show conversion preview
    - Confirm swap, handle insufficient balance error
    - Unlink partner option
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 9.8 Implement ProfileScreen
    - Display phone number, display name, linked partners
    - Edit display name
    - Logout button (invalidate session, return to login)
    - Delete account button with confirmation
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [x] 9.9 Implement NotificationsScreen
    - List unread notifications
    - Mark as read on tap
    - Show notification title, body, timestamp
    - _Requirements: 9.5, 19.4_

- [x] 10. Final checkpoint — Full MVP complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Backend tasks (1–6) should be completed first to unblock Dashboard and App
- Dashboard (7) and App (9) can be developed in parallel once the API is ready
- Property tests validate universal correctness properties from the design document
- All services use Supabase PostgreSQL transactions for data consistency
- For the hackathon demo, Supabase magic link replaces real SMS OTP, and partner APIs are mocked with static data

