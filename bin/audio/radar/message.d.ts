import { PatternFormat } from "./pattern.js";
export declare type RadarMessage = SetPattern | SetAudio;
export declare type SetAudio = {
    type: "set-audio";
    channels: Float32Array[];
    frames: number;
};
export declare type SetPattern = {
    type: "update-pattern";
    format: PatternFormat;
};
