import {TAU} from "../../lib/math.js"
import {Ray} from "./ray.js"

export type Obstacle = Evaluator

interface Evaluator {
    capture(ray: Ray): number

    modify(ray: Ray): void

    paint(context: CanvasRenderingContext2D, scale: number): void
}

const Epsilon: number = 0.000001

class LineEvaluator implements Evaluator {
    private x0: number
    private y0: number
    private x1: number
    private y1: number
    private dx: number
    private dy: number
    private nx: number
    private ny: number

    set(x0: number, y0: number, x1: number, y1: number): void {
        this.x0 = x0
        this.y0 = y0
        this.x1 = x1
        this.y1 = y1
        this.dx = x1 - x0
        this.dy = y1 - y0
        const nl = Math.sqrt(this.dx * this.dx + this.dy * this.dy)
        this.nx = this.dy / nl
        this.ny = -this.dx / nl
    }

    capture(ray: Ray): number {
        const ud = this.dy * ray.dx - this.dx * ray.dy
        const px = this.x0 - ray.rx
        const py = this.y0 - ray.ry
        const dt = (this.dy * px - this.dx * py) / ud
        if (dt < Epsilon) {
            return Number.MAX_VALUE
        }
        const ua = (ray.dy * px - ray.dx * py) / ud
        if (ua < 0.0 || ua > 1.0) {
            return Number.MAX_VALUE
        }
        return dt
    }

    modify(ray: Ray): void {
        ray.reflect(this.nx, this.ny)
    }

    paint(context: CanvasRenderingContext2D, scale: number): void {
        context.moveTo(this.x0 * scale, this.y0 * scale)
        context.lineTo(this.x1 * scale, this.y1 * scale)
    }
}

class CurveEvaluator implements Evaluator {
    private cx: number
    private cy: number
    private radius: number
    private angle0: number
    private angle1: number
    private angleWidth: number

    set(x0: number, y0: number, x1: number, y1: number, bend: number): void {
        const dx = x1 - x0
        const dy = y1 - y0

        const ln = Math.sqrt(dx * dx + dy * dy)
        const nx = dy / ln
        const ny = -dx / ln

        const offset = ln * .5 * bend
        const x2 = x0 + dx * .5 + nx * offset
        const y2 = y0 + dy * .5 + ny * offset
        const a1 = 2.0 * (x2 - x1)
        const b1 = 0.5 / (y2 - y1)
        const a2 = 2.0 * (x0 - x1)
        const b2 = 2.0 * (y0 - y1)
        const c1 = (x2 * x2 - x1 * x1) + (y2 * y2 - y1 * y1)
        const c2 = (x0 * x0 - x1 * x1) + (y0 * y0 - y1 * y1)
        this.cx = (c2 - b2 * c1 * b1) / (a2 - b2 * a1 * b1)
        this.cy = (c1 - a1 * this.cx) * b1
        this.radius = Math.sqrt((x1 - this.cx) * (x1 - this.cx) + (y1 - this.cy) * (y1 - this.cy))
        this.angle0 = Math.atan2(y0 - this.cy, x0 - this.cx)
        this.angle1 = Math.atan2(y1 - this.cy, x1 - this.cx)
        if (bend < 0.0) {
            const tmp = this.angle0
            this.angle0 = this.angle1
            this.angle1 = tmp
        }
        if (this.angle0 < 0.0) this.angle0 += TAU
        if (this.angle1 < 0.0) this.angle1 += TAU
        this.angleWidth = this.angle1 - this.angle0
        while (this.angleWidth < 0.0) this.angleWidth += TAU
    }

