interface AudioWorkletProcessor {
    port: MessagePort
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor
    port: MessagePort
    new(option?: any): AudioWorkletProcessor
    process(inputs: Float32Array[][], outputs: Float32Array[][], parameters: { [name: string]: Float32Array }): boolean
}

declare var sampleRate: number

declare function registerProcessor<T extends AudioWorkletProcessor>(name: string, processorCtor: T): void

// Spec: https://www.w3.org/TR/css-font-loading/
type CSSOMString = string

interface FontFace {
    family: CSSOMString
    style: CSSOMString
    weight: CSSOMString

    load(): Promise<FontFace>
}

interface FontFaceSet {
    readonly ready: Promise<FontFaceSet>

    add(FontFace): FontFace
}

declare interface Document {
    fonts: FontFaceSet
}