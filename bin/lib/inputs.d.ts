import { NumericStepper, ObservableValue, PrintMapping, Terminable } from "./common.js";
export interface Editor<T> extends Terminable {
    with(value: T): void;
    clear(): void;
}
export declare class Checkbox implements Editor<ObservableValue<boolean>> {
    private readonly element;
    private readonly terminator;
    private value;
    constructor(element: HTMLInputElement);
    with(value: ObservableValue<boolean>): void;
    clear(): void;
    init(): void;
    update(): void;
    terminate(): void;
    private readonly observer;
}
export declare class SelectInput<T> implements Editor<ObservableValue<T>> {
    private readonly select;
    private readonly map;
    private readonly terminator;
    private readonly options;
    private readonly values;
    private value;
    constructor(select: HTMLSelectElement, map: Map<string, T>);
    with(value: ObservableValue<T>): SelectInput<T>;
    clear(): void;
    terminate(): void;
    private observer;
    private update;
    private connect;
}
export declare class NumericStepperInput implements Editor<ObservableValue<number>> {
    private readonly parent;
    private readonly printMapping;
    private readonly stepper;
    private readonly terminator;
    private value;
    private readonly decreaseButton;
    private readonly increaseButton;
    private readonly input;
    constructor(parent: HTMLElement, printMapping: PrintMapping<number>, stepper: NumericStepper);
    with(value: ObservableValue<number>): void;
    clear(): void;
    connect(): void;
    parse(): number | null;
    update(): void;
    terminate(): void;
    private readonly observer;
}
export declare class NumericInput implements Editor<ObservableValue<number>> {
    private readonly input;
    private readonly printMapping;
    private readonly terminator;
    private value;
    constructor(input: HTMLInputElement, printMapping: PrintMapping<number>);
    with(value: ObservableValue<number>): void;
    clear(): void;
    connect(): void;
    parse(): number | null;
    update(): void;
    terminate(): void;
    private readonly observer;
}
