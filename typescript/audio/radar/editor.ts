import {
    Events,
    HTMLRadioGroup,
    ObservableValue,
    ObservableValueImpl,
    Option,
    Options,
    Terminable,
    TerminableVoid
} from "../../lib/common.js"
import {HTML} from "../../lib/dom.js"
import {TAU} from "../../lib/math.js"
import {distance, DragHandler, snapAngle, snapLength} from "./dragging.js"
import {ArcObstacle, LineObstacle, Obstacle, QBezierObstacle} from "./obstacles.js"
import {Pattern} from "./pattern.js"
import {Point, Ray} from "./ray.js"
import {Renderer} from "./render.js"

type Tool = 'move' | 'line' | 'arc' | 'curve'

export class Editor {
    private static Ray: Ray = new Ray()
    private static WaveformWidth: number = 48
    private static Size: number = Renderer.Diameter + Editor.WaveformWidth * 2
    private static Radius: number = Editor.Size / 2
    private static CaptureRadius = 8.0 / Renderer.Radius

    private readonly canvas: HTMLCanvasElement = HTML.create('canvas', {
        style: `width: ${Editor.Size}px; height: ${Editor.Size}px;`,
        width: Editor.Size * devicePixelRatio, height: Editor.Size * devicePixelRatio
    })
    private readonly context = this.canvas.getContext('2d')
    private readonly origin: Point = {x: 0.0, y: 0.0}
    private readonly angleResolution: ObservableValue<number> = new ObservableValueImpl<number>(64)
    private readonly distanceResolution: ObservableValue<number> = new ObservableValueImpl<number>(16)

    private readonly dragHandlers: DragHandler[] = [{
        distance: (x: number, y: number): number => {
            return distance(x, y, this.origin.x, this.origin.y)
        }, moveTo: (x: number, y: number): void => {
            this.origin.x = x
            this.origin.y = y
        }, constrainToCircle: (): boolean => true
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

    snap(local: Point, constrainToCircle: boolean = false): Point {
        const l = snapLength(Math.sqrt(local.x * local.x + local.y * local.y), this.distanceResolution.get())
        const d = constrainToCircle ? Math.min(1.0, l) : l
        const a = snapAngle(Math.atan2(local.y, local.x), this.angleResolution.get())
        return {
            x: Math.cos(a) * d,
            y: Math.sin(a) * d
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
        Renderer.renderRadarInside(context, this.angleResolution.get(), this.distanceResolution.get())
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
                    Editor.startDragging((event: MouseEvent) => {
                        const local = this.snap(this.globalToLocal(event.clientX, event.clientY), handler.constrainToCircle())
                        handler.moveTo(local.x, local.y)
                    })
                }
            })
        })
    }

    private installCreateTool<OBSTACLE extends Obstacle>(
        factory: (x0: number, y0: number) => OBSTACLE,
        move: (obstacle: OBSTACLE, x0: number, y0: number, x1: number, y1: number) => void
    ): Terminable {
        return Events.bindEventListener(this.canvas, 'mousedown', (event: MouseEvent) => {
            const {x: x0, y: y0} = this.snap(this.globalToLocal(event.clientX, event.clientY), false)
            if (x0 * x0 + y0 * y0 > 1.0) {
                return
            }
            this.pattern.ifPresent(pattern => {
                const obstacle: OBSTACLE = factory(x0, y0)
                pattern.addObstacle(obstacle)
                Editor.startDragging((event: MouseEvent) => {
                    const local = this.snap(this.globalToLocal(event.clientX, event.clientY), true)
                    move(obstacle, x0, y0, local.x, local.y)
                })
            })
        })
    }

    private switchTool(tool: Tool): Terminable {
        switch (tool) {
            case 'move':
                return this.installMoveTool()
            case 'line':
                return this.installCreateTool(
                    (x0: number, y0: number) => new LineObstacle(x0, y0, x0, y0),
                    (obstacle, x0, y0, x1, y1) =>
                        obstacle.set(x0, y0, x1, y1)
                )
            case 'arc':
                return this.installCreateTool(
                    (x0: number, y0: number) => new ArcObstacle(x0, y0, x0, y0, 1.0),
                    (obstacle, x0, y0, x1, y1) =>
                        obstacle.set(x0, y0, x1, y1, 1.0)
                )
            case 'curve':
                return this.installCreateTool(
                    (x0: number, y0: number) => new QBezierObstacle(x0, y0, x0, y0, x0, y0),
                    (obstacle, x0, y0, x1, y1) =>
                        obstacle.set(x0, y0, (x0 + x1) / 2.0, (y0 + y1) / 2.0, x1, y1)
                )
            default:
                return TerminableVoid
        }
    }

    private static startDragging(move: (event: MouseEvent) => void) {
        window.addEventListener('mousemove', move)
        window.addEventListener('mouseup', () =>
            window.removeEventListener('mousemove', move), {once: true})
    }
}