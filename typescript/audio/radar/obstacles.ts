import {TAU} from "../../lib/math.js"
import {distance, DragHandler} from "./dragging.js"
import {Ray} from "./ray.js"

export type Obstacle = Evaluator

interface Evaluator {
    capture(ray: Ray): number

    reflect(ray: Ray): void

    paintPath(context: CanvasRenderingContext2D, scale: number): void

    paintHandler(context: CanvasRenderingContext2D, scale: number): void

    isBoundary(): boolean

    dragHandlers: ReadonlyArray<DragHandler>
}

const Epsilon: number = 0.00001

const drawHandler = (context: CanvasRenderingContext2D, x: number, y: number, scale: number): void => {
    context.beginPath()
    context.arc(x * scale, y * scale, 4, 0.0, TAU)
    context.fill()
}

export class OutlineEvaluator implements Evaluator {
    dragHandlers: ReadonlyArray<DragHandler> = []

    capture(ray: Ray): number {
        const ev = ray.cross()
        const sq = 1.0 - ev * ev
        console.assert(sq >= 0.0)
        return Math.sqrt(sq) - ray.dot()
    }

    paintHandler(context: CanvasRenderingContext2D, scale: number): void {
        // fixed position
    }

    paintPath(context: CanvasRenderingContext2D, scale: number): void {
        // invisible
    }

    reflect(ray: Ray): void {
        // ray track is done. no reflection needed.
    }

    isBoundary(): boolean {
        return true
    }
}

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
        this.update()
    }

    capture(ray: Ray): number {
        const ud = this.dy * ray.vx - this.dx * ray.vy
        const px = this.x0 - ray.x
        const py = this.y0 - ray.y
        const dt = (this.dy * px - this.dx * py) / ud
        if (dt < Epsilon) {
            return Number.MAX_VALUE
        }
        const ua = (ray.vy * px - ray.vx * py) / ud
        if (ua < 0.0 || ua > 1.0) {
            return Number.MAX_VALUE
        }
        return dt
    }

    reflect(ray: Ray): void {
        ray.reflect(this.nx, this.ny)
    }

    paintPath(context: CanvasRenderingContext2D, scale: number): void {
        context.beginPath()
        context.moveTo(this.x0 * scale, this.y0 * scale)
        context.lineTo(this.x1 * scale, this.y1 * scale)
        context.stroke()
    }

    paintHandler(context: CanvasRenderingContext2D, scale: number): void {
        drawHandler(context, this.x0, this.y0, scale)
        drawHandler(context, this.x1, this.y1, scale)
    }

    isBoundary(): boolean {
        return false
    }

    readonly dragHandlers: ReadonlyArray<DragHandler> = [
        {
            distance: (x: number, y: number) => distance(x, y, this.x0, this.y0),
            moveTo: (x: number, y: number) => {
                this.x0 = x
                this.y0 = y
                this.update()
            }
        },
        {
            distance: (x: number, y: number) => distance(x, y, this.x1, this.y1),
            moveTo: (x: number, y: number) => {
                this.x1 = x
                this.y1 = y
                this.update()
            }
        }]

    private update(): void {
        this.dx = this.x1 - this.x0
        this.dy = this.y1 - this.y0
        const nl = Math.sqrt(this.dx * this.dx + this.dy * this.dy)
        this.nx = this.dy / nl
        this.ny = -this.dx / nl
    }
}

class ArcEvaluator implements Evaluator {
    private x0: number
    private y0: number
    private x1: number
    private y1: number
    private bend: number
    private x2: number
    private y2: number
    private cx: number
    private cy: number
    private radius: number
    private angle0: number
    private angle1: number
    private angleWidth: number

    set(x0: number, y0: number, x1: number, y1: number, bend: number): void {
        this.x0 = x0
        this.y0 = y0
        this.x1 = x1
        this.y1 = y1
        this.bend = bend
        this.update()
    }

