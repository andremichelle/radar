// https://iquilezles.org/articles/distfunctions2d/

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export class vec2 {
    static dot(a: vec2, b: vec2): number {
        return a.x * b.x + a.y * b.y
    }

    static dot2(v: vec2): number {
        return v.x * v.x + v.y * v.y
    }

    static len(v: vec2): number {
        return Math.sqrt(v.x * v.x + v.y * v.y)
    }

    static sign(v: vec2): vec2 {
        return new vec2(Math.sign(v.x), Math.sign(v.y))
    }

    static abs(v: vec2): vec2 {
        return new vec2(Math.abs(v.x), Math.abs(v.y))
    }

    static pow(base: vec2, exp: vec2): vec2 {
        return new vec2(Math.pow(base.x, exp.x), Math.pow(base.y, exp.y))
    }

    static add(a: vec2, b: vec2): vec2 {
        return new vec2(b.x + a.x, b.y + a.y)
    }

    static subtract(a: vec2, b: vec2): vec2 {
        return new vec2(b.x - a.x, b.y - a.y)
    }

    static multiply(a: vec2, b: vec2): vec2 {
        return new vec2(a.x * b.x, a.y * b.y)
    }

    static scale(v: vec2, value: number): vec2 {
        return new vec2(v.x * value, v.y * value)
    }

    static div(v: vec2, value: number): vec2 {
        return new vec2(v.x / value, v.y / value)
    }

    constructor(public x: number, public y: number) {
    }
}

export class vec3 {
    static scale(v: vec3, value: number): vec3 {
        return new vec3(v.x * value, v.y * value, v.z * value)
    }

    static multiply(a: vec3, b: vec3): vec3 {
        return new vec3(a.x * b.x, a.y * b.y, a.z * b.z)
    }

    static subtract(v: vec3, value: number): vec3 {
        return new vec3(v.x - value, v.y - value, v.z - value)
    }

    static clamp(v: vec3, min: number, max: number): vec3 {
        return new vec3(clamp(v.x, min, max), clamp(v.y, min, max), clamp(v.z, min, max))
    }

    constructor(public x: number, public y: number, public z: number) {
    }
}

export const sdSegment = (p: vec2, a: vec2, b: vec2): number => {
    const pa = vec2.subtract(p, a)
    const ba = vec2.subtract(b, a)
    return vec2.len(vec2.subtract(pa, vec2.scale(ba, clamp(vec2.dot(pa, ba) / vec2.dot(ba, ba), 0.0, 1.0))))
}

export const sdBezier = (pos: vec2, A: vec2, B: vec2, C: vec2): number => {
    const a: vec2 = vec2.subtract(B, A)
    const b: vec2 = vec2.add(vec2.subtract(A, vec2.scale(B, 2.0)), C)
    const c: vec2 = vec2.scale(a, 2.0)
    const d: vec2 = vec2.subtract(A, pos)
    const kk = 1.0 / vec2.dot(b, b)
    const kx = kk * vec2.dot(a, b)
    const ky = kk * (2.0 * vec2.dot(a, a) + vec2.dot(d, b)) / 3.0
    const kz = kk * vec2.dot(d, a)
    const p = ky - kx * kx
    const p3 = p * p * p
    const q = kx * (2.0 * kx * kx - 3.0 * ky) + kz
    let h = q * q + 4.0 * p3
    if (h >= 0.0) {
        h = Math.sqrt(h)
        const x: vec2 = vec2.div(new vec2(h - q, -h - q), 2.0)
        const uv: vec2 = vec2.multiply(vec2.sign(x), vec2.pow(vec2.abs(x), new vec2(1.0 / 3.0, 1.0 / 3.0)))
        const t = clamp(uv.x + uv.y - kx, 0.0, 1.0)
        return Math.sqrt(vec2.dot2(vec2.add(d, vec2.scale(vec2.add(c, vec2.scale(b, t)), t))))
    } else {
        const z = Math.sqrt(-p)
        const v = Math.acos(q / (p * z * 2.0)) / 3.0
        const m = Math.cos(v)
        const n = Math.sin(v) * 1.732050808
        const t: vec3 = vec3.clamp(vec3.subtract(vec3.scale(new vec3(m + m, -n - m, n - m), z), kx), 0.0, 1.0)
        return Math.sqrt(Math.min(vec2.dot2(vec2.add(d, vec2.scale(vec2.add(c, vec2.scale(b, t.x)), t.x))),
            vec2.dot2(vec2.add(d, vec2.scale(vec2.add(c, vec2.scale(b, t.y)), t.y)))))
    }
}
