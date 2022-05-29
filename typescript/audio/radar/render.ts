import {Colors} from "../../lib/dom.js"
import {TAU} from "../../lib/math.js"
import {Obstacle} from "./obstacles.js"
import {Pattern} from "./pattern.js"
import {Point, Ray} from "./ray.js"

const RadarOriginStyle = Colors[1]
const CursorStyle = Colors[2]
const ObstacleStyle = Colors[2]
const RayTrailStyle = Colors[3]
const WaveformStyle = Colors[1]
const WaveformPositionStyle = Colors[4]

export class Renderer {
    static Radius: number = 256

    static renderRadarInside(context: CanvasRenderingContext2D, angleResolution: number, distanceResolution: number): void {
        context.fillStyle = 'rgba(0, 0, 0, 0.4)'
        context.beginPath()
        context.arc(0.0, 0.0, Renderer.Radius, 0.0, TAU, false)
        context.closePath()
        context.fill()
        context.fillStyle = 'none'

        const gradient = context.createRadialGradient(0, 0, Renderer.Radius, 0, 0, 0)
        gradient.addColorStop(0.5, ObstacleStyle)
        gradient.addColorStop(1.0, 'transparent')
        context.strokeStyle = gradient
        context.setLineDash([1, (Renderer.Radius - 0.5) / distanceResolution - 1])
        context.beginPath()

        for (let i = 0; i < angleResolution; i++) {
            const a = i / angleResolution * TAU
            context.moveTo(0, 0)
            context.lineTo(Math.sin(a) * Renderer.Radius, -Math.cos(a) * Renderer.Radius)
        }
        context.stroke()
        context.setLineDash([])
    }

    static renderRayOrigin(context: CanvasRenderingContext2D, origin: Point): void {
        context.strokeStyle = RadarOriginStyle
        context.lineWidth = 0.0
        context.beginPath()
        context.arc(origin.x * Renderer.Radius, origin.y * Renderer.Radius, 7, 0.0, TAU, false)
        context.closePath()
        context.stroke()
    }

    static renderCursor(context: CanvasRenderingContext2D, local: Point): void {
        context.fillStyle = CursorStyle
        context.lineWidth = 0.0
        context.beginPath()
        context.arc(local.x * Renderer.Radius, local.y * Renderer.Radius, 3, 0.0, TAU, false)
        context.closePath()
        context.fill()
        context.fillStyle = 'none'
    }

    static renderObstacles(context: CanvasRenderingContext2D, pattern: Pattern, selection: Obstacle<any>[]): void {
        context.fillStyle = context.strokeStyle = ObstacleStyle
        context.lineWidth = 0.0
        pattern
            .getObstacles()
            .forEach(obstacle => {
                if (selection.includes(obstacle)) {
                    context.fillStyle = context.strokeStyle = 'white'
                } else {
                    context.fillStyle = context.strokeStyle = ObstacleStyle
                }
                obstacle.paintPath(context, Renderer.Radius)
            })
        context.fillStyle = context.strokeStyle = ObstacleStyle
        pattern
            .getObstacles()
            .forEach(obstacle => obstacle.paintHandler(context, Renderer.Radius))
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
        const resolution = Math.floor(radius * TAU * 2) | 0
        context.translate(radius, radius)
        context.fillStyle = 'rgba(0, 0, 0, 0.8)'
        context.beginPath()
        context.arc(0, 0, radius, 0.0, TAU, false)
        context.arc(0, 0, radius - width * 2, 0.0, TAU, true)
        context.fill()

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
                const value = (ch0[index] + ch1[index]) * 0.37
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