    capture(ray: Ray): number {
        const dx = ray.dx
        const dy = ray.dy
        const ex = ray.rx - this.cx
        const ey = ray.ry - this.cy
        const ev = ex * dy - ey * dx

        let sq = this.radius * this.radius - ev * ev
        if (sq < 0.0) {
            return Number.MAX_VALUE
        }
        sq = Math.sqrt(sq)

        const ed = ey * dy + ex * dx
        const dt0 = +sq - ed
        const dt1 = -sq - ed

        let dt: number
        if (dt0 < Epsilon) {
            if (dt1 < Epsilon) {
                return Number.MAX_VALUE
            }
            dt = dt1
        } else if (dt1 < Epsilon) {
            if (dt0 < Epsilon) {
                return Number.MAX_VALUE
            }
            dt = dt0
        } else {
            let da0 = Math.atan2(ey + dy * dt0, ex + dx * dt0) - this.angle0
            let da1 = Math.atan2(ey + dy * dt1, ex + dx * dt1) - this.angle0
            while (da0 < 0.0) da0 += TAU
            while (da0 > TAU) da0 -= TAU
            while (da1 < 0.0) da1 += TAU
            while (da1 > TAU) da1 -= TAU
            if (da0 > this.angleWidth) {
                if (da1 < this.angleWidth) {
                    return dt1
                }
                return Number.MAX_VALUE
            }
            if (da1 > this.angleWidth) {
                if (da0 < this.angleWidth) {
                    return dt0
                }
                return Number.MAX_VALUE
            }
            return dt0 < dt1 ? dt0 : dt1
        }
        let da0 = Math.atan2(ey + dy * dt, ex + dx * dt) - this.angle0
        while (da0 < 0.0) da0 += TAU
        while (da0 > TAU) da0 -= TAU
        if (da0 > this.angleWidth) {
            return Number.MAX_VALUE
        }
        return dt
    }

    modify(ray: Ray): void {
        ray.reflect((ray.rx - this.cx) / this.radius, (ray.ry - this.cy) / this.radius)
    }

    paint(context: CanvasRenderingContext2D, scale: number): void {
        context.arc(this.cx * scale, this.cy * scale, this.radius * scale, this.angle0, this.angle1)
    }
}

class QBezierEvaluator implements Evaluator {
    private x0: number
    private y0: number
    private x1: number
    private y1: number
    private x2: number
    private y2: number
    private cachedT: number

    set(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): void {
        this.x0 = x0
        this.y0 = y0
        this.x1 = x1
        this.y1 = y1
        this.x2 = x2
        this.y2 = y2
    }

    capture(ray: Ray): number {
        const cx1: number = (this.x1 - this.x0) * 2.0
        const cy1: number = (this.y1 - this.y0) * 2.0
        const cx2: number = this.x0 - this.x1 * 2.0 + this.x2
        const cy2: number = this.y0 - this.y1 * 2.0 + this.y2

        if (Math.abs(cx2) < Epsilon && Math.abs(cy2) < Epsilon) {
            const lx: number = this.x2 - this.x0
            const ly: number = this.y2 - this.y0
            const px: number = this.x0 - ray.rx
            const py: number = this.y0 - ray.ry
            const ud: number = 1.0 / (ray.dx * ly - ray.dy * lx)
            const dt: number = (ly * px - lx * py) * ud
            if (dt < Epsilon) {
                return Number.MAX_VALUE
            }
            const ua: number = (ray.dy * px - ray.dx * py) * ud
            if (ua < 0.0 || ua > 1.0) {
                return Number.MAX_VALUE
            }
            this.cachedT = ua
            return dt
        }

        const a: number = 1.0 / (ray.dx * cy2 - ray.dy * cx2)
        const b: number = (ray.dx * cy1 - ray.dy * cx1) * a
        const c: number = (ray.dx * this.y0 - ray.dy * this.x0 + ray.rx * ray.dy - ray.dx * ray.ry) * a

        let d: number = b * b - 4.0 * c
        let t0: number
        let t1: number
        let dt0: number = Number.MAX_VALUE
        let dt1: number = Number.MAX_VALUE

        if (d > 0.0) {
            d = Math.sqrt(d)
            t0 = 0.5 * (-b + d)
            if (0.0 <= t0 && t0 <= 1.0) {
                dt0 = this.advanceDistance(t0, ray)
            }
            t1 = 0.5 * (-b - d)
            if (0.0 <= t1 && t1 <= 1.0) {
                dt1 = this.advanceDistance(t1, ray)
            }
            if (dt0 > dt1) {
                this.cachedT = t1
                return dt1
            } else {
                this.cachedT = t0
                return dt0
            }
        } else if (d == 0.0) {
            t0 = -0.5 * b
            if (0.0 <= t0 && t0 <= 1.0) {
                this.cachedT = t0
                return this.advanceDistance(t0, ray)
            }
        }
        return Number.MAX_VALUE
    }

