import {TAU} from "../../lib/math.js"
import {Obstacle} from "./obstacles.js"

export interface DragHandler {
    distance(x: number, y: number): number

    moveTo(x: number, y: number): void

    constrainToCircle(): boolean

    readonly obstacle: Obstacle<any>
}

export const distance = (x0: number, y0: number, x1: number, y1: number): number => {
    const dx = x1 - x0
    const dy = y1 - y0
    return Math.sqrt(dx * dx + dy * dy)
}

export const snapLength = (length: number, resolution: number = 0): number => {
    if (resolution === 0) return length
    return Math.round(length * resolution) / resolution
}

export const snapAngle = (angle: number, resolution: number = 0): number => {
    if (resolution === 0) return angle
    angle /= TAU
    return Math.round((angle - Math.floor(angle)) * resolution) / resolution * TAU
}