export class ListItemDefaultData {
    constructor(readonly label: string,
                readonly shortcut: string = "",
                readonly checked: boolean = false) {
    }

    toString() {
        return this.label
    }
}

export class ListItem {
    separatorBefore: boolean = false
    selectable: boolean = true
    private readonly permanentChildren: ListItem[] = []
    private readonly transientChildren: ListItem[] = []
    private transientChildrenCallback: (parent: ListItem) => void = null
    private openingCallback: (listItem: ListItem) => void = null
    private triggerCallback: (listItem: ListItem) => void = null
    private isOpening: boolean = false

    constructor(readonly data) {
    }

    static root() {
        return new ListItem(null)
    }

    static default(label: string, shortcut: string = '', checked: boolean = false) {
        return new ListItem(new ListItemDefaultData(label, shortcut, checked))
    }

    addListItem(listItem: ListItem): ListItem {
        if (this.isOpening) {
            this.transientChildren.push(listItem)
        } else {
            this.permanentChildren.push(listItem)
        }
        return this
    }

    opening(): void {
        if (null !== this.openingCallback) {
            this.openingCallback(this)
        }
    }

    trigger(): void {
        if (null === this.triggerCallback) {
            console.log("You selected '" + this.data + "'")
        } else {
            this.triggerCallback(this)
        }
    }

    isSelectable(value: boolean = true): ListItem {
        this.selectable = value
        return this
    }

    addSeparatorBefore(): ListItem {
        this.separatorBefore = true
        return this
    }

    addRuntimeChildrenCallback(callback: (parent: ListItem) => void): ListItem {
        this.transientChildrenCallback = callback
        return this
    }

    onOpening(callback: (listItem: ListItem) => void): ListItem {
        this.openingCallback = callback
        return this
    }

    onTrigger(callback: (listItem: ListItem) => void): ListItem {
        this.triggerCallback = callback
        return this
    }

    hasChildren(): boolean {
        return 0 < this.permanentChildren.length || null !== this.transientChildrenCallback
    }

    collectChildren(): ListItem[] {
        if (null === this.transientChildrenCallback) {
            return this.permanentChildren
        }
        this.isOpening = true
        this.transientChildrenCallback(this)
        this.isOpening = false
        return this.permanentChildren.concat(this.transientChildren)
    }

    removeTransientChildren(): void {
        this.transientChildren.splice(0, this.transientChildren.length)
    }
}

class Controller {
    private readonly mouseDownHandler: (event: MouseEvent) => void

    private root: Menu = null
    private layer: HTMLElement = null
    private onClose: () => void = null

    constructor() {
        this.mouseDownHandler = event => {
            if (null === this.root) {
                throw new Error("No root")
            }
            if (!Menu.Controller.reduceAll(m => {
                const rect = m.element.getBoundingClientRect()
                return event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom
            })) {
                event.stopImmediatePropagation()
                event.preventDefault()
                this.close()
            }
        }
    }

    async open(listItem: ListItem, x: number, y: number, docked: boolean): Promise<void> {
        if (null === this.layer) {
            this.layer = document.createElement("div")
            this.layer.classList.add("menu-layer")
            document.body.appendChild(this.layer)
        } else if (null !== this.root) {
            this.close()
        }
        this.root = new Menu(listItem, docked)
        this.root.moveTo(x, y)
        this.root.attach(this.layer, null)
        window.addEventListener("mousedown", this.mouseDownHandler, true)
        return new Promise<void>(resolve => this.onClose = resolve)
    }

    close() {
        if (null === this.root) {
            throw new Error("Cannot close root.")
        }
        this.onClose()
        this.onClose = null
        this.root.dispose()
        this.root = null
    }

    onDispose(pullDown) {
        if (this.root === pullDown) {
            window.removeEventListener("mousedown", this.mouseDownHandler, true)
            this.root = null
        }
    }

    shutdown() {
        this.iterateAll(menu => menu.element.classList.add("shutdown"))
    }

    iterateAll(callback) {
        let menu = this.root
        do {
            callback(menu)
            menu = menu.childMenu
        } while (menu !== null)
    }

