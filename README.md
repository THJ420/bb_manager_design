# BB Manager — Enterprise Restaurant Pickup & Operational Terminal

Production-ready employee-facing mobile dashboard designed for restaurant staff, kitchen leads, and counter managers managing local pickups, dining table floor occupancy, guest reservations, live menu stock, and store operational schedules across multiple branches.

## Architecture Overview

- **Framework**: React Native with Expo SDK 58 (Expo Router file-based routing)
- **Navigation**: Clean, icon-centric bottom navigation footer (`tabBarShowLabel: false`) for Live Orders (📋), Menu & Stock (🍔), Dining Tables (🪑), Reservations (📅), Pickup Ledger (🛍️), and Store Settings (⚙️).
- **Local Database & Cache**: Expo SQLite with Write-Ahead Logging (`bb_manager_local.db`).
- **Offline Outbox Engine**: Transactional queue caching all status transitions, table edits, stock toggles, and hours updates for resilient floor operation when Wi-Fi drops.
- **Backend & Real-Time Sync**: PocketBase JS SDK with custom `AsyncAuthStore` backed by `@react-native-async-storage/async-storage` and Server-Sent Events (SSE) subscriptions.
- **Visual Design**: Stripe Dashboard / Material 3 Dark theme with 8pt grid, charcoal surfaces (`#121212`, `#1E1E1E`, `#262626`), high-contrast badges, horizontal filter chip bars, and 48dp touch targets.

## Project Directory Structure

```
├── app.json
├── package.json
├── tsconfig.json
└── src/
    ├── app/
    │   ├── _layout.tsx              # Root Stack & Dark Status Bar
    │   ├── login.tsx                # Staff Auth with Branch ID validation
    │   └── (app)/
    │       ├── _layout.tsx          # Icon-Only Compact Bottom Tab Navigator
    │       ├── index.tsx            # Live Orders Board with Split Tablet View
    │       ├── menu/
    │       │   └── index.tsx        # Comprehensive Menu Management (Full CRUD + Stock Sync)
    │       ├── tables.tsx           # Dining Tables Floor Plan & Live Availability Toggle
    │       ├── reservations.tsx     # Guest Reservations & Lobby Arrival Dispatch
    │       ├── pickup-orders.tsx    # Historical Pickup Orders Ledger & Audit
    │       ├── analytics.tsx        # Floor Analytics & KDS Shift Performance
    │       └── settings.tsx         # Operating Hours, Master Order Switch & Multi-Branch
    ├── components/
    │   ├── ConnectionBadge.tsx      # Real-time SSE / Polling / Offline indicator
    │   ├── HorizontalFilterChips.tsx# Pinned horizontal chip bar (no vertical pills)
    │   ├── MenuItemCard.tsx         # Stock toggle & currency card
    │   ├── MetricCard.tsx           # Neon/amber KPI cards for floor metrics
    │   ├── OrderCard.tsx            # Scannable order card with 48dp action buttons
    │   ├── PriceEditModal.tsx       # Immediate server synchronization price modal
    │   └── StatusBadge.tsx          # High-contrast semantic order badges
    ├── db/
    │   └── sqlite.ts                # Expo SQLite schema & Outbox queue
    ├── services/
    │   ├── auth.ts                  # Staff auth with branch scoping
    │   └── pocketbase.ts            # PocketBase client & AsyncAuthStore
    ├── theme/
    │   └── colors.ts                # Deep charcoal & semantic accent tokens
    └── types/
        └── index.ts                 # Strict TypeScript schemas
```

## PocketBase Collections Schema

### 1. `staff_users`
- `email`: string (unique)
- `name`: string
- `role`: select (`manager`, `kitchen_lead`, `floor_staff`)
- `branch_id`: relation -> `branches.id` (required)

### 2. `branches`
- `name`: string
- `code`: string (e.g. `DT-01`)
- `address`: string
- `phone`: string
- `is_active`: bool

### 3. `orders`
- `order_number`: string
- `branch_id`: relation -> `branches.id`
- `customer_name`: string
- `customer_phone`: string
- `status`: select (`new`, `preparing`, `ready`, `completed`, `cancelled`)
- `items`: json
- `total_amount`: number
- `pickup_code`: string (4-digit PIN)
- `notes`: string

### 4. `menu_items`
- `branch_id`: relation -> `branches.id`
- `name`: string
- `category`: select (`Burgers`, `Sides`, `Beverages`, `Desserts`)
- `description`: string
- `price`: number
- `currency`: string (e.g. `USD`)
- `in_stock`: bool
- `prep_minutes`: number
- `modifiers`: json

### 5. `dining_tables`
- `branch_id`: relation -> `branches.id`
- `table_number`: string (e.g. `T-01`)
- `name`: string
- `capacity`: number
- `is_available`: bool
- `zone`: string (`Main Dining`, `Patio`, `Bar`)

### 6. `reservations`
- `branch_id`: relation -> `branches.id`
- `customer_name`: string
- `customer_phone`: string
- `guest_count`: number
- `reservation_time`: string
- `table_number`: string
- `status`: select (`upcoming`, `arrived`, `seated`, `completed`, `cancelled`)
- `special_requests`: string

### 7. `store_operations`
- `branch_id`: relation -> `branches.id`
- `is_open_for_orders`: bool (Master switch)
- `opening_time`: string
- `closing_time`: string
- `slot_interval_minutes`: number (15, 30, 45, 60)
- `accepting_pickups`: bool
- `accepting_reservations`: bool

## Quick Start Instructions

```bash
# 1. Install dependencies
npm install

# 2. Start the Expo development server
npx expo start

# 3. Run on Android device or emulator
npm run android
```
