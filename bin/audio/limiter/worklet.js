import { Linear } from "../../lib/mapping.js";
import { Parameter, PrintMapping, Terminator } from "../../lib/common.js";
export class LimiterWorklet extends AudioWorkletNode {
    constructor(context) {
        super(context, "limiter-processor", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.terminator = new Terminator();
        this.parameterLookAhead = this.terminator.with(new Parameter(LimiterWorklet.LOOKAHEAD_MAPPING, LimiterWorklet.LOOKAHEAD_PRINT, 0.005));
        this.parameterThreshold = this.terminator.with(new Parameter(LimiterWorklet.THRESHOLD_MAPPING, LimiterWorklet.THRESHOLD_PRINT, -3.0));
        this.parameterLookAhead.addObserver(seconds => this.port.postMessage({ type: "set-lookahead", seconds: seconds }), true);
        this.parameterThreshold.addObserver(db => this.port.postMessage({ type: "set-threshold", db: db }), true);
    }
    static loadModule(context) {
        return context.audioWorklet.addModule("bin/audio/limiter/processor.js");
    }
    terminate() {
        this.terminator.terminate();
    }
}
LimiterWorklet.LOOKAHEAD_MAPPING = new Linear(0.000, 0.100);
LimiterWorklet.LOOKAHEAD_PRINT = PrintMapping.float(3, "", "s");
LimiterWorklet.THRESHOLD_MAPPING = new Linear(-72.0, 0.0);
LimiterWorklet.THRESHOLD_PRINT = PrintMapping.float(1, "", "db");
//# sourceMappingURL=worklet.js.map