    reduceAll(callback) {
        let menu = this.root
        let result = 0
        do {
            result |= callback(menu)
            menu = menu.childMenu
        } while (menu !== null)
        return result
    }
}

export class Menu {
    static Controller: Controller = new Controller()
    static Renderer: Map<any, (element: HTMLElement, data: any) => void> = new Map()
    childMenu: Menu = null
    private element: HTMLElement = document.createElement("nav")
    private readonly container: HTMLElement = document.createElement("div")
    private readonly scrollUp: HTMLElement = document.createElement("div")
    private readonly scrollDown: HTMLElement = document.createElement("div")
    private selectedDiv: HTMLDivElement = null
    private x: number = 0 | 0
    private y: number = 0 | 0

    constructor(private listItem: ListItem, docked: boolean = false) {
        this.element.classList.add("menu")
        this.element.addEventListener("contextmenu", event => {
            event.preventDefault()
            event.stopImmediatePropagation()
        }, true)
        if (docked) {
            this.element.classList.add("docked")
        }
        this.container = document.createElement("div")
        this.container.classList.add("container")
        this.scrollUp = document.createElement("div")
        this.scrollUp.textContent = "▲"
        this.scrollUp.classList.add("transparent")
        this.scrollUp.classList.add("scroll")
        this.scrollUp.classList.add("up")
        this.scrollDown = document.createElement("div")
        this.scrollDown.textContent = "▼"
        this.scrollDown.classList.add("transparent")
        this.scrollDown.classList.add("scroll")
        this.scrollDown.classList.add("down")
        this.element.appendChild(this.scrollUp)
        this.element.appendChild(this.container)
        this.element.appendChild(this.scrollDown)
        for (const listItem of this.listItem.collectChildren()) {
            listItem.opening()
            if (listItem.separatorBefore) {
                this.container.appendChild(document.createElement("hr"))
            }
            const div = document.createElement("div")
            if (listItem.selectable) {
                div.classList.add("selectable")
            } else {
                div.classList.remove("selectable")
            }
            if (listItem.hasChildren()) {
                div.classList.add("has-children")
            }
            div.onmouseenter = () => {
                if (null !== this.selectedDiv) {
                    this.selectedDiv.classList.remove("selected")
                    this.selectedDiv = null
                }
                div.classList.add("selected")
                this.selectedDiv = div
                const hasChildren = listItem.hasChildren()
                if (null !== this.childMenu) {
                    if (hasChildren && this.childMenu.listItem === listItem) {
                        // no need to remove and recreate the same pull-down
                        return
                    }
                    this.childMenu.dispose()
                    this.childMenu = null
                }
                if (hasChildren) {
                    const divRect = div.getBoundingClientRect()
                    this.childMenu = new Menu(listItem)
                    this.childMenu.moveTo(divRect.left + divRect.width, divRect.top - 8) // padding top
                    this.childMenu.attach(this.element.parentElement, this)
                }
            }
            div.onmouseleave = event => {
                if (this.isChild(event.relatedTarget as Node)) {
                    return
                }
                div.classList.remove("selected")
                this.selectedDiv = null
                if (null !== this.childMenu) {
                    this.childMenu.dispose()
                    this.childMenu = null
                }
            }
            div.onmouseup = event => {
                event.preventDefault()
                if (null === this.childMenu) {
                    div.addEventListener("animationend", () => {
                        listItem.trigger()
                        Menu.Controller.close()
                    }, {once: true})
                    div.classList.add("triggered")
                    Menu.Controller.shutdown()
                }
                return true
            }
            const renderer = Menu.Renderer.get(listItem.data.constructor)
            if (renderer) {
                renderer(div, listItem.data)
            } else {
                throw new Error("No renderer found for " + listItem.data)
            }
            this.container.appendChild(div)
        }
    }

    moveTo(x, y): void {
        this.x = x | 0
        this.y = y | 0
        this.element.style.transform = "translate(" + this.x + "px, " + this.y + "px)"
    }

