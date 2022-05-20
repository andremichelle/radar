export type Message = SetBpm | SetEnabled
export type SetBpm = { type: "set-bpm", value: number }
export type SetEnabled = { type: "set-enabled", value: boolean }