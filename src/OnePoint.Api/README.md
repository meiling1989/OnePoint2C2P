# OnePoint Loyalty Engine — API Reference

Base URL: `http://localhost:5200`

## Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Returns `{ "status": "healthy" }` |

---

## Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new consumer |
| POST | `/api/auth/login` | Login placeholder (use Supabase Auth directly) |
| DELETE | `/api/auth/account` | Deactivate the authenticated user's account |
| PUT | `/api/auth/profile` | Update the authenticated user's profile |

### POST `/api/auth/register`

```json
{
  "phoneNumber": "+66812345678"
}
```

Response `201 Created`:
```json
{
  "id": "guid",
  "phoneNumber": "+66812345678",
  "displayName": null,
  "onepointBalance": 0,
  "qrCodeData": "...",
  "isActive": true,
  "createdAt": "2026-03-20T00:00:00Z"
}
```

### PUT `/api/auth/profile`

```json
{
  "displayName": "Somchai"
}
```

---

## Balance

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/balance/{userId}` | Get consumer's OnePoint balance and partner balances |

### GET `/api/balance/{userId}`

`userId` is a GUID.

Response `200 OK`:
```json
{
  "id": "guid",
  "onepointBalance": 1500.00,
  "partnerBalances": [
    { "programId": "airline-miles", "cachedBalance": 3200.00 }
  ]
}
```

---

## Redemptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/redemptions` | Redeem points at a merchant |
| GET | `/api/redemptions` | List/filter redemption transactions |
| POST | `/api/redemptions/{transactionRef}/reverse` | Reverse a redemption |

### POST `/api/redemptions`

```json
{
  "consumerId": "guid",
  "merchantId": "guid",
  "amount": 500,
  "method": "qr"
}
```

Response `200 OK`:
```json
{
  "transactionRef": "TXN-20260320-001",
  "status": "completed",
  "pointsRedeemed": 500,
  "monetaryValue": 250.00,
  "updatedBalance": 1000.00
}
```

### GET `/api/redemptions`

Query parameters (all optional):

| Parameter | Type | Description |
|-----------|------|-------------|
| `consumerId` | GUID | Filter by consumer |
| `merchantId` | GUID | Filter by merchant |
| `fromDate` | DateTimeOffset | Start date |
| `toDate` | DateTimeOffset | End date |
| `status` | string | Filter by status (`completed`, `reversed`, `pending`) |
| `minAmount` | decimal | Minimum points amount |
| `page` | int | Page number (default: 1) |
| `pageSize` | int | Items per page (default: 20) |
| `sortBy` | string | Sort field (default: `date`) |
| `sortDir` | string | Sort direction: `asc` or `desc` (default: `desc`) |

Response `200 OK`:
```json
{
  "items": [ /* RedemptionTransaction[] */ ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 148
}
```

### POST `/api/redemptions/{transactionRef}/reverse`

No request body. Response `200 OK`:
```json
{ "status": "reversed" }
```

---

## Point Awards

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/points/award` | Award points to a consumer for a purchase |

### POST `/api/points/award`

```json
{
  "consumerId": "guid",
  "merchantId": "guid",
  "purchaseAmount": 1000.00
}
```

Response `200 OK`:
```json
{
  "pointsAwarded": 100,
  "updatedBalance": 1600.00
}
```

---

## Swaps

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/swaps` | Execute a point swap between partner programs |
| GET | `/api/swaps/rates` | Preview swap conversion rates |

### POST `/api/swaps`

```json
{
  "consumerId": "guid",
  "sourceProgram": "airline-miles",
  "targetProgram": "hotel-points",
  "amount": 1000
}
```

Response `200 OK`:
```json
{
  "swapId": "guid",
  "status": "completed",
  "sourceAmount": 1000,
  "targetAmount": 800
}
```

### GET `/api/swaps/rates`

Query parameters (all required):

| Parameter | Type | Description |
|-----------|------|-------------|
| `source` | string | Source program ID |
| `target` | string | Target program ID |
| `amount` | decimal | Amount to convert |

Response `200 OK`:
```json
{
  "sourceAmount": 1000,
  "onepointIntermediate": 500,
  "targetAmount": 800,
  "sourceProgram": "airline-miles",
  "targetProgram": "hotel-points"
}
```

---

## Partner Links

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/partners/link` | Link a partner loyalty program to consumer |
| DELETE | `/api/partners/{programId}` | Unlink a partner program |
| GET | `/api/partners` | List linked partner programs |

### POST `/api/partners/link`

```json
{
  "consumerId": "guid",
  "programId": "airline-miles"
}
```

Response `201 Created`:
```json
{
  "id": "guid",
  "consumerId": "guid",
  "programId": "airline-miles",
  "cachedBalance": 0,
  "linkedAt": "2026-03-20T00:00:00Z"
}
```

### GET `/api/partners`

Response `200 OK`:
```json
[
  {
    "id": "guid",
    "consumerId": "guid",
    "programId": "airline-miles",
    "cachedBalance": 3200.00,
    "linkedAt": "2026-03-20T00:00:00Z"
  }
]
```

---

## Merchants (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/merchants` | Create a new merchant |
| GET | `/api/merchants` | List all merchants |
| PUT | `/api/merchants/{id}` | Update a merchant |
| DELETE | `/api/merchants/{id}` | Deactivate a merchant |

