var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class ListItemDefaultData {
    constructor(label, shortcut = "", checked = false) {
        this.label = label;
        this.shortcut = shortcut;
        this.checked = checked;
    }
    toString() {
        return this.label;
    }
}
export class ListItem {
    constructor(data) {
        this.data = data;
        this.separatorBefore = false;
        this.selectable = true;
        this.permanentChildren = [];
        this.transientChildren = [];
        this.transientChildrenCallback = null;
        this.openingCallback = null;
        this.triggerCallback = null;
        this.isOpening = false;
    }
    static root() {
        return new ListItem(null);
    }
    static default(label, shortcut = '', checked = false) {
        return new ListItem(new ListItemDefaultData(label, shortcut, checked));
    }
    addListItem(listItem) {
        if (this.isOpening) {
            this.transientChildren.push(listItem);
        }
        else {
            this.permanentChildren.push(listItem);
        }
        return this;
    }
    opening() {
        if (null !== this.openingCallback) {
            this.openingCallback(this);
        }
    }
    trigger() {
        if (null === this.triggerCallback) {
            console.log("You selected '" + this.data + "'");
        }
        else {
            this.triggerCallback(this);
        }
    }
    isSelectable(value = true) {
        this.selectable = value;
        return this;
    }
    addSeparatorBefore() {
        this.separatorBefore = true;
        return this;
    }
    addRuntimeChildrenCallback(callback) {
        this.transientChildrenCallback = callback;
        return this;
    }
    onOpening(callback) {
        this.openingCallback = callback;
        return this;
    }
    onTrigger(callback) {
        this.triggerCallback = callback;
        return this;
    }
    hasChildren() {
        return 0 < this.permanentChildren.length || null !== this.transientChildrenCallback;
    }
    collectChildren() {
        if (null === this.transientChildrenCallback) {
            return this.permanentChildren;
        }
        this.isOpening = true;
        this.transientChildrenCallback(this);
        this.isOpening = false;
        return this.permanentChildren.concat(this.transientChildren);
    }
    removeTransientChildren() {
        this.transientChildren.splice(0, this.transientChildren.length);
    }
}
class Controller {
    constructor() {
        this.root = null;
        this.layer = null;
        this.onClose = null;
        this.mouseDownHandler = event => {
            if (null === this.root) {
                throw new Error("No root");
            }
            if (!Menu.Controller.reduceAll(m => {
                const rect = m.element.getBoundingClientRect();
                return event.clientX >= rect.left && event.clientX < rect.right && event.clientY >= rect.top && event.clientY < rect.bottom;
            })) {
                event.stopImmediatePropagation();
                event.preventDefault();
                this.close();
            }
        };
    }
    open(listItem, x, y, docked) {
        return __awaiter(this, void 0, void 0, function* () {
            if (null === this.layer) {
                this.layer = document.createElement("div");
                this.layer.classList.add("menu-layer");
                document.body.appendChild(this.layer);
            }
            else if (null !== this.root) {
                this.close();
            }
            this.root = new Menu(listItem, docked);
            this.root.moveTo(x, y);
            this.root.attach(this.layer, null);
            window.addEventListener("mousedown", this.mouseDownHandler, true);
            return new Promise(resolve => this.onClose = resolve);
        });
    }
    close() {
        if (null === this.root) {
            throw new Error("Cannot close root.");
        }
        this.onClose();
        this.onClose = null;
        this.root.dispose();
        this.root = null;
    }
    onDispose(pullDown) {
        if (this.root === pullDown) {
            window.removeEventListener("mousedown", this.mouseDownHandler, true);
            this.root = null;
        }
    }
    shutdown() {
        this.iterateAll(menu => menu.element.classList.add("shutdown"));
    }
    iterateAll(callback) {
        let menu = this.root;
        do {
            callback(menu);
            menu = menu.childMenu;
        } while (menu !== null);
    }
    reduceAll(callback) {
        let menu = this.root;
        let result = 0;
        do {
            result |= callback(menu);
            menu = menu.childMenu;
        } while (menu !== null);
        return result;
    }
}
export class Menu {
    constructor(listItem, docked = false) {
        this.listItem = listItem;
        this.childMenu = null;
        this.element = document.createElement("nav");
        this.container = document.createElement("div");
        this.scrollUp = document.createElement("div");
        this.scrollDown = document.createElement("div");
        this.selectedDiv = null;
        this.x = 0 | 0;
        this.y = 0 | 0;
        this.element.classList.add("menu");
        this.element.addEventListener("contextmenu", event => {
            event.preventDefault();
            event.stopImmediatePropagation();
        }, true);
        if (docked) {
            this.element.classList.add("docked");
        }
        this.container = document.createElement("div");
        this.container.classList.add("container");
        this.scrollUp = document.createElement("div");
        this.scrollUp.textContent = "▲";
        this.scrollUp.classList.add("transparent");
        this.scrollUp.classList.add("scroll");
        this.scrollUp.classList.add("up");
        this.scrollDown = document.createElement("div");
        this.scrollDown.textContent = "▼";
        this.scrollDown.classList.add("transparent");
        this.scrollDown.classList.add("scroll");
        this.scrollDown.classList.add("down");
        this.element.appendChild(this.scrollUp);
        this.element.appendChild(this.container);
        this.element.appendChild(this.scrollDown);
        for (const listItem of this.listItem.collectChildren()) {
            listItem.opening();
            if (listItem.separatorBefore) {
                this.container.appendChild(document.createElement("hr"));
            }
            const div = document.createElement("div");
            if (listItem.selectable) {
                div.classList.add("selectable");
            }
            else {
                div.classList.remove("selectable");
            }
            if (listItem.hasChildren()) {
                div.classList.add("has-children");
            }
            div.onmouseenter = () => {
                if (null !== this.selectedDiv) {
                    this.selectedDiv.classList.remove("selected");
                    this.selectedDiv = null;
                }
                div.classList.add("selected");
                this.selectedDiv = div;
                const hasChildren = listItem.hasChildren();
                if (null !== this.childMenu) {
                    if (hasChildren && this.childMenu.listItem === listItem) {
                        return;
                    }
                    this.childMenu.dispose();
                    this.childMenu = null;
                }
                if (hasChildren) {
                    const divRect = div.getBoundingClientRect();
                    this.childMenu = new Menu(listItem);
                    this.childMenu.moveTo(divRect.left + divRect.width, divRect.top - 8);
                    this.childMenu.attach(this.element.parentElement, this);
                }
            };
            div.onmouseleave = event => {
                if (this.isChild(event.relatedTarget)) {
                    return;
                }
                div.classList.remove("selected");
                this.selectedDiv = null;
                if (null !== this.childMenu) {
                    this.childMenu.dispose();
                    this.childMenu = null;
                }
            };
            div.onmouseup = event => {
                event.preventDefault();
                if (null === this.childMenu) {
                    div.addEventListener("animationend", () => {
                        listItem.trigger();
                        Menu.Controller.close();
                    }, { once: true });
                    div.classList.add("triggered");
                    Menu.Controller.shutdown();
                }
                return true;
            };
            const renderer = Menu.Renderer.get(listItem.data.constructor);
            if (renderer) {
                renderer(div, listItem.data);
            }
            else {
                throw new Error("No renderer found for " + listItem.data);
            }
            this.container.appendChild(div);
        }
    }
    moveTo(x, y) {
        this.x = x | 0;
        this.y = y | 0;
        this.element.style.transform = "translate(" + this.x + "px, " + this.y + "px)";
    }
    attach(parentNode, parentMenu = null) {
        parentNode.appendChild(this.element);
        const clientRect = this.element.getBoundingClientRect();
        if (clientRect.left + clientRect.width > parentNode.clientWidth) {
            if (null === parentMenu || undefined === parentMenu) {
                this.moveTo(this.x - clientRect.width, this.y);
            }
            else {
                this.moveTo(parentMenu.x - clientRect.width, this.y);
            }
        }
        if (clientRect.height >= parentNode.clientHeight) {
            this.moveTo(this.x, 0);
            this.makeScrollable();
        }
        else if (clientRect.top + clientRect.height > parentNode.clientHeight) {
            this.moveTo(this.x, parentNode.clientHeight - clientRect.height);
        }
    }
    dispose() {
        if (null !== this.childMenu) {
            this.childMenu.dispose();
            this.childMenu = null;
        }
        Menu.Controller.onDispose(this);
        this.element.remove();
        this.element = null;
        this.listItem.removeTransientChildren();
        this.listItem = null;
        this.selectedDiv = null;
    }
    domElement() {
        return this.element;
    }
    isChild(target) {
        if (null === this.childMenu) {
            return false;
        }
        while (null !== target) {
            if (target === this.element) {
                return false;
            }
            if (target === this.childMenu.domElement()) {
                return true;
            }
            target = target.parentNode;
        }
        return false;
    }
    makeScrollable() {
        const scroll = direction => this.container.scrollTop += direction;
        this.element.classList.add("overflowing");
        this.element.addEventListener("wheel", event => scroll(Math.sign(event.deltaY) * 6), { passive: false });
        const canScroll = (direction) => {
            if (0 > direction && 0 === this.container.scrollTop) {
                return false;
            }
            if (0 < direction && this.container.scrollTop === this.container.scrollHeight - this.container.clientHeight) {
                return false;
            }
            return true;
        };
        const setup = (button, direction) => {
            button.onmouseenter = () => {
                if (!canScroll(direction)) {
                    return;
                }
                button.classList.add("scrolling");
                let active = true;
                const scrolling = () => {
                    scroll(direction);
                    if (!canScroll(direction)) {
                        active = false;
                    }
                    if (active) {
                        window.requestAnimationFrame(scrolling);
                    }
                    else {
                        button.classList.remove("scrolling");
                    }
                };
                window.requestAnimationFrame(scrolling);
                button.onmouseleave = () => {
                    active = false;
                    button.onmouseup = null;
                };
            };
        };
        setup(this.scrollUp, -8);
        setup(this.scrollDown, 8);
    }
}
Menu.Controller = new Controller();
Menu.Renderer = new Map();
Menu.Renderer.set(ListItemDefaultData, (element, data) => {
    element.classList.add("default");
    element.innerHTML =
        `<svg class="check-icon" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M2 7L5 10L10 3"/></svg>
         <div class="label">${data.label}</div>
         <div class="shortcut">${Array.from(data.shortcut.split("")).map(s => `<span>${s}</span>`).join("")}</div>
         <svg class="children-icon" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg"><path d="M4 2L8 6L4 10"/></svg>`;
    if (data.checked) {
        element.classList.add("checked");
    }
});
export class MenuBar {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.openListItem = null;
    }
    static install() {
        return new MenuBar();
    }
    offset(x, y) {
        this.offsetX = x;
        this.offsetY = y;
        return this;
    }
    addButton(button, listItem) {
        button.onmousedown = (event) => __awaiter(this, void 0, void 0, function* () {
            yield this.open(button, listItem);
        });
        button.onmouseenter = () => __awaiter(this, void 0, void 0, function* () {
            if (null !== this.openListItem && this.openListItem !== listItem) {
                yield this.open(button, listItem);
            }
        });
        return this;
    }
    open(button, listItem) {
        return __awaiter(this, void 0, void 0, function* () {
            const rect = button.getBoundingClientRect();
            const x = rect.left + this.offsetX;
            const y = rect.bottom + this.offsetY;
            button.classList.add("selected");
            this.openListItem = listItem;
            yield Menu.Controller.open(listItem, x, y, true);
            this.openListItem = null;
            button.classList.remove("selected");
        });
    }
}
//# sourceMappingURL=menu.js.map