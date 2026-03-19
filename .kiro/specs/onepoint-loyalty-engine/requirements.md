# Requirements Document

## Introduction

2C2P OnePoint is a unified loyalty exchange engine integrated with the 2C2P Payment Gateway. It addresses "app fatigue" by enabling consumers to aggregate loyalty points from multiple partner programs (e.g., Lazada, Central), convert them through a universal intermediary currency (OnePoint), and spend consolidated points at 2C2P merchants via QR payment. The platform consists of three main components: a consumer-facing mobile application (App), a merchant/admin web dashboard (Dashboard), and a backend API layer (API). The system serves consumers with fragmented loyalty balances, SME merchants seeking enterprise-grade loyalty capabilities, and enterprise partners (banks, malls) looking to increase point liquidity.

## Glossary

- **App**: The consumer-facing mobile application for managing loyalty points, viewing promotions, and performing transactions.
- **Dashboard**: The web-based interface for merchants and administrators to manage transactions, users, merchants, and loyalty rules.
- **API**: The backend service layer that processes redemptions, point awards, and serves data to the App and Dashboard.
- **OnePoint_System**: The unified loyalty exchange engine encompassing the App, Dashboard, and API.
- **Consumer**: An end user who holds loyalty points and uses the App to aggregate, swap, and spend them.
- **Merchant**: An SME business using 2C2P POS terminals that accepts loyalty point payments through OnePoint.
- **Admin**: A system administrator with elevated privileges to manage merchants and merchant users via the Dashboard.
- **Merchant_User**: A user account associated with a specific Merchant, with access to that Merchant's Dashboard data.
- **Partner_Program**: An external loyalty program (e.g., Lazada, Central) whose points can be linked and swapped within OnePoint.
- **OnePoint_Balance**: The intermediary universal point currency used for conversion between different Partner_Programs.
- **Conversion_Rate**: The dynamic exchange ratio between a Partner_Program's points and OnePoint_Balance.
- **Redemption_Transaction**: A completed transaction where a Consumer spends OnePoint_Balance at a Merchant.
- **User_ID**: A unique identifier assigned to each Consumer upon registration.
- **QR_Code**: A machine-readable code uniquely associated with a Consumer's User_ID, used for point redemption at POS terminals.
- **POS_Terminal**: A 2C2P point-of-sale device at a Merchant location that scans QR codes or accepts User_IDs for redemption.
- **SSO_Provider**: A Single Sign-On identity provider used for authentication (e.g., Google, Facebook, LINE).
- **Loyalty_Rule**: A merchant-specific configuration defining how points are earned per purchase amount and how points are redeemed for value.
- **Promotion**: A time-bound offer created by a Merchant to attract Consumers, visible in the App.

---

## Section 1: App (Consumer Mobile Frontend)

### Requirement 1: Consumer Login

**User Story:** As a Consumer, I want to log in to the App using SSO or username/password, so that I can securely access my loyalty account.

#### Acceptance Criteria

1. WHEN a Consumer selects SSO login, THE App SHALL redirect to the chosen SSO_Provider's authentication flow and authenticate the Consumer upon successful completion.
2. WHEN a Consumer submits a valid username and password, THE App SHALL authenticate the Consumer and navigate to the homepage.
3. IF a Consumer submits invalid login credentials, THEN THE App SHALL display an error message indicating incorrect username or password without revealing which field is wrong.
4. IF SSO authentication fails or is cancelled, THEN THE App SHALL return the Consumer to the login screen with a descriptive error message.
5. WHEN a Consumer is authenticated, THE App SHALL issue a session token and maintain the session until explicit logout or token expiry.

### Requirement 2: Consumer Registration

**User Story:** As a Consumer, I want to register using my phone number, so that I can create a OnePoint account quickly.

#### Acceptance Criteria

1. WHEN a Consumer submits a phone number for registration, THE App SHALL send an OTP to the provided phone number for verification.
2. WHEN a Consumer enters a valid OTP, THE App SHALL create a new Consumer account using the phone number as the User_ID.
3. IF a Consumer enters an invalid or expired OTP, THEN THE App SHALL display an error message and allow the Consumer to request a new OTP.
4. IF the submitted phone number is already associated with an existing account, THEN THE App SHALL inform the Consumer that the phone number is already registered and suggest login.
5. THE App SHALL assign a unique User_ID and generate a QR_Code for the Consumer upon successful registration.

