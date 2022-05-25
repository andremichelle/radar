import {
    Events,
    HTMLRadioGroup,
    ObservableValue,
    ObservableValueImpl,
    Option,
    Options,
    Terminable,
    TerminableVoid,
    Terminator
} from "../../lib/common.js"
import {HTML} from "../../lib/dom.js"
import {TAU} from "../../lib/math.js"
import {DragHandler, snapAngle, snapLength} from "./dragging.js"
import {ArcObstacle, CurveObstacle, LineObstacle, Obstacle} from "./obstacles.js"
import {Pattern} from "./pattern.js"
import {Point, Ray} from "./ray.js"
import {Renderer} from "./render.js"

type Tool = 'move' | 'line' | 'arc' | 'curve'

export class Editor {
    private static Ray: Ray = new Ray()
    private static WaveformWidth: number = 48
    private static Radius: number = Renderer.Radius + Editor.WaveformWidth
    private static Size: number = Editor.Radius << 1
    private static CaptureRadius = 8.0 / Renderer.Radius

    private readonly canvas: HTMLCanvasElement = HTML.create('canvas')
    private readonly context = this.canvas.getContext('2d')
    private readonly angleResolution: ObservableValue<number> = new ObservableValueImpl<number>(64)
    private readonly distanceResolution: ObservableValue<number> = new ObservableValueImpl<number>(16)

    private tool: Option<Terminable> = Options.None
    private toolCursor: Option<Point> = Options.None
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
            x: (x - rect.left - rect.width / 2) / Renderer.Radius,
            y: (y - rect.top - rect.height / 2) / Renderer.Radius
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
        const clientWidth = canvas.clientWidth
        const clientHeight = canvas.clientHeight
        canvas.width = clientWidth * devicePixelRatio
        canvas.height = clientHeight * devicePixelRatio

        context.save()
        context.scale(devicePixelRatio, devicePixelRatio)
        context.translate(clientWidth / 2, clientHeight / 2)
        this.waveform.ifPresent(bitmap => context.drawImage(bitmap, -Editor.Radius, -Editor.Radius, Editor.Size, Editor.Size))
        context.lineWidth = 0.0
        Renderer.renderRadarInside(context, this.angleResolution.get(), this.distanceResolution.get())
        this.pattern.ifPresent(pattern => {
            const origin = pattern.getOrigin()
            Renderer.renderRayOrigin(context, origin)
            const ray = Editor.Ray.reuse(this.position * TAU, origin.x, origin.y)
            Renderer.renderObstacles(context, pattern)
            Renderer.renderRayTrail(context, pattern, ray)
            Renderer.renderWaveformPosition(context, ray.angle(), Editor.WaveformWidth)
        })
        this.toolCursor.ifPresent(point => Renderer.renderCursor(context, point))
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
                    .concat(pattern.dragHandlers)
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

    private installCreateTool<OBSTACLE extends Obstacle<any>>(
        factory: (x0: number, y0: number) => OBSTACLE,
        move: (obstacle: OBSTACLE, x0: number, y0: number, x1: number, y1: number) => void
    ): Terminable {
        const terminator = new Terminator()
        terminator.with(Events.bindEventListener(this.canvas, 'mousemove', (event: MouseEvent) => {
            const local = this.snap(this.globalToLocal(event.clientX, event.clientY), true)
            if (this.toolCursor.isEmpty()) {
                this.toolCursor = Options.valueOf(local)
            } else {
                const cursor = this.toolCursor.get()
                cursor.x = local.x
                cursor.y = local.y
            }
        }))
        terminator.with({terminate: () => this.toolCursor = Options.None})
        terminator.with(Events.bindEventListener(this.canvas, 'mousedown', (event: MouseEvent) => {
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
        }))
        return terminator
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
                    (x0: number, y0: number) => new ArcObstacle(x0, y0, x0, y0, 0.0),
                    (obstacle, x0, y0, x1, y1) =>
                        obstacle.set(x0, y0, x1, y1, 0.0)
                )
            case 'curve':
                return this.installCreateTool(
                    (x0: number, y0: number) => new CurveObstacle(x0, y0, x0, y0, x0, y0),
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