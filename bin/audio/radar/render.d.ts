import { Obstacle } from "./obstacles.js";
import { Pattern } from "./pattern.js";
import { Point, Ray } from "./ray.js";
export declare class Renderer {
    static Radius: number;
    static renderRadarInside(context: CanvasRenderingContext2D, angleResolution: number, distanceResolution: number): void;
    static renderRayOrigin(context: CanvasRenderingContext2D, origin: Point): void;
    static renderCursor(context: CanvasRenderingContext2D, local: Point): void;
    static renderObstacles(context: CanvasRenderingContext2D, pattern: Pattern, selection: Obstacle<any>[]): void;
    static renderRayTrail(context: CanvasRenderingContext2D, pattern: Pattern, ray: Ray): void;
    static renderWaveformPosition(context: CanvasRenderingContext2D, angle: number, width: number, lineWidth?: number): void;
    static renderWaveform(buffer: AudioBuffer, size: number, width: number): ImageBitmap;
}
