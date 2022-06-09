import { TAU } from "../../lib/math.js";
export var Touch;
(function (Touch) {
    Touch[Touch["Obstacle"] = 0] = "Obstacle";
    Touch[Touch["Last"] = 1] = "Last";
})(Touch || (Touch = {}));
export class Ray {
    constructor() {
        this.x = 0.0;
        this.y = 0.0;
        this.vx = 0.0;
        this.vy = 0.0;
        this.moveCounts = 0;
        this.lastAngle = 0.0;
    }
    reuse(angle, x = 0.0, y = 0.0) {
        this.x = x;
        this.y = y;
        this.assertInsideUnitCircle();
        this.vx = Math.sin(angle);
        this.vy = -Math.cos(angle);
        this.normalize();
        this.moveCounts = 0;
        return this;
    }
    *trace(obstacles) {
        while (this.step(obstacles) === Touch.Obstacle) {
            if (this.moveExceeded()) {
                this.x = Math.sin(this.lastAngle);
                this.y = -Math.cos(this.lastAngle);
                return this;
            }
            yield this;
        }
        this.lastAngle = this.angle();
        yield this;
    }
    eval(obstacles) {
        while (this.step(obstacles) === Touch.Obstacle) {
            if (this.moveExceeded())
                return this.lastAngle;
        }
        return this.lastAngle = this.angle();
    }
    step(obstacles) {
        let closestObstacle = null;
        let closestDistance = Number.MAX_VALUE;
        obstacles.forEach(obstacle => {
            const distance = obstacle.trace(this);
            if (distance > 0.0 && distance <= closestDistance) {
                closestObstacle = obstacle;
                closestDistance = distance;
            }
        });
        if (closestObstacle === null) {
            throw new Error('No reflection');
        }
        this.move(closestDistance);
        if (closestObstacle.isBoundary()) {
            return Touch.Last;
        }
        closestObstacle.reflect(this);
        return Touch.Obstacle;
    }
    move(dt) {
        console.assert(dt >= 0.0);
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.assertInsideUnitCircle();
        this.moveCounts++;
    }
    moveExceeded() {
        return this.moveCounts >= Ray.MaxMovements;
    }
    reflect(nx, ny) {
        const reflect = 2.0 * (nx * this.vx + ny * this.vy);
        this.vx -= nx * reflect;
        this.vy -= ny * reflect;
        this.normalize();
    }
    normalize() {
        const l = this.length();
        this.vx /= l;
        this.vy /= l;
    }
    length() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }
    angle() {
        const angle = Math.atan2(this.x, -this.y);
        return angle < 0.0 ? angle + TAU : angle;
    }
    dot() {
        return this.x * this.vx + this.y * this.vy;
    }
    cross() {
        return this.x * this.vy - this.y * this.vx;
    }
    assertInsideUnitCircle() {
        const distance = Math.sqrt(this.x * this.x + this.y * this.y);
        console.assert(distance <= Ray.Epsilon, `Outside circle (${distance})`);
    }
}
Ray.Epsilon = 1.0001;
Ray.MaxMovements = 250;
//# sourceMappingURL=ray.js.map