import { ObservableImpl, ObservableValueImpl, Terminator } from "../../lib/common.js";
import { ArcObstacle, CurveObstacle, LineObstacle, OutlineObstacle } from "./obstacles.js";
import { distance } from "./utils.js";
export class Pattern {
    constructor() {
        this.terminator = new Terminator();
        this.observable = this.terminator.with(new ObservableImpl());
        this.origin = { x: 0.0, y: 0.0 };
        this.file = new ObservableValueImpl('amen.wav');
        this.bpm = new ObservableValueImpl(160.0);
        this.bars = new ObservableValueImpl(2);
        this.obstacles = [new OutlineObstacle(this)];
        this.dragHandlers = [{
                distance: (x, y) => {
                    return distance(x, y, this.origin.x, this.origin.y);
                }, moveTo: (x, y) => {
                    this.origin.x = x;
                    this.origin.y = y;
                    this.observable.notify(this);
                }, constrainToCircle: () => true,
                obstacle: null
            }];
        this.terminator.with(this.bars.addObserver(() => this.observable.notify(this)));
        this.terminator.with(this.bpm.addObserver(() => this.observable.notify(this)));
    }
    addObstacle(obstacle) {
        this.obstacles.push(obstacle);
        this.observable.notify(this);
    }
    removeObstacle(obstacle) {
        const indexOf = this.obstacles.indexOf(obstacle);
        console.assert(-1 !== indexOf);
        this.obstacles.splice(indexOf, 1);
        this.observable.notify(this);
    }
    getObstacles() {
        return this.obstacles;
    }
    getOrigin() {
        return this.origin;
    }
    getBars() {
        return this.bars;
    }
    getBpm() {
        return this.bpm;
    }
    clearObstacles() {
        this.obstacles.splice(1, this.obstacles.length);
        this.observable.notify(this);
    }
    resetOrigin() {
        this.origin.x = 0.0;
        this.origin.y = 0.0;
        this.observable.notify(this);
    }
    onChanged() {
        this.observable.notify(this);
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    addFileObserver(observer) {
        return this.file.addObserver(observer, true);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    deserialize(format) {
        this.origin.x = format.origin.x;
        this.origin.y = format.origin.y;
        this.obstacles.splice(1, this.obstacles.length, ...format.obstacles.map((format) => {
            if (format.class === 'line') {
                return new LineObstacle(this).set(format.x0, format.y0, format.x1, format.y1);
            }
            else if (format.class === 'arc') {
                return new ArcObstacle(this).set(format.x0, format.y0, format.x1, format.y1, format.bend);
            }
            else if (format.class === 'curve') {
                return new CurveObstacle(this).set(format.x0, format.y0, format.x1, format.y1, format.x2, format.y2);
            }
        }));
        this.file.set(format.file);
        this.bpm.set(format.bpm);
        this.bars.set(format.bars);
        this.observable.notify(this);
        return this;
    }
    serialize() {
        return {
            origin: { x: this.origin.x, y: this.origin.y },
            obstacles: this.obstacles
                .slice(1)
                .map(obstacle => obstacle.serialize()),
            file: this.file.get(),
            bpm: this.bpm.get(),
            bars: this.bars.get()
        };
    }
    terminate() {
        this.terminator.terminate();
    }
}
//# sourceMappingURL=pattern.js.map