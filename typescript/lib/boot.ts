// noinspection JSUnusedGlobalSymbols

import {Observable, ObservableImpl, Observer, Terminable} from "./common.js"

export const preloadImagesOfCssFile = async (pathToCss: string): Promise<void> => {
    const href = location.href
    const base = href.substring(0, href.lastIndexOf("/")) + "/bin/"
    console.debug(`preloadImagesOfCssFile... base: ${base}`)
    const urls: URL[] = await fetch(pathToCss)
        .then(x => x.text()).then(x => {
            const matches = x.match(/url\(.+(?=\))/g)
            if (matches === null) {
                console.debug("no image urls found.")
                return []
            }
            return matches
                .map(path => path.replace(/url\(/, "").slice(1, -1))
                .filter(path => !path.startsWith("#"))
                .map(path => new URL(path, base))
        })
    return Promise.all(urls.map(url => new Promise<void>((resolve, reject) => {
        const src = url.href
        console.debug(`src: '${src}'`)
        const image = new Image()
        image.onload = () => resolve()
        image.onerror = (error) => reject(error)
        image.src = src
    }))).then(() => Promise.resolve())
}

export interface Dependency<T> {
    get: () => T
}

export class Boot implements Observable<Boot> {
    private readonly observable = new ObservableImpl<Boot>()

    private finishedTasks: number = 0 | 0
    private totalTasks: number = 0 | 0
    private completed: boolean = false

    addObserver(observer: Observer<Boot>): Terminable {
        return this.observable.addObserver(observer)
    }

    removeObserver(observer: Observer<Boot>): boolean {
        return this.observable.removeObserver(observer)
    }

    terminate(): void {
        this.observable.terminate()
    }

    registerProcess<T>(promise: Promise<T>): Dependency<T> {
        this.totalTasks++
        let result = null
        promise.then((value: T) => {
            result = value
            this.finishedTasks++
            if (this.isCompleted()) this.completed = true
            this.observable.notify(this)
        })
        return {
            get: () => {
                if (result === null) {
                    throw new Error("Dependency has not been resolved.")
                }
                return result
            }
        }
    }

    registerFont(name: string, url: string): Dependency<FontFace> {
        return this.registerProcess(document.fonts.ready
            .then((faceSet: FontFaceSet) => new FontFace(name, url)
                .load()
                .then(fontFace => faceSet.add(fontFace))))
    }

    isCompleted(): boolean {
        return this.finishedTasks === this.totalTasks
    }

    normalizedPercentage() {
        return 0 === this.totalTasks ? 1.0 : this.finishedTasks / this.totalTasks
    }

    percentage() {
        return Math.round(this.normalizedPercentage() * 100.0)
    }

    waitForCompletion(): Promise<void> {
        return this.isCompleted() ? Promise.resolve() : new Promise<void>((resolve: (value: void) => void) => {
            this.observable.addObserver(boot => {
                if (boot.isCompleted()) {
                    requestAnimationFrame(() => {
                        resolve()
                        boot.terminate()
                    })
                }
            })
        })
    }
}

export const newAudioContext = (options: AudioContextOptions = {
    sampleRate: 48000,
    latencyHint: "interactive"
}): AudioContext => {
    const context = new AudioContext(options)
    if (context.state !== "running") {
        const eventOptions = {capture: true}
        const resume = async () => {
            if (context.state !== "running") {
                try {
                    await context.resume()
                } catch (e) {
                    return
                }
                window.removeEventListener("mousedown", resume, eventOptions)
                window.removeEventListener("touchstart", resume, eventOptions)
                window.removeEventListener("keydown", resume, eventOptions)
            }
        }
        window.addEventListener("mousedown", resume, eventOptions)
        window.addEventListener("touchstart", resume, eventOptions)
        window.addEventListener("keydown", resume, eventOptions)
    }
    return context
}