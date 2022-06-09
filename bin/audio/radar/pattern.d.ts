import { Observable, ObservableValue, Observer, Serializer, Terminable } from "../../lib/common.js";
import { Obstacle, ObstacleFormat } from "./obstacles.js";
import { Point } from "./ray.js";
import { DragHandler } from "./utils.js";
export interface PatternFormat {
    origin: {
        x: number;
        y: number;
    };
    obstacles: ObstacleFormat[];
    file: string;
}
export declare class Pattern implements Observable<Pattern>, Serializer<PatternFormat> {
    private readonly terminator;
    private readonly observable;
    private readonly origin;
    private readonly file;
    private readonly bpm;
    private readonly bar;
    private readonly obstacles;
    constructor();
    addObstacle(obstacle: Obstacle<any>): void;
    removeObstacle(obstacle: Obstacle<any>): void;
    getObstacles(): ReadonlyArray<Obstacle<any>>;
    getOrigin(): Readonly<Point>;
    getBarValue(): ObservableValue<number>;
    getBpmValue(): ObservableValue<number>;
    clearObstacles(): void;
    resetOrigin(): void;
    onChanged(): void;
    addObserver(observer: Observer<Pattern>): Terminable;
    addFileObserver(observer: Observer<string>): Terminable;
    removeObserver(observer: Observer<Pattern>): boolean;
    deserialize(format: PatternFormat): Serializer<PatternFormat>;
    serialize(): PatternFormat;
    terminate(): void;
    readonly dragHandlers: DragHandler[];
}
