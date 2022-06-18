import {
    Events,
    HTMLRadioGroup,
    NumericStepper,
    ObservableValue,
    ObservableValueImpl,
    Option,
    Options,
    PrintMapping,
    Terminable,
    TerminableVoid,
    Terminator
} from "../../lib/common.js"
import {UIControllerLayout} from "../../lib/controls.js"
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

    private readonly canvas: HTMLCanvasElement = HTML.query('canvas', this.element)
    private readonly context = this.canvas.getContext('2d')
    private readonly angleResolution: ObservableValue<number> = new ObservableValueImpl<number>(64)
    private readonly distanceResolution: ObservableValue<number> = new ObservableValueImpl<number>(24)

    private tool: Option<Terminable> = Options.None
    private toolCursor: Option<Point> = Options.None
    private waveform: Option<ImageBitmap> = Options.None

    readonly selection: Obstacle<any>[] = []

    constructor(private readonly element: HTMLElement,
                private readonly pattern: Pattern,
                private readonly position: () => number) {
        const toolGroup = new HTMLRadioGroup(HTML.query('[data-component=tools]', this.element), 'tool')
        toolGroup.addObserver(tool => {
            this.tool.ifPresent(tool => tool.terminate())
            this.tool = Options.valueOf(this.switchTool(tool as Tool))
        }, true)

        {
            const layout = new UIControllerLayout(HTML.query('[data-component=pattern]', this.element))
            layout
                .createNumericStepper('Bpm', PrintMapping.INTEGER, NumericStepper.Integer)
                .with(pattern.getBpm())
            layout
                .createNumericStepper('Bar', PrintMapping.INTEGER, NumericStepper.Integer)
                .with(pattern.getBars())
        }
        {
            const layout = new UIControllerLayout(HTML.query('[data-component=snapping]', this.element))
            layout
                .createNumericStepper('Snap position', PrintMapping.INTEGER, NumericStepper.Integer)
                .with(this.angleResolution)
            layout
                .createNumericStepper('Snap distance', PrintMapping.INTEGER, NumericStepper.Integer)
                .with(this.distanceResolution)
        }

        requestAnimationFrame(this.update)
    }

    cancelUserAction() {
        // TODO revert and abort action
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

    deleteSelection(): void {
        for (const obstacle of this.selection.splice(0, this.selection.length)) {
            this.pattern.removeObstacle(obstacle)
        }
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
        const origin = this.pattern.getOrigin()
        Renderer.renderRayOrigin(context, origin)
        const ray = Editor.Ray.reuse(position * TAU, origin.x, origin.y)
        Renderer.renderObstacles(context, this.pattern, this.selection)
        Renderer.renderRayTrail(context, this.pattern, ray)
        Renderer.renderWaveformPosition(context, ray.angle(), Editor.WaveformWidth)
        this.toolCursor.ifPresent(point => Renderer.renderCursor(context, point))
        context.restore()

        requestAnimationFrame(this.update)
    }

    private installMoveTool(): Terminable {
        return Events.bindEventListener(this.canvas, 'pointerdown', (event: PointerEvent) => {
            const {x, y} = this.globalToLocal(event.clientX, event.clientY)
            const handler: DragHandler | null = this.closestDragHandler(x, y)
            if (handler !== null) {
                if (handler.obstacle !== null) {
                    this.selection.splice(0, this.selection.length, handler.obstacle)
                }
                this.startDragging(event, (event: PointerEvent) => {
                    const local = this.snap(this.globalToLocal(event.clientX, event.clientY), handler.constrainToCircle())
                    handler.moveTo(local.x, local.y)
                })
            } else {
                const obstacle: Obstacle<any> | null = this.closestObstacle(x, y)
                if (event.shiftKey) {
                    this.selection.push(obstacle)
                } else {
                    this.selection.splice(0, this.selection.length, obstacle)
                }
            }
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
            const obstacle: OBSTACLE = factory(this.pattern, x0, y0)
            this.pattern.addObstacle(obstacle)
            this.startDragging(event, (event: PointerEvent) => {
                const local = this.snap(this.globalToLocal(event.clientX, event.clientY), true)
                move(obstacle, x0, y0, local.x, local.y)
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

    private closestObstacle(x: number, y: number): Obstacle<any> | null {
        return this.pattern
            .getObstacles()
            .reduce((prev: Obstacle<any>, next: Obstacle<any>) => {
                const distance = next.distance(x, y)
                return prev === null
                    ? distance < Editor.CaptureRadius
                        ? next : null : distance < prev.distance(x, y)
                        ? next : prev
            }, null)
    }

    private closestDragHandler(x: number, y: number): DragHandler | null {
        return this.pattern
            .getObstacles()
            .flatMap(obstacle => obstacle.dragHandlers)
            .concat(this.pattern.dragHandlers)
            .reduce((prev: DragHandler, next: DragHandler) => {
                const distance = next.distance(x, y)
                return prev === null
                    ? distance < Editor.CaptureRadius
                        ? next : null : distance < prev.distance(x, y)
                        ? next : prev
            }, null)
    }
}