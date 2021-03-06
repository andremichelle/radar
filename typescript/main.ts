import {LimiterWorklet} from "./audio/limiter/worklet.js"
import {MeterWorklet} from "./audio/meter/worklet.js"
import {Editor} from "./audio/radar/editor.js"
import {Pattern} from "./audio/radar/pattern.js"
import {RadarWorklet} from "./audio/radar/worklet.js"
import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {HTML} from "./lib/dom.js"
import {installMenu, installShortcuts} from "./menu.js"

/**
 * TODO
 * [ ] Controls for snapping (distance, angle)
 * [ ] Controls for loop bpm / duration in bars
 * [ ] Draw empty waveform when no buffer is available
 * [ ] Time-stretcher with transient duration detection or best correlation
 * [ ] Keyboard shortcuts (move, create, escape)
 */

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
    boot.registerProcess(RadarWorklet.loadModule(context))
    await boot.waitForCompletion()

    // --- BOOT ENDS ---

    const pattern = new Pattern()

    const worklet = new RadarWorklet(context, pattern)
    worklet.connect(context.destination)

    const editor = new Editor(HTML.query('.radar'), pattern, () => worklet.getPosition())

    pattern.addFileObserver(async fileName => {
        const buffer: AudioBuffer = await fetch(`loops/${fileName}`)
            .then(result => result.arrayBuffer())
            .then(buffer => context.decodeAudioData(buffer))
            .catch(() => null)
        if (buffer !== null) {
            worklet.setAudioBuffer(buffer)
            editor.showAudioBuffer(buffer)
        }
    })

    const transportCheckbox: HTMLInputElement = HTML.query('[data-checkbox=transport]')
    transportCheckbox.addEventListener('change', () => worklet.setTransporting(transportCheckbox.checked))

    installMenu(editor, pattern)
    installShortcuts(editor, pattern)

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