export declare class MeterWorklet extends AudioWorkletNode {
    readonly numLines: number;
    readonly channelCount: number;
    static loadModule(context: AudioContext): Promise<void>;
    static readonly PEAK_HOLD_DURATION: number;
    static readonly CLIP_HOLD_DURATION: number;
    readonly peaks: Float32Array[];
    readonly squares: Float32Array[];
    readonly peakHoldValue: Float32Array[];
    readonly releasePeakHoldTime: Float32Array[];
    constructor(context: BaseAudioContext, numLines: number, channelCount: number);
}
export declare class StereoMeterWorklet extends MeterWorklet {
    private readonly meterHPadding;
    private readonly meterSegmentWidth;
    private readonly meterSegmentHeight;
    private readonly meterSegmentHGap;
    private readonly meterSegmentVGap;
    private readonly meterSegmentCount;
    private readonly meterWidth;
    private readonly width;
    private readonly height;
    private readonly labelStepsDb;
    private readonly maxDb;
    private readonly minDb;
    private readonly canvas;
    private readonly graphics;
    private readonly gradient;
    private readonly updater;
    private scale;
    constructor(context: AudioContext);
    get domElement(): HTMLElement;
    update(): void;
    renderScale(): void;
    renderMeter(gain: number, y: number, h: number): void;
    dbToX(db: number): number;
    dbToIndex(db: number): number;
    dbToNorm(db: number): number;
}
