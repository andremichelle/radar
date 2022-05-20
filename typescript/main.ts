import {LimiterWorklet} from "./audio/limiter/worklet.js"
import {MeterWorklet} from "./audio/meter/worklet.js"
import {MetronomeWorklet} from "./audio/metronome/worklet.js"
import {CircleSegmentObstacle, LineObstacle} from "./audio/radar/obstacles.js"
import {Pattern, Point} from "./audio/radar/pattern.js"
import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {HTML} from "./lib/dom.js"
import {TAU} from "./lib/math.js"

const showProgress = (() => {
    const progress: SVGSVGElement = document.querySelector("svg.preloader")
    window.onerror = () => progress.classList.add("error")
    window.onunhandledrejection = () => progress.classList.add("error")
    return (percentage: number) => progress.style.setProperty("--percentage", percentage.toFixed(2))
})();

(async () => {
    console.debug("booting...")

    // --- BOOT STARTS ---

    const boot = new Boot()
    boot.addObserver(boot => showProgress(boot.normalizedPercentage()))
    boot.registerProcess(preloadImagesOfCssFile("./bin/main.css"))
    const context = newAudioContext()
    boot.registerProcess(LimiterWorklet.loadModule(context))
    boot.registerProcess(MeterWorklet.loadModule(context))
    boot.registerProcess(MetronomeWorklet.loadModule(context))
    await boot.waitForCompletion()

    // --- BOOT ENDS ---

    const pattern = new Pattern()
    pattern.addObstacle(new CircleSegmentObstacle(-0.25, 0.5, 0.5, 0.5, -0.5))
    pattern.addObstacle(new LineObstacle(-0.8, -0.5, 0.8, -0.5))
    let phase = 0.0

    const canvas: HTMLCanvasElement = HTML.query('canvas')
    canvas.width = 1024
    canvas.height = 1024
    const context2D = canvas.getContext('2d')
    const run = () => {
        context2D.clearRect(0.0, 0.0, 1024, 1024)
        context2D.save()
        context2D.translate(512, 512)
        context2D.lineWidth = 0.0
        context2D.strokeStyle = 'orange'
        context2D.beginPath()
        pattern.getObstacle().forEach(modifier => modifier.paint(context2D, 512))
        context2D.stroke()
        context2D.beginPath()
        context2D.arc(0.0, 0.0, 511.5, 0.0, TAU, false)
        context2D.stroke()

        context2D.beginPath()
        context2D.moveTo(0, 0)
        const iterator: Generator<Point, Point> = pattern.trace(phase)
        for (let next = iterator.next(); !next.done; next = iterator.next()) {
            const point: Point = next.value
            context2D.lineTo(point.x * 512, point.y * 512)
        }
        context2D.strokeStyle = 'white'
        context2D.stroke()
        context2D.restore()

        phase += 0.003
        phase -= Math.floor(phase)

        requestAnimationFrame(run)
    }
    requestAnimationFrame(run)

    // prevent dragging entire document on mobile
    document.addEventListener('touchmove', (event: TouchEvent) => event.preventDefault(), {passive: false})
    document.addEventListener('dblclick', (event: Event) => event.preventDefault(), {passive: false})
    const resize = () => document.body.style.height = `${window.innerHeight}px`
    window.addEventListener("resize", resize)
    resize()
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove())
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"))
    })
    console.debug("boot complete.")
})()