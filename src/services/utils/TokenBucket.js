export class TokenBucket {
    constructor(capacity, fillPerSecond) {
        this.capacity = capacity;
        this.tokens = capacity;
        this.lastFilled = Date.now();
        this.fillPerSecond = fillPerSecond;
    }

    take(count = 1) {
        this.refill();
        if (this.tokens >= count) {
            this.tokens -= count;
            return true;
        }
        return false;
    }

    refill() {
        const now = Date.now();
        const delta = (now - this.lastFilled) / 1000;
        this.tokens = Math.min(this.capacity, this.tokens + delta * this.fillPerSecond);
        this.lastFilled = now;
    }
}