### Requirement 3: User ID and QR Code Display

**User Story:** As a Consumer, I want to view my User_ID and QR_Code in the App, so that I can present them at merchant locations for point redemption.

#### Acceptance Criteria

1. THE App SHALL display the Consumer's User_ID on a dedicated identification screen accessible from the homepage.
2. THE App SHALL display a QR_Code that encodes the Consumer's User_ID on the same identification screen.
3. WHEN a Consumer opens the identification screen, THE App SHALL generate the QR_Code with a brightness-optimized display suitable for POS_Terminal scanning.
4. THE App SHALL allow the Consumer to refresh the QR_Code on demand to generate a new time-limited code for security.

### Requirement 4: Homepage Points Display

**User Story:** As a Consumer, I want to see my current point balance on the homepage, so that I know how many points I have available.

#### Acceptance Criteria

1. WHEN a Consumer opens the homepage, THE App SHALL retrieve and display the Consumer's current OnePoint_Balance.
2. THE App SHALL display the OnePoint_Balance prominently at the top of the homepage.
3. THE App SHALL display point balances from each linked Partner_Program alongside the OnePoint_Balance.
4. IF the API is unreachable when loading the homepage, THEN THE App SHALL display the last cached OnePoint_Balance with a stale-data indicator and timestamp.

### Requirement 5: Redemption Transaction History

**User Story:** As a Consumer, I want to view my redemption transaction history, so that I can track where and when I spent my points.

#### Acceptance Criteria

1. WHEN a Consumer navigates to the transaction history screen, THE App SHALL retrieve and display a list of all Redemption_Transactions associated with the Consumer's account.
2. THE App SHALL display each Redemption_Transaction with the Merchant name, date, time, points redeemed, and transaction reference.
3. THE App SHALL support scrolling pagination to load older Redemption_Transactions on demand.
4. WHEN a Consumer selects a specific Redemption_Transaction, THE App SHALL display the full transaction details including Merchant location and redemption method (QR_Code or User_ID).

### Requirement 6: Merchant Promotions

**User Story:** As a Consumer, I want to browse merchant promotions, so that I can find the best deals to redeem my points.

#### Acceptance Criteria

1. WHEN a Consumer navigates to the promotions screen, THE App SHALL retrieve and display a list of active Promotions from participating Merchants.
2. THE App SHALL display each Promotion with the Merchant name, description, validity period, and required points.
3. THE App SHALL allow the Consumer to filter Promotions by Merchant category and location.
4. WHEN a Consumer selects a Promotion, THE App SHALL display full Promotion details including terms, conditions, and Merchant location.
5. IF no active Promotions are available, THEN THE App SHALL display a message indicating no current promotions.

### Requirement 7: Partner Program Linking and Point Swap

**User Story:** As a Consumer, I want to link external loyalty programs and swap points between them, so that I can consolidate my loyalty value.

#### Acceptance Criteria

1. WHEN a Consumer initiates a partner account linking request, THE App SHALL present the Partner_Program's OAuth or OTP authentication flow.
2. WHEN a Consumer completes authentication for a Partner_Program, THE App SHALL store the credentials securely and retrieve the current point balance from the Partner_Program.
3. IF partner authentication fails, THEN THE App SHALL display a descriptive error message and allow retry.
4. THE App SHALL support linking multiple Partner_Programs to a single Consumer account.
5. WHEN a Consumer requests a point swap from a source Partner_Program to a target Partner_Program, THE App SHALL display the applicable Conversion_Rates and resulting point amounts before confirmation.
6. WHEN a Consumer confirms a point swap, THE App SHALL instruct the API to debit points from the source Partner_Program and credit equivalent points to the target Partner_Program atomically.
7. IF the source Partner_Program balance is insufficient for the requested swap, THEN THE App SHALL reject the swap and display the available balance.
8. WHEN a Consumer requests to unlink a Partner_Program, THE App SHALL revoke stored credentials and remove the Partner_Program association.

