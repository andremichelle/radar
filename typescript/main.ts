import {LimiterWorklet} from "./audio/limiter/worklet.js"
import {MeterWorklet} from "./audio/meter/worklet.js"
import {MetronomeWorklet} from "./audio/metronome/worklet.js"
import {Editor} from "./audio/radar/editor.js"
import {CircleObstacle, LineObstacle, QBezierObstacle} from "./audio/radar/obstacles.js"
import {Pattern} from "./audio/radar/pattern.js"
import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {HTML} from "./lib/dom.js"

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
    pattern.addObstacle(new LineObstacle(-0.8, -0.5, 0.8, -0.5))
    pattern.addObstacle(new CircleObstacle(-0.25, 0.5, 0.5, 0.5, 0.5))
    pattern.addObstacle(new QBezierObstacle(0.0, 0.25, 0.25, -0.5, 0.5, 0.25))

    const editor = new Editor()
    editor.setPattern(pattern)
    HTML.query('main').appendChild(editor.element())

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