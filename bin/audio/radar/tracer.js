import { TAU } from "../../lib/math.js";
import { Ray, Touch } from "./ray.js";
export class Tracer {
    constructor() {
        this.ray = new Ray();
    }
    *trace(obstacles, position, x, y) {
        this.ray.reuse(position * TAU, x, y);
        yield this.ray;
        while (this.step(obstacles) === Touch.Obstacle) {
            yield this.ray;
            if (this.ray.moveExceeded())
                break;
        }
        yield this.ray;
    }
    step(obstacles) {
        let closestObstacle = null;
        let closestDistance = Number.MAX_VALUE;
        obstacles.forEach(modifier => {
            const distance = modifier.capture(this.ray);
            if (distance > 0.0 && distance < closestDistance) {
                closestObstacle = modifier;
                closestDistance = distance;
            }
        });
        if (closestObstacle === null) {
            throw new Error('No reflection');
        }
        this.ray.move(closestDistance);
        if (closestObstacle.isBoundary()) {
            return Touch.Last;
        }
        closestObstacle.reflect(this.ray);
        return Touch.Obstacle;
    }
}
//# sourceMappingURL=tracer.js.map