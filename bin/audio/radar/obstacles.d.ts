import { Serializer } from "../../lib/common.js";
import { Pattern } from "./pattern.js";
import { Ray } from "./ray.js";
import { DragHandler } from "./utils.js";
export declare type ObstacleFormat = LineObstacleFormat | ArcObstacleFormat | CurveObstacleFormat;
export declare abstract class Obstacle<FORMAT extends ObstacleFormat> implements Serializer<FORMAT> {
    private readonly pattern;
    protected constructor(pattern: Pattern);
    protected onChanged(): void;
    abstract trace(ray: Ray): number;
    abstract reflect(ray: Ray): void;
    abstract paintPath(context: CanvasRenderingContext2D, scale: number): void;
    abstract paintHandler(context: CanvasRenderingContext2D, scale: number): void;
    abstract isBoundary(): boolean;
    abstract distance(x: number, y: number): number;
    abstract deserialize(format: FORMAT): Serializer<FORMAT>;
    abstract serialize(): FORMAT;
    abstract dragHandlers: ReadonlyArray<DragHandler>;
}
export declare class OutlineObstacle extends Obstacle<ObstacleFormat> {
    constructor(pattern: Pattern);
    trace(ray: Ray): number;
    paintHandler(context: CanvasRenderingContext2D, scale: number): void;
    paintPath(context: CanvasRenderingContext2D, scale: number): void;
    reflect(ray: Ray): void;
    isBoundary(): boolean;
    distance(x: number, y: number): number;
    deserialize(format: ObstacleFormat): Serializer<ObstacleFormat>;
    serialize(): ObstacleFormat;
    dragHandlers: ReadonlyArray<DragHandler>;
}
export interface LineObstacleFormat {
    class: 'line';
    x0: number;
    y0: number;
    x1: number;
    y1: number;
}
export declare class LineObstacle extends Obstacle<LineObstacleFormat> {
    private x0;
    private y0;
    private x1;
    private y1;
    private dx;
    private dy;
    private nx;
    private ny;
    constructor(pattern: Pattern);
    set(x0: number, y0: number, x1: number, y1: number): this;
    trace(ray: Ray): number;
    reflect(ray: Ray): void;
    paintPath(context: CanvasRenderingContext2D, scale: number): void;
    paintHandler(context: CanvasRenderingContext2D, scale: number): void;
    isBoundary(): boolean;
    distance(x: number, y: number): number;
    deserialize(format: LineObstacleFormat): Serializer<LineObstacleFormat>;
    serialize(): LineObstacleFormat;
    readonly dragHandlers: ReadonlyArray<DragHandler>;
    private update;
}
export interface ArcObstacleFormat {
    class: 'arc';
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    bend: number;
}
export declare class ArcObstacle extends Obstacle<ArcObstacleFormat> {
    private x0;
    private y0;
    private x1;
    private y1;
    private bend;
    private bx;
    private by;
    private cx;
    private cy;
    private radius;
    private angle0;
    private angle1;
    private angleWidth;
    constructor(pattern: Pattern);
    set(x0: number, y0: number, x1: number, y1: number, bend: number): this;
    trace(ray: Ray): number;
    reflect(ray: Ray): void;
    paintPath(context: CanvasRenderingContext2D, scale: number): void;
    paintHandler(context: CanvasRenderingContext2D, scale: number): void;
    isBoundary(): boolean;
    distance(x: number, y: number): number;
    deserialize(format: ArcObstacleFormat): Serializer<ArcObstacleFormat>;
    serialize(): ArcObstacleFormat;
    readonly dragHandlers: ReadonlyArray<DragHandler>;
    private appearsAsLine;
    private update;
}
export interface CurveObstacleFormat {
    class: 'curve';
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}
export declare class CurveObstacle extends Obstacle<CurveObstacleFormat> {
    private x0;
    private y0;
    private x1;
    private y1;
    private x2;
    private y2;
    private cachedT;
    constructor(pattern: Pattern);
    set(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): this;
    trace(ray: Ray): number;
    reflect(ray: Ray): void;
    paintPath(context: CanvasRenderingContext2D, scale: number): void;
    paintHandler(context: CanvasRenderingContext2D, scale: number): void;
    isBoundary(): boolean;
    distance(x: number, y: number): number;
    deserialize(format: CurveObstacleFormat): Serializer<CurveObstacleFormat>;
    serialize(): CurveObstacleFormat;
    readonly dragHandlers: ReadonlyArray<DragHandler>;
    private advanceDistance;
}