### Requirement 8: Profile and Settings

**User Story:** As a Consumer, I want to manage my profile and app settings, so that I can keep my information up to date and customize my experience.

#### Acceptance Criteria

1. THE App SHALL display a profile screen showing the Consumer's phone number, display name, and linked Partner_Programs.
2. WHEN a Consumer updates profile information, THE App SHALL validate the input and save the changes via the API.
3. THE App SHALL provide settings for notification preferences, language selection, and session management.
4. WHEN a Consumer requests account logout, THE App SHALL invalidate the session token and return to the login screen.
5. WHEN a Consumer requests account deletion, THE App SHALL confirm the action and instruct the API to deactivate the Consumer account.

### Requirement 9: Push Notifications

**User Story:** As a Consumer, I want to receive push notifications, so that I am informed about transactions, promotions, and account activity.

#### Acceptance Criteria

1. WHEN a Redemption_Transaction is completed for a Consumer, THE App SHALL deliver a push notification with the transaction amount and Merchant name.
2. WHEN a new Promotion relevant to the Consumer is published, THE App SHALL deliver a push notification with the Promotion summary.
3. WHEN a Consumer's OnePoint_Balance changes due to points earned, THE App SHALL deliver a push notification with the updated balance.
4. THE App SHALL respect the Consumer's notification preferences and suppress notifications for disabled categories.
5. IF push notification delivery fails, THEN THE App SHALL store the notification in an in-app notification center for later viewing.

---

## Section 2: Dashboard (Merchant and Admin Web Frontend)

### Requirement 10: Dashboard Login with SSO

**User Story:** As a Merchant_User or Admin, I want to log in to the Dashboard using SSO, so that I can securely access the management interface.

#### Acceptance Criteria

1. WHEN a Merchant_User or Admin selects SSO login, THE Dashboard SHALL redirect to the SSO_Provider's authentication flow.
2. WHEN SSO authentication completes successfully, THE Dashboard SHALL establish a session and navigate to the main dashboard view based on the user's role.
3. IF SSO authentication fails or is cancelled, THEN THE Dashboard SHALL return to the login screen with a descriptive error message.
4. THE Dashboard SHALL enforce role-based access so that Merchant_Users see only their Merchant's data and Admins see system-wide data.

### Requirement 11: Dashboard Overview

**User Story:** As a Merchant_User, I want to see a dashboard overview of my loyalty program performance, so that I can monitor key metrics at a glance.

#### Acceptance Criteria

1. WHEN a Merchant_User opens the Dashboard, THE Dashboard SHALL display summary statistics including total Redemption_Transactions count, total OnePoint_Balance redeemed, and total monetary value for the current period.
2. THE Dashboard SHALL display a chart showing Redemption_Transaction trends over the selected time period.
3. THE Dashboard SHALL allow the Merchant_User to select the reporting period (daily, weekly, monthly).
4. WHEN an Admin opens the Dashboard, THE Dashboard SHALL display system-wide summary statistics across all Merchants.

### Requirement 12: Transaction List

**User Story:** As a Merchant_User, I want to view a detailed list of redemption transactions, so that I can see where consumers redeemed points and for which amounts.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of all Redemption_Transactions for the authenticated Merchant, including transaction reference, Consumer identifier, timestamp, OnePoint_Balance amount, and monetary equivalent.
2. THE Dashboard SHALL provide filtering by date range, transaction status, and minimum transaction amount.
3. THE Dashboard SHALL support sorting by date, amount, and status.
4. WHEN a Merchant_User requests a transaction export, THE Dashboard SHALL generate a downloadable CSV file containing all Redemption_Transactions matching the current filter criteria.
5. WHEN a new Redemption_Transaction is completed at the Merchant's POS_Terminal, THE Dashboard SHALL display the transaction within 10 seconds.
6. WHEN an Admin views the transaction list, THE Dashboard SHALL display transactions across all Merchants with an additional Merchant name column.

### Requirement 13: Admin Merchant and User Management

**User Story:** As an Admin, I want to create and manage merchants and merchant users, so that I can onboard new businesses onto the OnePoint platform.

