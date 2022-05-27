import {
    Observable,
    ObservableImpl,
    ObservableValueImpl,
    Observer,
    Serializer,
    Terminable,
    Terminator
} from "../../lib/common.js"
import {ArcObstacle, CurveObstacle, LineObstacle, Obstacle, ObstacleFormat, OutlineObstacle} from "./obstacles.js"
import {Point} from "./ray.js"
import {distance, DragHandler} from "./utils.js"

export interface PatternFormat {
    origin: { x: number, y: number }
    obstacles: ObstacleFormat[]
    file: string
}

export class Pattern implements Observable<Pattern>, Serializer<PatternFormat> {
    private readonly terminator: Terminator = new Terminator()
    private readonly observable: ObservableImpl<Pattern> = this.terminator.with(new ObservableImpl<Pattern>())
    private readonly origin: Point = {x: 0.0, y: 0.0}
    private readonly file: ObservableValueImpl<string> = new ObservableValueImpl<string>('dnb.ogg')
    private readonly obstacles: Obstacle<any>[] = [new OutlineObstacle(this)]

    addObstacle(obstacle: Obstacle<any>): void {
        this.obstacles.push(obstacle)
        this.observable.notify(this)
    }

    removeObstacle(obstacle: Obstacle<any>): void {
        const indexOf = this.obstacles.indexOf(obstacle)
        console.assert(-1 !== indexOf)
        this.obstacles.splice(indexOf, 1)
        this.observable.notify(this)
    }

    getObstacles(): ReadonlyArray<Obstacle<any>> {
        return this.obstacles
    }

    getOrigin(): Readonly<Point> {
        return this.origin
    }

    clearObstacles(): void {
        this.obstacles.splice(1, this.obstacles.length)
        this.observable.notify(this)
    }

    resetOrigin() {
        this.origin.x = 0.0
        this.origin.y = 0.0
        this.observable.notify(this)
    }

    onChanged(): void {
        this.observable.notify(this)
    }

    addObserver(observer: Observer<Pattern>): Terminable {
        return this.observable.addObserver(observer)
    }

    addFileObserver(observer: Observer<string>): Terminable {
        return this.file.addObserver(observer, true)
    }

    removeObserver(observer: Observer<Pattern>): boolean {
        return this.observable.removeObserver(observer)
    }

    deserialize(format: PatternFormat): Serializer<PatternFormat> {
        this.origin.x = format.origin.x
        this.origin.y = format.origin.y
        this.obstacles.splice(1, this.obstacles.length, ...format.obstacles.map((format: ObstacleFormat) => {
            if (format.class === 'line') {
                return new LineObstacle(this).set(format.x0, format.y0, format.x1, format.y1)
            } else if (format.class === 'arc') {
                return new ArcObstacle(this).set(format.x0, format.y0, format.x1, format.y1, format.bend)
            } else if (format.class === 'curve') {
                return new CurveObstacle(this).set(format.x0, format.y0, format.x1, format.y1, format.x2, format.y2)
            }
        }))
        this.file.set(format.file)
        this.observable.notify(this)
        return this
    }

    serialize(): PatternFormat {
        return {
            origin: {x: this.origin.x, y: this.origin.y},
            obstacles: this.obstacles
                .slice(1)
                .map(obstacle => obstacle.serialize()),
            file: this.file.get()
        }
    }

    terminate(): void {
        this.terminator.terminate()
    }

    readonly dragHandlers: DragHandler[] = [{
        distance: (x: number, y: number): number => {
            return distance(x, y, this.origin.x, this.origin.y)
        }, moveTo: (x: number, y: number): void => {
            this.origin.x = x
            this.origin.y = y
            this.observable.notify(this)
        }, constrainToCircle: (): boolean => true
    }]
}