import { Linear } from "../../lib/mapping.js";
import { Parameter, PrintMapping, Terminable } from "../../lib/common.js";
export declare class LimiterWorklet extends AudioWorkletNode implements Terminable {
    static loadModule(context: AudioContext): Promise<void>;
    static LOOKAHEAD_MAPPING: Linear;
    static LOOKAHEAD_PRINT: PrintMapping<number>;
    static THRESHOLD_MAPPING: Linear;
    static THRESHOLD_PRINT: PrintMapping<number>;
    private readonly terminator;
    readonly parameterLookAhead: Parameter<number>;
    readonly parameterThreshold: Parameter<number>;
    constructor(context: any);
    terminate(): void;
}
