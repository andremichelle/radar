import { ObservableValueImpl } from "../../lib/common.js";
export class MetronomeWorklet extends AudioWorkletNode {
    constructor(context) {
        super(context, "metronome-processor", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.enabled = new ObservableValueImpl(false);
        this.enabled.addObserver(value => this.port.postMessage({ type: "set-enabled", value: value }));
    }
    static loadModule(context) {
        return context.audioWorklet.addModule("bin/audio/metronome/processor.js");
    }
    setBpm(value) {
        this.port.postMessage({ type: "set-bpm", value: value });
    }
    listenToTransport(transport) {
        return transport.addObserver(message => this.port.postMessage(message), false);
    }
}
//# sourceMappingURL=worklet.js.map