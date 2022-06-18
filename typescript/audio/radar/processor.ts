import {TAU} from "../../lib/math.js"
import {barsToNumFrames, RENDER_QUANTUM, TransportMessage} from "../common.js"
import {RadarMessage} from "./message.js"
import {Pattern} from "./pattern.js"
import {Ray} from "./ray.js"

const UpdateBlocks: number = Math.floor(sampleRate / RENDER_QUANTUM / 60) | 0
const BestCorrelationWindow = 512
const CrossLength = 1024

registerProcessor("radar", class extends AudioWorkletProcessor {
    private readonly pattern = new Pattern()
    private readonly ray: Ray = new Ray()

    private remaining: number = UpdateBlocks
    private audio: Float32Array[] = null
    private frames: number = 0 | 0
    private headA: number = -1
    private headB: number = -1
    private headCross: number = 0
    private headDirection: boolean = true
    private phase: number = 0.0
    private phaseIncr: number = 0.0
    private moving: boolean = false

    constructor() {
        super()

        this.port.onmessage = event => {
            const message = event.data as RadarMessage | TransportMessage
            if (message.type === "set-audio") {
                this.audio = message.channels
                this.frames = message.frames
            } else if (message.type === "update-pattern") {
                this.pattern.deserialize(message.format)
                const bpm = this.pattern.getBpm().get()
                const bars = this.pattern.getBars().get()
                this.phaseIncr = 1.0 / barsToNumFrames(bars, bpm, sampleRate)
            } else if (message.type === "transport-play") {
                this.moving = true
            } else if (message.type === "transport-pause") {
                this.moving = false
            } else if (message.type === "transport-move") {
                throw new Error('Not implemented')
            }
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        if (this.audio === null || !this.moving) return true

        const output: Float32Array[] = outputs[0]
        const outL = output[0]
        const outR = output[1]
        const audioL = this.audio[0]
        const audioR = this.audio[1]
        if (this.headA === -1 || this.headB === -1) {
            this.headA = this.headB = this.map()
        }
        for (let i = 0; i < RENDER_QUANTUM; i++) {
            if (this.headDirection) {
                if (++this.headCross === CrossLength) {
                    this.headA = this.bestCorrelation(this.headB, this.map())
                    this.headDirection = false
                }
            } else {
                if (--this.headCross === 0) {
                    this.headB = this.bestCorrelation(this.headA, this.map())
                    this.headDirection = true
                }
            }
            const alpha = this.headCross / CrossLength
            const pA = this.headA % this.frames
            const pB = this.headB % this.frames
            outL[i] = audioL[pA] * (1.0 - alpha) + audioL[pB] * alpha
            outR[i] = audioR[pA] * (1.0 - alpha) + audioR[pB] * alpha
            this.phase += this.phaseIncr
            this.headA++
            this.headB++
        }
        if (--this.remaining === 0) {
            this.remaining = UpdateBlocks
            this.port.postMessage(this.phase)
        }
        return true
    }

    map(): number {
        const origin = this.pattern.getOrigin()
        this.ray.reuse(this.phase * TAU, origin.x, origin.y)
        return Math.floor(this.ray.eval(this.pattern.getObstacles()) / TAU * this.frames)
    }

    bestCorrelation(prev: number, next: number): number {
        const ch0 = this.audio[0]
        let min = Number.POSITIVE_INFINITY
        let index = 0
        for (let j = 0; j < BestCorrelationWindow; j++) {
            const curr = next + j
            let corr = 0.0
            for (let i = 0; i < BestCorrelationWindow; i++) {
                const a = ch0[(prev + i) % this.frames]
                const b = ch0[(curr + i) % this.frames]
                corr += (a - b) * (a - b)
            }
            if (min > corr) {
                min = corr
                index = j
            }
        }
        return (next + index) % this.frames
    }
})