#### Acceptance Criteria

1. WHEN an Admin submits a new Merchant creation request with business details and POS_Terminal identifiers, THE Dashboard SHALL create the Merchant account via the API.
2. WHEN an Admin creates a Merchant_User for a specific Merchant, THE Dashboard SHALL associate the Merchant_User with that Merchant and assign appropriate access permissions.
3. IF an Admin submits incomplete Merchant or Merchant_User details, THEN THE Dashboard SHALL display validation errors specifying the missing fields.
4. THE Dashboard SHALL allow an Admin to deactivate a Merchant account, which disables all associated Merchant_Users and POS_Terminals.
5. THE Dashboard SHALL allow an Admin to list, edit, and deactivate Merchant_Users for any Merchant.
6. THE Dashboard SHALL restrict Merchant and Merchant_User management functions to Admin role only.

### Requirement 14: Merchant Loyalty Rules Configuration

**User Story:** As a Merchant_User, I want to configure loyalty rules for my business, so that I can define how consumers earn and redeem points.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Loyalty_Rule configuration screen for each Merchant.
2. WHEN a Merchant_User defines a point-earning rule, THE Dashboard SHALL accept the purchase amount threshold and the corresponding points awarded.
3. WHEN a Merchant_User defines a point-redemption rule, THE Dashboard SHALL accept the points required and the corresponding monetary discount value.
4. WHEN a Merchant_User saves a Loyalty_Rule, THE Dashboard SHALL validate that all values are positive numbers and save the rule via the API.
5. IF a Merchant_User submits a Loyalty_Rule with invalid values (zero, negative, or non-numeric), THEN THE Dashboard SHALL display a validation error.
6. THE Dashboard SHALL display the list of active Loyalty_Rules for the Merchant with the ability to edit or deactivate each rule.
7. WHEN a Loyalty_Rule is updated, THE Dashboard SHALL apply the new rule to all subsequent transactions within 60 seconds.

---

## Section 3: API (Backend)

### Requirement 15: Redemption API

**User Story:** As a Merchant operating a POS_Terminal, I want to redeem a Consumer's points using either User_ID or QR_Code, so that Consumers can pay with points at my store.

#### Acceptance Criteria

1. WHEN the API receives a redemption request with a valid User_ID and redemption amount, THE API SHALL verify the Consumer's OnePoint_Balance and process the Redemption_Transaction.
2. WHEN the API receives a redemption request with a valid QR_Code, THE API SHALL decode the QR_Code to resolve the Consumer's User_ID and process the Redemption_Transaction.
3. WHEN a Redemption_Transaction is approved, THE API SHALL debit the redemption amount from the Consumer's OnePoint_Balance and credit the equivalent monetary value to the Merchant's settlement account.
4. IF the Consumer's OnePoint_Balance is insufficient for the requested redemption, THEN THE API SHALL reject the transaction and return an insufficient-balance error with the current available balance.
5. IF the provided User_ID or QR_Code is invalid or expired, THEN THE API SHALL reject the transaction and return an invalid-identifier error.
6. THE API SHALL complete each Redemption_Transaction within 5 seconds from request receipt.
7. THE API SHALL generate a unique transaction reference for each Redemption_Transaction and return it in the response.
8. IF a Redemption_Transaction fails after the Consumer's OnePoint_Balance has been debited, THEN THE API SHALL reverse the debit and return a transaction-failure error.
9. THE API SHALL log every Redemption_Transaction with Consumer identifier, Merchant identifier, amount, method (User_ID or QR_Code), status, and timestamp.

### Requirement 16: Point Award API

**User Story:** As a system integrator, I want to award points to Consumers when they make purchases online or at offline merchants, so that Consumers earn loyalty value for their spending.

#### Acceptance Criteria

