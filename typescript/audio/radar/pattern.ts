import {Obstacle, OutlineEvaluator} from "./obstacles.js"

export class Pattern {
    private static Outline = new OutlineEvaluator()

    private readonly obstacles: Obstacle[] = [Pattern.Outline]

    addObstacle(obstacle: Obstacle): void {
        this.obstacles.push(obstacle)
    }

    removeObstacle(obstacle: Obstacle): void {
        const indexOf = this.obstacles.indexOf(obstacle)
        console.assert(-1 !== indexOf)
        this.obstacles.splice(indexOf, 1)
    }

    getObstacles(): ReadonlyArray<Obstacle> {
        return this.obstacles
    }
}