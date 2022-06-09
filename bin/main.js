var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { LimiterWorklet } from "./audio/limiter/worklet.js";
import { MeterWorklet } from "./audio/meter/worklet.js";
import { Editor } from "./audio/radar/editor.js";
import { Pattern } from "./audio/radar/pattern.js";
import { RadarWorklet } from "./audio/radar/worklet.js";
import { Boot, newAudioContext, preloadImagesOfCssFile } from "./lib/boot.js";
import { HTML } from "./lib/dom.js";
import { installMenu, installShortcuts } from "./menu.js";
const showProgress = (() => {
    const progress = document.querySelector("svg.preloader");
    window.onerror = () => progress.classList.add("error");
    window.onunhandledrejection = () => progress.classList.add("error");
    return (percentage) => progress.style.setProperty("--percentage", percentage.toFixed(2));
})();
(() => __awaiter(void 0, void 0, void 0, function* () {
    console.debug("booting...");
    const boot = new Boot();
    boot.addObserver(boot => showProgress(boot.normalizedPercentage()));
    boot.registerProcess(preloadImagesOfCssFile("./bin/main.css"));
    const context = newAudioContext();
    boot.registerProcess(LimiterWorklet.loadModule(context));
    boot.registerProcess(MeterWorklet.loadModule(context));
    boot.registerProcess(RadarWorklet.loadModule(context));
    yield boot.waitForCompletion();
    const pattern = new Pattern();
    const worklet = new RadarWorklet(context, pattern);
    worklet.connect(context.destination);
    const editor = new Editor(HTML.query('.radar'), pattern, () => worklet.getPosition());
    pattern.addFileObserver((fileName) => __awaiter(void 0, void 0, void 0, function* () {
        const buffer = yield fetch(`loops/${fileName}`)
            .then(result => result.arrayBuffer())
            .then(buffer => context.decodeAudioData(buffer))
            .catch(() => null);
        if (buffer !== null) {
            worklet.setAudioBuffer(buffer);
            editor.showAudioBuffer(buffer);
        }
    }));
    const transportCheckbox = HTML.query('[data-checkbox=transport]');
    transportCheckbox.addEventListener('change', () => worklet.setTransporting(transportCheckbox.checked));
    installMenu(editor, pattern);
    installShortcuts(editor, pattern);
    document.addEventListener('touchmove', (event) => event.preventDefault(), { passive: false });
    document.addEventListener('dblclick', (event) => event.preventDefault(), { passive: false });
    const resize = () => document.body.style.height = `${window.innerHeight}px`;
    window.addEventListener("resize", resize);
    resize();
    requestAnimationFrame(() => {
        document.querySelectorAll("body svg.preloader").forEach(element => element.remove());
        document.querySelectorAll("body main").forEach(element => element.classList.remove("invisible"));
    });
    console.debug("boot complete.");
}))();
//# sourceMappingURL=main.js.map