1. WHEN the API receives a point-award request with a Consumer User_ID, Merchant identifier, and purchase amount, THE API SHALL calculate the points to award based on the Merchant's active Loyalty_Rule.
2. WHEN points are calculated, THE API SHALL credit the awarded points to the Consumer's OnePoint_Balance.
3. THE API SHALL return the awarded points amount and the Consumer's updated OnePoint_Balance in the response.
4. IF no active Loyalty_Rule exists for the specified Merchant, THEN THE API SHALL reject the request and return a no-rule-configured error.
5. IF the Consumer User_ID is invalid, THEN THE API SHALL reject the request and return an invalid-consumer error.
6. THE API SHALL support point awards from both online purchase events and offline POS_Terminal transactions.
7. THE API SHALL log every point-award event with Consumer identifier, Merchant identifier, purchase amount, points awarded, and timestamp.

### Requirement 17: Consumer Account API

**User Story:** As the App, I want backend APIs for consumer account operations, so that the mobile frontend can manage registration, authentication, and profile data.

#### Acceptance Criteria

1. WHEN the API receives a registration request with a phone number and OTP, THE API SHALL verify the OTP, create the Consumer account, assign a User_ID, and generate a QR_Code.
2. WHEN the API receives a login request with valid credentials (username/password or SSO token), THE API SHALL authenticate the Consumer and return a session token.
3. IF authentication credentials are invalid, THEN THE API SHALL return an authentication-failure error without revealing which credential is incorrect.
4. WHEN the API receives a profile update request, THE API SHALL validate the input and update the Consumer's profile data.
5. WHEN the API receives an account deletion request, THE API SHALL deactivate the Consumer account and revoke all active sessions.

### Requirement 18: Partner Program and Point Swap API

**User Story:** As the App, I want backend APIs for linking partner programs and swapping points, so that Consumers can manage external loyalty accounts.

#### Acceptance Criteria

1. WHEN the API receives a partner-link request with OAuth or OTP credentials, THE API SHALL authenticate with the Partner_Program and store the link securely.
2. WHEN the API receives a point-swap request specifying source Partner_Program, target Partner_Program, and amount, THE API SHALL calculate the conversion using current Conversion_Rates through OnePoint_Balance as intermediary.
3. WHEN a point swap is confirmed, THE API SHALL debit points from the source Partner_Program and credit equivalent points to the target Partner_Program within a single atomic transaction.
4. IF the debit from the source Partner_Program succeeds but the credit to the target Partner_Program fails, THEN THE API SHALL reverse the debit and return a swap-failure error.
5. IF the source Partner_Program balance is insufficient, THEN THE API SHALL reject the swap and return the available balance.
6. THE API SHALL log every point-swap transaction with source program, target program, amounts, Conversion_Rates, and timestamp.

### Requirement 19: Notification API

**User Story:** As the App, I want backend APIs for managing and delivering notifications, so that Consumers receive timely updates about their account activity.

#### Acceptance Criteria

1. WHEN a Redemption_Transaction is completed, THE API SHALL trigger a push notification to the Consumer with the transaction details.
2. WHEN a new Promotion is published by a Merchant, THE API SHALL trigger a push notification to eligible Consumers.
3. WHEN points are awarded to a Consumer, THE API SHALL trigger a push notification with the points earned and updated balance.
4. THE API SHALL store all notifications and provide a retrieval endpoint for the App to fetch unread notifications.
5. THE API SHALL respect Consumer notification preferences when determining whether to deliver push notifications.

### Requirement 20: Merchant and Loyalty Rule Management API

**User Story:** As the Dashboard, I want backend APIs for managing merchants, merchant users, and loyalty rules, so that the web frontend can perform administrative operations.

#### Acceptance Criteria

1. WHEN the API receives a Merchant creation request from an Admin, THE API SHALL validate the business details and POS_Terminal identifiers and create the Merchant account.
2. WHEN the API receives a Merchant_User creation request from an Admin, THE API SHALL create the user and associate it with the specified Merchant.
3. WHEN the API receives a Loyalty_Rule creation or update request, THE API SHALL validate that all values are positive numbers and save the rule.
4. WHEN a Loyalty_Rule is updated, THE API SHALL apply the new rule to subsequent transactions within 60 seconds.
5. IF any management request contains invalid or incomplete data, THEN THE API SHALL return a validation error specifying the issues.
6. THE API SHALL enforce role-based authorization so that only Admin users can create or modify Merchants and Merchant_Users.

