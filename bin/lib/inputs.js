import { Events, ObservableValueVoid, Terminator } from "./common.js";
export class Checkbox {
    constructor(element) {
        this.element = element;
        this.terminator = new Terminator();
        this.value = ObservableValueVoid.Instance;
        this.observer = () => this.update();
        this.init();
    }
    with(value) {
        this.value.removeObserver(this.observer);
        this.value = value;
        this.value.addObserver(this.observer, true);
    }
    clear() {
        this.with(ObservableValueVoid.Instance);
    }
    init() {
        this.terminator.with(Events.bindEventListener(this.element, "change", () => this.value.set(this.element.checked)));
    }
    update() {
        this.element.checked = this.value.get();
    }
    terminate() {
        this.value.removeObserver(this.observer);
        this.terminator.terminate();
    }
}
export class SelectInput {
    constructor(select, map) {
        this.select = select;
        this.map = map;
        this.terminator = new Terminator();
        this.options = new Map();
        this.values = [];
        this.value = ObservableValueVoid.Instance;
        this.observer = () => this.update();
        this.connect();
    }
    with(value) {
        this.value.removeObserver(this.observer);
        this.value = value;
        this.value.addObserver(this.observer, true);
        return this;
    }
    clear() {
        this.with(ObservableValueVoid.Instance);
    }
    terminate() {
        this.value.removeObserver(this.observer);
        this.terminator.terminate();
    }
    update() {
        const key = this.value.get();
        if (key === undefined)
            return;
        this.options.get(key).selected = true;
    }
    connect() {
        this.map.forEach((some, key) => {
            const optionElement = document.createElement("OPTION");
            optionElement.textContent = key;
            optionElement.selected = some === this.value.get();
            this.select.appendChild(optionElement);
            this.values.push(some);
            this.options.set(some, optionElement);
        });
        this.terminator.with(Events.bindEventListener(this.select, "change", () => this.value.set(this.values[this.select.selectedIndex])));
    }
}
export class NumericStepperInput {
    constructor(parent, printMapping, stepper) {
        this.parent = parent;
        this.printMapping = printMapping;
        this.stepper = stepper;
        this.terminator = new Terminator();
        this.value = ObservableValueVoid.Instance;
        this.observer = () => this.update();
        const buttons = this.parent.querySelectorAll("button");
        this.decreaseButton = buttons.item(0);
        this.increaseButton = buttons.item(1);
        this.input = this.parent.querySelector("input[type=text]");
        this.connect();
    }
    with(value) {
        this.value.removeObserver(this.observer);
        this.value = value;
        this.value.addObserver(this.observer, true);
    }
    clear() {
        this.with(ObservableValueVoid.Instance);
    }
    connect() {
        this.terminator.with(Events.configRepeatButton(this.decreaseButton, () => this.stepper.decrease(this.value)));
        this.terminator.with(Events.configRepeatButton(this.increaseButton, () => this.stepper.increase(this.value)));
        this.terminator.with(Events.bindEventListener(this.input, "focusin", (focusEvent) => {
            const blur = (() => {
                const lastFocus = focusEvent.relatedTarget;
                return () => {
                    this.input.setSelectionRange(0, 0);
                    if (lastFocus === null) {
                        this.input.blur();
                    }
                    else {
                        lastFocus.focus();
                    }
                };
            })();
            const keyboardListener = (event) => {
                switch (event.key) {
                    case "ArrowUp": {
                        event.preventDefault();
                        this.stepper.increase(this.value);
                        this.input.select();
                        break;
                    }
                    case "ArrowDown": {
                        event.preventDefault();
                        this.stepper.decrease(this.value);
                        this.input.select();
                        break;
                    }
                    case "Escape": {
                        event.preventDefault();
                        this.update();
                        blur();
                        break;
                    }
                    case "Enter": {
                        event.preventDefault();
                        const number = this.parse();
                        if (null === number || !this.value.set(number)) {
                            this.update();
                        }
                        blur();
                    }
                }
            };
            this.input.addEventListener("focusout", () => this.input.removeEventListener("keydown", keyboardListener), { once: true });
            this.input.addEventListener("keydown", keyboardListener);
            window.addEventListener("mouseup", () => {
                if (this.input.selectionStart === this.input.selectionEnd)
                    this.input.select();
            }, { once: true });
        }));
    }
    parse() {
        return this.printMapping.parse(this.input.value);
    }
    update() {
        this.input.value = this.printMapping.print(this.value.get());
    }
    terminate() {
        this.terminator.terminate();
        this.value.removeObserver(this.observer);
    }
}
export class NumericInput {
    constructor(input, printMapping) {
        this.input = input;
        this.printMapping = printMapping;
        this.terminator = new Terminator();
        this.value = ObservableValueVoid.Instance;
        this.observer = () => this.update();
        this.connect();
    }
    with(value) {
        this.value.removeObserver(this.observer);
        this.value = value;
        this.value.addObserver(this.observer, true);
    }
    clear() {
        this.with(ObservableValueVoid.Instance);
    }
    connect() {
        this.terminator.with(Events.bindEventListener(this.input, "focusin", (focusEvent) => {
            const blur = (() => {
                const lastFocus = focusEvent.relatedTarget;
                return () => {
                    this.input.setSelectionRange(0, 0);
                    if (lastFocus === null) {
                        this.input.blur();
                    }
                    else {
                        lastFocus.focus();
                    }
                };
            })();
            const keyboardListener = (event) => {
                switch (event.key) {
                    case "Escape": {
                        event.preventDefault();
                        this.update();
                        blur();
                        break;
                    }
                    case "Enter": {
                        event.preventDefault();
                        const number = this.parse();
                        if (null === number || !this.value.set(number)) {
                            this.update();
                        }
                        blur();
                    }
                }
            };
            this.input.addEventListener("focusout", () => this.input.removeEventListener("keydown", keyboardListener), { once: true });
            this.input.addEventListener("keydown", keyboardListener);
            window.addEventListener("mouseup", () => {
                if (this.input.selectionStart === this.input.selectionEnd)
                    this.input.select();
            }, { once: true });
        }));
    }
    parse() {
        return this.printMapping.parse(this.input.value);
    }
    update() {
        this.input.value = this.printMapping.print(this.value.get());
    }
    terminate() {
        this.terminator.terminate();
        this.value.removeObserver(this.observer);
    }
}
//# sourceMappingURL=inputs.js.map