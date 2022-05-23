export interface DragHandler {
    distance(x: number, y: number): number

    moveTo(x: number, y: number): void
}

export const distance = (x0: number, y0: number, x1: number, y1: number): number => {
    const dx = x1 - x0
    const dy = y1 - y0
    return Math.sqrt(dx * dx + dy * dy)
}