import { Obstacle } from "./obstacles.js";
export interface DragHandler {
    distance(x: number, y: number): number;
    moveTo(x: number, y: number): void;
    constrainToCircle(): boolean;
    readonly obstacle: Obstacle<any>;
}
export declare const distance: (x0: number, y0: number, x1: number, y1: number) => number;
export declare const snapLength: (length: number, resolution?: number) => number;
export declare const snapAngle: (angle: number, resolution?: number) => number;
