import { ArrayUtils, ObservableValueImpl, Parameter, PrintMapping, Settings } from "./common.js";
import { Linear, LinearInteger } from "./mapping.js";
import { Func, Mulberry32 } from "./math.js";
const InjectiveTypes = [];
export class Injective extends Settings {
    static from(format) {
        switch (format.class) {
            case IdentityInjective.name:
                return new IdentityInjective();
            case PowInjective.name:
                return new PowInjective().deserialize(format);
            case TShapeInjective.name:
                return new TShapeInjective().deserialize(format);
            case CShapeInjective.name:
                return new CShapeInjective().deserialize(format);
            case SmoothStepInjective.name:
                return new SmoothStepInjective().deserialize(format);
            case MonoNoiseInjective.name:
                return new MonoNoiseInjective().deserialize(format);
        }
        throw new Error("Unknown movement format");
    }
    static random(random) {
        return new InjectiveTypes[Math.floor(random.nextDouble(0.0, InjectiveTypes.length))]().randomize(random);
    }
    fxi(x) {
        const xi = Math.floor(x);
        return this.fx(x - xi) + xi;
    }
    fyi(y) {
        const yi = Math.floor(y);
        return this.fy(y - yi) + yi;
    }
}
export class IdentityInjective extends Injective {
    fx(x) {
        return x;
    }
    fy(y) {
        return y;
    }
    serialize() {
        return super.pack();
    }
    deserialize(format) {
        super.unpack(format);
        return this;
    }
    copy() {
        return new IdentityInjective();
    }
    randomize(random) {
        return this;
    }
}
export class PowInjective extends Injective {
    constructor() {
        super(...arguments);
        this.range = new Linear(1.0, 4.0);
        this.exponent = this.bindValue(new Parameter(this.range, PrintMapping.FLOAT_ONE, 2.0));
    }
    fx(x) {
        return Math.pow(x, this.exponent.get());
    }
    fy(y) {
        return Math.pow(y, 1.0 / this.exponent.get());
    }
    serialize() {
        return super.pack({ exponent: this.exponent.get() });
    }
    deserialize(format) {
        this.exponent.set(super.unpack(format).exponent);
        return this;
    }
    copy() {
        const copy = new PowInjective();
        copy.exponent.set(this.exponent.get());
        return copy;
    }
    randomize(random) {
        this.exponent.set(random.nextDouble(2.0, 4.0));
        return this;
    }
}
export class CShapeInjective extends Injective {
    constructor() {
        super();
        this.range = new Linear(0.0, 2.0);
        this.slope = this.bindValue(new Parameter(this.range, PrintMapping.FLOAT_ONE, 1.0));
        this.terminator.with(this.slope.addObserver(() => this.update(), true));
    }
    fx(x) {
        return this.c * Math.sign(x - 0.5) * Math.pow(Math.abs(x - 0.5), this.o) + 0.5;
    }
    fy(y) {
        return Math.sign(y - 0.5) * Math.pow(Math.abs(y - 0.5) / this.c, 1.0 / this.o) + 0.5;
    }
    serialize() {
        return super.pack({ slope: this.slope.get() });
    }
    deserialize(format) {
        this.slope.set(super.unpack(format).slope);
        return this;
    }
    copy() {
        const copy = new CShapeInjective();
        copy.slope.set(this.slope.get());
        return copy;
    }
    randomize(random) {
        this.slope.set(random.nextDouble(0.5, 2.0));
        return this;
    }
    update() {
        this.o = Math.pow(2.0, this.slope.get());
        this.c = Math.pow(2.0, this.o - 1);
    }
}
export class TShapeInjective extends Injective {
    constructor() {
        super();
        this.range = Linear.Bipolar;
        this.shape = this.bindValue(new Parameter(this.range, PrintMapping.FLOAT_ONE, 0.5));
    }
    fx(x) {
        return Func.tx(x, this.shape.get());
    }
    fy(y) {
        return Func.ty(y, this.shape.get());
    }
    serialize() {
        return super.pack({ shape: this.shape.get() });
    }
    deserialize(format) {
        this.shape.set(super.unpack(format).shape);
        return this;
    }
    copy() {
        const copy = new TShapeInjective();
        copy.shape.set(this.shape.get());
        return copy;
    }
    randomize(random) {
        this.shape.set(random.nextDouble(this.range.min, this.range.max));
        return this;
    }
}
export class SmoothStepInjective extends Injective {
    constructor() {
        super();
        this.edge0 = this.bindValue(new Parameter(Linear.Identity, PrintMapping.UnipolarPercent, 0.25));
        this.edge1 = this.bindValue(new Parameter(Linear.Identity, PrintMapping.UnipolarPercent, 0.75));
    }
    fx(x) {
        return Func.smoothStep(Func.step(this.edge0.get(), this.edge1.get(), x));
    }
    fy(y) {
        return Math.min(1.0, Math.max(0.0, this.edge0.get()
            + Func.smoothStepInverse(y) * (this.edge1.get() - this.edge0.get())));
    }
    deserialize(format) {
        const data = this.unpack(format);
        this.edge0.set(data.edge0);
        this.edge1.set(data.edge1);
        return this;
    }
    serialize() {
        return super.pack({ edge0: this.edge0.get(), edge1: this.edge1.get() });
    }
    copy() {
        const copy = new SmoothStepInjective();
        copy.edge0.set(this.edge0.get());
        copy.edge1.set(this.edge1.get());
        return copy;
    }
    randomize(random) {
        this.edge0.set(random.nextDouble(0.125, 0.375));
        this.edge1.set(random.nextDouble(0.625, 0.875));
        return this;
    }
}
export class MonoNoiseInjective extends Injective {
    constructor() {
        super();
        this.seed = this.bindValue(new ObservableValueImpl(0xFFFFFF));
        this.resolution = this.bindValue(new Parameter(new LinearInteger(0, 64), PrintMapping.INTEGER, 16));
        this.roughness = this.bindValue(new Parameter(new Linear(0.0, 16.0), PrintMapping.FLOAT_ONE, 64.0));
        this.strength = this.bindValue(new Parameter(Linear.Identity, PrintMapping.FLOAT_ONE, 1.0));
        this.values = new Float32Array([0.0, 1.0]);
        this.terminator.with(this.seed.addObserver(() => this.update(), false));
        this.terminator.with(this.resolution.addObserver(() => this.update(), false));
        this.terminator.with(this.roughness.addObserver(() => this.update(), false));
        this.terminator.with(this.strength.addObserver(() => this.update(), false));
        this.update();
    }
    static monotoneRandom(random, n, roughness, strength) {
        const sequence = new Float32Array(n + 1);
        let sum = 0.0;
        for (let i = 1; i <= n; ++i) {
            const x = Math.floor(random.nextDouble(0.0, roughness)) + 1.0;
            sum += x;
            sequence[i] = x;
        }
        let nominator = 0.0;
        for (let i = 1; i <= n; ++i) {
            nominator += sequence[i];
            sequence[i] = (nominator / sum) * strength + (1.0 - strength) * i / n;
        }
        return sequence;
    }
    fx(y) {
        if (y <= 0.0)
            return 0.0;
        if (y >= 1.0)
            return 1.0;
        const index = ArrayUtils.binarySearch(this.values, this.values.length, y);
        const a = this.values[index];
        const b = this.values[index + 1];
        const nInverse = 1.0 / this.resolution.get();
        return index * nInverse + nInverse / (b - a) * (y - a);
    }
    fy(x) {
        if (x <= 0.0)
            return 0.0;
        if (x >= 1.0)
            return 1.0;
        const xd = x * this.resolution.get();
        const xi = xd | 0;
        const a = xd - xi;
        const q = this.values[xi];
        return q + a * (this.values[xi + 1] - q);
    }
    deserialize(format) {
        const data = super.unpack(format);
        this.seed.set(data.seed);
        this.resolution.set(data.resolution);
        this.roughness.set(data.roughness);
        this.strength.set(data.strength);
        return this;
    }
    serialize() {
        return super.pack({
            seed: this.seed.get(),
            resolution: this.resolution.get(),
            roughness: this.roughness.get(),
            strength: this.strength.get()
        });
    }
    copy() {
        const injective = new MonoNoiseInjective();
        injective.seed.set(this.seed.get());
        injective.resolution.set(this.resolution.get());
        injective.roughness.set(this.roughness.get());
        injective.strength.set(this.strength.get());
        return injective;
    }
    randomize(random) {
        this.seed.set(random.nextInt(0, 0xFFFFFFFF));
        return this;
    }
    update() {
        this.values = MonoNoiseInjective.monotoneRandom(new Mulberry32(this.seed.get()), this.resolution.get(), this.roughness.get(), this.strength.get());
    }
}
InjectiveTypes.push(IdentityInjective);
InjectiveTypes.push(PowInjective);
InjectiveTypes.push(CShapeInjective);
InjectiveTypes.push(TShapeInjective);
InjectiveTypes.push(SmoothStepInjective);
InjectiveTypes.push(MonoNoiseInjective);
//# sourceMappingURL=injective.js.map