import {barsToNumFrames, dbToGain, numFramesToBars, RENDER_QUANTUM, TransportMessage} from "../common.js"
import {TAU} from "../../lib/math.js"
import {Message} from "./message.js"

registerProcessor("metronome-processor", class extends AudioWorkletProcessor {
    private readonly gain: number = dbToGain(-3.0)
    private readonly scale: number = 1.0 / 4.0
    private readonly duration: number = 1.0 / (1.0 / 32.0)

    private barPosition: number = 0.0
    private bpm: number = 120.0
    private enabled: boolean = false
    private moving: boolean = false
    private phase: number = 0.0
    private frequency: number = 0.0

    constructor() {
        super()

        this.port.onmessage = event => {
            const msg = event.data as Message | TransportMessage
            if (msg.type === "set-bpm") {
                this.bpm = msg.value
            } else if (msg.type === "set-enabled") {
                this.enabled = msg.value
            } else if (msg.type === "transport-play") {
                this.moving = true
            } else if (msg.type === "transport-pause") {
                this.moving = false
            } else if (msg.type === "transport-move") {
                this.barPosition = msg.position
            }
        }
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const barsIncrement: number = numFramesToBars(RENDER_QUANTUM, this.bpm, sampleRate)
        const b0 = this.barPosition
        if (!this.enabled) {
            this.barPosition = b0 + barsIncrement
            return true
        }
        const output = outputs[0][0]
        if (this.moving) {
            const b1 = this.barPosition + barsIncrement
            let index = Math.floor(b0 / this.scale)
            let position = index * this.scale
            let frame = 0 | 0
            while (position < b1) {
                if (position >= b0) {
                    frame = this.advance(output, frame, barsToNumFrames(position - b0, this.bpm, sampleRate) | 0)
                    this.frequency = index % 4 === 0 ? 1760.0 : 880.0
                    this.phase = 0.0
                }
                position = ++index * this.scale
            }
            this.advance(output, frame, RENDER_QUANTUM)
            this.barPosition = b1
        } else {
            this.advance(output, 0, RENDER_QUANTUM)
        }
        return true
    }

    private advance(output: Float32Array, frame: number, to: number): number {
        while (frame < to) {
            output[frame++] = Math.sin(this.phase * this.frequency * TAU)
                * (1.0 - Math.min(1.0, this.phase * this.duration)) * this.gain
            this.phase += 1.0 / sampleRate
        }
        return to
    }
})