    capture(ray: Ray): number {
        const dx = ray.vx
        const dy = ray.vy
        const ex = ray.x - this.cx
        const ey = ray.y - this.cy
        const ev = ex * dy - ey * dx

        let sq = this.radius * this.radius - ev * ev
        if (sq < 0.0) {
            return Number.MAX_VALUE
        }
        sq = Math.sqrt(sq)

        const ed = ey * dy + ex * dx
        const dt0 = sq - ed
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

    reflect(ray: Ray): void {
        ray.reflect((ray.x - this.cx) / this.radius, (ray.y - this.cy) / this.radius)
    }

    paintPath(context: CanvasRenderingContext2D, scale: number): void {
        context.beginPath()
        context.arc(this.cx * scale, this.cy * scale, this.radius * scale, this.angle0, this.angle1)
        context.stroke()
    }

    paintHandler(context: CanvasRenderingContext2D, scale: number): void {
        drawHandler(context, this.x0, this.y0, scale)
        drawHandler(context, this.x1, this.y1, scale)
        drawHandler(context, this.x2, this.y2, scale)
    }

    isBoundary(): boolean {
        return false
    }

    readonly dragHandlers: ReadonlyArray<DragHandler> = [
        {
            distance: (x: number, y: number) => distance(x, y, this.x0, this.y0),
            moveTo: (x: number, y: number) => this.set(x, y, this.x1, this.y1, this.bend)
        },
        {
            distance: (x: number, y: number) => distance(x, y, this.x1, this.y1),
            moveTo: (x: number, y: number) => this.set(this.x0, this.y0, x, y, this.bend)
        },
        {
            distance: (x: number, y: number) => distance(x, y, this.x2, this.y2),
            moveTo: (x: number, y: number) => {
                const dx = this.x1 - this.x0
                const dy = this.y1 - this.y0
                const bend = Math.abs(dy) < Epsilon
                    ? (2.0 * (this.y0 - y) - dy) / dx
                    : (2.0 * (x - this.x0) - dx) / dy
                this.set(this.x0, this.y0, this.x1, this.y1, bend)
            }
        }]

    private update(): void {
        const dx = this.x1 - this.x0
        const dy = this.y1 - this.y0
        this.x2 = this.x0 + 0.5 * (dx + dy * this.bend)
        this.y2 = this.y0 + 0.5 * (dy - dx * this.bend)
        const a1 = 2.0 * (this.x2 - this.x1)
        const b1 = 0.5 / (this.y2 - this.y1)
        const a2 = 2.0 * (this.x0 - this.x1)
        const b2 = 2.0 * (this.y0 - this.y1)
        const c1 = (this.x2 * this.x2 - this.x1 * this.x1) + (this.y2 * this.y2 - this.y1 * this.y1)
        const c2 = (this.x0 * this.x0 - this.x1 * this.x1) + (this.y0 * this.y0 - this.y1 * this.y1)
        this.cx = (c2 - b2 * c1 * b1) / (a2 - b2 * a1 * b1)
        this.cy = (c1 - a1 * this.cx) * b1
        this.radius = Math.sqrt((this.x1 - this.cx) * (this.x1 - this.cx) + (this.y1 - this.cy) * (this.y1 - this.cy))
        this.angle0 = Math.atan2(this.y0 - this.cy, this.x0 - this.cx)
        this.angle1 = Math.atan2(this.y1 - this.cy, this.x1 - this.cx)
        if (this.bend < 0.0) {
            const tmp = this.angle0
            this.angle0 = this.angle1
            this.angle1 = tmp
        }
        if (this.angle0 < 0.0) this.angle0 += TAU
        if (this.angle1 < 0.0) this.angle1 += TAU
        this.angleWidth = this.angle1 - this.angle0
        while (this.angleWidth < 0.0) this.angleWidth += TAU
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
            const px: number = this.x0 - ray.x
            const py: number = this.y0 - ray.y
            const ud: number = ray.vx * ly - ray.vy * lx
            const dt: number = (ly * px - lx * py) / ud
            if (dt < Epsilon) {
                return Number.MAX_VALUE
            }
            const ua: number = (ray.vy * px - ray.vx * py) / ud
            if (ua < 0.0 || ua > 1.0) {
                return Number.MAX_VALUE
            }
            this.cachedT = ua
            return dt
        }

        const a: number = ray.vx * cy2 - ray.vy * cx2
        const b: number = (ray.vx * cy1 - ray.vy * cx1) / a
        const c: number = (ray.vx * this.y0 - ray.vy * this.x0 + ray.x * ray.vy - ray.vx * ray.y) / a

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

    reflect(ray: Ray): void {
        const dx = this.cachedT * (this.x0 - 2.0 * this.x1 + this.x2) - this.x0 + this.x1
        const dy = this.cachedT * (this.y0 - 2.0 * this.y1 + this.y2) - this.y0 + this.y1
        const dd = Math.sqrt(dx * dx + dy * dy)
        ray.reflect(dy / dd, -dx / dd)
    }

    paintPath(context: CanvasRenderingContext2D, scale: number): void {
        context.beginPath()
        context.moveTo(this.x0 * scale, this.y0 * scale)
        context.quadraticCurveTo(this.x1 * scale, this.y1 * scale, this.x2 * scale, this.y2 * scale)
        context.stroke()
    }

    paintHandler(context: CanvasRenderingContext2D, scale: number): void {
        drawHandler(context, this.x0, this.y0, scale)
        drawHandler(context,
            this.x1 * 0.5 + 0.25 * (this.x0 + this.x2),
            this.y1 * 0.5 + 0.25 * (this.y0 + this.y2), scale)
        drawHandler(context, this.x2, this.y2, scale)
    }

    isBoundary(): boolean {
        return false
    }

    readonly dragHandlers: ReadonlyArray<DragHandler> = [
        {
            distance: (x: number, y: number) => distance(x, y, this.x0, this.y0),
            moveTo: (x: number, y: number) => {
                this.x0 = x
                this.y0 = y
            }
        },
        {
            distance: (x: number, y: number) => distance(x, y,
                this.x1 * 0.5 + 0.25 * (this.x0 + this.x2),
                this.y1 * 0.5 + 0.25 * (this.y0 + this.y2)),
            moveTo: (x: number, y: number) => {
                this.x1 = 2.0 * x - 0.5 * (this.x0 + this.x2)
                this.y1 = 2.0 * y - 0.5 * (this.y0 + this.y2)
            }
        },
        {
            distance: (x: number, y: number) => distance(x, y, this.x2, this.y2),
            moveTo: (x: number, y: number) => {
                this.x2 = x
                this.y2 = y
            }
        }]

    private advanceDistance(t: number, ray: Ray): number {
        const nx = t * (this.x0 - 2.0 * this.x1 + this.x2) - this.x0 + this.x1
        const ny = t * (this.y0 - 2.0 * this.y1 + this.y2) - this.y0 + this.y1
        const dir: boolean = nx * ray.vy - ny * ray.vx < 0.0
        const t0 = 1.0 - t
        const t1 = t0 * t0
        const t2 = t0 * t
        const t3 = t * t
        const dx = (t1 * this.x0 + 2.0 * t2 * this.x1 + t3 * this.x2) - ray.x
        const dy = (t1 * this.y0 + 2.0 * t2 * this.y1 + t3 * this.y2) - ray.y
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

    reflect(ray: Ray): void {
        this.evaluator.reflect(ray)
    }

    paintPath(context: CanvasRenderingContext2D, scale: number): void {
        this.evaluator.paintPath(context, scale)
    }

    paintHandler(context: CanvasRenderingContext2D, scale: number) {
        this.evaluator.paintHandler(context, scale)
    }

    isBoundary(): boolean {
        return false
    }

    readonly dragHandlers: ReadonlyArray<DragHandler> = this.evaluator.dragHandlers
}

export class ArcObstacle implements Obstacle {
    private static LineModeTolerance: number = 0.001

    private readonly lineEvaluator: LineEvaluator = new LineEvaluator()
    private readonly arcEvaluator: ArcEvaluator = new ArcEvaluator()

    private evaluator: Evaluator = this.lineEvaluator

    constructor(x0: number, y0: number, x1: number, y1: number, bend: number) {
        this.set(x0, y0, x1, y1, bend)
    }

    set(x0: number, y0: number, x1: number, y1: number, bend: number): void {
        this.lineEvaluator.set(x0, y0, x1, y1)
        this.arcEvaluator.set(x0, y0, x1, y1, bend)
        if (bend > -ArcObstacle.LineModeTolerance && bend < ArcObstacle.LineModeTolerance) {
            this.evaluator = this.lineEvaluator
        } else {
            this.evaluator = this.arcEvaluator
        }
    }

    capture(ray: Ray): number {
        return this.evaluator.capture(ray)
    }

    reflect(ray: Ray): void {
        this.evaluator.reflect(ray)
    }

    paintPath(context: CanvasRenderingContext2D, scale: number): void {
        this.evaluator.paintPath(context, scale)
    }

    paintHandler(context: CanvasRenderingContext2D, scale: number): void {
        this.arcEvaluator.paintHandler(context, scale)
    }

    isBoundary(): boolean {
        return false
    }

    readonly dragHandlers: ReadonlyArray<DragHandler> = this.arcEvaluator.dragHandlers
}

export class QBezierObstacle implements Obstacle {
    private readonly evaluator: QBezierEvaluator = new QBezierEvaluator()

    constructor(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
        this.set(x0, y0, x1, y1, x2, y2)
    }

    set(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) {
        this.evaluator.set(x0, y0, x1, y1, x2, y2)
    }

    capture(ray: Ray): number {
        return this.evaluator.capture(ray)
    }

    reflect(ray: Ray) {
        this.evaluator.reflect(ray)
    }

    paintPath(context: CanvasRenderingContext2D, scale: number) {
        this.evaluator.paintPath(context, scale)
    }

    paintHandler(context: CanvasRenderingContext2D, scale: number) {
        this.evaluator.paintHandler(context, scale)
    }

    isBoundary(): boolean {
        return false
    }

    readonly dragHandlers: ReadonlyArray<DragHandler> = this.evaluator.dragHandlers
}