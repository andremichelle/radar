// noinspection JSUnusedGlobalSymbols

export const RENDER_QUANTUM: number = 128 | 0
export const LOG_DB = Math.log(10.0) / 20.0
export const dbToGain = (db: number): number => Math.exp(db * LOG_DB)
export const gainToDb = (gain: number): number => Math.log(gain) / LOG_DB
export const midiToHz = (note: number = 60.0, baseFrequency: number = 440.0): number => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0)
export const numFramesToBars = (numFrames: number, bpm: number, samplingRate: number): number => (numFrames * bpm) / (samplingRate * 240.0)
export const barsToNumFrames = (bars: number, bpm: number, samplingRate: number): number => (bars * samplingRate * 240.0) / bpm
export const barsToSeconds = (bars: number, bpm: number): number => (bars * 240.0) / bpm
export const SILENCE_GAIN = dbToGain(-192.0) // if gain is zero the waa will set streams to undefined

export class RMS {
    private readonly values: Float32Array
    private readonly inv: number
    private sum: number
    private index: number

    constructor(private readonly n: number) {
        this.values = new Float32Array(n)
        this.inv = 1.0 / n
        this.sum = 0.0
        this.index = 0 | 0
    }

    pushPop(squared: number): number {
        this.sum -= this.values[this.index]
        this.sum += squared
        this.values[this.index] = squared
        if (++this.index === this.n) this.index = 0
        return 0.0 >= this.sum ? 0.0 : Math.sqrt(this.sum * this.inv)
    }
}

import {Observable, ObservableImpl, Observer, Terminable} from "../lib/common.js"

export type TransportMessage =
    | { type: "transport-play" }
    | { type: "transport-pause" }
    | { type: "transport-move", position: number }

export interface TransportListener {
    listenToTransport(transport: Transport): Terminable
}

export class Transport implements Observable<TransportMessage> {
    private readonly observable: ObservableImpl<TransportMessage> = new ObservableImpl<TransportMessage>()

    private moving: boolean = false

    constructor() {
    }

    addObserver(observer: Observer<TransportMessage>, notify: boolean): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<TransportMessage>): boolean {
        return this.observable.removeObserver(observer)
    }

    play(): void {
        if (this.moving) return
        this.moving = true
        this.observable.notify({type: "transport-play"})
    }

    pause(): void {
        if (!this.moving) return
        this.moving = false
        this.observable.notify({type: "transport-pause"})
    }

    togglePlayback(): void {
        if (this.moving) {
            this.pause()
        } else {
            this.play()
        }
    }

    stop(): void {
        this.pause()
        this.move(0.0)
    }

    move(position: number): void {
        this.observable.notify({type: "transport-move", position: position})
    }

    terminate(): void {
        this.observable.terminate()
    }
}