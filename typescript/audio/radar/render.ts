import {TAU} from "../../lib/math.js"
import {Pattern, Point} from "./pattern.js"
import {Ray} from "./ray.js"

const RadarOutlineStyle = '#333'
const ObstacleStyle = '#666'
const RayTrailStyle = 'white'

export class Renderer {
    static Radius: number = 256
    static Diameter: number = Renderer.Radius << 1

    static renderRadarOutline(context: CanvasRenderingContext2D): void {
        context.strokeStyle = RadarOutlineStyle
        context.beginPath()
        context.arc(0.0, 0.0, Renderer.Radius - 0.5, 0.0, TAU, false)
        context.stroke()
    }

    static renderObstacles(context: CanvasRenderingContext2D, pattern: Pattern): void {
        context.strokeStyle = ObstacleStyle
        pattern
            .getObstacles()
            .forEach(modifier => {
                context.beginPath()
                modifier.paint(context, Renderer.Radius)
                context.stroke()
            })
    }

    static renderRayTrail(context: CanvasRenderingContext2D, pattern: Pattern, ray: Ray): void {
        context.strokeStyle = RayTrailStyle
        context.beginPath()
        context.moveTo(ray.rx * Renderer.Radius, ray.ry * Renderer.Radius)
        const iterator: Generator<Point> = pattern.trace(ray)
        for (const point of iterator) {
            context.lineTo(point.x * Renderer.Radius, point.y * Renderer.Radius)
        }
        context.stroke()
    }
}