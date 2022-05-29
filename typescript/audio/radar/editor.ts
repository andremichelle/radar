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
import {ArcObstacle, CurveObstacle, LineObstacle, Obstacle} from "./obstacles.js"
import {Pattern} from "./pattern.js"
import {Point, Ray} from "./ray.js"
import {Renderer} from "./render.js"
import {DragHandler, snapAngle, snapLength} from "./utils.js"

type Tool = 'move' | 'line' | 'arc' | 'curve'

export class Editor {
    private static Ray: Ray = new Ray()
    private static WaveformWidth: number = 64
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

    readonly selection: Obstacle<any>[] = []

    constructor(private readonly position: () => number) {
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

    deleteSelection(): void {
        this.pattern.ifPresent(pattern => {
            for (const obstacle of this.selection.splice(0, this.selection.length)) {
                pattern.removeObstacle(obstacle)
            }
        })
    }

    element(): HTMLElement {
        return this.canvas
    }

    private update = (): void => {
        const position = this.position()
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
            const ray = Editor.Ray.reuse(position * TAU, origin.x, origin.y)
            Renderer.renderObstacles(context, pattern, this.selection)
            Renderer.renderRayTrail(context, pattern, ray)
            Renderer.renderWaveformPosition(context, ray.angle(), Editor.WaveformWidth)
        })
        this.toolCursor.ifPresent(point => Renderer.renderCursor(context, point))
        context.restore()

        requestAnimationFrame(this.update)
    }

    private installMoveTool(): Terminable {
        return Events.bindEventListener(this.canvas, 'pointerdown', (event: PointerEvent) => {
            const {x, y} = this.globalToLocal(event.clientX, event.clientY)
            this.pattern.ifPresent(pattern => {
                const handler: DragHandler | null = this.closestDragHandler(pattern, x, y)
                if (handler !== null) {
                    if (handler.obstacle !== null) {
                        this.selection.splice(0, this.selection.length, handler.obstacle)
                    }
                    this.startDragging(event, (event: PointerEvent) => {
                        const local = this.snap(this.globalToLocal(event.clientX, event.clientY), handler.constrainToCircle())
                        handler.moveTo(local.x, local.y)
                    })
                } else {
                    const obstacle: Obstacle<any> | null = this.closestObstacle(pattern, x, y)
                    if (event.shiftKey) {
                        this.selection.push(obstacle)
                    } else {
                        this.selection.splice(0, this.selection.length, obstacle)
                    }
                }
            })
        })
    }

    private installCreateTool<OBSTACLE extends Obstacle<any>>(
        factory: (pattern: Pattern, x0: number, y0: number) => OBSTACLE,
        move: (obstacle: OBSTACLE, x0: number, y0: number, x1: number, y1: number) => void
    ): Terminable {
        const terminator = new Terminator()
        terminator.with(Events.bindEventListener(this.canvas, 'pointermove', (event: PointerEvent) => {
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
        terminator.with(Events.bindEventListener(this.canvas, 'pointerdown', (event: PointerEvent) => {
            const {x: x0, y: y0} = this.snap(this.globalToLocal(event.clientX, event.clientY), false)
            if (x0 * x0 + y0 * y0 > 1.0) {
                return
            }
            this.pattern.ifPresent(pattern => {
                const obstacle: OBSTACLE = factory(pattern, x0, y0)
                pattern.addObstacle(obstacle)
                this.startDragging(event, (event: PointerEvent) => {
                    const local = this.snap(this.globalToLocal(event.clientX, event.clientY), true)
                    move(obstacle, x0, y0, local.x, local.y)
                })
            })
        }))
        return terminator
    }

    private switchTool(tool: Tool): Terminable {
        console.debug(`switchTool(${tool})`)
        switch (tool) {
            case 'move':
                return this.installMoveTool()
            case 'line':
                return this.installCreateTool(
                    (pattern: Pattern, x0: number, y0: number) => new LineObstacle(pattern).set(x0, y0, x0, y0),
                    (obstacle, x0, y0, x1, y1) =>
                        obstacle.set(x0, y0, x1, y1)
                )
            case 'arc':
                return this.installCreateTool(
                    (pattern: Pattern, x0: number, y0: number) => new ArcObstacle(pattern).set(x0, y0, x0, y0, 0.0),
                    (obstacle, x0, y0, x1, y1) =>
                        obstacle.set(x0, y0, x1, y1, 0.0)
                )
            case 'curve':
                return this.installCreateTool(
                    (pattern: Pattern, x0: number, y0: number) => new CurveObstacle(pattern).set(x0, y0, x0, y0, x0, y0),
                    (obstacle, x0, y0, x1, y1) =>
                        obstacle.set(x0, y0, (x0 + x1) / 2.0, (y0 + y1) / 2.0, x1, y1)
                )
            default:
                return TerminableVoid
        }
    }

    private startDragging(event: PointerEvent, move: (event: PointerEvent) => void) {
        this.canvas.setPointerCapture(event.pointerId)
        this.canvas.addEventListener('pointermove', move)
        this.canvas.addEventListener('pointerup', () =>
            this.canvas.removeEventListener('pointermove', move), {once: true})
    }

    private closestObstacle(pattern: Pattern, x: number, y: number): Obstacle<any> | null {
        return pattern
            .getObstacles()
            .reduce((prev: Obstacle<any>, next: Obstacle<any>) => {
                const distance = next.distance(x, y)
                return prev === null
                    ? distance < Editor.CaptureRadius
                        ? next : null : distance < prev.distance(x, y)
                        ? next : prev
            }, null)
    }

    private closestDragHandler(pattern: Pattern, x: number, y: number): DragHandler | null {
        return pattern
            .getObstacles()
            .flatMap(obstacle => obstacle.dragHandlers)
            .concat(pattern.dragHandlers)
            .reduce((prev: DragHandler, next: DragHandler) => {
                const distance = next.distance(x, y)
                return prev === null
                    ? distance < Editor.CaptureRadius
                        ? next : null : distance < prev.distance(x, y)
                        ? next : prev
            }, null)
    }
}