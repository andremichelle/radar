import { ObservableValueImpl, Terminable } from "../../lib/common.js";
import { Transport, TransportListener } from "../common.js";
export declare class MetronomeWorklet extends AudioWorkletNode implements TransportListener {
    static loadModule(context: AudioContext): Promise<void>;
    readonly enabled: ObservableValueImpl<boolean>;
    constructor(context: BaseAudioContext);
    setBpm(value: number): void;
    listenToTransport(transport: Transport): Terminable;
}
