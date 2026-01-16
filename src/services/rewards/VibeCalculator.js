export class VibeCalculator {
    calculateSignUpBonus() {
        return 100;
    }

    calculateReviewReward(isVerified) {
        return isVerified ? 50 : 10;
    }

    calculateBookingReward(bookingValueUsd) {
        if (bookingValueUsd < 0) {
            throw new Error("Booking value cannot be negative");
        }
        return Math.floor(bookingValueUsd * 0.1);
    }
}
