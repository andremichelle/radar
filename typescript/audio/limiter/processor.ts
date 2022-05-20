import {dbToGain, gainToDb, RENDER_QUANTUM} from "../common.js"
import {Message} from "./message.js"

registerProcessor("limiter-processor", class extends AudioWorkletProcessor {
    private lookAheadFrames: number = 0 | 0
    private buffer: Float32Array[] = null
    private position: number = 0 | 0
    private remaining: number = 0 | 0
    private slope: number = 0.0
    private envelope: number = 0.0
    private threshold: number = -1.0
    private releaseTime: number
    private releaseCoeff: number

    constructor() {
        super()

        this.port.onmessage = event => {
            const data = event.data as Message
            if (data.type === "set-lookahead") {
                this.lookAhead = data.seconds
            } else if (data.type === "set-threshold") {
                this.threshold = data.db
            }
        }
    }

    set lookAhead(seconds: number) {
        this.lookAheadFrames = Math.ceil(seconds * sampleRate) | 0
        this.buffer = [
            new Float32Array(this.lookAheadFrames),
            new Float32Array(this.lookAheadFrames)
        ]
        this.position = 0 | 0
        this.remaining = 0 | 0
        this.slope = 0.0
        this.envelope = 0.0
        this.releaseTime = 0.1
        this.releaseCoeff = Math.exp(-1.0 / (sampleRate * this.releaseTime))
        this.envelope = 0.0
    }

    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        const buffer = this.buffer
        if (null === buffer) {
            return true
        }
        // This number is found by trying to make the limiter super brick-wall.
        // There is probably a way to calculate it. Only tested for 5ms look-ahead.
        const MAGIC_HEADROOM = -0.42 // -0.41 already does not work with some input
        const frames = this.lookAheadFrames
        const input = inputs[0]
        const output = outputs[0]
        const input0 = input[0]
        const input1 = input[1]
        if (undefined === input0 || undefined === input1) {
            return true
        }
        const output0 = output[0]
        const output1 = output[1]
        const buffer0 = buffer[0]
        const buffer1 = buffer[1]
        for (let i = 0; i < RENDER_QUANTUM; i++) {
            const inp0 = input0[i]
            const inp1 = input1[i]
            const peak = Math.max(Math.abs(inp0), Math.abs(inp1))
            if (this.envelope < peak) {
                this.envelope = peak
            } else {
                this.envelope = peak + this.releaseCoeff * (this.envelope - peak)
            }
            const gain = dbToGain(Math.min(0.0, this.threshold - gainToDb(this.envelope)))
                * dbToGain(MAGIC_HEADROOM - this.threshold)
            output0[i] = buffer0[this.position] * gain
            output1[i] = buffer1[this.position] * gain
            buffer0[this.position] = inp0
            buffer1[this.position] = inp1
            this.position = (this.position + 1) % frames
        }
        return true
    }
})