    attach(parentNode: Element, parentMenu: Menu = null): void {
        parentNode.appendChild(this.element)
        const clientRect = this.element.getBoundingClientRect()
        if (clientRect.left + clientRect.width > parentNode.clientWidth) {
            if (null === parentMenu || undefined === parentMenu) {
                this.moveTo(this.x - clientRect.width, this.y)
            } else {
                this.moveTo(parentMenu.x - clientRect.width, this.y)
            }
        }
        if (clientRect.height >= parentNode.clientHeight) {
            this.moveTo(this.x, 0)
            this.makeScrollable()
        } else if (clientRect.top + clientRect.height > parentNode.clientHeight) {
            this.moveTo(this.x, parentNode.clientHeight - clientRect.height)
        }
    }

    dispose(): void {
        if (null !== this.childMenu) {
            this.childMenu.dispose()
            this.childMenu = null
        }
        Menu.Controller.onDispose(this)
        this.element.remove()
        this.element = null
        this.listItem.removeTransientChildren()
        this.listItem = null
        this.selectedDiv = null
    }

    domElement(): HTMLElement {
        return this.element
    }

    isChild(target: Node): boolean {
        if (null === this.childMenu) {
            return false
        }
        while (null !== target) {
            if (target === this.element) {
                return false
            }
            if (target === this.childMenu.domElement()) {
                return true
            }
            target = target.parentNode
        }
        return false
    }

    private makeScrollable(): void {
        const scroll = direction => this.container.scrollTop += direction
        this.element.classList.add("overflowing")
        this.element.addEventListener("wheel", event => scroll(Math.sign(event.deltaY) * 6), {passive: false})
        const canScroll = (direction: number): boolean => {
            if (0 > direction && 0 === this.container.scrollTop) {
                return false
            }
            // noinspection RedundantIfStatementJS
            if (0 < direction && this.container.scrollTop === this.container.scrollHeight - this.container.clientHeight) {
                return false
            }
            return true
        }
        const setup = (button: HTMLElement, direction: number) => {
            button.onmouseenter = () => {
                if (!canScroll(direction)) {
                    return
                }
                button.classList.add("scrolling")
                let active: boolean = true
                const scrolling = (): void => {
                    scroll(direction)
                    if (!canScroll(direction)) {
                        active = false
                    }
                    if (active) {
                        window.requestAnimationFrame(scrolling)
                    } else {
                        button.classList.remove("scrolling")
                    }
                }
                window.requestAnimationFrame(scrolling)
                button.onmouseleave = () => {
                    active = false
                    button.onmouseup = null
                }
            }
        }
        setup(this.scrollUp, -8)
        setup(this.scrollDown, 8)
    }
}

Menu.Renderer.set(ListItemDefaultData, (element: HTMLElement, data: ListItemDefaultData) => {
    element.classList.add("default")
    element.innerHTML =
        `<svg class="check-icon" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M2 7L5 10L10 3"/></svg>
         <div class="label">${data.label}</div>
         <div class="shortcut">${Array.from(data.shortcut.split("")).map(s => `<span>${s}</span>`).join("")}</div>
         <svg class="children-icon" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M4 2L8 6L4 10"/></svg>`
    if (data.checked) {
        element.classList.add("checked")
    }
})

export class MenuBar {
    static install(): MenuBar {
        return new MenuBar()
    }

    private offsetX: number = 0
    private offsetY: number = 0
    private openListItem: ListItem = null

    private constructor() {
    }

    offset(x: number, y: number): MenuBar {
        this.offsetX = x
        this.offsetY = y
        return this
    }

    addButton(button: HTMLElement, listItem: ListItem): MenuBar {
        button.onmousedown = async (event: MouseEvent) => {
            // TODO console.log(event.button, event.buttons, event.detail, event.ctrlKey)
            await this.open(button, listItem)
        }
        button.onmouseenter = async () => {
            if (null !== this.openListItem && this.openListItem !== listItem) {
                await this.open(button, listItem)
            }
        }
        return this
    }

    async open(button: HTMLElement, listItem: ListItem): Promise<void> {
        const rect = button.getBoundingClientRect()
        const x = rect.left + this.offsetX
        const y = rect.bottom + this.offsetY
        button.classList.add("selected")
        this.openListItem = listItem
        await Menu.Controller.open(listItem, x, y, true)
        this.openListItem = null
        button.classList.remove("selected")
    }
}