import {Serializer} from "../../lib/common.js"
import {distance, DragHandler} from "./dragging.js"
import {ArcObstacle, CurveObstacle, LineObstacle, Obstacle, ObstacleFormat, OutlineObstacle} from "./obstacles.js"
import {Point} from "./ray.js"

export interface PatternFormat {
    origin: { x: number, y: number }
    obstacles: ObstacleFormat[]
}

export class Pattern implements Serializer<PatternFormat> {
    private static Outline = new OutlineObstacle()

    private readonly origin: Point = {x: 0.0, y: 0.0}
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

    getOrigin(): Readonly<Point> {
        return this.origin
    }

    clearObstacles(): void {
        this.obstacles.splice(1, this.obstacles.length)
    }

    resetOrigin() {
        this.origin.x = 0.0
        this.origin.y = 0.0
    }

    deserialize(format: PatternFormat): Serializer<PatternFormat> {
        this.origin.x = format.origin.x
        this.origin.y = format.origin.y
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
            origin: {x: this.origin.x, y: this.origin.y},
            obstacles: this.obstacles
                .filter(obstacle => obstacle !== Pattern.Outline)
                .map(obstacle => obstacle.serialize())
        }
    }

    readonly dragHandlers: DragHandler[] = [{
        distance: (x: number, y: number): number => {
            return distance(x, y, this.origin.x, this.origin.y)
        }, moveTo: (x: number, y: number): void => {
            this.origin.x = x
            this.origin.y = y
        }, constrainToCircle: (): boolean => true
    }]
}