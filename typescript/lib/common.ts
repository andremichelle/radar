// noinspection JSUnusedGlobalSymbols

import {ValueMapping} from "./mapping.js"
import {Random} from "./math"

export interface Terminable {
    terminate(): void
}

export const TerminableVoid: Terminable = {
    terminate() {
    }
}

export class Terminator implements Terminable {
    private readonly terminables: Terminable[] = []

    with<T extends Terminable>(terminable: T): T {
        this.terminables.push(terminable)
        return terminable
    }

    terminate(): void {
        while (this.terminables.length) {
            this.terminables.pop().terminate()
        }
    }
}

export interface Option<T> {
    get(): T

    ifPresent<R>(callback: (value: T) => R): R

    contains(value: T): boolean

    isEmpty(): boolean

    nonEmpty(): boolean

    map<U>(callback: (value: T) => U): Option<U>
}

export class Options {
    static valueOf<T>(value: T): Option<T> {
        return null === value || undefined === value ? Options.None : new Options.Some(value)
    }

    static Some = class<T> implements Option<T> {
        constructor(readonly value: T) {
            console.assert(null !== value && undefined !== value, "Cannot be null or undefined")
        }

        get = (): T => this.value
        contains = (value: T): boolean => value === this.value
        ifPresent = <R>(callback: (value: T) => R): R => callback(this.value)
        isEmpty = (): boolean => false
        nonEmpty = (): boolean => true

        map<U>(callback: (value: T) => U): Option<U> {
            return Options.valueOf(callback(this.value))
        }

        toString(): string {
            return `Options.Some(${this.value})`
        }
    }

    static None = new class implements Option<never> {
        get = (): never => {
            throw new Error("Option has no value")
        }
        contains = (_: never): boolean => false
        ifPresent = (_: (value: never) => never): any => {
        }
        isEmpty = (): boolean => true
        nonEmpty = (): boolean => false

        map<U>(callback: (_: never) => U): Option<U> {
            return Options.None
        }

        toString(): string {
            return 'Options.None'
        }
    }
}

export type Observer<VALUE> = (value: VALUE) => void

export interface Observable<VALUE> extends Terminable {
    addObserver(observer: Observer<VALUE>, notify: boolean): Terminable

    removeObserver(observer: Observer<VALUE>): boolean
}

export class ObservableImpl<T> implements Observable<T> {
    private readonly observers: Observer<T>[] = []

    notify(value: T) {
        this.observers.forEach(observer => observer(value))
    }

    addObserver(observer: Observer<T>): Terminable {
        this.observers.push(observer)
        return {terminate: () => this.removeObserver(observer)}
    }

    removeObserver(observer: Observer<T>): boolean {
        let index = this.observers.indexOf(observer)
        if (-1 < index) {
            this.observers.splice(index, 1)
            return true
        }
        return false
    }

    terminate(): void {
        this.observers.splice(0, this.observers.length)
    }
}

export interface Serializer<T> {
    serialize(): T

    deserialize(format: T): Serializer<T>
}

export interface Value<T> {
    set(value: T): boolean

    get(): T
}

export interface ObservableValue<T> extends Value<T>, Observable<T> {
}

export class ObservableValueImpl<T> implements ObservableValue<T> {
    private readonly observable = new ObservableImpl<T>()

    constructor(private value?: T) {
    }

    get(): T {
        return this.value
    }

    set(value: T): boolean {
        if (this.value === value) {
            return false
        }
        this.value = value
        this.observable.notify(value)
        return true
    }

    addObserver(observer: Observer<T>, notify: boolean = false): Terminable {
        if (notify) observer(this.value)
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<T>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
}

export class Parameter<T> implements ObservableValue<T> {
    private readonly observable = new ObservableImpl<T>()

    constructor(readonly valueMapping: ValueMapping<T>,
                readonly printMapping: PrintMapping<T>,
                private value: T) {
    }

    getUnipolar(): number {
        return this.valueMapping.x(this.value)
    }

    setUnipolar(value: number): void {
        this.set(this.valueMapping.y(value))
    }

    print(): string {
        return this.printMapping.print(this.value)
    }

    get(): T {
        return this.value
    }

    set(value: T): boolean {
        if (value === this.value) {
            return
        }
        this.value = value
        this.observable.notify(value)
        return true
    }