    modify(ray: Ray): void {
        let xd = this.cachedT * (this.x0 - 2.0 * this.x1 + this.x2) - this.x0 + this.x1
        let yd = this.cachedT * (this.y0 - 2.0 * this.y1 + this.y2) - this.y0 + this.y1
        const dd = Math.sqrt(xd * xd + yd * yd)
        xd /= dd
        yd /= dd
        const rf = 2.0 * (xd * ray.dy - yd * ray.dx)
        ray.dx += yd * rf
        ray.dy -= xd * rf
    }

    paint(context: CanvasRenderingContext2D, scale: number): void {
        context.moveTo(this.x0 * scale, this.y0 * scale)
        context.quadraticCurveTo(this.x1 * scale, this.y1 * scale, this.x2 * scale, this.y2 * scale)
    }

    private advanceDistance(t: number, ray: Ray): number {
        const nx = t * (this.x0 - 2.0 * this.x1 + this.x2) - this.x0 + this.x1
        const ny = t * (this.y0 - 2.0 * this.y1 + this.y2) - this.y0 + this.y1
        const dir: boolean = nx * ray.dy - ny * ray.dx < 0.0
        const t0 = 1.0 - t
        const t1 = t0 * t0
        const t2 = t0 * t
        const t3 = t * t
        const dx = (t1 * this.x0 + 2.0 * t2 * this.x1 + t3 * this.x2) - ray.rx
        const dy = (t1 * this.y0 + 2.0 * t2 * this.y1 + t3 * this.y2) - ray.ry
        const side: boolean = dx * ny - dy * nx < 0.0
        if (side == dir) {
            return Number.MAX_VALUE
        }
        const dt = Math.sqrt(dx * dx + dy * dy)
        if (dt < Epsilon) {
            return Number.MAX_VALUE
        }
        return dt
    }
}

export class LineObstacle implements Obstacle {
    private readonly evaluator: LineEvaluator = new LineEvaluator()

    private x0: number
    private y0: number
    private x1: number
    private y1: number

    constructor(x0: number, y0: number, x1: number, y1: number) {
        this.set(x0, y0, x1, y1)
    }

    set(x0: number, y0: number, x1: number, y1: number): void {
        this.evaluator.set(x0, y0, x1, y1)
        this.x0 = x0
        this.y0 = y0
        this.x1 = x1
        this.y1 = y1
    }

    capture(ray: Ray): number {
        return this.evaluator.capture(ray)
    }

    modify(ray: Ray): void {
        this.evaluator.modify(ray)
    }

    paint(context: CanvasRenderingContext2D, scale: number): void {
        this.evaluator.paint(context, scale)
    }
}

export class CircleObstacle implements Obstacle {
    private static LineModeTolerance: number = 0.01

    private readonly lineEvaluator: LineEvaluator = new LineEvaluator()
    private readonly curveEvaluator: CurveEvaluator = new CurveEvaluator()

    private evaluator: Evaluator = this.lineEvaluator

    constructor(x0: number, y0: number, x1: number, y1: number, bend: number) {
        this.set(x0, y0, x1, y1, bend)
    }

    set(x0: number, y0: number, x1: number, y1: number, bend: number): void {
        if (bend > -CircleObstacle.LineModeTolerance && bend < CircleObstacle.LineModeTolerance) {
            this.lineEvaluator.set(x0, y0, x1, y1)
            this.evaluator = this.lineEvaluator
        } else {
            this.curveEvaluator.set(x0, y0, x1, y1, bend)
            this.evaluator = this.curveEvaluator
        }
    }

    capture(ray: Ray): number {
        return this.evaluator.capture(ray)
    }

    modify(ray: Ray): void {
        this.evaluator.modify(ray)
    }

    paint(context: CanvasRenderingContext2D, scale: number): void {
        this.evaluator.paint(context, scale)
    }
}

export class QBezierObstacle implements Obstacle {
    private readonly evaluator: QBezierEvaluator = new QBezierEvaluator()

    constructor(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
        this.evaluator.set(x0, y0, x1, y1, x2, y2)
    }

    capture(ray: Ray): number {
        return this.evaluator.capture(ray)
    }

    modify(ray: Ray) {
        this.evaluator.modify(ray)
    }

    paint(context: CanvasRenderingContext2D, scale: number) {
        this.evaluator.paint(context, scale)
    }
}