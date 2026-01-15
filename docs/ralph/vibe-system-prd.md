# PRD: Vibe System (Loyalty & P2P)

## Overview
The Vibe System is the implementation of the "Vibe Token" loyalty program. It allows users to:
1.  **Earn** Vibes (Sign up, Reviews, Bookings).
2.  **Hold** Vibes in a digital wallet.
3.  **View** Balance and Transaction History.
4.  (Future) **Redeem** Vibes for discounts.

## Requirements

### 1. Database & Schema (Existing)
*   Table `wallets`: Stores `vibes_balance` (Int) and `balance` (THB/USD).
*   Table `transactions`: Records history. `currency` = 'VIBES'.
*   RPC `award_vibes`: Securely increments balance.

### 2. Backend Services (`src/services/wallet/`)
#### `WalletService.ts`
*   **`getBalance(userId)`**: Returns `{ thb: number, vibes: number }`.
*   **`getTransactions(userId, currency?)`**: Returns paginated list.
*   **`awardVibes(userId, amount, reason)`**: Wraps the RPC call.
*   **`processBookingReward(bookingId, amountUsd)`**:
    *   Uses `VibeCalculator` to determine reward.
    *   Calls `awardVibes`.

### 3. Frontend Components
#### `WalletIndicator.jsx`
*   Small badge in the header showing current Vibe balance.
*   Animates on change.

#### `WalletPage.jsx` (/wallet)
*   **Overview Card**: Big balance display.
*   **History List**: Table of recent transactions (Earned/Spent).
*   **Transfer UI**: (P2P) Send Vibes to another user (optional for v1, but schema matches).

## Integration Points
*   **Auth**: On new user creation -> Trigger Signup Bonus (100 Vibes).
*   **Reviews**: On verify review -> Trigger Review Bonus.
*   **Stripe**: On payment success -> Trigger Booking Reward.

## Testing Strategy (Ralph Loop)
1.  **Unit Tests**: `WalletService` methods (mocking Supabase calls).
2.  **Integration Tests**: Call `awardVibes` and verify DB state (using Test User).
