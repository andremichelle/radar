export const createElement = <K extends keyof SVGElementTagNameMap>(name: K)
    : SVGElementTagNameMap[K] => document.createElementNS("http://www.w3.org/2000/svg", name)