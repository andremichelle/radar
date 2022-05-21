import {Option, Options} from "../../lib/common.js"
import {HTML} from "../../lib/dom.js"
import {TAU} from "../../lib/math.js"
import {Pattern} from "./pattern.js"
import {Ray} from "./ray.js"
import {Renderer} from "./render.js"

export class Editor {
    private static Evaluator: Ray = new Ray()

    private readonly canvas: HTMLCanvasElement = HTML.create('canvas', {
        style: `width: ${Renderer.Diameter}px; height: ${Renderer.Diameter}px;`,
        width: Renderer.Diameter * devicePixelRatio, height: Renderer.Diameter * devicePixelRatio
    })
    private readonly context = this.canvas.getContext('2d')

    private pattern: Option<Pattern> = Options.None

    private position: number = 0.0

    constructor() {
        this.update()
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
        context.translate(Renderer.Radius, Renderer.Radius)
        context.lineWidth = 0.0

        Renderer.renderRadarOutline(context)

        this.pattern.ifPresent(pattern => {
            Renderer.renderObstacles(context, pattern)
            Renderer.renderRayTrail(context, pattern, Editor.Evaluator.reuse(this.position * TAU, 0.25))
        })

        context.restore()

        this.position += 0.003
        this.position -= Math.floor(this.position)

        requestAnimationFrame(this.update)
    }
}