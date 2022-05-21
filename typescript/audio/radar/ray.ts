export interface Point {
    x: number
    y: number
}

export class Ray implements Point {
    x: number = 0.0
    y: number = 0.0
    vx: number = 0.0
    vy: number = 0.0

    /**
     * @param angle zero is upwards, positive counter-clock wise
     * @param x x position in circle [-1, +1]
     * @param y y position in circle [-1, +1]
     */
    reuse(angle: number, x: number = 0.0, y: number = 0.0): this {
        console.assert(Math.sqrt(x * x + y * y) < 1.0)
        this.x = x
        this.y = y
        this.vx = Math.sin(angle)
        this.vy = -Math.cos(angle)
        this.normalize()
        return this
    }

    move(dt: number): void {
        console.assert(dt >= 0.0)
        this.x += this.vx * dt
        this.y += this.vy * dt
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
}