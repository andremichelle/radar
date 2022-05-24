import {Obstacle} from "./obstacles.js"

export interface Point {
    x: number
    y: number
}

export enum Touch {
    Obstacle, Last
}

const Epsilon: number = 1.0001

/**
 * Special ray implementation whereas origin is always inside a unit circle
 */
export class Ray {
    static readonly MaxMovements: number = 250

    x: number = 0.0
    y: number = 0.0
    vx: number = 0.0
    vy: number = 0.0
    moveCounts: number = 0
    lastAngle: number = 0.0

    /**
     * @param angle zero is upwards, positive counter-clock wise
     * @param x x position in circle
     * @param y y position in circle
     */
    reuse(angle: number, x: number = 0.0, y: number = 0.0): this {
        this.x = x
        this.y = y
        this.assertInsideUnitCircle()
        this.vx = Math.sin(angle)
        this.vy = -Math.cos(angle)
        this.normalize()
        this.moveCounts = 0
        return this
    }

    * trace(obstacles: ReadonlyArray<Obstacle>): Generator<Readonly<Ray>> {
        while (this.step(obstacles) === Touch.Obstacle) {
            if (this.moveExceeded()) {
                this.x = Math.sin(this.lastAngle)
                this.y = -Math.cos(this.lastAngle)
                return this
            }
            yield this
        }
        this.lastAngle = this.angle()
        yield this
    }

    eval(obstacles: ReadonlyArray<Obstacle>): number {
        while (this.step(obstacles) === Touch.Obstacle) {
            if (this.moveExceeded()) return this.lastAngle
        }
        return this.lastAngle = this.angle()
    }

    step(obstacles: ReadonlyArray<Obstacle>): Touch {
        let closestObstacle: Obstacle = null
        let closestDistance = Number.MAX_VALUE
        obstacles.forEach(modifier => {
            const distance = modifier.capture(this)
            if (distance > 0.0 && distance < closestDistance) {
                closestObstacle = modifier
                closestDistance = distance
            }
        })
        if (closestObstacle === null) {
            throw new Error('No reflection')
        }
        this.move(closestDistance)
        if (closestObstacle.isBoundary()) {
            return Touch.Last
        }
        closestObstacle.reflect(this)
        return Touch.Obstacle
    }

    move(dt: number): void {
        console.assert(dt >= 0.0)
        this.x += this.vx * dt
        this.y += this.vy * dt
        this.assertInsideUnitCircle()
        this.moveCounts++
    }

    moveExceeded(): boolean {
        return this.moveCounts >= Ray.MaxMovements
    }

    reflect(nx: number, ny: number): void {
        const reflect = 2.0 * (nx * this.vx + ny * this.vy)
        this.vx -= nx * reflect
        this.vy -= ny * reflect
        this.normalize()
    }

    normalize() {
        const l = this.length()
        this.vx /= l
        this.vy /= l
    }

    length(): number {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy)
    }

    angle() {
        return Math.atan2(this.x, -this.y)
    }

    dot(): number {
        return this.x * this.vx + this.y * this.vy
    }

    cross(): number {
        return this.x * this.vy - this.y * this.vx
    }

    assertInsideUnitCircle(): void {
        const distance = Math.sqrt(this.x * this.x + this.y * this.y)
        console.assert(distance <= Epsilon, `Outside circle (${distance})`)
    }
}