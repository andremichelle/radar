import { ValueMapping } from "./mapping.js";
import { Random } from "./math.js";
export declare type NoArgType<T> = {
    new (): T;
};
export interface Terminable {
    terminate(): void;
}
export declare const TerminableVoid: Terminable;
export declare class Terminator implements Terminable {
    private readonly terminables;
    with<T extends Terminable>(terminable: T): T;
    terminate(): void;
}
export interface Option<T> {
    get(): T;
    ifPresent<R>(callback: (value: T) => R): R;
    contains(value: T): boolean;
    isEmpty(): boolean;
    nonEmpty(): boolean;
    map<U>(callback: (value: T) => U): Option<U>;
}
export declare class Options {
    static valueOf<T>(value: T): Option<T>;
    static Some: {
        new <T>(value: T): {
            readonly value: T;
            get: () => T;
            contains: (value: T) => boolean;
            ifPresent: <R>(callback: (value: T) => R) => R;
            isEmpty: () => boolean;
            nonEmpty: () => boolean;
            map<U>(callback: (value: T) => U): Option<U>;
            toString(): string;
        };
    };
    static None: {
        get: () => never;
        contains: (_: never) => boolean;
        ifPresent: (_: (value: never) => never) => any;
        isEmpty: () => boolean;
        nonEmpty: () => boolean;
        map<U>(callback: (_: never) => U): Option<U>;
        toString(): string;
    };
}
export declare type Observer<VALUE> = (value: VALUE) => void;
export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>, notify: boolean): Terminable;
    removeObserver(observer: Observer<VALUE>): boolean;
}
export declare class ObservableImpl<T> implements Observable<T> {
    private readonly observers;
    notify(value: T): void;
    addObserver(observer: Observer<T>): Terminable;
    removeObserver(observer: Observer<T>): boolean;
    terminate(): void;
}
export interface Serializer<T> {
    serialize(): T;
    deserialize(format: T): Serializer<T>;
}
export interface Value<T> {
    set(value: T): boolean;
    get(): T;
}
export interface ObservableValue<T> extends Value<T>, Observable<T> {
}
export declare class ObservableValueImpl<T> implements ObservableValue<T> {
    private value?;
    private readonly observable;
    constructor(value?: T);
    get(): T;
    set(value: T): boolean;
    addObserver(observer: Observer<T>, notify?: boolean): Terminable;
    removeObserver(observer: Observer<T>): boolean;
    terminate(): void;
}
export declare class ObservableValueVoid implements ObservableValue<any> {
    static Instance: ObservableValueVoid;
    addObserver(observer: Observer<any>): Terminable;
    get(): any;
    removeObserver(observer: Observer<any>): boolean;
    set(value: any): boolean;
    terminate(): void;
}
export declare class Parameter<T> implements ObservableValue<T> {
    readonly valueMapping: ValueMapping<T>;
    readonly printMapping: PrintMapping<T>;
    private value;
    private readonly observable;
    constructor(valueMapping: ValueMapping<T>, printMapping: PrintMapping<T>, value: T);
    getUnipolar(): number;
    setUnipolar(value: number): void;
    print(): string;
    get(): T;
    set(value: T): boolean;
    addObserver(observer: Observer<T>, notify?: boolean): Terminable;
    removeObserver(observer: Observer<T>): boolean;
    terminate(): void;
}
export declare type Parser<Y> = (text: string) => Y | null;
export declare type Printer<Y> = (value: Y) => string;
export declare class PrintMapping<Y> {
    private readonly parser;
    private readonly printer;
    private readonly preUnit;
    private readonly postUnit;
    static INTEGER: PrintMapping<number>;
    static FLOAT_ONE: PrintMapping<number>;
    static createBoolean(trueValue: string, falseValue: string): PrintMapping<boolean>;
    static UnipolarPercent: PrintMapping<number>;
    static RGB: PrintMapping<number>;
    static integer(postUnit: string): PrintMapping<number>;
    static float(numPrecision: number, preUnit: string, postUnit: string): PrintMapping<number>;
    static smallFloat(numPrecision: number, postUnit: string): PrintMapping<number>;
    constructor(parser: Parser<Y>, printer: Printer<Y>, preUnit?: string, postUnit?: string);
    parse(text: string): Y | null;
    print(value: Y): string;
}
export interface Stepper {
    decrease(value: ObservableValue<number>): void;
    increase(value: ObservableValue<number>): void;
}
export declare class NumericStepper implements Stepper {
    private readonly step;
    static Integer: NumericStepper;
    static Hundredth: NumericStepper;
    constructor(step?: number);
    decrease(value: ObservableValue<number>): void;
    increase(value: ObservableValue<number>): void;
}
export declare class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[];
    static shuffle(array: ArrayBufferLike, n: number, random: Random): void;
    static binarySearch: (array: ArrayBufferLike, length: number, key: number) => number;
    private constructor();
}
export interface SettingsFormat<DATA> {
    class: string;
    data: DATA;
}
export declare abstract class Settings<DATA> implements Observable<Settings<DATA>>, Serializer<SettingsFormat<DATA>>, Terminable {
    protected readonly terminator: Terminator;
    protected readonly observable: ObservableImpl<Settings<DATA>>;
    abstract deserialize(format: SettingsFormat<DATA>): Settings<DATA>;
    abstract serialize(): SettingsFormat<DATA>;
    protected pack(data?: DATA): SettingsFormat<DATA>;
    protected unpack(format: SettingsFormat<DATA>): DATA;
    protected bindValue<T>(property: ObservableValue<T>): ObservableValue<T>;
    addObserver(observer: Observer<Settings<DATA>>): Terminable;
    removeObserver(observer: Observer<Settings<DATA>>): boolean;
    terminate(): void;
}
export declare class Waiting {
    static forFrame(): Promise<void>;
    static forFrames(count: number): Promise<void>;
    static forAnimationComplete(element: Element): Promise<void>;
    static forTransitionComplete(element: Element): Promise<void>;
    static forEvent(element: Element, type: string): Promise<void>;
    private static forEvents;
}
export declare class Events {
    static preventDefault: (event: any) => any;
    static toPromise<E extends Event>(target: EventTarget, type: string): Promise<E>;
    static bindEventListener(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: AddEventListenerOptions): Terminable;
    static configRepeatButton(button: any, callback: any): Terminable;
}
export declare class HTMLRadioGroup implements ObservableValue<string> {
    private readonly form;
    private readonly name;
    private readonly terminator;
    private readonly observable;
    constructor(form: HTMLFormElement, name: string);
    set(value: string): boolean;
    get(): string;
    values(): string[];
    addObserver(observer: Observer<string>, notify?: boolean): Terminable;
    removeObserver(observer: Observer<string>): boolean;
    terminate(): void;
}