    addObserver(observer: Observer<T>, notify: boolean = false): Terminable {
        if (notify) observer(this.value)
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<T>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }
}

export type Parser<Y> = (text: string) => Y | null
export type Printer<Y> = (value: Y) => string

export class PrintMapping<Y> {
    static INTEGER = PrintMapping.integer("")
    static FLOAT_ONE = PrintMapping.float(1, "", "")

    static createBoolean(trueValue: string, falseValue: string) {
        return new PrintMapping(text => {
            return trueValue.toLowerCase() === text.toLowerCase()
        }, value => value ? trueValue : falseValue)
    }

    static UnipolarPercent = new PrintMapping(text => {
        const value = parseFloat(text)
        if (isNaN(value)) return null
        return value / 100.0
    }, value => (value * 100.0).toFixed(1), "", "%")
    static RGB = new PrintMapping<number>(text => {
        if (3 === text.length) {
            text = text.charAt(0) + text.charAt(0) + text.charAt(1) + text.charAt(1) + text.charAt(2) + text.charAt(2)
        }
        if (6 === text.length) {
            return parseInt(text, 16)
        } else {
            return null
        }
    }, value => value.toString(16).padStart(6, "0").toUpperCase(), "#", "")

    static integer(postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseInt(text, 10)
            if (isNaN(value)) return null
            return Math.round(value) | 0
        }, value => String(value), "", postUnit)
    }

    static float(numPrecision: number, preUnit: string, postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseFloat(text)
            if (isNaN(value)) return null
            return value
        }, value => {
            if (isNaN(value)) {
                return "N/A"
            }
            if (!isFinite(value)) {
                return value < 0.0 ? "-∞" : "∞"
            }
            return value.toFixed(numPrecision)
        }, preUnit, postUnit)
    }

    static smallFloat(numPrecision: number, postUnit: string): PrintMapping<number> {
        return new PrintMapping(text => {
            const value = parseFloat(text)
            if (isNaN(value)) return null
            return text.toLowerCase().includes("k") ? value * 1000.0 : value
        }, value => {
            if (value >= 1000.0) {
                return `${(value / 1000.0).toFixed(numPrecision)}k`
            }
            return value.toFixed(numPrecision)
        }, "", postUnit)
    }

    constructor(private readonly parser: Parser<Y>,
                private readonly printer: Printer<Y>,
                private readonly preUnit = "",
                private readonly postUnit = "") {
    }

    parse(text: string): Y | null {
        return this.parser(text.replace(this.preUnit, "").replace(this.postUnit, ""))
    }

    print(value: Y): string {
        return undefined === value ? "" : `${this.preUnit}${this.printer(value)}${this.postUnit}`
    }
}

export interface Stepper {
    decrease(value: ObservableValue<number>): void

    increase(value: ObservableValue<number>): void
}

export class NumericStepper implements Stepper {
    static Integer = new NumericStepper(1)
    static Hundredth = new NumericStepper(0.01)

    constructor(private readonly step: number = 1) {
    }

    decrease(value: ObservableValue<number>): void {
        value.set(Math.round((value.get() - this.step) / this.step) * this.step)
    }

    increase(value: ObservableValue<number>): void {
        value.set(Math.round((value.get() + this.step) / this.step) * this.step)
    }
}

export class ArrayUtils {
    static fill<T>(n: number, factory: (index: number) => T): T[] {
        const array: T[] = []
        for (let i = 0; i < n; i++) {
            array[i] = factory(i)
        }
        return array
    }

    static shuffle(array: ArrayBufferLike, n: number, random: Random) {
        for (let i = 0; i < n; i++) {
            const element = array[i]
            const randomIndex = random.nextInt(0, n - 1)
            array[i] = array[randomIndex]
            array[randomIndex] = element
        }
    }

    static binarySearch = (array: ArrayBufferLike, length: number, key: number): number => {
        let low = 0 | 0
        let high = (length - 1) | 0
        while (low <= high) {
            const mid = (low + high) >>> 1
            const midVal = array[mid]
            if (midVal < key)
                low = mid + 1
            else if (midVal > key)
                high = mid - 1
            else {
                if (midVal === key)
                    return mid
                else if (midVal < key)
                    low = mid + 1
                else
                    high = mid - 1
            }
        }
        return high
    }

    // noinspection JSUnusedLocalSymbols
    private constructor() {
    }
}

