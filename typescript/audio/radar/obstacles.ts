import {TAU} from "../../lib/math.js"
import {Ray} from "./ray.js"

export abstract class Obstacle {
    static EPSILON: number = 0.000001

    protected constructor() {
    }

    abstract capture(ray: Ray): number

    abstract modify(ray: Ray, time: number): void

    abstract paint(context: CanvasRenderingContext2D, scale: number): void
}

export class LineObstacle extends Obstacle {
    private dx: number
    private dy: number
    private nx: number
    private ny: number

    constructor(private x0: number,
                private y0: number,
                private x1: number,
                private y1: number) {
        super()

        this.precompute()
    }

    capture(ray: Ray): number {
        const ud = this.dy * ray.dx - this.dx * ray.dy
        const px = this.x0 - ray.rx
        const py = this.y0 - ray.ry
        const dt = (this.dy * px - this.dx * py) / ud
        if (dt < Obstacle.EPSILON) {
            return Number.MAX_VALUE
        }
        const ua = (ray.dy * px - ray.dx * py) / ud
        if (ua < 0.0 || ua > 1.0) {
            return Number.MAX_VALUE
        }
        return dt
    }

    modify(ray: Ray, time: number): void {
        ray.move(time)
        ray.reflect(this.nx, this.ny)
    }

    paint(context: CanvasRenderingContext2D, scale: number): void {
        context.moveTo(this.x0 * scale, this.y0 * scale)
        context.lineTo(this.x1 * scale, this.y1 * scale)
    }

    private precompute(): void {
        this.dx = this.x1 - this.x0
        this.dy = this.y1 - this.y0
        const nl = Math.sqrt(this.dx * this.dx + this.dy * this.dy)
        this.nx = this.dy / nl
        this.ny = -this.dx / nl
    }
}

export class CircleSegmentObstacle extends Obstacle {
    private static LineModeTolerance: number = 0.01

    private lineMode: boolean
    private dx: number
    private dy: number
    private nx: number
    private ny: number
    private x2: number
    private y2: number
    private ln: number
    private cx: number
    private cy: number
    private radius: number
    private radiusInv: number
    private radiusPow2: number
    private angle0: number
    private angle1: number
    private angleWidth: number

    constructor(private x0: number,
                private y0: number,
                private x1: number,
                private y1: number,
                private bend: number) {
        super()

        this.assemble()
    }

    capture(ray: Ray): number {
        if (this.lineMode) {
            return this.distanceLine(ray)
        } else {
            return this.distanceCurve(ray)
        }
    }

    modify(ray: Ray, time: number): void {
        if (this.lineMode) {
            this.modifyLine(ray, time)
        } else {
            this.modifyCurve(ray, time)
        }
    }

    paint(context: CanvasRenderingContext2D, scale: number): void {
        if (this.lineMode) {
            context.moveTo(this.x0 * scale, this.y0 * scale)
            context.lineTo(this.x1 * scale, this.y1 * scale)
        } else {
            context.arc(this.cx * scale, this.cy * scale, this.radius * scale, this.angle0, this.angle0 + this.angleWidth)
        }
    }

    modifyCurve(ray: Ray, time: number): void {
        const dx: number = ray.dx
        const dy: number = ray.dy
        ray.rx += dx * time
        ray.ry += dy * time
        const nx: number = (ray.rx - this.cx) * this.radiusInv
        const ny: number = (ray.ry - this.cy) * this.radiusInv
        const rf: number = 2.0 * (nx * dx + ny * dy)
        ray.dx -= nx * rf
        ray.dy -= ny * rf
    }

    private modifyLine(ray: Ray, time: number): void {
        const dx: number = ray.dx
        const dy: number = ray.dy
        ray.rx += dx * time
        ray.ry += dy * time
        const rf: number = 2.0 * (this.nx * dx + this.ny * dy)
        ray.dx -= this.nx * rf
        ray.dy -= this.ny * rf
    }

    private distanceCurve(ray: Ray): number {
        const dx: number = ray.dx
        const dy: number = ray.dy
        const ex: number = ray.rx - this.cx
        const ey: number = ray.ry - this.cy
        const ev: number = ex * dy - ey * dx

        let sq: number = this.radiusPow2 - ev * ev
        if (sq < 0.0) {
            return Number.MAX_VALUE
        }

        sq = Math.sqrt(sq)

        const ed: number = ey * dy + ex * dx
        const dt0: number = (sq - ed)
        const dt1: number = -(sq + ed)

        let dt: number

        if (dt0 < Obstacle.EPSILON) {
            if (dt1 < Obstacle.EPSILON) {
                return Number.MAX_VALUE
            }
            dt = dt1
        } else if (dt1 < Obstacle.EPSILON) {
            if (dt0 < Obstacle.EPSILON) {
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

    private distanceLine(ray: Ray): number {
        const dx = ray.dx
        const dy = ray.dy
        const ud = this.dy * dx - this.dx * dy
        const px = this.x0 - ray.rx
        const py = this.y0 - ray.ry
        const dt = (this.dy * px - this.dx * py) / ud
        if (dt < Obstacle.EPSILON) {
            return Number.MAX_VALUE
        }
        const ua = (dy * px - dx * py) / ud
        if (ua < 0.0 || ua > 1.0) {
            return Number.MAX_VALUE
        }
        return dt
    }

    private assemble(): void {
        this.dx = this.x1 - this.x0
        this.dy = this.y1 - this.y0
        this.ln = Math.sqrt(this.dx * this.dx + this.dy * this.dy)

        this.nx = this.dy / this.ln
        this.ny = -this.dx / this.ln

        const offset: number = this.ln * .5 * this.bend
        this.x2 = this.x0 + this.dx * .5 + this.nx * offset
        this.y2 = this.y0 + this.dy * .5 + this.ny * offset

        this.lineMode = this.bend > -CircleSegmentObstacle.LineModeTolerance && this.bend < CircleSegmentObstacle.LineModeTolerance

        const a1: number = 2.0 * (this.x2 - this.x1)
        const b1: number = 0.5 / (this.y2 - this.y1)
        const a2: number = 2.0 * (this.x0 - this.x1)
        const b2: number = 2.0 * (this.y0 - this.y1)

        const c1: number = (this.x2 * this.x2 - this.x1 * this.x1) + (this.y2 * this.y2 - this.y1 * this.y1)
        const c2: number = (this.x0 * this.x0 - this.x1 * this.x1) + (this.y0 * this.y0 - this.y1 * this.y1)

        this.cx = (c2 - b2 * c1 * b1) / (a2 - b2 * a1 * b1)
        this.cy = (c1 - a1 * this.cx) * b1
        this.radius = Math.sqrt((this.x1 - this.cx) * (this.x1 - this.cx) + (this.y1 - this.cy) * (this.y1 - this.cy))
        this.radiusInv = 1.0 / this.radius
        this.radiusPow2 = this.radius * this.radius
        this.angle0 = Math.atan2(this.y0 - this.cy, this.x0 - this.cx)
        this.angle1 = Math.atan2(this.y1 - this.cy, this.x1 - this.cx)
        if (this.bend < 0.0) {
            const tmp: number = this.angle0
            this.angle0 = this.angle1
            this.angle1 = tmp
        }
        if (this.angle0 < 0.0) this.angle0 += TAU
        if (this.angle1 < 0.0) this.angle1 += TAU
        this.angleWidth = this.angle1 - this.angle0
        while (this.angleWidth < 0.0) this.angleWidth += TAU
        // notify(RayModifierNotifyType.CHANGEDthis.MODEL)
    }
}