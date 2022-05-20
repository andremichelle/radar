export class Ray {
    rx: number
    ry: number
    dx: number
    dy: number

    reset(angle: number): this {
        this.rx = 0.0
        this.ry = 0.0
        this.dx = Math.cos(angle)
        this.dy = Math.sin(angle)
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

    normalize(): void {
        const dd = this.length()
        this.dx /= dd
        this.dy /= dd
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
}