import {
    NoArgType,
    NumericStepper,
    ObservableValue,
    ObservableValueImpl,
    Option,
    Options,
    PrintMapping,
    Terminable,
    Terminator
} from "./common.js"
import {Checkbox, Editor, NumericInput, NumericStepperInput, SelectInput} from "./inputs.js"

class NumericInputFactory {
    static create(printMapping: PrintMapping<number>): [HTMLInputElement, NumericInput] {
        const htmlElement = NumericInputFactory.createElement()
        return [htmlElement, new NumericInput(htmlElement, printMapping)]
    }

    private static createElement(): HTMLInputElement {
        return NumericInputFactory.template.cloneNode(true) as HTMLInputElement
    }

    private static readonly template: HTMLInputElement = new DOMParser().parseFromString(`
                    <input type="text">`, "text/html")
        .body.querySelectorAll("input").item(0)
}

class NumericStepperInputFactory {
    static create(printMapping: PrintMapping<number>, stepper: NumericStepper): [HTMLFieldSetElement, NumericStepperInput] {
        const htmlElement = NumericStepperInputFactory.createElement()
        return [htmlElement, new NumericStepperInput(htmlElement, printMapping, stepper)]
    }

    private static createElement(): HTMLFieldSetElement {
        return NumericStepperInputFactory.template.cloneNode(true) as HTMLFieldSetElement
    }

    private static readonly template: HTMLFieldSetElement = new DOMParser().parseFromString(`
                    <fieldset class="stepper">
                        <button>◀︎</button>
                        <input type="text">
                        <button>▶</button>
                    </fieldset>`, "text/html")
        .body.querySelectorAll("fieldset").item(0)
}

class SelectInputFactory {
    static create<T>(map: Map<string, T>): [HTMLElement, SelectInput<T>] {
        const htmlElement = SelectInputFactory.createElement()
        return [htmlElement, new SelectInput(htmlElement, map)]
    }

    private static createElement(): HTMLSelectElement {
        return SelectInputFactory.template.cloneNode(true) as HTMLSelectElement
    }

    private static readonly template: HTMLSelectElement = new DOMParser().parseFromString(`<select></select>`, "text/html")
        .body.querySelectorAll("select").item(0)
}

class CheckboxFactory {
    static create<T>(): [HTMLElement, Checkbox] {
        const htmlElement = CheckboxFactory.createElement()
        return [htmlElement, new Checkbox(htmlElement.querySelector("input"))]
    }

    private static createElement(): HTMLLabelElement {
        return CheckboxFactory.instance.template.cloneNode(true) as HTMLLabelElement
    }

    private static instance = new CheckboxFactory()

    private readonly template: HTMLLabelElement = new DOMParser().parseFromString(`
            <label class="checkbox slider">
                <input type="checkbox"/>
                <span></span>
            </label>
          `, "text/html")
        .body.querySelectorAll("label").item(0)

    private constructor() {
    }
}

export class UIControllerLayout implements Terminable {
    private readonly terminator: Terminator = new Terminator()

    constructor(private readonly container?: HTMLElement) {
        if (container === undefined) {
            this.container = document.createElement("div")
            this.container.classList.add("two-columns")
        } else {
            console.assert(this.container.classList.contains("two-columns"))
        }
    }

    element(): HTMLElement {
        return this.container
    }

    createNumericStepper(labelText: string, printMapping: PrintMapping<number>, stepper: NumericStepper): NumericStepperInput {
        const input = NumericStepperInputFactory.create(printMapping, stepper)
        this.append(UIControllerLayout.createLabel(labelText), input[0])
        return this.terminator.with(input[1])
    }

    createNumericInput(labelText: string, printMapping: PrintMapping<number>): NumericInput {
        const input = NumericInputFactory.create(printMapping)
        this.append(UIControllerLayout.createLabel(labelText), input[0])
        return this.terminator.with(input[1])
    }

    createSelect<T>(labelText: string, map: Map<string, T>): SelectInput<T> {
        const input = SelectInputFactory.create(map)
        this.append(UIControllerLayout.createLabel(labelText), input[0])
        return this.terminator.with(input[1])
    }

    createCheckbox(labelText: string): Checkbox {
        const input = CheckboxFactory.create()
        this.append(UIControllerLayout.createLabel(labelText), input[0])
        return this.terminator.with(input[1])
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private append(label: HTMLLabelElement, element: HTMLElement): void {
        this.terminator.with({
            terminate: () => {
                label.remove()
                element.remove()
            }
        })
        this.container.append(label)
        this.container.append(element)
    }

    private static createLabel(labelText: string): HTMLLabelElement {
        const labelElement = document.createElement("label")
        labelElement.classList.add("name")
        labelElement.textContent = labelText
        return labelElement
    }
}

export interface ControlBuilder<T> {
    build(layout: UIControllerLayout, value: T): void

    availableTypes: Map<string, NoArgType<T>>
}

export class TypeSwitchEditor<T extends Terminable> implements Editor<ObservableValue<T>> {
    private readonly terminator: Terminator = new Terminator()

    private readonly selectLayout: UIControllerLayout
    private readonly controllerLayout: UIControllerLayout

    private readonly typeValue: ObservableValue<NoArgType<T>>
    private readonly typeSelectInput: SelectInput<NoArgType<T>>

    private editable: Option<ObservableValue<T>> = Options.None
    private subscription: Option<Terminable> = Options.None

    constructor(private readonly parentElement: HTMLElement,
                private readonly controlBuilder: ControlBuilder<T>, name: string) {
        this.selectLayout = this.terminator.with(new UIControllerLayout(parentElement))
        this.controllerLayout = this.terminator.with(new UIControllerLayout(parentElement))

        this.typeValue = this.terminator.with(new ObservableValueImpl(controlBuilder.availableTypes[0]))
        this.typeSelectInput = this.selectLayout.createSelect(name, controlBuilder.availableTypes)
        this.typeSelectInput.with(this.typeValue)
        this.terminator.with(this.typeValue.addObserver(type => this.editable.ifPresent(value => {
            value.get().terminate()
            value.set(new type())
        }), false))
    }

    with(value: ObservableValue<T>): void {
        this.editable = Options.None
        this.subscription.ifPresent(_ => _.terminate())
        this.subscription = Options.valueOf(value.addObserver(value => this.updateType(value), true))
        this.editable = Options.valueOf(value)
    }

    clear(): void {
        this.subscription.ifPresent(_ => _.terminate())
        this.subscription = Options.None
        this.editable = Options.None
        this.controllerLayout.terminate()
    }

    terminate(): void {
        this.terminator.terminate()
    }

    private updateType(value: T): void {
        this.controllerLayout.terminate()
        this.typeValue.set(value.constructor as NoArgType<T>)
        this.controlBuilder.build(this.controllerLayout, value)
    }
}