var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ObservableImpl } from "./common.js";
export const preloadImagesOfCssFile = (pathToCss) => __awaiter(void 0, void 0, void 0, function* () {
    const href = location.href;
    const base = href.substring(0, href.lastIndexOf("/")) + "/bin/";
    console.debug(`preloadImagesOfCssFile... base: ${base}`);
    const urls = yield fetch(pathToCss)
        .then(x => x.text()).then(x => {
        const matches = x.match(/url\(.+(?=\))/g);
        if (matches === null) {
            console.debug("no image urls found.");
            return [];
        }
        return matches
            .map(path => path.replace(/url\(/, "").slice(1, -1))
            .filter(path => !path.startsWith("#"))
            .map(path => new URL(path, base));
    });
    return Promise.all(urls.map(url => new Promise((resolve, reject) => {
        const src = url.href;
        console.debug(`src: '${src}'`);
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = (error) => reject(error);
        image.src = src;
    }))).then(() => Promise.resolve());
});
export class Boot {
    constructor() {
        this.observable = new ObservableImpl();
        this.finishedTasks = 0 | 0;
        this.totalTasks = 0 | 0;
        this.completed = false;
    }
    addObserver(observer) {
        return this.observable.addObserver(observer);
    }
    removeObserver(observer) {
        return this.observable.removeObserver(observer);
    }
    terminate() {
        this.observable.terminate();
    }
    registerProcess(promise) {
        this.totalTasks++;
        let result = null;
        promise.then((value) => {
            result = value;
            this.finishedTasks++;
            if (this.isCompleted())
                this.completed = true;
            this.observable.notify(this);
        });
        return {
            get: () => {
                if (result === null) {
                    throw new Error("Dependency has not been resolved.");
                }
                return result;
            }
        };
    }
    registerFont(name, url) {
        return this.registerProcess(document.fonts.ready
            .then((faceSet) => new FontFace(name, url)
            .load()
            .then(fontFace => faceSet.add(fontFace))));
    }
    isCompleted() {
        return this.finishedTasks === this.totalTasks;
    }
    normalizedPercentage() {
        return 0 === this.totalTasks ? 1.0 : this.finishedTasks / this.totalTasks;
    }
    percentage() {
        return Math.round(this.normalizedPercentage() * 100.0);
    }
    waitForCompletion() {
        return this.isCompleted() ? Promise.resolve() : new Promise((resolve) => {
            this.observable.addObserver(boot => {
                if (boot.isCompleted()) {
                    requestAnimationFrame(() => {
                        resolve();
                        boot.terminate();
                    });
                }
            });
        });
    }
}
export const newAudioContext = (options = {
    sampleRate: 48000,
    latencyHint: "interactive"
}) => {
    const context = new AudioContext(options);
    if (context.state !== "running") {
        const eventOptions = { capture: true };
        const resume = () => __awaiter(void 0, void 0, void 0, function* () {
            if (context.state !== "running") {
                try {
                    yield context.resume();
                    console.debug('AudioContext resumed.');
                }
                catch (e) {
                    return;
                }
                window.removeEventListener("mousedown", resume, eventOptions);
                window.removeEventListener("touchstart", resume, eventOptions);
                window.removeEventListener("keydown", resume, eventOptions);
            }
        });
        window.addEventListener("mousedown", resume, eventOptions);
        window.addEventListener("touchstart", resume, eventOptions);
        window.addEventListener("keydown", resume, eventOptions);
    }
    return context;
};
//# sourceMappingURL=boot.js.map