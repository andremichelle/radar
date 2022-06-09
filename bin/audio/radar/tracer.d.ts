import { Obstacle } from "./obstacles.js";
import { Ray, Touch } from "./ray.js";
export declare class Tracer {
    private readonly ray;
    constructor();
    trace(obstacles: ReadonlyArray<Obstacle>, position: number, x: number, y: number): Generator<Readonly<Ray>>;
    step(obstacles: ReadonlyArray<Obstacle>): Touch;
}
