import { Pattern } from "./pattern.js";
export declare class RadarWorklet extends AudioWorkletNode {
    static loadModule(context: AudioContext): Promise<void>;
    private readonly terminator;
    private position;
    constructor(context: BaseAudioContext, pattern: Pattern);
    setTransporting(enabled: boolean): void;
    setAudioBuffer(buffer: AudioBuffer): void;
    getPosition(): number;
}
