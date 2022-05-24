import {Events, HTMLRadioGroup, Option, Options, Terminable, TerminableVoid} from "../../lib/common.js"
import {HTML} from "../../lib/dom.js"
import {TAU} from "../../lib/math.js"
import {distance, DragHandler} from "./dragging.js"
import {LineObstacle} from "./obstacles.js"
import {Pattern} from "./pattern.js"
import {Point, Ray} from "./ray.js"
import {Renderer} from "./render.js"

type Tool = 'move' | 'line' | 'circle' | 'bezier'

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

    private tool: Option<Terminable> = Options.None
    private pattern: Option<Pattern> = Options.None
    private waveform: Option<ImageBitmap> = Options.None

    private position: number = 0.0

    constructor() {
        const toolGroup = new HTMLRadioGroup(HTML.query('[data-component=tools]'), 'tool')
        toolGroup.addObserver(tool => {
            this.tool.ifPresent(tool => tool.terminate())
            this.tool = Options.valueOf(this.switchTool(tool as Tool))
        }, true)

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
        this.waveform.ifPresent(bitmap => context.drawImage(bitmap, 0, 0))
        context.save()
        context.scale(devicePixelRatio, devicePixelRatio)
        context.translate(Editor.Radius, Editor.Radius)
        context.lineWidth = 0.0
        Renderer.renderRadarInside(context)
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

        this.position += 0.002
        this.position -= Math.floor(this.position)

        requestAnimationFrame(this.update)
    }

    private installMoveTool(): Terminable {
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
                    Editor.installMove((event: MouseEvent) => {
                        const local = this.globalToLocal(event.clientX, event.clientY)
                        const x = local.x
                        const y = local.y
                        const d = Math.sqrt(x * x + y * y)
                        if (d > 1.0) {
                            handler.moveTo(x / d, y / d)
                        } else {
                            handler.moveTo(x, y)
                        }
                    })
                }
            })
        })
    }

    private installCreateLineTool(): Terminable {
        return Events.bindEventListener(this.canvas, 'mousedown', (event: MouseEvent) => {
            const {x: x0, y: y0} = this.globalToLocal(event.clientX, event.clientY)
            if (x0 * x0 + y0 * y0 > 1.0) {
                return
            }
            this.pattern.ifPresent(pattern => {
                const obstacle = new LineObstacle(x0, y0, x0, y0)
                pattern.addObstacle(obstacle)
                Editor.installMove((event: MouseEvent) => {
                    const {x: x1, y: y1} = this.globalToLocal(event.clientX, event.clientY)
                    const d = Math.sqrt(x1 * x1 + y1 * y1)
                    if (d > 1.0) {
                        obstacle.set(x0, y0, x1 / d, y1 / d)
                    } else {
                        obstacle.set(x0, y0, x1, y1)
                    }
                })
            })
        })
    }

    private switchTool(tool: Tool): Terminable {
        switch (tool) {
            case 'move':
                return this.installMoveTool()
            case 'line':
                return this.installCreateLineTool()
            default:
                return TerminableVoid
        }
    }

    private static installMove(move: (event: MouseEvent) => void) {
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', () =>
            window.removeEventListener('mousemove', move), {once: true})
    }
}