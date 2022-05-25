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

declare interface ImageEncodeOptions {
    quality?: number;
    type?: string;
}

declare interface OffscreenCanvas extends EventTarget {
    /**
     * These attributes return the dimensions of the OffscreenCanvas object's bitmap.
     *
     * They can be set, to replace the bitmap with a new, transparent black bitmap of the specified dimensions (effectively resizing it).
     */
    height: number;
    /**
     * These attributes return the dimensions of the OffscreenCanvas object's bitmap.
     *
     * They can be set, to replace the bitmap with a new, transparent black bitmap of the specified dimensions (effectively resizing it).
     */
    width: number;

    /**
     * Returns a promise that will fulfill with a new Blob object representing a file containing the image in the OffscreenCanvas object.
     *
     * The argument, if provided, is a dictionary that controls the encoding options of the image file to be created. The type field specifies the file format and has a default value of "image/png"; that type is also used if the requested type isn't supported. If the image format supports variable quality (such as "image/jpeg"), then the quality field is a number in the range 0.0 to 1.0 inclusive indicating the desired quality level for the resulting image.
     */
    convertToBlob(options?: ImageEncodeOptions): Promise<Blob>;

    /**
     * Returns an object that exposes an API for drawing on the OffscreenCanvas object. contextId specifies the desired API: "2d", "bitmaprenderer", "webgl", or "webgl2". options is handled by that API.
     *
     * This specification defines the "2d" context below, which is similar but distinct from the "2d" context that is created from a canvas element. The WebGL specifications define the "webgl" and "webgl2" contexts. [WEBGL]
     *
     * Returns null if the canvas has already been initialized with another context type (e.g., trying to get a "2d" context after getting a "webgl" context).
     */
    getContext(contextId: "2d", options?: CanvasRenderingContext2DSettings): OffscreenCanvasRenderingContext2D | null;

    getContext(contextId: "bitmaprenderer", options?: ImageBitmapRenderingContextSettings): ImageBitmapRenderingContext | null;

    getContext(contextId: "webgl", options?: WebGLContextAttributes): WebGLRenderingContext | null;

    getContext(contextId: "webgl2", options?: WebGLContextAttributes): WebGL2RenderingContext | null;

    /**
     * Returns a newly created ImageBitmap object with the image in the OffscreenCanvas object. The image in the OffscreenCanvas object is replaced with a new blank image.
     */
    transferToImageBitmap(): ImageBitmap;
}

declare var OffscreenCanvas: {
    prototype: OffscreenCanvas;
    new(width: number, height: number): OffscreenCanvas;
}

declare interface OffscreenCanvasRenderingContext2D extends CanvasCompositing, CanvasDrawImage, CanvasDrawPath, CanvasFillStrokeStyles, CanvasFilters, CanvasImageData, CanvasImageSmoothing, CanvasPath, CanvasPathDrawingStyles, CanvasRect, CanvasShadowStyles, CanvasState, CanvasText, CanvasTextDrawingStyles, CanvasTransform {
    readonly canvas: OffscreenCanvas;

    commit(): void;
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemWritableFileStream/
declare interface FileSystemWritableFileStream {
    write(data: BufferSource | Blob): void

    close(): void
}

// https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileHandle
declare interface FileSystemFileHandle {
    createWritable(): Promise<FileSystemWritableFileStream>

    getFile(): Promise<File>
}

declare interface PickerOptionType {
    description: string
    accept?: { [key: string]: string[] }
}

declare interface PickerOptions {
    excludeAcceptAllOption?: boolean
    suggestedName?: string
    multiple?: boolean
    types?: PickerOptionType[]
}

// Hides error TS2339: Property 'text' does not exist on type 'File'
declare interface Window {
    showOpenFilePicker(pickerOpts?: PickerOptions): Promise<FileSystemFileHandle[]>

    showSaveFilePicker(pickerOpts?: PickerOptions): Promise<FileSystemFileHandle>
}