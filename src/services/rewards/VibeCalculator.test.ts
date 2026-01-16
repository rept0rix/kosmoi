import { describe, it, expect } from 'vitest';
import { VibeCalculator } from './VibeCalculator';

describe('VibeCalculator', () => {
    const calculator = new VibeCalculator();

    describe('calculateSignUpBonus', () => {
        it('should return 100 vibes for sign up', () => {
            expect(calculator.calculateSignUpBonus()).toBe(100);
        });
    });

    describe('calculateReviewReward', () => {
        it('should return 50 vibes for verified review', () => {
            expect(calculator.calculateReviewReward(true)).toBe(50);
        });

        it('should return 10 vibes for standard review', () => {
            expect(calculator.calculateReviewReward(false)).toBe(10);
        });
    });

    describe('calculateBookingReward', () => {
        it('should return 10% of booking value rounded down', () => {
            expect(calculator.calculateBookingReward(150)).toBe(15);
            expect(calculator.calculateBookingReward(159)).toBe(15);
            expect(calculator.calculateBookingReward(15)).toBe(1);
        });

        it('should return 0 if 10% is less than 1', () => {
            expect(calculator.calculateBookingReward(5)).toBe(0);
        });

        it('should throw error for negative booking value', () => {
            expect(() => calculator.calculateBookingReward(-10)).toThrow();
        });
    });
});
