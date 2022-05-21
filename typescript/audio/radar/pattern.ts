import {TAU} from "../../lib/math.js"
import {Obstacle} from "./obstacles.js"
import {Point, Ray} from "./ray.js"

export class Pattern {
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

    getObstacles(): ReadonlyArray<Obstacle> {
        return this.obstacles
    }

    evaluate(ray: Ray): number {
        let count = 0
        while (this.step(ray)) {
            if (++count > Pattern.MaxIterations) {
                break
            }
        }
        const ev = ray.cross()
        const sq = 1.0 - ev * ev
        console.assert(sq >= 0.0)
        ray.move(Math.sqrt(sq) - ray.dot())
        const position = ray.angle() / TAU
        return position - Math.floor(position)
    }

    * trace(ray: Ray): Generator<Readonly<Point>> {
        let count = 0
        while (this.step(ray)) {
            if (++count === Pattern.MaxIterations) {
                console.warn(`Max iteration reached ${count}!`)
                break
            }
            yield ray
        }
        const ev = ray.cross()
        const sq = 1.0 - ev * ev
        console.assert(sq > 0.0)
        ray.move((Math.sqrt(sq) - ray.dot()))
        yield ray
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
        ray.move(closestDistance)
        closestModifier.reflect(ray)
        return true
    }
}