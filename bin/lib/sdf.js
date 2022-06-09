const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export class vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }
    static dot2(v) {
        return v.x * v.x + v.y * v.y;
    }
    static len(v) {
        return Math.sqrt(v.x * v.x + v.y * v.y);
    }
    static sign(v) {
        return new vec2(Math.sign(v.x), Math.sign(v.y));
    }
    static abs(v) {
        return new vec2(Math.abs(v.x), Math.abs(v.y));
    }
    static pow(base, exp) {
        return new vec2(Math.pow(base.x, exp.x), Math.pow(base.y, exp.y));
    }
    static add(a, b) {
        return new vec2(b.x + a.x, b.y + a.y);
    }
    static subtract(a, b) {
        return new vec2(b.x - a.x, b.y - a.y);
    }
    static multiply(a, b) {
        return new vec2(a.x * b.x, a.y * b.y);
    }
    static scale(v, value) {
        return new vec2(v.x * value, v.y * value);
    }
    static div(v, value) {
        return new vec2(v.x / value, v.y / value);
    }
}
export class vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    static scale(v, value) {
        return new vec3(v.x * value, v.y * value, v.z * value);
    }
    static multiply(a, b) {
        return new vec3(a.x * b.x, a.y * b.y, a.z * b.z);
    }
    static subtract(v, value) {
        return new vec3(v.x - value, v.y - value, v.z - value);
    }
    static clamp(v, min, max) {
        return new vec3(clamp(v.x, min, max), clamp(v.y, min, max), clamp(v.z, min, max));
    }
}
export const sdSegment = (p, a, b) => {
    const pa = vec2.subtract(p, a);
    const ba = vec2.subtract(b, a);
    return vec2.len(vec2.subtract(pa, vec2.scale(ba, clamp(vec2.dot(pa, ba) / vec2.dot(ba, ba), 0.0, 1.0))));
};
export const sdBezier = (pos, A, B, C) => {
    const a = vec2.subtract(B, A);
    const b = vec2.add(vec2.subtract(A, vec2.scale(B, 2.0)), C);
    const c = vec2.scale(a, 2.0);
    const d = vec2.subtract(A, pos);
    const kk = 1.0 / vec2.dot(b, b);
    const kx = kk * vec2.dot(a, b);
    const ky = kk * (2.0 * vec2.dot(a, a) + vec2.dot(d, b)) / 3.0;
    const kz = kk * vec2.dot(d, a);
    const p = ky - kx * kx;
    const p3 = p * p * p;
    const q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
    let h = q * q + 4.0 * p3;
    if (h >= 0.0) {
        h = Math.sqrt(h);
        const x = vec2.div(new vec2(h - q, -h - q), 2.0);
        const uv = vec2.multiply(vec2.sign(x), vec2.pow(vec2.abs(x), new vec2(1.0 / 3.0, 1.0 / 3.0)));
        const t = clamp(uv.x + uv.y - kx, 0.0, 1.0);
        return Math.sqrt(vec2.dot2(vec2.add(d, vec2.scale(vec2.add(c, vec2.scale(b, t)), t))));
    }
    else {
        const z = Math.sqrt(-p);
        const v = Math.acos(q / (p * z * 2.0)) / 3.0;
        const m = Math.cos(v);
        const n = Math.sin(v) * 1.732050808;
        const t = vec3.clamp(vec3.subtract(vec3.scale(new vec3(m + m, -n - m, n - m), z), kx), 0.0, 1.0);
        return Math.sqrt(Math.min(vec2.dot2(vec2.add(d, vec2.scale(vec2.add(c, vec2.scale(b, t.x)), t.x))), vec2.dot2(vec2.add(d, vec2.scale(vec2.add(c, vec2.scale(b, t.y)), t.y)))));
    }
};
//# sourceMappingURL=sdf.js.map