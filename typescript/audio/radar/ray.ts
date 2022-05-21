export class Ray {
    rx: number = 0.0
    ry: number = 0.0
    dx: number = 0.0
    dy: number = 0.0

    /**
     * @param angle zero is upwards, positive counter-clock wise
     * @param x x position in circle [-1, +1]
     * @param y y position in circle [-1, +1]
     */
    reuse(angle: number, x: number = 0.0, y: number = 0.0): this {
        console.assert(Math.sqrt(x * x + y * y) < 1.0)
        this.rx = x
        this.ry = y
        this.dx = Math.sin(angle)
        this.dy = -Math.cos(angle)
        return this
    }

    move(dt: number): void {
        this.rx += this.dx * dt
        this.ry += this.dy * dt
    }

    reflect(nx: number, ny: number): void {
        const reflect = 2.0 * (nx * this.dx + ny * this.dy)
        this.dx -= nx * reflect
        this.dy -= ny * reflect
    }

    length(): number {
        return Math.sqrt(this.dx * this.dx + this.dy * this.dy)
    }

    dot(): number {
        return this.rx * this.dx + this.ry * this.dy
    }

    cross(): number {
        return this.rx * this.dy - this.ry * this.dx
    }

    angle(): number {
        return Math.atan2(this.ry, this.rx)
    }

    fromCenter(): void {
        this.dx = this.rx
        this.dy = this.ry
        const len = this.length()
        this.dx /= len
        this.dy /= len
    }
}