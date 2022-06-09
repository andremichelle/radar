import { TAU } from "../../lib/math.js";
import { RENDER_QUANTUM } from "../common.js";
import { Pattern } from "./pattern.js";
import { Ray } from "./ray.js";
registerProcessor("radar", class extends AudioWorkletProcessor {
    constructor() {
        super();
        this.NUM_BLOCKS = Math.floor(sampleRate / RENDER_QUANTUM / 60) | 0;
        this.pattern = new Pattern();
        this.ray = new Ray();
        this.remaining = this.NUM_BLOCKS;
        this.audio = null;
        this.frames = 0 | 0;
        this.position = 0 | 0;
        this.moving = false;
        this.port.onmessage = event => {
            const message = event.data;
            if (message.type === "set-audio") {
                this.audio = message.channels;
                this.frames = message.frames;
            }
            else if (message.type === "update-pattern") {
                this.pattern.deserialize(message.format);
            }
            else if (message.type === "transport-play") {
                this.moving = true;
            }
            else if (message.type === "transport-pause") {
                this.moving = false;
            }
            else if (message.type === "transport-move") {
            }
        };
    }
    process(inputs, outputs) {
        if (this.audio === null || !this.moving)
            return true;
        const output = outputs[0];
        const outL = output[0];
        const outR = output[1];
        const audioL = this.audio[0];
        const audioR = this.audio[1];
        const origin = this.pattern.getOrigin();
        for (let i = 0; i < RENDER_QUANTUM; i++) {
            this.ray.reuse(this.position / this.frames * TAU, origin.x, origin.y);
            const position = Math.floor(this.ray.eval(this.pattern.getObstacles()) / TAU * this.frames);
            outL[i] = audioL[position];
            outR[i] = audioR[position];
            this.position++;
        }
        if (--this.remaining === 0) {
            this.remaining = this.NUM_BLOCKS;
            this.port.postMessage(this.position / this.frames);
        }
        return true;
    }
});
//# sourceMappingURL=processor.js.map