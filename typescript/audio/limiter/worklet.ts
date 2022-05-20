import {Linear} from "../../lib/mapping.js"
import {Parameter, PrintMapping, Terminable, Terminator} from "../../lib/common.js"

export class LimiterWorklet extends AudioWorkletNode implements Terminable {
    static loadModule(context: AudioContext): Promise<void> {
        return context.audioWorklet.addModule("bin/audio/limiter/processor.js")
    }

    static LOOKAHEAD_MAPPING = new Linear(0.000, 0.100)
    static LOOKAHEAD_PRINT = PrintMapping.float(3, "", "s")
    static THRESHOLD_MAPPING = new Linear(-72.0, 0.0)
    static THRESHOLD_PRINT = PrintMapping.float(1, "", "db")

    private readonly terminator: Terminator = new Terminator()

    readonly parameterLookAhead: Parameter<number> =
        this.terminator.with(new Parameter<number>(LimiterWorklet.LOOKAHEAD_MAPPING, LimiterWorklet.LOOKAHEAD_PRINT, 0.005))
    readonly parameterThreshold: Parameter<number> =
        this.terminator.with(new Parameter<number>(LimiterWorklet.THRESHOLD_MAPPING, LimiterWorklet.THRESHOLD_PRINT, -3.0))

    constructor(context) {
        super(context, "limiter-processor", {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        this.parameterLookAhead.addObserver(seconds =>
            this.port.postMessage({type: "set-lookahead", seconds: seconds}), true)
        this.parameterThreshold.addObserver(db =>
            this.port.postMessage({type: "set-threshold", db: db}), true)
    }

    terminate(): void {
        this.terminator.terminate()
    }
}