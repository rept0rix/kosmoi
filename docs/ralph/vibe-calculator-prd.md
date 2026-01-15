# PRD: Vibe Points Calculator

## Overview
We need a robust, testable service to calculate "Vibe Points" (loyalty tokens) for various user actions. This component will be pure logic, allowing for strict TDD.

## Requirements

### 1. Calculation Rules
- **Sign Up Bonus**: A user earns **100 Vibes** upon creating an account.
- **Review Submission**:
    - Standard Review: **10 Vibes**.
    - Verified Review (with photo/booking proofs): **50 Vibes**.
- **Booking Reward**:
    - Users earn Vibes equivalent to **10% of the booking value** (USD).
    - Example: $150 booking -> 15 Vibes.
    - Result should be rounded *down* to the nearest integer. (e.g., $159 -> 15 Vibes).

### 2. Constraints
- Input must be validated (e.g., booking value cannot be negative).
- Returns a strict integer (no decimals).

### 3. Interface
The service should expose a class or function:
```typescript
interface VibeCalculator {
  calculateSignUpBonus(): number;
  calculateReviewReward(isVerified: boolean): number;
  calculateBookingReward(bookingValueUsd: number): number;
}
```

## Technical Goals (Ralph Loop)
1.  写 strict tests first (Red).
2.  Implement logic (Green).
3.  Refactor (if needed).
