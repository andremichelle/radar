import {LimiterWorklet} from "./audio/limiter/worklet.js"
import {MeterWorklet} from "./audio/meter/worklet.js"
import {MetronomeWorklet} from "./audio/metronome/worklet.js"
import {Editor} from "./audio/radar/editor.js"
import {Pattern} from "./audio/radar/pattern.js"
import {Boot, newAudioContext, preloadImagesOfCssFile} from "./lib/boot.js"
import {HTML} from "./lib/dom.js"
import {installMenu} from "./menu.js"

/**
 * TODO
 * [ ] Delete shapes
 * [ ] loop bpm / duration in bars
 * [ ] Time-stretcher with transient duration detection or best correlation
 * [ ] Reset origin
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
    boot.registerProcess(MetronomeWorklet.loadModule(context))
    await boot.waitForCompletion()

    // --- BOOT ENDS ---

    const pattern = new Pattern()
    pattern.addObserver(() => console.log('changed'))

    const editor = new Editor()
    editor.setPattern(pattern)
    HTML.query('.radar').appendChild(editor.element())

    const buffer: AudioBuffer = await fetch('loops/dnb.ogg')
        .then(result => result.arrayBuffer())
        .then(buffer => context.decodeAudioData(buffer))
    editor.showAudioBuffer(buffer)

    installMenu(pattern)

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