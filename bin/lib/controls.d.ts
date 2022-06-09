import { NoArgType, NumericStepper, ObservableValue, PrintMapping, Terminable } from "./common.js";
import { Checkbox, Editor, NumericInput, NumericStepperInput, SelectInput } from "./inputs.js";
export declare class UIControllerLayout implements Terminable {
    private readonly container?;
    private readonly terminator;
    constructor(container?: HTMLElement);
    element(): HTMLElement;
    createNumericStepper(labelText: string, printMapping: PrintMapping<number>, stepper: NumericStepper): NumericStepperInput;
    createNumericInput(labelText: string, printMapping: PrintMapping<number>): NumericInput;
    createSelect<T>(labelText: string, map: Map<string, T>): SelectInput<T>;
    createCheckbox(labelText: string): Checkbox;
    terminate(): void;
    private append;
    private static createLabel;
}
export interface ControlBuilder<T> {
    build(layout: UIControllerLayout, value: T): void;
    availableTypes: Map<string, NoArgType<T>>;
}
export declare class TypeSwitchEditor<T extends Terminable> implements Editor<ObservableValue<T>> {
    private readonly parentElement;
    private readonly controlBuilder;
    private readonly terminator;
    private readonly selectLayout;
    private readonly controllerLayout;
    private readonly typeValue;
    private readonly typeSelectInput;
    private editable;
    private subscription;
    constructor(parentElement: HTMLElement, controlBuilder: ControlBuilder<T>, name: string);
    with(value: ObservableValue<T>): void;
    clear(): void;
    terminate(): void;
    private updateType;
}
