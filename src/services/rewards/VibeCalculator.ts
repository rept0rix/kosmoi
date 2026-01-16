export class VibeCalculator {
    calculateSignUpBonus(): number {
        return 100;
    }

    calculateReviewReward(isVerified: boolean): number {
        return isVerified ? 50 : 10;
    }

    calculateBookingReward(bookingValueUsd: number): number {
        if (bookingValueUsd < 0) {
            throw new Error("Booking value cannot be negative");
        }
        return Math.floor(bookingValueUsd * 0.1);
    }
}
