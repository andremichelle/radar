export interface Point {
    x: number
    y: number
}

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

    dot(): number {
        return this.x * this.vx + this.y * this.vy
    }

    cross(): number {
        return this.x * this.vy - this.y * this.vx
    }

    angle(): number {
        return Math.atan2(this.y, this.x)
    }

    burst(): void {
        this.vx = this.x
        this.vy = this.y
        this.normalize()
    }

    assertInsideUnitCircle(): void {
        //console.assert(Math.sqrt(this.x * this.x + this.y * this.y) <= 1.0)
        const l = Math.sqrt(this.x * this.x + this.y * this.y)
        if(l > 1.0) {
            // TODO console.warn(l) exceeds at the end. Can we fix this?
        }
    }
}