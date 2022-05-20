import {ObservableValueImpl, Terminable} from "../../lib/common.js"
import {Transport, TransportListener} from "../common.js"

export class MetronomeWorklet extends AudioWorkletNode implements TransportListener {
    static loadModule(context: AudioContext): Promise<void> {
        return context.audioWorklet.addModule("bin/audio/metronome/processor.js")
    }

    readonly enabled: ObservableValueImpl<boolean> = new ObservableValueImpl<boolean>(false)

    constructor(context: BaseAudioContext) {
        super(context, "metronome-processor", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
            channelCount: 1,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })
        this.enabled.addObserver(value => this.port.postMessage({type: "set-enabled", value: value}))
    }

    setBpm(value: number): void {
        this.port.postMessage({type: "set-bpm", value: value})
    }

    listenToTransport(transport: Transport): Terminable {
        return transport.addObserver(message => this.port.postMessage(message), false)
    }
}