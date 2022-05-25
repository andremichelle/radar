import {Serializer} from "../../lib/common.js"
import {ArcObstacle, CurveObstacle, LineObstacle, Obstacle, ObstacleFormat, OutlineObstacle} from "./obstacles.js"

export interface PatternFormat {
    obstacles: ObstacleFormat[]
}

export class Pattern implements Serializer<PatternFormat> {
    private static Outline = new OutlineObstacle()

    private readonly obstacles: Obstacle<any>[] = [Pattern.Outline]

    addObstacle(obstacle: Obstacle<any>): void {
        this.obstacles.push(obstacle)
    }

    removeObstacle(obstacle: Obstacle<any>): void {
        const indexOf = this.obstacles.indexOf(obstacle)
        console.assert(-1 !== indexOf)
        this.obstacles.splice(indexOf, 1)
    }

    getObstacles(): ReadonlyArray<Obstacle<any>> {
        return this.obstacles
    }

    clearObstacles(): void {
        this.obstacles.splice(1, this.obstacles.length)
    }

    deserialize(format: PatternFormat): Serializer<PatternFormat> {
        this.obstacles.splice(1, this.obstacles.length, ...format.obstacles.map((format: ObstacleFormat) => {
            if (format.class === 'line') {
                return new LineObstacle(format.x0, format.y0, format.x1, format.y1)
            } else if (format.class === 'arc') {
                return new ArcObstacle(format.x0, format.y0, format.x1, format.y1, format.bend)
            } else if (format.class === 'curve') {
                return new CurveObstacle(format.x0, format.y0, format.x1, format.y1, format.x2, format.y2)
            }
        }))
        return this
    }

    serialize(): PatternFormat {
        return {
            obstacles: this.obstacles
                .filter(obstacle => obstacle !== Pattern.Outline)
                .map(obstacle => obstacle.serialize())
        }
    }
}