### Requirement 21: Promotion Management API

**User Story:** As the Dashboard, I want backend APIs for managing promotions, so that Merchants can create and publish offers visible to Consumers.

#### Acceptance Criteria

1. WHEN the API receives a Promotion creation request from a Merchant_User, THE API SHALL validate the Promotion details including description, validity period, and required points.
2. THE API SHALL store the Promotion and make it retrievable by the App for display to Consumers.
3. WHEN a Promotion's validity period expires, THE API SHALL mark the Promotion as inactive and exclude it from active Promotion listings.
4. THE API SHALL provide a listing endpoint that returns active Promotions with support for filtering by Merchant and category.
5. IF a Promotion creation request contains invalid data, THEN THE API SHALL return a validation error specifying the issues.


### Requirement 6: Merchant Promotions

**User Story:** As a Consumer, I want to browse merchant promotions, so that I can find the best deals to redeem my points.

#### Acceptance Criteria

1. WHEN a Consumer navigates to the promotions screen, THE App SHALL retrieve and display a list of active Promotions from participating Merchants.
2. THE App SHALL display each Promotion with the Merchant name, description, validity period, and required points.
3. THE App SHALL allow the Consumer to filter Promotions by Merchant category and location.
4. WHEN a Consumer selects a Promotion, THE App SHALL display full Promotion details including terms, conditions, and Merchant location.
5. IF no active Promotions are available, THEN THE App SHALL display a message indicating no current promotions.

### Requirement 7: Partner Program Linking and Point Swap

**User Story:** As a Consumer, I want to link external loyalty programs and swap points between them, so that I can consolidate my loyalty value.

#### Acceptance Criteria

1. WHEN a Consumer initiates a partner account linking request, THE App SHALL present the Partner_Program's OAuth or OTP authentication flow.
2. WHEN a Consumer completes authentication for a Partner_Program, THE App SHALL store the credentials securely and retrieve the current point balance from the Partner_Program.
3. IF partner authentication fails, THEN THE App SHALL display a descriptive error message and allow retry.
4. THE App SHALL support linking multiple Partner_Programs to a single Consumer account.
5. WHEN a Consumer requests a point swap from a source Partner_Program to a target Partner_Program, THE App SHALL display the applicable Conversion_Rates and resulting point amounts before confirmation.
6. WHEN a Consumer confirms a point swap, THE App SHALL instruct the API to debit points from the source Partner_Program and credit equivalent points to the target Partner_Program atomically.
7. IF the source Partner_Program balance is insufficient for the requested swap, THEN THE App SHALL reject the swap and display the available balance.
8. WHEN a Consumer requests to unlink a Partner_Program, THE App SHALL revoke stored credentials and remove the Partner_Program association.

### Requirement 8: Profile and Settings

**User Story:** As a Consumer, I want to manage my profile and app settings, so that I can keep my information up to date and customize my experience.

#### Acceptance Criteria

1. THE App SHALL display a profile screen showing the Consumer's phone number, display name, and linked Partner_Programs.
2. WHEN a Consumer updates profile information, THE App SHALL validate the input and save the changes via the API.
3. THE App SHALL provide settings for notification preferences, language selection, and session management.
4. WHEN a Consumer requests account logout, THE App SHALL invalidate the session token and return to the login screen.
5. WHEN a Consumer requests account deletion, THE App SHALL confirm the action and instruct the API to deactivate the Consumer account.

### Requirement 9: Push Notifications

**User Story:** As a Consumer, I want to receive push notifications, so that I am informed about transactions, promotions, and account activity.

#### Acceptance Criteria

1. WHEN a Redemption_Transaction is completed for a Consumer, THE App SHALL deliver a push notification with the transaction amount and Merchant name.
2. WHEN a new Promotion relevant to the Consumer is published, THE App SHALL deliver a push notification with the Promotion summary.
3. WHEN a Consumer's OnePoint_Balance changes due to points earned, THE App SHALL deliver a push notification with the updated balance.
4. THE App SHALL respect the Consumer's notification preferences and suppress notifications for disabled categories.
5. IF push notification delivery fails, THEN THE App SHALL store the notification in an in-app notification center for later viewing.

