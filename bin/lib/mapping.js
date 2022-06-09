export class Range {
    constructor() {
    }
    clamp(value) {
        return Math.min(this.max, Math.max(this.min, value));
    }
}
export class Linear {
    constructor(min, max) {
        this.min = min;
        this.max = max;
        this.range = max - min;
    }
    x(y) {
        return (y - this.min) / this.range;
    }
    y(x) {
        return this.min + x * this.range;
    }
    clamp(y) {
        return Math.min(this.max, Math.max(this.min, y));
    }
}
Linear.Identity = new Linear(0.0, 1.0);
Linear.Bipolar = new Linear(-1.0, 1.0);
Linear.Percent = new Linear(0.0, 100.0);
export class LinearInteger {
    constructor(min, max) {
        this.max = max | 0;
        this.min = min | 0;
        this.range = max - min;
    }
    x(y) {
        return (y - this.min) / this.range;
    }
    y(x) {
        return (this.min + Math.round(x * this.range)) | 0;
    }
    clamp(y) {
        return Math.min(this.max, Math.max(this.min, y));
    }
}
LinearInteger.Percent = new Linear(0, 100);
export class Exp {
    constructor(min, max) {
        this.max = max;
        this.min = min;
        this.range = Math.log(max / min);
    }
    x(y) {
        return Math.log(y / this.min) / this.range;
    }
    y(x) {
        return this.min * Math.exp(x * this.range);
    }
    clamp(y) {
        return Math.min(this.max, Math.max(this.min, y));
    }
}
export class BooleanMapping {
    x(y) {
        return y ? 1.0 : 0.0;
    }
    y(x) {
        return x >= 0.5;
    }
    clamp(y) {
        return y;
    }
}
BooleanMapping.Instance = new BooleanMapping();
export class Volume {
    constructor(min, mid, max) {
        this.min = min;
        this.mid = mid;
        this.max = max;
        const min2 = min * min;
        const max2 = max * max;
        const mid2 = mid * mid;
        const tmp0 = min + max - 2.0 * mid;
        const tmp1 = max - mid;
        this.a = ((2.0 * max - mid) * min - mid * max) / tmp0;
        this.b = (tmp1 * min2 + (mid2 - max2) * min + mid * max2 - mid2 * max)
            / (min2 + (2.0 * max - 4.0 * mid) * min + max2 - 4.0 * mid * max + 4 * mid2);
        this.c = -tmp1 / tmp0;
    }
    y(x) {
        if (0.0 >= x) {
            return Number.NEGATIVE_INFINITY;
        }
        if (1.0 <= x) {
            return this.max;
        }
        return this.a - this.b / (x + this.c);
    }
    x(y) {
        if (this.min >= y) {
            return 0.0;
        }
        if (this.max <= y) {
            return 1.0;
        }
        return -this.b / (y - this.a) - this.c;
    }
    clamp(y) {
        return Math.min(this.max, Math.max(this.min, y));
    }
}
Volume.Default = new Volume(-72.0, -12.0, 0.0);
//# sourceMappingURL=mapping.js.map