import {Events, Option, Options, Terminable} from "../../lib/common.js"
import {HTML} from "../../lib/dom.js"
import {TAU} from "../../lib/math.js"
import {distance, DragHandler} from "./dragging.js"
import {Pattern} from "./pattern.js"
import {Point, Ray} from "./ray.js"
import {Renderer} from "./render.js"

export class Editor {
    private static Ray: Ray = new Ray()
    private static WaveformWidth: number = 48
    private static Size: number = Renderer.Diameter + Editor.WaveformWidth * 2
    private static Radius: number = Editor.Size / 2
    private static CaptureRadius = 4.0 / Renderer.Radius

    private readonly canvas: HTMLCanvasElement = HTML.create('canvas', {
        style: `width: ${Editor.Size}px; height: ${Editor.Size}px;`,
        width: Editor.Size * devicePixelRatio, height: Editor.Size * devicePixelRatio
    })
    private readonly context = this.canvas.getContext('2d')
    private readonly origin: Point = {x: 0.0, y: 0.0}

    private readonly dragHandlers: DragHandler[] = [{
        distance: (x: number, y: number): number => {
            return distance(x, y, this.origin.x, this.origin.y)
        }, moveTo: (x: number, y: number): void => {
            this.origin.x = x
            this.origin.y = y
        }
    }]

    private pattern: Option<Pattern> = Options.None
    private waveform: Option<ImageBitmap> = Options.None

    private position: number = 0.0

    constructor() {
        this.installDragHandler() // TODO create this for all tools

        requestAnimationFrame(this.update)
    }

    globalToLocal(x: number, y: number): Point {
        const rect = this.canvas.getBoundingClientRect()
        return {
            x: (x - rect.left - Editor.Radius) / Renderer.Radius,
            y: (y - rect.top - Editor.Radius) / Renderer.Radius
        }
    }

    showAudioBuffer(buffer: AudioBuffer | null): void {
        this.waveform = buffer === null
            ? Options.None
            : Options.valueOf(Renderer.renderWaveform(buffer, Editor.Size * devicePixelRatio, Editor.WaveformWidth))
    }

    setPattern(pattern: Pattern | null): void {
        this.pattern = Options.valueOf(pattern)
    }

    element(): HTMLElement {
        return this.canvas
    }

    private update = (): void => {
        const canvas = this.canvas
        const context = this.context

        context.clearRect(0.0, 0.0, canvas.width, canvas.height)
        context.save()
        context.scale(devicePixelRatio, devicePixelRatio)
        context.translate(Editor.Radius, Editor.Radius)
        context.lineWidth = 0.0
        Renderer.renderRadarOutline(context, Editor.Radius)
        Renderer.renderRayOrigin(context, this.origin)
        this.pattern.ifPresent(pattern => {
            const ray = Editor.Ray.reuse(this.position * TAU, this.origin.x, this.origin.y)
            Renderer.renderObstacles(context, pattern)
            Renderer.renderRayTrail(context, pattern, ray)
            Renderer.renderWaveformPosition(context, ray.angle(), Editor.WaveformWidth)

            // TODO remove. it just validates the result
            {
                const ray = Editor.Ray.reuse(this.position * TAU, this.origin.x, this.origin.y)
                Renderer.renderWaveformPosition(context, ray.eval(pattern.getObstacles()), Editor.WaveformWidth / 3, 3)
            }
        })
        context.restore()

        this.waveform.ifPresent(bitmap => context.drawImage(bitmap, 0, 0))

        this.position += 0.001
        this.position -= Math.floor(this.position)

        requestAnimationFrame(this.update)
    }

    private installDragHandler(): Terminable {
        return Events.bindEventListener(this.canvas, 'mousedown', (event: MouseEvent) => {
            const local = this.globalToLocal(event.clientX, event.clientY)
            this.pattern.ifPresent(pattern => {
                const handler: DragHandler | null = pattern
                    .getObstacles()
                    .flatMap(obstacle => obstacle.dragHandlers)
                    .concat(this.dragHandlers)
                    .reduce((prev: DragHandler, next: DragHandler) => {
                        const distance = next.distance(local.x, local.y)
                        return prev === null
                            ? distance < Editor.CaptureRadius
                                ? next : null : distance < prev.distance(local.x, local.y)
                                ? next : prev
                    }, null)
                if (handler !== null) {
                    this.beginDrag(handler)
                }
            })
        })
    }

    private beginDrag(handler: DragHandler): void {
        const onMove = (event: MouseEvent) => {
            const local = this.globalToLocal(event.clientX, event.clientY)
            const x = local.x
            const y = local.y
            const d = Math.sqrt(x * x + y * y)
            if (d > 1.0) {
                handler.moveTo(x / d, y / d)
            } else {
                handler.moveTo(x, y)
            }
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', () =>
            window.removeEventListener('mousemove', onMove), {once: true})
    }
}