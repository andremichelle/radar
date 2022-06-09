import { Serializer } from "./common.js";
export declare const TAU: number;
export declare abstract class Random {
    nextDouble(min: number, max: number): number;
    nextInt(min: number, max: number): number;
    nextElement<T>(array: ArrayLike<T>): T;
    nextBoolean(): boolean;
    protected abstract uniform(): number;
}
export declare class JsRandom extends Random {
    static Instance: JsRandom;
    private constructor();
    protected uniform(): number;
}
export declare class Mulberry32 extends Random {
    seed: number;
    constructor(seed?: number);
    protected uniform(): number;
}
export declare class Func {
    static smoothStep(x: number): number;
    static smoothStepInverse(y: number): number;
    static clamp(x: number): number;
    static mod(x: number): number;
    static switchSign(x: number, neg: boolean): number;
    static tx(x: number, t: number): number;
    static ty(y: number, t: number): number;
    static step(edge0: number, edge1: number, x: number): number;
    static stairsMap(fx: (x: number) => number, x: number, fragments?: number, frequency?: number, delta?: number, reverse?: boolean): number;
    static stairsInverse(fy: (y: number) => number, y: number, fragments?: number, frequency?: number, delta?: number, reverse?: boolean): number;
}
export interface Bits {
    setBit(index: number, value: boolean): boolean;
    getBit(index: number): boolean;
    clear(): void;
    randomise(random: Random, chance: number): void;
}
export declare class BitArray implements Bits, Serializer<number[]> {
    private readonly numBits;
    private array;
    constructor(numBits?: number);
    getBit(index: number): boolean;
    setBit(index: number, value: boolean): boolean;
    randomise(random: Random, chance?: number): void;
    clear(): void;
    deserialize(format: number[]): BitArray;
    serialize(): number[];
}
