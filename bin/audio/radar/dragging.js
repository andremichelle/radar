import { TAU } from "../../lib/math.js";
export const distance = (x0, y0, x1, y1) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    return Math.sqrt(dx * dx + dy * dy);
};
export const snapLength = (length, resolution = 0) => {
    if (resolution === 0)
        return length;
    return Math.round(length * resolution) / resolution;
};
export const snapAngle = (angle, resolution = 0) => {
    if (resolution === 0)
        return angle;
    angle /= TAU;
    return Math.round((angle - Math.floor(angle)) * resolution) / resolution * TAU;
};
//# sourceMappingURL=dragging.js.map