import {TAU} from "../../lib/math.js"
import {Obstacle, OutlineEvaluator} from "./obstacles.js"
import {Point, Ray} from "./ray.js"

export enum Reflection {
    None, Obstacle, Outline
}

export class Pattern {
    private static MaxIterations: number = 250
    private static Outline = new OutlineEvaluator()

    private readonly obstacles: Obstacle[] = [Pattern.Outline]

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
        const position = ray.angle() / TAU
        return position - Math.floor(position)
    }

    * trace(ray: Ray): Generator<Readonly<Point>> {
        let count = 0
        while (this.step(ray) === Reflection.Obstacle) {
            if (++count === Pattern.MaxIterations) {
                console.warn(`Max iteration reached ${count}!`)
                break
            }
            yield ray
        }
        yield ray
    }

    private step(ray: Ray): Reflection {
        let closestObstacle: Obstacle = null
        let closestDistance = Number.MAX_VALUE
        this.obstacles.forEach(modifier => {
            const distance = modifier.capture(ray)
            if (distance > 0.0 && distance < closestDistance) {
                closestObstacle = modifier
                closestDistance = distance
            }
        })
        if (closestObstacle === null) {
            return Reflection.None
        }
        ray.move(closestDistance)
        if(closestObstacle === Pattern.Outline) {
            ray.burst()
            return Reflection.Outline
        }
        closestObstacle.reflect(ray)
        return Reflection.Obstacle
    }
}