import { ArrayUtils } from "../../lib/common.js";
import { dbToGain, gainToDb } from "../common.js";
export class MeterWorklet extends AudioWorkletNode {
    constructor(context, numLines, channelCount) {
        super(context, "meter-processor", {
            numberOfInputs: numLines,
            numberOfOutputs: numLines,
            outputChannelCount: new Array(numLines).fill(channelCount),
            channelCount: channelCount,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.numLines = numLines;
        this.channelCount = channelCount;
        this.peaks = ArrayUtils.fill(numLines, () => new Float32Array(channelCount));
        this.squares = ArrayUtils.fill(numLines, () => new Float32Array(channelCount));
        this.peakHoldValue = ArrayUtils.fill(numLines, () => new Float32Array(channelCount));
        this.releasePeakHoldTime = ArrayUtils.fill(numLines, () => new Float32Array(channelCount));
        this.port.onmessage = event => {
            const now = performance.now();
            const message = event.data;
            for (let lineIndex = 0; lineIndex < numLines; lineIndex++) {
                this.peaks[lineIndex] = message.maxPeaks[lineIndex];
                this.squares[lineIndex] = message.maxSquares[lineIndex];
                for (let channelIndex = 0; channelIndex < channelCount; ++channelIndex) {
                    const maxPeak = this.peaks[lineIndex][channelIndex];
                    if (this.peakHoldValue[lineIndex][channelIndex] <= maxPeak) {
                        this.peakHoldValue[lineIndex][channelIndex] = maxPeak;
                        this.releasePeakHoldTime[lineIndex][channelIndex] = now + (1.0 < maxPeak
                            ? MeterWorklet.CLIP_HOLD_DURATION
                            : MeterWorklet.PEAK_HOLD_DURATION);
                    }
                }
            }
        };
    }
    static loadModule(context) {
        return context.audioWorklet.addModule("bin/audio/meter/processor.js");
    }
}
MeterWorklet.PEAK_HOLD_DURATION = 1000.0;
MeterWorklet.CLIP_HOLD_DURATION = 2000.0;
export class StereoMeterWorklet extends MeterWorklet {
    constructor(context) {
        super(context, 1, 2);
        this.meterHPadding = 5;
        this.meterSegmentWidth = 12;
        this.meterSegmentHeight = 3;
        this.meterSegmentHGap = 2;
        this.meterSegmentVGap = 10;
        this.meterSegmentCount = 16;
        this.meterWidth = this.meterSegmentCount * (this.meterSegmentWidth + this.meterSegmentHGap) - this.meterSegmentHGap;
        this.width = this.meterHPadding * 2.0 + this.meterWidth;
        this.height = this.meterSegmentVGap + this.meterSegmentHeight * 2;
        this.labelStepsDb = 3.0;
        this.maxDb = 3.0;
        this.minDb = this.maxDb - this.labelStepsDb * (this.meterSegmentCount - 1);
        this.scale = NaN;
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = this.width + "px";
        this.canvas.style.height = this.height + "px";
        this.graphics = this.canvas.getContext("2d");
        const lowGain = "rgba(60,60,60)";
        const highGain = "rgb(60,60,60)";
        const clipGain = "rgb(160,16,0)";
        this.gradient = this.graphics.createLinearGradient(this.meterHPadding, 0, this.meterHPadding + this.meterWidth, 0);
        this.gradient.addColorStop(0.0, lowGain);
        this.gradient.addColorStop(this.dbToNorm(-9.0), lowGain);
        this.gradient.addColorStop(this.dbToNorm(-9.0), highGain);
        this.gradient.addColorStop(this.dbToNorm(0.0), highGain);
        this.gradient.addColorStop(this.dbToNorm(0.0), clipGain);
        this.gradient.addColorStop(1.0, clipGain);
        this.updater = () => this.update();
        this.update();
    }
    get domElement() {
        return this.canvas;
    }
    update() {
        const graphics = this.graphics;
        const densityChanged = this.scale !== devicePixelRatio;
        if (densityChanged) {
            this.scale = devicePixelRatio;
            this.canvas.width = this.width * this.scale;
            this.canvas.height = this.height * this.scale;
        }
        graphics.save();
        graphics.scale(this.scale, this.scale);
        if (densityChanged) {
            this.renderScale();
        }
        graphics.clearRect(0, 0, this.width, this.meterSegmentHeight);
        graphics.clearRect(0, this.meterSegmentHeight + this.meterSegmentVGap, this.width, this.meterSegmentHeight);
        graphics.fillStyle = "rgba(0, 0, 0, 0.2)";
        const maxGain = dbToGain(this.maxDb);
        this.renderMeter(maxGain, 0, this.meterSegmentHeight);
        this.renderMeter(maxGain, this.meterSegmentHeight + this.meterSegmentVGap, this.meterSegmentHeight);
        graphics.fillStyle = this.gradient;
        graphics.globalAlpha = 0.8;
        this.renderMeter(this.peaks[0][0], 0, this.meterSegmentHeight);
        this.renderMeter(this.peaks[0][1], this.meterSegmentHeight + this.meterSegmentVGap, this.meterSegmentHeight);
        graphics.globalAlpha = 1.0;
        this.renderMeter(this.squares[0][0], 0, this.meterSegmentHeight);
        this.renderMeter(this.squares[0][1], this.meterSegmentHeight + this.meterSegmentVGap, this.meterSegmentHeight);
        const now = performance.now();
        for (let i = 0; i < 2; ++i) {
            this.peaks[0][i] *= 0.97;
            this.squares[0][i] *= 0.97;
            if (0.0 <= now - this.releasePeakHoldTime[0][i]) {
                this.peakHoldValue[0][i] = 0.0;
            }
            else {
                const db = Math.min(this.maxDb, gainToDb(this.peakHoldValue[0][i]));
                if (db >= this.minDb) {
                    graphics.fillStyle = 0.0 < db ? "rgb(160,16,0)" : "rgb(100,100,100)";
                    graphics.fillRect(this.dbToX(db) - 1, i * (this.meterSegmentHeight + this.meterSegmentVGap), 1, this.meterSegmentHeight);
                }
            }
        }
        graphics.restore();
        window.requestAnimationFrame(this.updater);
    }
    renderScale() {
        const graphics = this.graphics;
        graphics.clearRect(0, 0, this.height, this.width);
        graphics.font = "7px IBM Plex Sans";
        graphics.textBaseline = "top";
        graphics.textAlign = "center";
        const y = this.meterSegmentHeight + this.meterSegmentVGap * 0.5 - 3;
        for (let i = 0; i < this.meterSegmentCount; i++) {
            const db = this.maxDb - this.labelStepsDb * i;
            const x = this.meterHPadding + (this.meterSegmentWidth + this.meterSegmentHGap) * (this.meterSegmentCount - i - 1) + (this.meterSegmentWidth >> 1);
            graphics.fillStyle = db <= 0 ? "rgb(60,60,60)" : "rgb(160,26,20)";
            if (db > this.minDb) {
                graphics.fillText(db.toString(10), x, y);
            }
            else {
                graphics.fillText("dB", x, y);
            }
        }
    }
    renderMeter(gain, y, h) {
        const db = gainToDb(gain);
        const dbIndex = Math.max(1, this.dbToIndex(db)) | 0;
        for (let i = 0; i < dbIndex; i++) {
            this.graphics.fillRect(this.meterHPadding + (this.meterSegmentWidth + this.meterSegmentHGap) * i, y, this.meterSegmentWidth, h);
        }
    }
    dbToX(db) {
        return this.meterHPadding + this.dbToIndex(db) * (this.meterSegmentWidth + this.meterSegmentHGap);
    }
    dbToIndex(db) {
        return this.meterSegmentCount - Math.floor((this.maxDb - db) / this.labelStepsDb) - 1;
    }
    dbToNorm(db) {
        return 1.0 - Math.floor((this.maxDb - db) / this.labelStepsDb + 1.0) / this.meterSegmentCount;
    }
}
//# sourceMappingURL=worklet.js.map