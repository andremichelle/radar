export declare type Message = {
    type: "set-lookahead";
    seconds: number;
} | {
    type: "set-threshold";
    db: number;
};
