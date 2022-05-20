// noinspection JSUnusedGlobalSymbols

export abstract class Range {
    readonly min: number
    readonly max: number

    // noinspection JSUnusedLocalSymbols
    private constructor() {
    }

    clamp(value: number): number {
        return Math.min(this.max, Math.max(this.min, value))
    }
}

export interface ValueMapping<Y> {
    y(x: number): Y

    x(y: Y): number

    clamp(y: Y): Y
}

export class Linear implements ValueMapping<number>, Range {
    static Identity = new Linear(0.0, 1.0)
    static Bipolar = new Linear(-1.0, 1.0)
    static Percent = new Linear(0.0, 100.0)

    private readonly range: number

    constructor(readonly min: number, readonly max: number) {
        this.range = max - min
    }

    x(y: number): number {
        return (y - this.min) / this.range
    }

    y(x: number): number {
        return this.min + x * this.range
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y))
    }
}

export class LinearInteger implements ValueMapping<number>, Range {
    static Percent = new Linear(0, 100)

    readonly min: number
    readonly max: number
    private readonly range: number

    constructor(min: number, max: number) {
        this.max = max | 0
        this.min = min | 0
        this.range = max - min
    }

    x(y: number): number {
        return (y - this.min) / this.range
    }

    y(x: number): number {
        return (this.min + Math.round(x * this.range)) | 0
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y))
    }
}

export class Exp implements ValueMapping<number>, Range {
    readonly min: number
    readonly max: number
    private readonly range: number

    constructor(min: number, max: number) {
        this.max = max
        this.min = min
        this.range = Math.log(max / min)
    }

    x(y: number): number {
        return Math.log(y / this.min) / this.range
    }

    y(x: number): number {
        return this.min * Math.exp(x * this.range)
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y))
    }
}

export class BooleanMapping implements ValueMapping<boolean> {
    static Instance: BooleanMapping = new BooleanMapping()

    x(y: boolean): number {
        return y ? 1.0 : 0.0
    }

    y(x: number): boolean {
        return x >= 0.5
    }

    clamp(y: boolean): boolean {
        return y
    }
}

/**
 * A proper level mapping based on db = a-b/(x+c) where x is unipolar [0,1]
 * Solved in Maxima: solve([min=a-b/c,max=a-b/(1+c),mid=a-b/(1/2+c)],[a,b,c]);
 */
export class Volume implements ValueMapping<number>, Range {
    static Default = new Volume(-72.0, -12.0, 0.0)

    private readonly a: number
    private readonly b: number
    private readonly c: number

    /**
     * @param min The lowest decibel value [0.0]
     * @param mid The decibel value in the center [0.5]
     * @param max The highest decibel value [1.0]
     */
    constructor(readonly min, readonly mid, readonly max) {
        const min2 = min * min
        const max2 = max * max
        const mid2 = mid * mid
        const tmp0 = min + max - 2.0 * mid
        const tmp1 = max - mid
        this.a = ((2.0 * max - mid) * min - mid * max) / tmp0
        this.b = (tmp1 * min2 + (mid2 - max2) * min + mid * max2 - mid2 * max)
            / (min2 + (2.0 * max - 4.0 * mid) * min + max2 - 4.0 * mid * max + 4 * mid2)
        this.c = -tmp1 / tmp0
    }

    y(x: number): number {
        if (0.0 >= x) {
            return Number.NEGATIVE_INFINITY // in order to get a true zero gain
        }
        if (1.0 <= x) {
            return this.max
        }
        return this.a - this.b / (x + this.c)
    }

    x(y: number): number {
        if (this.min >= y) {
            return 0.0
        }
        if (this.max <= y) {
            return 1.0
        }
        return -this.b / (y - this.a) - this.c
    }

    clamp(y: number): number {
        return Math.min(this.max, Math.max(this.min, y))
    }
}