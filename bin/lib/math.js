export const TAU = Math.PI * 2.0;
export class Random {
    nextDouble(min, max) {
        return min + this.uniform() * (max - min);
    }
    nextInt(min, max) {
        return min + Math.floor(this.uniform() * (max - min));
    }
    nextElement(array) {
        return array[Math.floor(this.uniform() * array.length)];
    }
    nextBoolean() {
        return this.uniform() < 0.5;
    }
}
export class JsRandom extends Random {
    constructor() {
        super();
    }
    uniform() {
        return Math.random();
    }
}
JsRandom.Instance = new JsRandom();
export class Mulberry32 extends Random {
    constructor(seed = 0x12345678) {
        super();
        this.seed = seed | 0;
    }
    uniform() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296.0;
    }
}
export class Func {
    static smoothStep(x) {
        return x * x * (3.0 - 2.0 * x);
    }
    static smoothStepInverse(y) {
        return 0.5 - Math.sin(Math.asin(1.0 - 2.0 * y) / 3.0);
    }
    static clamp(x) {
        return Math.max(0.0, Math.min(1.0, x));
    }
    static mod(x) {
        return x - Math.floor(x);
    }
    static switchSign(x, neg) {
        return neg ? -x : +x;
    }
    static tx(x, t) {
        console.assert(0.0 <= x && x <= 1.0, `${x} out of bounds`);
        if (t === 0.0)
            return x;
        t *= 1.0 - 1e-3;
        return t < 0.0 ? (t * x + x) / (t * x + 1.0) : x / (t * x - t + 1.0);
    }
    static ty(y, t) {
        return Func.tx(y, -t);
    }
    static step(edge0, edge1, x) {
        return Math.min(1.0, Math.max(0.0, (x - edge0) / (edge1 - edge0)));
    }
    static stairsMap(fx, x, fragments = 1.0, frequency = 1.0, delta = 0.0, reverse = false) {
        const mx = fragments * (reverse ? 1.0 - x : x);
        const nx = Math.floor(mx);
        return frequency * (fx(mx - nx) + nx) / fragments + delta;
    }
    static stairsInverse(fy, y, fragments = 1.0, frequency = 1.0, delta = 0.0, reverse = false) {
        const my = fragments * (y - delta) / frequency;
        const ny = Math.floor(my);
        const result = (fy(my - ny) + ny) / fragments;
        return reverse ? 1.0 - result : result;
    }
}
export class BitArray {
    constructor(numBits = 32 | 0) {
        this.numBits = numBits;
        this.array = new Uint32Array((numBits >>> 5) + 1);
    }
    getBit(index) {
        if (0 > index || index >= this.numBits)
            return false;
        const aIndex = index >>> 5;
        const byte = 1 << (index - (aIndex << 3));
        return 0 !== (this.array[aIndex] & byte);
    }
    setBit(index, value) {
        if (0 > index || index >= this.numBits) {
            throw new Error("out of bounds");
        }
        const aIndex = index >>> 5;
        const byte = 1 << (index - (aIndex << 5));
        const was = this.getBit(index);
        if (value) {
            this.array[aIndex] |= byte;
        }
        else {
            this.array[aIndex] &= ~byte;
        }
        return value !== was;
    }
    randomise(random, chance = 1.0) {
        for (let i = 0; i < this.numBits; i++) {
            this.setBit(i, random.nextDouble(0.0, 1.0) < chance);
        }
    }
    clear() {
        this.array.fill(0);
    }
    deserialize(format) {
        this.array = new Uint32Array(format);
        return this;
    }
    serialize() {
        return Array.from(this.array);
    }
}
//# sourceMappingURL=math.js.map