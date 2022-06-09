import { ArrayUtils } from "../../lib/common.js";
import { RENDER_QUANTUM, RMS } from "../common.js";
registerProcessor("meter-processor", class extends AudioWorkletProcessor {
    constructor(options) {
        super(options);
        this.updateCount = 0 | 0;
        this.numberOfLines = options.numberOfInputs;
        this.channelCount = options.channelCount;
        console.assert(options.numberOfOutputs === this.numberOfLines);
        this.maxPeaks = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount));
        this.maxSquares = ArrayUtils.fill(this.numberOfLines, () => new Float32Array(this.channelCount));
        const rmsSize = sampleRate * 0.050;
        const fps = 60.0;
        this.updateRate = (sampleRate / fps) | 0;
        this.rmsChannels = ArrayUtils.fill(this.numberOfLines, () => ArrayUtils.fill(this.channelCount, () => new RMS(rmsSize)));
    }
    process(inputs, outputs) {
        for (let lineIndex = 0; lineIndex < this.numberOfLines; lineIndex++) {
            const input = inputs[lineIndex];
            const output = outputs[lineIndex];
            for (let channel = 0; channel < this.channelCount; ++channel) {
                const inputChannel = input[channel];
                const outputChannel = output[channel];
                const rms = this.rmsChannels[lineIndex][channel];
                if (undefined === inputChannel) {
                    this.maxPeaks[lineIndex][channel] = 0.0;
                    this.maxSquares[lineIndex][channel] = 0.0;
                }
                else {
                    let maxPeak = this.maxPeaks[lineIndex][channel];
                    let maxSquare = this.maxSquares[lineIndex][channel];
                    for (let i = 0; i < RENDER_QUANTUM; ++i) {
                        const inp = outputChannel[i] = inputChannel[i];
                        maxPeak = Math.max(maxPeak, Math.abs(inp));
                        maxSquare = Math.max(maxSquare, rms.pushPop(inp * inp));
                    }
                    this.maxPeaks[lineIndex][channel] = maxPeak;
                    this.maxSquares[lineIndex][channel] = maxSquare;
                }
            }
        }
        this.updateCount += RENDER_QUANTUM;
        if (this.updateCount >= this.updateRate) {
            this.updateCount -= this.updateRate;
            this.port.postMessage({ type: "update-meter", maxSquares: this.maxSquares, maxPeaks: this.maxPeaks });
            for (let lineIndex = 0; lineIndex < this.numberOfLines; lineIndex++) {
                for (let channelIndex = 0; channelIndex < this.channelCount; ++channelIndex) {
                    this.maxPeaks[lineIndex][channelIndex] *= 0.93;
                    this.maxSquares[lineIndex][channelIndex] *= 0.93;
                }
            }
        }
        return true;
    }
});
//# sourceMappingURL=processor.js.map