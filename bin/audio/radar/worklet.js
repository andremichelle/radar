import { ArrayUtils, Terminator } from "../../lib/common.js";
export class RadarWorklet extends AudioWorkletNode {
    constructor(context, pattern) {
        super(context, 'radar', {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        });
        this.terminator = new Terminator();
        this.position = 0.0;
        this.port.onmessage = event => this.position = event.data;
        const updateFormat = () => this.port.postMessage({
            type: "update-pattern",
            format: pattern.serialize()
        });
        this.terminator.with(pattern.addObserver(updateFormat));
        updateFormat();
    }
    static loadModule(context) {
        return context.audioWorklet.addModule("bin/audio/radar/processor.js");
    }
    setTransporting(enabled) {
        this.port.postMessage({ type: enabled ? 'transport-play' : 'transport-pause' });
    }
    setAudioBuffer(buffer) {
        const channels = ArrayUtils.fill(buffer.numberOfChannels, index => {
            const channel = new Float32Array(buffer.length);
            buffer.copyFromChannel(channel, index);
            return channel;
        });
        this.port.postMessage({ type: "set-audio", channels, frames: buffer.length });
    }
    getPosition() {
        return this.position;
    }
}
//# sourceMappingURL=worklet.js.map