export interface SettingsFormat<DATA> {
    class: string
    data: DATA
}

export abstract class Settings<DATA> implements Observable<Settings<DATA>>, Serializer<SettingsFormat<DATA>>, Terminable {
    protected readonly terminator: Terminator = new Terminator()
    protected readonly observable: ObservableImpl<Settings<DATA>> = new ObservableImpl<Settings<DATA>>()

    abstract deserialize(format: SettingsFormat<DATA>): Settings<DATA>

    abstract serialize(): SettingsFormat<DATA>

    protected pack(data?: DATA): SettingsFormat<DATA> {
        return {
            class: this.constructor.name,
            data: data
        }
    }

    protected unpack(format: SettingsFormat<DATA>): DATA {
        console.assert(this.constructor.name === format.class)
        return format.data
    }

    protected bindValue<T>(property: ObservableValue<T>): ObservableValue<T> {
        this.terminator.with(property.addObserver(() => this.observable.notify(this), false))
        return this.terminator.with(property)
    }

    addObserver(observer: Observer<Settings<DATA>>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<Settings<DATA>>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.terminator.terminate()
    }
}

export class Waiting {
    static forFrame(): Promise<void> {
        return new Promise(resolve => requestAnimationFrame(() => resolve()))
    }

    static forFrames(count: number): Promise<void> {
        return new Promise(resolve => {
            const callback = () => {
                if (--count <= 0) resolve()
                else requestAnimationFrame(callback)
            }
            requestAnimationFrame(callback)
        })
    }

    static forAnimationComplete(element: Element): Promise<void> {
        return Waiting.forEvents(element, "animationstart", "animationend")
    }

    static forTransitionComplete(element: Element): Promise<void> {
        return Waiting.forEvents(element, "transitionstart", "transitionend")
    }

    static forEvent(element: Element, type: string): Promise<void> {
        return new Promise<void>((resolve) =>
            element.addEventListener(type, () => resolve(), {once: true}))
    }

    private static forEvents(element: Element, startType: string, endType: string): Promise<void> {
        let numProperties = 0
        element.addEventListener(startType, event => {
            if (event.target === element) {
                numProperties++
            }
        })
        return new Promise<void>((resolve) =>
            element.addEventListener(endType, event => {
                if (event.target === element) {
                    if (--numProperties === 0) {
                        resolve()
                    }
                    console.assert(numProperties >= 0)
                }
            }))
    }
}

export class Events {
    static preventDefault = event => event.preventDefault()

    static async toPromise<E extends Event>(target: EventTarget, type: string): Promise<E> {
        return new Promise<E>(resolve => target
            .addEventListener(type, (event: E) => resolve(event), {once: true}))
    }

    static bindEventListener(target: EventTarget,
                             type: string, listener: EventListenerOrEventListenerObject,
                             options?: AddEventListenerOptions): Terminable {
        target.addEventListener(type, listener, options)
        return {terminate: () => target.removeEventListener(type, listener, options)}
    }
}

export class HTMLRadioGroup implements ObservableValue<string> {
    private readonly terminator: Terminator = new Terminator()
    private readonly observable: ObservableImpl<string> = this.terminator.with(new ObservableImpl<string>())

    constructor(private readonly form: HTMLFormElement, private readonly name: string) {
        this.terminator.with(Events.bindEventListener(this.form, 'change', (event: Event): void => {
            if (event.target instanceof HTMLInputElement) {
                this.observable.notify(event.target.value)
            }
        }))
    }

    set(value: string): boolean {
        const element: HTMLInputElement = this.form.querySelector(`input[type=radio][name=${this.name}][value=${value}]`)
        if (element === null) {
            throw new Error(`value not found in ${this.form}`)
        }
        if (element.checked) {
            return false
        }
        element.checked = true
        this.observable.notify(value)
        return true
    }

    get(): string {
        const element: HTMLInputElement = this.form.querySelector(`input[type=radio][name=${this.name}]:checked`)
        if (element === null) {
            throw new Error(`value not found in ${this.form}`)
        }
        return element.value
    }

    values(): string[] {
        return Array.from(this.form.querySelectorAll(`input[type=radio][name=${this.name}]`))
            .map((input: HTMLInputElement) => input.value)
    }

    addObserver(observer: Observer<string>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<string>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.terminator.terminate()
    }
}