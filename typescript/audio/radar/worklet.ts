import {ArrayUtils, Terminator} from "../../lib/common.js"
import {SetAudio, SetPattern} from "./message.js"
import {Pattern} from "./pattern.js"

export class RadarWorklet extends AudioWorkletNode {
    static loadModule(context: AudioContext): Promise<void> {
        return context.audioWorklet.addModule("bin/audio/radar/processor.js")
    }

    private readonly terminator: Terminator = new Terminator()

    private position: number = 0.0

    constructor(context: BaseAudioContext, pattern: Pattern) {
        super(context, 'radar', {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [2],
            channelCount: 2,
            channelCountMode: "explicit",
            channelInterpretation: "speakers"
        })

        this.port.onmessage = event => this.position = event.data

        const updateFormat = () => this.port.postMessage({
            type: "update-pattern",
            format: pattern.serialize()
        } as SetPattern)
        this.terminator.with(pattern.addObserver(updateFormat))
        updateFormat()
    }

    setAudioBuffer(buffer: AudioBuffer): void {
        const channels = ArrayUtils.fill(buffer.numberOfChannels, index => {
            const channel = new Float32Array(buffer.length)
            buffer.copyFromChannel(channel, index)
            return channel
        })
        this.port.postMessage({type: "set-audio", channels, frames: buffer.length} as SetAudio)
    }

    getPosition(): number {
        return this.position
    }
}