import {
    Events,
    NumericStepper,
    ObservableValue,
    ObservableValueVoid,
    PrintMapping,
    Terminable,
    Terminator
} from "./common.js"

export interface Editor<T> extends Terminable {
    with(value: T): void

    clear(): void
}

export class Checkbox implements Editor<ObservableValue<boolean>> {
    private readonly terminator = new Terminator()
    private value: ObservableValue<boolean> = ObservableValueVoid.Instance

    constructor(private readonly element: HTMLInputElement) {
        this.init()
    }

    with(value: ObservableValue<boolean>): void {
        this.value.removeObserver(this.observer)
        this.value = value
        this.value.addObserver(this.observer, true)
    }

    clear(): void {
        this.with(ObservableValueVoid.Instance)
    }

    init(): void {
        this.terminator.with(Events.bindEventListener(this.element, "change",
            () => this.value.set(this.element.checked)))
    }

    update() {
        this.element.checked = this.value.get()
    }

    terminate() {
        this.value.removeObserver(this.observer)
        this.terminator.terminate()
    }

    private readonly observer = () => this.update()
}

export class SelectInput<T> implements Editor<ObservableValue<T>> {
    private readonly terminator = new Terminator()
    private readonly options = new Map<T, HTMLOptionElement>()
    private readonly values: T[] = []

    private value: ObservableValue<T> = ObservableValueVoid.Instance

    constructor(private readonly select: HTMLSelectElement,
                private readonly map: Map<string, T>) {
        this.connect()
    }

    with(value: ObservableValue<T>): SelectInput<T> {
        this.value.removeObserver(this.observer)
        this.value = value
        this.value.addObserver(this.observer, true)
        return this
    }

    clear(): void {
        this.with(ObservableValueVoid.Instance)
    }

    terminate() {
        this.value.removeObserver(this.observer)
        this.terminator.terminate()
    }

    private observer = () => this.update()

    private update() {
        const key = this.value.get()
        if (key === undefined) return
        this.options.get(key).selected = true
    }

    private connect() {
        this.map.forEach((some: T, key: string) => {
            const optionElement: HTMLOptionElement = document.createElement("OPTION") as HTMLOptionElement
            optionElement.textContent = key
            optionElement.selected = some === this.value.get()
            this.select.appendChild(optionElement)
            this.values.push(some)
            this.options.set(some, optionElement)
        })
        this.terminator.with(Events.bindEventListener(this.select, "change",
            () => this.value.set(this.values[this.select.selectedIndex])))
    }
}

export class NumericStepperInput implements Editor<ObservableValue<number>> {
    private readonly terminator: Terminator = new Terminator()
    private value: ObservableValue<number> = ObservableValueVoid.Instance
    private readonly decreaseButton: HTMLButtonElement
    private readonly increaseButton: HTMLButtonElement
    private readonly input: HTMLInputElement

    constructor(private readonly parent: HTMLElement,
                private readonly printMapping: PrintMapping<number>,
                private readonly stepper: NumericStepper) {
        const buttons = this.parent.querySelectorAll("button")
        this.decreaseButton = buttons.item(0)
        this.increaseButton = buttons.item(1)
        this.input = this.parent.querySelector("input[type=text]")
        this.connect()
    }

    with(value: ObservableValue<number>): void {
        this.value.removeObserver(this.observer)
        this.value = value
        this.value.addObserver(this.observer, true)
    }

    clear(): void {
        this.with(ObservableValueVoid.Instance)
    }

    connect() {
        this.terminator.with(Events.configRepeatButton(this.decreaseButton, () => this.stepper.decrease(this.value)))
        this.terminator.with(Events.configRepeatButton(this.increaseButton, () => this.stepper.increase(this.value)))
        this.terminator.with(Events.bindEventListener(this.input, "focusin", (focusEvent: FocusEvent) => {
            const blur = (() => {
                const lastFocus: HTMLElement = focusEvent.relatedTarget as HTMLElement
                return () => {
                    this.input.setSelectionRange(0, 0)
                    if (lastFocus === null) {
                        this.input.blur()
                    } else {
                        lastFocus.focus()
                    }
                }
            })()
            const keyboardListener = (event: KeyboardEvent) => {
                switch (event.key) {
                    case "ArrowUp": {
                        event.preventDefault()
                        this.stepper.increase(this.value)
                        this.input.select()
                        break
                    }
                    case "ArrowDown": {
                        event.preventDefault()
                        this.stepper.decrease(this.value)
                        this.input.select()
                        break
                    }
                    case "Escape": {
                        event.preventDefault()
                        this.update()
                        blur()
                        break
                    }
                    case "Enter": {
                        event.preventDefault()
                        const number = this.parse()
                        if (null === number || !this.value.set(number)) {
                            this.update()
                        }
                        blur()
                    }
                }
            }
            this.input.addEventListener("focusout", () =>
                this.input.removeEventListener("keydown", keyboardListener), {once: true})
            this.input.addEventListener("keydown", keyboardListener)
            window.addEventListener("mouseup", () => {
                if (this.input.selectionStart === this.input.selectionEnd) this.input.select()
            }, {once: true})
        }))
    }

    parse(): number | null {
        return this.printMapping.parse(this.input.value)
    }

    update() {
        this.input.value = this.printMapping.print(this.value.get())
    }

    terminate() {
        this.terminator.terminate()
        this.value.removeObserver(this.observer)
    }

    private readonly observer = () => this.update()
}

export class NumericInput implements Editor<ObservableValue<number>> {
    private readonly terminator: Terminator = new Terminator()
    private value: ObservableValue<number> = ObservableValueVoid.Instance

    constructor(private readonly input: HTMLInputElement,
                private readonly printMapping: PrintMapping<number>) {
        this.connect()
    }

    with(value: ObservableValue<number>): void {
        this.value.removeObserver(this.observer)
        this.value = value
        this.value.addObserver(this.observer, true)
    }

    clear(): void {
        this.with(ObservableValueVoid.Instance)
    }

    connect() {
        this.terminator.with(Events.bindEventListener(this.input, "focusin", (focusEvent: FocusEvent) => {
            const blur = (() => {
                const lastFocus: HTMLElement = focusEvent.relatedTarget as HTMLElement
                return () => {
                    this.input.setSelectionRange(0, 0)
                    if (lastFocus === null) {
                        this.input.blur()
                    } else {
                        lastFocus.focus()
                    }
                }
            })()
            const keyboardListener = (event: KeyboardEvent) => {
                switch (event.key) {
                    case "Escape": {
                        event.preventDefault()
                        this.update()
                        blur()
                        break
                    }
                    case "Enter": {
                        event.preventDefault()
                        const number = this.parse()
                        if (null === number || !this.value.set(number)) {
                            this.update()
                        }
                        blur()
                    }
                }
            }
            this.input.addEventListener("focusout", () =>
                this.input.removeEventListener("keydown", keyboardListener), {once: true})
            this.input.addEventListener("keydown", keyboardListener)
            window.addEventListener("mouseup", () => {
                if (this.input.selectionStart === this.input.selectionEnd) this.input.select()
            }, {once: true})
        }))
    }

    parse(): number | null {
        return this.printMapping.parse(this.input.value)
    }

    update() {
        this.input.value = this.printMapping.print(this.value.get())
    }

    terminate() {
        this.terminator.terminate()
        this.value.removeObserver(this.observer)
    }

    private readonly observer = () => this.update()
}