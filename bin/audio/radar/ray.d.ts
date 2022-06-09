import { Obstacle } from "./obstacles.js";
export interface Point {
    x: number;
    y: number;
}
export declare enum Touch {
    Obstacle = 0,
    Last = 1
}
export declare class Ray {
    static readonly Epsilon: number;
    static readonly MaxMovements: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    moveCounts: number;
    lastAngle: number;
    reuse(angle: number, x?: number, y?: number): this;
    trace(obstacles: ReadonlyArray<Obstacle<any>>): Generator<Readonly<Ray>>;
    eval(obstacles: ReadonlyArray<Obstacle<any>>): number;
    step(obstacles: ReadonlyArray<Obstacle<any>>): Touch;
    move(dt: number): void;
    moveExceeded(): boolean;
    reflect(nx: number, ny: number): void;
    normalize(): void;
    length(): number;
    angle(): number;
    dot(): number;
    cross(): number;
    assertInsideUnitCircle(): void;
}
