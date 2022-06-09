export declare type Message = SetBpm | SetEnabled;
export declare type SetBpm = {
    type: "set-bpm";
    value: number;
};
export declare type SetEnabled = {
    type: "set-enabled";
    value: boolean;
};
