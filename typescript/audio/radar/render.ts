import {Colors} from "../../lib/dom.js"
import {TAU} from "../../lib/math.js"
import {Pattern} from "./pattern.js"
import {Point, Ray} from "./ray.js"

const RadarOriginStyle = Colors[1]
const ObstacleStyle = Colors[2]
const RayTrailStyle = Colors[3]
const WaveformStyle = Colors[1]
const WaveformPositionStyle = Colors[4]

export class Renderer {
    static Radius: number = 256
    static Diameter: number = Renderer.Radius << 1

    static renderRadarInside(context: CanvasRenderingContext2D): void {
        context.fillStyle = 'rgba(255, 255, 255, 0.02)'
        context.beginPath()
        context.arc(0.0, 0.0, Renderer.Radius, 0.0, TAU, false)
        context.closePath()
        context.fill()
        context.fillStyle = 'none'
    }

    static renderRayOrigin(context: CanvasRenderingContext2D, origin: Point): void {
        context.strokeStyle = RadarOriginStyle
        context.lineWidth = 0.0
        context.beginPath()
        context.arc(origin.x * Renderer.Radius, origin.y * Renderer.Radius, 7, 0.0, TAU, false)
        context.closePath()
        context.stroke()
    }

    static renderObstacles(context: CanvasRenderingContext2D, pattern: Pattern): void {
        context.fillStyle = ObstacleStyle
        context.strokeStyle = ObstacleStyle
        context.lineWidth = 1.0
        pattern
            .getObstacles()
            .forEach(modifier => {
                modifier.paintPath(context, Renderer.Radius)
            })
        pattern
            .getObstacles()
            .forEach(modifier => {
                modifier.paintHandler(context, Renderer.Radius)
            })
    }

    static renderRayTrail(context: CanvasRenderingContext2D, pattern: Pattern, ray: Ray): void {
        context.lineWidth = 0.0
        context.lineCap = 'round'
        context.lineJoin = 'round'
        context.strokeStyle = RayTrailStyle
        context.beginPath()
        context.moveTo(ray.x * Renderer.Radius, ray.y * Renderer.Radius)
        const iterator: Generator<Readonly<Ray>> = ray.trace(pattern.getObstacles())
        for (const ray of iterator) {
            context.lineTo(ray.x * Renderer.Radius, ray.y * Renderer.Radius)
            if (ray.moveExceeded()) {
                context.stroke()
                return
            }
        }
        context.stroke()
    }

    static renderWaveformPosition(context: CanvasRenderingContext2D, angle: number, width: number, lineWidth: number = 1.0): void {
        const r0 = Renderer.Radius
        const r1 = r0 + width
        const xAxis = Math.sin(angle)
        const yAxis = -Math.cos(angle)
        context.beginPath()
        context.moveTo(xAxis * r0, yAxis * r0)
        context.lineTo(xAxis * r1, yAxis * r1)
        context.lineWidth = lineWidth
        context.strokeStyle = WaveformPositionStyle
        context.stroke()
    }

    static renderWaveform(buffer: AudioBuffer, size: number, width: number): ImageBitmap {
        const canvas = new OffscreenCanvas(size, size)
        const context = canvas.getContext('2d')
        const radius = size >> 1
        const rr = radius - width
        const resolution = Math.floor(radius * TAU) | 0
        context.translate(radius, radius)
        context.globalCompositeOperation = 'lighter'
        context.strokeStyle = WaveformStyle
        context.lineWidth = 1.0
        context.beginPath()
        const ch0 = new Float32Array(buffer.length)
        const ch1 = new Float32Array(buffer.length)
        const sep = buffer.length / resolution
        buffer.copyFromChannel(ch0, 0)
        buffer.copyFromChannel(ch1, 1)
        let index = 0 | 0
        let min = Number.MAX_VALUE
        let max = -Number.MAX_VALUE
        for (let x = 0 | 0; x <= resolution; x++) {
            const indexTo = x * sep
            while (index < indexTo) {
                const value = (ch0[index] + ch1[index]) * 0.33
                index++
                min = Math.min(min, value)
                max = Math.max(max, value)
            }
            const r0 = rr + Math.min(0.5, width * min)
            const r1 = rr + Math.max(0.5, width * max)
            const angle = x / resolution * TAU
            const sn = Math.sin(angle)
            const cs = -Math.cos(angle)
            context.moveTo(sn * r0, cs * r0)
            context.lineTo(sn * r1, cs * r1)
            const tmp = min
            min = max
            max = tmp
        }
        context.stroke()
        return canvas.transferToImageBitmap()
    }
}