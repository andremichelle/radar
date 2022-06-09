var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export const TerminableVoid = {
    terminate() {
    }
};
export class Terminator {
    constructor() {
        this.terminables = [];
    }
    with(terminable) {
        this.terminables.push(terminable);
        return terminable;
    }
    terminate() {
        while (this.terminables.length) {
            this.terminables.pop().terminate();
        }
    }
}
export class Options {
    static valueOf(value) {
        return null === value || undefined === value ? Options.None : new Options.Some(value);
    }
}
Options.Some = class {
    constructor(value) {
        this.value = value;
        this.get = () => this.value;
        this.contains = (value) => value === this.value;
        this.ifPresent = (callback) => callback(this.value);
        this.isEmpty = () => false;
        this.nonEmpty = () => true;
        console.assert(null !== value && undefined !== value, "Cannot be null or undefined");
    }
    map(callback) {
        return Options.valueOf(callback(this.value));
    }
    toString() {
        return `Options.Some(${this.value})`;
    }
};
Options.None = new class {
    constructor() {
        this.get = () => {
            throw new Error("Option has no value");
        };
        this.contains = (_) => false;
        this.ifPresent = (_) => {
        };
        this.isEmpty = () => true;
        this.nonEmpty = () => false;
    }
    map(callback) {
        return Options.None;
    }
    toString() {
        return 'Options.None';
    }
};
export class ObservableImpl {
    constructor() {
        this.observers = [];
    }
    notify(value) {
        this.observers.forEach(observer => observer(value));
    }
    addObserver(observer) {
        this.observers.push(observer);
        return { terminate: () => this.removeObserver(observer) };
    }
    removeObserver(observer) {
        let index = this.observers.indexOf(observer);
        if (-1 < index) {
            this.observers.splice(index, 1);
            return true;
        }
        return false;
    }
    terminate() {
        this.observers.splice(0, this.observers.length);
    }
}
export class ObservableValueImpl {
    constructor(value) {
        this.value = value;
        this.observable = new ObservableImpl();
    }
    get() {
        return this.value;
    }
    set(value) {
        if (this.value === value) {
            return false;
        }
        this.value = value;
        this.observable.notify(value);
        return true;
    }
    addObserver(observer, notify = false) {
        if (notify)
            observer(this.value);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export class ObservableValueVoid {
    addObserver(observer) {
        return TerminableVoid;
    }
    get() {
    }
    removeObserver(observer) {
        return false;
    }
    set(value) {
        return true;
    }
    terminate() {
    }
}
ObservableValueVoid.Instance = new ObservableValueVoid();
export class Parameter {
    constructor(valueMapping, printMapping, value) {
        this.valueMapping = valueMapping;
        this.printMapping = printMapping;
        this.value = value;
        this.observable = new ObservableImpl();
    }
    getUnipolar() {
        return this.valueMapping.x(this.value);
    }
    setUnipolar(value) {
        this.set(this.valueMapping.y(value));
    }
    print() {
        return this.printMapping.print(this.value);
    }
    get() {
        return this.value;
    }
    set(value) {
        if (value === this.value) {
            return;
        }
        this.value = value;
        this.observable.notify(value);
        return true;
    }
    addObserver(observer, notify = false) {
        if (notify)
            observer(this.value);
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
}
export class PrintMapping {
    constructor(parser, printer, preUnit = "", postUnit = "") {
        this.parser = parser;
        this.printer = printer;
        this.preUnit = preUnit;
        this.postUnit = postUnit;
    }
    static createBoolean(trueValue, falseValue) {
        return new PrintMapping(text => {
            return trueValue.toLowerCase() === text.toLowerCase();
        }, value => value ? trueValue : falseValue);
    }
    static integer(postUnit) {
        return new PrintMapping(text => {
            const value = parseInt(text, 10);
            if (isNaN(value))
                return null;
            return Math.round(value) | 0;
        }, value => String(value), "", postUnit);
    }
    static float(numPrecision, preUnit, postUnit) {
        return new PrintMapping(text => {
            const value = parseFloat(text);
            if (isNaN(value))
                return null;
            return value;
        }, value => {
            if (isNaN(value)) {
                return "N/A";
            }
            if (!isFinite(value)) {
                return value < 0.0 ? "-∞" : "∞";
            }
            return value.toFixed(numPrecision);
        }, preUnit, postUnit);
    }
    static smallFloat(numPrecision, postUnit) {
        return new PrintMapping(text => {
            const value = parseFloat(text);
            if (isNaN(value))
                return null;
            return text.toLowerCase().includes("k") ? value * 1000.0 : value;
        }, value => {
            if (value >= 1000.0) {
                return `${(value / 1000.0).toFixed(numPrecision)}k`;
            }
            return value.toFixed(numPrecision);
        }, "", postUnit);
    }
    parse(text) {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""));
    }
    print(value) {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`;
    }
}
PrintMapping.INTEGER = PrintMapping.integer("");
PrintMapping.FLOAT_ONE = PrintMapping.float(1, "", "");
PrintMapping.UnipolarPercent = new PrintMapping(text => {
    const value = parseFloat(text);
    if (isNaN(value))
        return null;
    return value / 100.0;
}, value => (value * 100.0).toFixed(1), "", "%");
PrintMapping.RGB = new PrintMapping(text => {
    if (3 === text.length) {
        text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2);
    }
    if (6 === text.length) {
        return parseInt(text, 16);
    }
    else {
        return null;
    }
}, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "");
export class NumericStepper {
    constructor(step = 1) {
        this.step = step;
    }
    decrease(value) {
        value.set(Math.round((value.get() - this.step) / this.step) * this.step);
    }
    increase(value) {
        value.set(Math.round((value.get() + this.step) / this.step) * this.step);
    }
}
NumericStepper.Integer = new NumericStepper(1);
NumericStepper.Hundredth = new NumericStepper(0.01);
export class ArrayUtils {
    constructor() {
    }
    static fill(n, factory) {
        const array = [];
        for (let i = 0; i < n; i++) {
            array[i] = factory(i);
        }
        return array;
    }
    static shuffle(array, n, random) {
        for (let i = 0; i < n; i++) {
            const element = array[i];
            const randomIndex = random.nextInt(0, n - 1);
            array[i] = array[randomIndex];
            array[randomIndex] = element;
        }
    }
}
ArrayUtils.binarySearch = (array, length, key) => {
    let low = 0 | 0;
    let high = (length - 1) | 0;
    while (low <= high) {
        const mid = (low + high) >>> 1;
        const midVal = array[mid];
        if (midVal < key)
            low = mid + 1;
        else if (midVal > key)
            high = mid - 1;
        else {
            if (midVal === key)
                return mid;
            else if (midVal < key)
                low = mid + 1;
            else
                high = mid - 1;
        }
    }
    return high;
};
export class Settings {
    constructor() {
        this.terminator = new Terminator();
        this.observable = new ObservableImpl();
    }
    pack(data) {
        return {
            class: this.constructor.name,
            data: data
        };
    }
    unpack(format) {
        console.assert(this.constructor.name === format.class);
        return format.data;
    }
    bindValue(property) {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false));
        return this.terminator.with(property);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.terminator.terminate();
    }
}
export class Waiting {
    static forFrame() {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    }
    static forFrames(count) {
        return new Promise(resolve => {
            const callback = () => {
                if (--count <= 0)
                    resolve();
                else
                    requestAnimationFrame(callback);
            };
            requestAnimationFrame(callback);
        });
    }
    static forAnimationComplete(element) {
        return Waiting.forEvents(element, "animationstart", "animationend");
    }
    static forTransitionComplete(element) {
        return Waiting.forEvents(element, "transitionstart", "transitionend");
    }
    static forEvent(element, type) {
        return new Promise((resolve) => element.addEventListener(type, () => resolve(), { once: true }));
    }
    static forEvents(element, startType, endType) {
        let numProperties = 0;
        element.addEventListener(startType, event => {
            if (event.target === element) {
                numProperties++;
            }
        });
        return new Promise((resolve) => element.addEventListener(endType, event => {
            if (event.target === element) {
                if (--numProperties === 0) {
                    resolve();
                }
                console.assert(numProperties >= 0);
            }
        }));
    }
}
export class Events {
    static toPromise(target, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => target
                .addEventListener(type, (event) => resolve(event), { once: true }));
        });
    }
    static bindEventListener(target, type, listener, options) {
        target.addEventListener(type, listener, options);
        return { terminate: () => target.removeEventListener(type, listener, options) };
    }
    static configRepeatButton(button, callback) {
        const mouseDownListener = () => {
            let lastTime = Date.now();
            let delay = 500.0;
            const repeat = () => {
                if (!isNaN(lastTime)) {
                    if (Date.now() - lastTime > delay) {
                        lastTime = Date.now();
                        delay *= 0.75;
                        callback();
                    }
                    requestAnimationFrame(repeat);
                }
            };
            requestAnimationFrame(repeat);
            callback();
            window.addEventListener("mouseup", () => {
                lastTime = NaN;
                delay = Number.MAX_VALUE;
            }, { once: true });
        };
        button.addEventListener("mousedown", mouseDownListener);
        return { terminate: () => button.removeEventListener("mousedown", mouseDownListener) };
    }
}
Events.preventDefault = event => event.preventDefault();
export class HTMLRadioGroup {
    constructor(form, name) {
        this.form = form;
        this.name = name;
        this.terminator = new Terminator();
        this.observable = this.terminator.with(new ObservableImpl());
        this.terminator.with(Events.bindEventListener(this.form, 'change', (event) => {
            const inputElement = event.target;
            if (inputElement instanceof HTMLInputElement) {
                if (inputElement.name === name) {
                    this.observable.notify(inputElement.value);
                }
            }
        }));
    }
    set(value) {
        const element = this.form.querySelector(`input[type=radio][name=${this.name}][value=${value}]`);
        if (element === null) {
            throw new Error(`value not found in ${this.form}`);
        }
        if (element.checked) {
            return false;
        }
        element.checked = true;
        this.observable.notify(value);
        return true;
    }
    get() {
        const element = this.form.querySelector(`input[type=radio][name=${this.name}]:checked`);
        if (element === null) {
            throw new Error(`value not found in ${this.form}`);
        }
        return element.value;
    }
    values() {
        return Array.from(this.form.querySelectorAll(`input[type=radio][name=${this.name}]`))
            .map((input) => input.value);
    }
    addObserver(observer, notify) {
        if (notify) {
            observer(this.get());
        }
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.terminator.terminate();
    }
}
//# sourceMappingURL=common.js.map