import {PatternFormat} from "./pattern.js"

export type RadarMessage = SetPattern | SetAudio
export type SetAudio = { type: "set-audio", channels: Float32Array[], frames: number }
export type SetPattern = { type: "update-pattern", format: PatternFormat }
