import {TAU} from "../../lib/math.js"
import {Obstacle} from "./obstacles.js"
import {Ray} from "./ray.js"

export interface Point {
    x: number
    y: number
}

export class Pattern {
    private static Evaluator = new Ray()
    private static MaxIterations: number = 500

    private readonly obstacles: Obstacle[] = []

    addObstacle(modifier: Obstacle): void {
        this.obstacles.push(modifier)
    }

    removeObstacle(modifier: Obstacle): void {
        const indexOf = this.obstacles.indexOf(modifier)
        console.assert(-1 !== indexOf)
        this.obstacles.splice(indexOf, 1)
    }

    getObstacle(): ReadonlyArray<Obstacle> {
        return this.obstacles
    }

    evaluate(normalized: number): number {
        const ray = Pattern.Evaluator.reset(normalized * TAU)
        let count = 0
        while (this.step(ray)) {
            if (++count > Pattern.MaxIterations) {
                break
            }
        }
        const ev = ray.cross()
        const sq = 1.0 - ev * ev
        if (sq < 0.0) {
            return 0.0
        }
        const dt = (Math.sqrt(sq) - ray.ry * ray.dy - ray.rx * ray.dx)
        const position = Math.atan2(ray.ry + ray.dy * dt, ray.rx + ray.dx * dt) / TAU + 1.0
        return position - Math.floor(position)
    }

    * trace(normalized: number): Generator<Point, Point> {
        const ray = new Ray().reset(normalized * TAU)
        for (let count = 0; count < Pattern.MaxIterations; count++) {
            if (this.step(ray)) {
                yield {x: ray.rx, y: ray.ry}
            } else {
                break
            }
        }
        const ev = ray.rx * ray.dy - ray.ry * ray.dx
        const sq = 1.0 - ev * ev
        if (sq < 0.0) {
            return
        }
        ray.move((Math.sqrt(sq) - ray.ry * ray.dy - ray.rx * ray.dx))
        yield {x: ray.rx, y: ray.ry}
    }

    private step(ray: Ray): boolean {
        let closestModifier: Obstacle = null
        let closestDistance = Number.MAX_VALUE
        this.obstacles.forEach(modifier => {
            const distance = modifier.capture(ray)
            if (distance > 0.0 && distance < closestDistance) {
                closestModifier = modifier
                closestDistance = distance
            }
        })
        if (null == closestModifier) {
            return false
        }
        closestModifier.modify(ray, closestDistance)
        return true
    }
}