### Section 2: Dashboard (Merchant and Admin Web Frontend)

### Requirement 10: Dashboard Login with SSO

**User Story:** As a Merchant_User or Admin, I want to log in to the Dashboard using SSO, so that I can securely access the management interface.

#### Acceptance Criteria

1. WHEN a Merchant_User or Admin selects SSO login, THE Dashboard SHALL redirect to the SSO_Provider's authentication flow.
2. WHEN SSO authentication completes successfully, THE Dashboard SHALL establish a session and navigate to the main dashboard view based on the user's role.
3. IF SSO authentication fails or is cancelled, THEN THE Dashboard SHALL return to the login screen with a descriptive error message.
4. THE Dashboard SHALL enforce role-based access so that Merchant_Users see only their Merchant's data and Admins see system-wide data.

### Requirement 11: Dashboard Overview

**User Story:** As a Merchant_User, I want to see a dashboard overview of my loyalty program performance, so that I can monitor key metrics at a glance.

#### Acceptance Criteria

1. WHEN a Merchant_User opens the Dashboard, THE Dashboard SHALL display summary statistics including total Redemption_Transactions count, total OnePoint_Balance redeemed, and total monetary value for the current period.
2. THE Dashboard SHALL display a chart showing Redemption_Transaction trends over the selected time period.
3. THE Dashboard SHALL allow the Merchant_User to select the reporting period (daily, weekly, monthly).
4. WHEN an Admin opens the Dashboard, THE Dashboard SHALL display system-wide summary statistics across all Merchants.

### Requirement 12: Transaction List

**User Story:** As a Merchant_User, I want to view a detailed list of redemption transactions, so that I can see where consumers redeemed points and for which amounts.

#### Acceptance Criteria

1. THE Dashboard SHALL display a list of all Redemption_Transactions for the authenticated Merchant, including transaction reference, Consumer identifier, timestamp, OnePoint_Balance amount, and monetary equivalent.
2. THE Dashboard SHALL provide filtering by date range, transaction status, and minimum transaction amount.
3. THE Dashboard SHALL support sorting by date, amount, and status.
4. WHEN a Merchant_User requests a transaction export, THE Dashboard SHALL generate a downloadable CSV file containing all Redemption_Transactions matching the current filter criteria.
5. WHEN a new Redemption_Transaction is completed at the Merchant's POS_Terminal, THE Dashboard SHALL display the transaction within 10 seconds.
6. WHEN an Admin views the transaction list, THE Dashboard SHALL display transactions across all Merchants with an additional Merchant name column.

### Requirement 13: Admin Merchant and User Management

**User Story:** As an Admin, I want to create and manage merchants and merchant users, so that I can onboard new businesses onto the OnePoint platform.

#### Acceptance Criteria

1. WHEN an Admin submits a new Merchant creation request with business details and POS_Terminal identifiers, THE Dashboard SHALL create the Merchant account via the API.
2. WHEN an Admin creates a Merchant_User for a specific Merchant, THE Dashboard SHALL associate the Merchant_User with that Merchant and assign appropriate access permissions.
3. IF an Admin submits incomplete Merchant or Merchant_User details, THEN THE Dashboard SHALL display validation errors specifying the missing fields.
4. THE Dashboard SHALL allow an Admin to deactivate a Merchant account, which disables all associated Merchant_Users and POS_Terminals.
5. THE Dashboard SHALL allow an Admin to list, edit, and deactivate Merchant_Users for any Merchant.
6. THE Dashboard SHALL restrict Merchant and Merchant_User management functions to Admin role only.

### Requirement 14: Merchant Loyalty Rules Configuration

**User Story:** As a Merchant_User, I want to configure loyalty rules for my business, so that I can define how consumers earn and redeem points.

#### Acceptance Criteria

