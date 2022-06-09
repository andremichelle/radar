export declare class vec2 {
    x: number;
    y: number;
    static dot(a: vec2, b: vec2): number;
    static dot2(v: vec2): number;
    static len(v: vec2): number;
    static sign(v: vec2): vec2;
    static abs(v: vec2): vec2;
    static pow(base: vec2, exp: vec2): vec2;
    static add(a: vec2, b: vec2): vec2;
    static subtract(a: vec2, b: vec2): vec2;
    static multiply(a: vec2, b: vec2): vec2;
    static scale(v: vec2, value: number): vec2;
    static div(v: vec2, value: number): vec2;
    constructor(x: number, y: number);
}
export declare class vec3 {
    x: number;
    y: number;
    z: number;
    static scale(v: vec3, value: number): vec3;
    static multiply(a: vec3, b: vec3): vec3;
    static subtract(v: vec3, value: number): vec3;
    static clamp(v: vec3, min: number, max: number): vec3;
    constructor(x: number, y: number, z: number);
}
export declare const sdSegment: (p: vec2, a: vec2, b: vec2) => number;
export declare const sdBezier: (pos: vec2, A: vec2, B: vec2, C: vec2) => number;
