import { Observable, Observer, Terminable } from "./common.js";
export declare const preloadImagesOfCssFile: (pathToCss: string) => Promise<void>;
export interface Dependency<T> {
    get: () => T;
}
export declare class Boot implements Observable<Boot> {
    private readonly observable;
    private finishedTasks;
    private totalTasks;
    private completed;
    addObserver(observer: Observer<Boot>): Terminable;
    removeObserver(observer: Observer<Boot>): boolean;
    terminate(): void;
    registerProcess<T>(promise: Promise<T>): Dependency<T>;
    registerFont(name: string, url: string): Dependency<FontFace>;
    isCompleted(): boolean;
    normalizedPercentage(): number;
    percentage(): number;
    waitForCompletion(): Promise<void>;
}
export declare const newAudioContext: (options?: AudioContextOptions) => AudioContext;
