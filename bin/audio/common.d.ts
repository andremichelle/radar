export declare const RENDER_QUANTUM: number;
export declare const LOG_DB: number;
export declare const dbToGain: (db: number) => number;
export declare const gainToDb: (gain: number) => number;
export declare const midiToHz: (note?: number, baseFrequency?: number) => number;
export declare const numFramesToBars: (numFrames: number, bpm: number, samplingRate: number) => number;
export declare const barsToNumFrames: (bars: number, bpm: number, samplingRate: number) => number;
export declare const barsToSeconds: (bars: number, bpm: number) => number;
export declare const SILENCE_GAIN: number;
export declare class RMS {
    private readonly n;
    private readonly values;
    private readonly inv;
    private sum;
    private index;
    constructor(n: number);
    pushPop(squared: number): number;
}
import { Observable, Observer, Terminable } from "../lib/common.js";
export declare type TransportMessage = {
    type: "transport-play";
} | {
    type: "transport-pause";
} | {
    type: "transport-move";
    position: number;
};
export interface TransportListener {
    listenToTransport(transport: Transport): Terminable;
}
export declare class Transport implements Observable<TransportMessage> {
    private readonly observable;
    private moving;
    constructor();
    addObserver(observer: Observer<TransportMessage>, notify: boolean): Terminable;
    removeObserver(observer: Observer<TransportMessage>): boolean;
    play(): void;
    pause(): void;
    togglePlayback(): void;
    stop(): void;
    move(position: number): void;
    terminate(): void;
}