### POST `/api/merchants`

```json
{
  "businessName": "CentralWorld",
  "businessRegistration": "REG-12345"
}
```

Response `201 Created`:
```json
{
  "id": "guid",
  "businessName": "CentralWorld",
  "businessRegistration": "REG-12345",
  "settlementBalance": 0,
  "isActive": true,
  "createdAt": "2026-03-20T00:00:00Z"
}
```

### PUT `/api/merchants/{id}`

```json
{
  "businessName": "CentralWorld Updated",
  "businessRegistration": "REG-12345"
}
```

### DELETE `/api/merchants/{id}`

Response `200 OK`:
```json
{ "status": "deactivated" }
```

---

## Merchant Users (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/merchants/{id}/users` | Create a merchant user |
| GET | `/api/merchants/{id}/users` | List users for a merchant |

### POST `/api/merchants/{id}/users`

```json
{
  "authUserId": "guid",
  "email": "[email]",
  "role": "merchant_user"
}
```

---

## Loyalty Rules

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/loyalty-rules` | Create a loyalty rule |
| GET | `/api/loyalty-rules/{merchantId}` | Get rules for a merchant |
| PUT | `/api/loyalty-rules/{id}` | Update a loyalty rule |

### POST `/api/loyalty-rules`

```json
{
  "merchantId": "guid",
  "ruleType": "per-baht",
  "purchaseThreshold": 100,
  "pointsValue": 1
}
```

### PUT `/api/loyalty-rules/{id}`

```json
{
  "ruleType": "per-baht",
  "purchaseThreshold": 200,
  "pointsValue": 2
}
```

---

## Promotions

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/promotions` | Create a promotion |
| GET | `/api/promotions` | List active promotions (filterable) |
| GET | `/api/promotions/{id}` | Get a single promotion |

### POST `/api/promotions`

```json
{
  "merchantId": "guid",
  "description": "Double Points Weekend",
  "category": "Bonus",
  "requiredPoints": 0,
  "termsConditions": "Valid for in-store purchases only",
  "validFrom": "2026-03-20T00:00:00Z",
  "validUntil": "2026-03-22T23:59:59Z"
}
```

### GET `/api/promotions`

Query parameters (all optional):

| Parameter | Type | Description |
|-----------|------|-------------|
| `merchantId` | GUID | Filter by merchant |
| `category` | string | Filter by category |

---

## Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get unread notifications for authenticated user |
| PATCH | `/api/notifications/{id}/read` | Mark a notification as read |

### PATCH `/api/notifications/{id}/read`

No request body. Response `200 OK`:
```json
{ "status": "read" }
```

---

## Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Get dashboard overview stats |

### GET `/api/dashboard/overview`

Query parameters (all optional):

| Parameter | Type | Description |
|-----------|------|-------------|
| `merchantId` | GUID | Scope to a specific merchant |
| `period` | string | `daily`, `weekly`, or `monthly` |

Response `200 OK`:
```json
{
  "transactionCount": 312,
  "totalPointsRedeemed": 84720,
  "totalMonetaryValue": 42360.00
}
```

---

## Error Responses

All errors return a consistent format:

```json
{
  "error": {
    "code": "error-code",
    "message": "Human-readable message",
    "details": {}
  }
}
```

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `insufficient-balance` | Not enough points to redeem |
| 400 | `no-rule-configured` | No loyalty rule found for merchant |
| 400 | `already-registered` | Phone number already registered |
| 400 | `invalid-promotion` | Promotion is invalid or expired |
| 400 | `validation-error` | General validation failure |
| 404 | `not-found` | Resource not found |
| 500 | `internal-error` | Unexpected server error |

---

## Dashboard UI (Blazor Server)

The app also serves a Blazor Server dashboard at:

| Route | Page |
|-------|------|
| `/dashboard` | Overview with KPI cards, recent transactions, top merchants |
| `/dashboard/login` | Dashboard login |
| `/dashboard/logout` | Dashboard logout |
| `/dashboard/merchants` | Merchant management |
| `/dashboard/loyalty-rules` | Loyalty rule management |
| `/dashboard/promotions` | Promotion management |
| `/dashboard/transactions` | Transaction browser |

---

## Tech Stack

- ASP.NET Core 9.0 (Minimal API + Blazor Server)
- Supabase (PostgreSQL + Auth)
- Dapper for data access
- Npgsql connection pooling via Supabase Pooler
