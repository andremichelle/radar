import {ArrayUtils} from "../../lib/common.js"
import {RENDER_QUANTUM, RMS} from "../common.js"

registerProcessor("meter-processor", class extends AudioWorkletProcessor {
    private readonly numberOfLines: number
    private readonly channelCount: number

    private readonly maxPeaks: Float32Array[]
    private readonly maxSquares: Float32Array[]
    private readonly updateRate: number
    private readonly rmsChannels: RMS[][]

    private updateCount: number = 0 | 0

    constructor(options) {
        super(options)

        this.numberOfLines = options.numberOfInputs
        this.channelCount = options.channelCount
        console.assert(options.numberOfOutputs === this.numberOfLines)

        this.maxPeaks = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount))
        this.maxSquares = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount))

        const rmsSize: number = sampleRate * 0.050 // 50ms
        const fps: number = 60.0
        this.updateRate = (sampleRate / fps) | 0
        this.rmsChannels = ArrayUtils.fill(this.numberOfLines, () => ArrayUtils.fill(this.channelCount, () => new RMS(rmsSize)))
    }

    // noinspection JSUnusedGlobalSymbols
    process(inputs: Float32Array[][], outputs: Float32Array[][]): boolean {
        for (let lineIndex = 0; lineIndex < this.numberOfLines; lineIndex++) {
            const input: Float32Array[] = inputs[lineIndex]
            const output: Float32Array[] = outputs[lineIndex]
            for (let channel: number = 0; channel < this.channelCount; ++channel) {
                const inputChannel: Float32Array = input[channel]
                const outputChannel: Float32Array = output[channel]
                const rms: RMS = this.rmsChannels[lineIndex][channel]
                if (undefined === inputChannel) {
                    this.maxPeaks[lineIndex][channel] = 0.0
                    this.maxSquares[lineIndex][channel] = 0.0
                } else {
                    let maxPeak: number = this.maxPeaks[lineIndex][channel]
                    let maxSquare: number = this.maxSquares[lineIndex][channel]
                    for (let i: number = 0; i < RENDER_QUANTUM; ++i) {
                        const inp: number = outputChannel[i] = inputChannel[i] // we pass the signal
                        maxPeak = Math.max(maxPeak, Math.abs(inp))
                        maxSquare = Math.max(maxSquare, rms.pushPop(inp * inp))
                    }
                    this.maxPeaks[lineIndex][channel] = maxPeak
                    this.maxSquares[lineIndex][channel] = maxSquare
                }
            }
        }
        this.updateCount += RENDER_QUANTUM
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate
            this.port.postMessage({type: "update-meter", maxSquares: this.maxSquares, maxPeaks: this.maxPeaks})
            for (let lineIndex = 0; lineIndex < this.numberOfLines; lineIndex++) {
                for (let channelIndex: number = 0; channelIndex < this.channelCount; ++channelIndex) {
                    this.maxPeaks[lineIndex][channelIndex] *= 0.93
                    this.maxSquares[lineIndex][channelIndex] *= 0.93
                }
            }
        }
        return true
    }
})