1. THE Dashboard SHALL provide a Loyalty_Rule configuration screen for each Merchant.
2. WHEN a Merchant_User defines a point-earning rule, THE Dashboard SHALL accept the purchase amount threshold and the corresponding points awarded.
3. WHEN a Merchant_User defines a point-redemption rule, THE Dashboard SHALL accept the points required and the corresponding monetary discount value.
4. WHEN a Merchant_User saves a Loyalty_Rule, THE Dashboard SHALL validate that all values are positive numbers and save the rule via the API.
5. IF a Merchant_User submits a Loyalty_Rule with invalid values (zero, negative, or non-numeric), THEN THE Dashboard SHALL display a validation error.
6. THE Dashboard SHALL display the list of active Loyalty_Rules for the Merchant with the ability to edit or deactivate each rule.
7. WHEN a Loyalty_Rule is updated, THE Dashboard SHALL apply the new rule to all subsequent transactions within 60 seconds.

### Section 3: API (Backend)

### Requirement 15: Redemption API

**User Story:** As a Merchant operating a POS_Terminal, I want to redeem a Consumer's points using either User_ID or QR_Code, so that Consumers can pay with points at my store.

#### Acceptance Criteria

1. WHEN the API receives a redemption request with a valid User_ID and redemption amount, THE API SHALL verify the Consumer's OnePoint_Balance and process the Redemption_Transaction.
2. WHEN the API receives a redemption request with a valid QR_Code, THE API SHALL decode the QR_Code to resolve the Consumer's User_ID and process the Redemption_Transaction.
3. WHEN a Redemption_Transaction is approved, THE API SHALL debit the redemption amount from the Consumer's OnePoint_Balance and credit the equivalent monetary value to the Merchant's settlement account.
4. IF the Consumer's OnePoint_Balance is insufficient for the requested redemption, THEN THE API SHALL reject the transaction and return an insufficient-balance error with the current available balance.
5. IF the provided User_ID or QR_Code is invalid or expired, THEN THE API SHALL reject the transaction and return an invalid-identifier error.
6. THE API SHALL complete each Redemption_Transaction within 5 seconds from request receipt.
7. THE API SHALL generate a unique transaction reference for each Redemption_Transaction and return it in the response.
8. IF a Redemption_Transaction fails after the Consumer's OnePoint_Balance has been debited, THEN THE API SHALL reverse the debit and return a transaction-failure error.
9. THE API SHALL log every Redemption_Transaction with Consumer identifier, Merchant identifier, amount, method (User_ID or QR_Code), status, and timestamp.

### Requirement 16: Point Award API

**User Story:** As a system integrator, I want to award points to Consumers when they make purchases online or at offline merchants, so that Consumers earn loyalty value for their spending.

#### Acceptance Criteria

1. WHEN the API receives a point-award request with a Consumer User_ID, Merchant identifier, and purchase amount, THE API SHALL calculate the points to award based on the Merchant's active Loyalty_Rule.
2. WHEN points are calculated, THE API SHALL credit the awarded points to the Consumer's OnePoint_Balance.
3. THE API SHALL return the awarded points amount and the Consumer's updated OnePoint_Balance in the response.
4. IF no active Loyalty_Rule exists for the specified Merchant, THEN THE API SHALL reject the request and return a no-rule-configured error.
5. IF the Consumer User_ID is invalid, THEN THE API SHALL reject the request and return an invalid-consumer error.
6. THE API SHALL support point awards from both online purchase events and offline POS_Terminal transactions.
7. THE API SHALL log every point-award event with Consumer identifier, Merchant identifier, purchase amount, points awarded, and timestamp.

### Requirement 17: Consumer Account API

**User Story:** As the App, I want backend APIs for consumer account operations, so that the mobile frontend can manage registration, authentication, and profile data.

#### Acceptance Criteria

1. WHEN the API receives a registration request with a phone number and OTP, THE API SHALL verify the OTP, create the Consumer account, assign a User_ID, and generate a QR_Code.
2. WHEN the API receives a login request with valid credentials (username/password or SSO token), THE API SHALL authenticate the Consumer and return a session token.
3. IF authentication credentials are invalid, THEN THE API SHALL return an authentication-failure error without revealing which credential is incorrect.
4. WHEN the API receives a profile update request, THE API SHALL validate the input and update the Consumer's profile data.
5. WHEN the API receives an account deletion request, THE API SHALL deactivate the Consumer account and revoke all active sessions.
