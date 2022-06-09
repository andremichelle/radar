export declare abstract class Range {
    readonly min: number;
    readonly max: number;
    private constructor();
    clamp(value: number): number;
}
export interface ValueMapping<Y> {
    y(x: number): Y;
    x(y: Y): number;
    clamp(y: Y): Y;
}
export declare class Linear implements ValueMapping<number>, Range {
    readonly min: number;
    readonly max: number;
    static Identity: Linear;
    static Bipolar: Linear;
    static Percent: Linear;
    private readonly range;
    constructor(min: number, max: number);
    x(y: number): number;
    y(x: number): number;
    clamp(y: number): number;
}
export declare class LinearInteger implements ValueMapping<number>, Range {
    static Percent: Linear;
    readonly min: number;
    readonly max: number;
    private readonly range;
    constructor(min: number, max: number);
    x(y: number): number;
    y(x: number): number;
    clamp(y: number): number;
}
export declare class Exp implements ValueMapping<number>, Range {
    readonly min: number;
    readonly max: number;
    private readonly range;
    constructor(min: number, max: number);
    x(y: number): number;
    y(x: number): number;
    clamp(y: number): number;
}
export declare class BooleanMapping implements ValueMapping<boolean> {
    static Instance: BooleanMapping;
    x(y: boolean): number;
    y(x: number): boolean;
    clamp(y: boolean): boolean;
}
export declare class Volume implements ValueMapping<number>, Range {
    readonly min: any;
    readonly mid: any;
    readonly max: any;
    static Default: Volume;
    private readonly a;
    private readonly b;
    private readonly c;
    constructor(min: any, mid: any, max: any);
    y(x: number): number;
    x(y: number): number;
    clamp(y: number): number;
}
