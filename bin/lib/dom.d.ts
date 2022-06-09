import { Terminable } from "./common.js";
declare type Attributes = {
    [name in 'textContent' | 'class' | string]: number | string | boolean;
};
export declare class HTML {
    static create<K extends keyof HTMLElementTagNameMap>(tagName: K, attributes?: Attributes): HTMLElementTagNameMap[K];
    static query<E extends Element>(selectors: string, inside?: ParentNode): E;
}
export interface SVGPathBuilder {
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    quadraticCurve(x1: number, y1: number, x: number, y: number): this;
    cubicCurve(x1: number, y1: number, x2: number, y2: number, x: number, y: number): this;
    arc(rx: number, ry: number, deg: number, largeArc: boolean, sweep: boolean, x: number, y: number): this;
    circleSegment(cx: number, cy: number, radius: number, a0: number, a1: number): this;
    for(from: number, to: number, step: number, build: (builder: this, x: number) => void): this;
    close(): this;
    build(): string;
}
export declare class SVG {
    static create<K extends keyof SVGElementTagNameMap>(tagName: K, attributes?: Attributes): SVGElementTagNameMap[K] & HTMLElement;
    static createUse(href: string, width: number, height: number, attributes?: Attributes): SVGSVGElement & HTMLElement;
    static createLine(x1: number, y1: number, x2: number, y2: number, attributes?: Attributes): SVGLineElement & HTMLElement;
    static createRect(x: number, y: number, width: number, height: number, rx?: number, ry?: number, attributes?: Attributes): SVGRectElement & HTMLElement;
    static createCircle(x: number, y: number, radius: number, attributes?: Attributes): SVGCircleElement & HTMLElement;
    static createPath(attributes?: Attributes): SVGPathElement & HTMLElement;
    static compilePathString(dx?: number, dy?: number): SVGPathBuilder;
    static func(fn: (x: number) => number, w: number, h: number, step?: number): string;
}
export interface ActionReceiver {
    actionBegin(event: UserEvent, clientX: number, clientY: number): ActionProcess;
}
export interface ActionProcess {
    actionMove(event: UserEvent, clientX: number, clientY: number): boolean;
    actionEnd(): void;
}
export declare type UserEvent = MouseEvent | TouchEvent;
export declare class ActionEvents implements Terminable {
    private readonly receiver;
    private readonly terminator;
    private process;
    private touchId;
    constructor(receiver: ActionReceiver);
    listen(target: EventTarget): void;
    withEvent(event: UserEvent): void;
    private onActionBegin;
    private onMoveMove;
    private onTouchMove;
    private onActionEnd;
    terminate(): void;
}
export declare class RenderRequest {
    private readonly render;
    private requested;
    constructor(render: (() => void));
    request(): void;
    private fire;
}
export declare const Colors: string[];
export {};
