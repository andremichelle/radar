export const RENDER_QUANTUM = 128 | 0;
export const LOG_DB = Math.log(10.0) / 20.0;
export const dbToGain = (db) => Math.exp(db * LOG_DB);
export const gainToDb = (gain) => Math.log(gain) / LOG_DB;
export const midiToHz = (note = 60.0, baseFrequency = 440.0) => baseFrequency * Math.pow(2.0, (note + 3.0) / 12.0 - 6.0);
export const numFramesToBars = (numFrames, bpm, samplingRate) => (numFrames * bpm) / (samplingRate * 240.0);
export const barsToNumFrames = (bars, bpm, samplingRate) => (bars * samplingRate * 240.0) / bpm;
export const barsToSeconds = (bars, bpm) => (bars * 240.0) / bpm;
export const SILENCE_GAIN = dbToGain(-192.0);
export class RMS {
    constructor(n) {
        this.n = n;
        this.values = new Float32Array(n);
        this.inv = 1.0 / n;
        this.sum = 0.0;
        this.index = 0 | 0;
    }
    pushPop(squared) {
        this.sum -= this.values[this.index];
        this.sum += squared;
        this.values[this.index] = squared;
        if (++this.index === this.n)
            this.index = 0;
        return 0.0 >= this.sum ? 0.0 : Math.sqrt(this.sum * this.inv);
    }
}
import { ObservableImpl } from "../lib/common.js";
export class Transport {
    constructor() {
        this.observable = new ObservableImpl();
        this.moving = false;
    }
    addObserver(observer, notify) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    play() {
        if (this.moving)
            return;
        this.moving = true;
        this.observable.notify({ type: "transport-play" });
    }
    pause() {
        if (!this.moving)
            return;
        this.moving = false;
        this.observable.notify({ type: "transport-pause" });
    }
    togglePlayback() {
        if (this.moving) {
            this.pause();
        }
        else {
            this.play();
        }
    }
    stop() {
        this.pause();
        this.move(0.0);
    }
    move(position) {
        this.observable.notify({ type: "transport-move", position: position });
    }
    terminate() {
        this.observable.terminate();
    }
}
//# sourceMappingURL=common.js.map