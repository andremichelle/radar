export declare class ListItemDefaultData {
    readonly label: string;
    readonly shortcut: string;
    readonly checked: boolean;
    constructor(label: string, shortcut?: string, checked?: boolean);
    toString(): string;
}
export declare class ListItem {
    readonly data: any;
    separatorBefore: boolean;
    selectable: boolean;
    private readonly permanentChildren;
    private readonly transientChildren;
    private transientChildrenCallback;
    private openingCallback;
    private triggerCallback;
    private isOpening;
    constructor(data: any);
    static root(): ListItem;
    static default(label: string, shortcut?: string, checked?: boolean): ListItem;
    addListItem(listItem: ListItem): ListItem;
    opening(): void;
    trigger(): void;
    isSelectable(value?: boolean): ListItem;
    addSeparatorBefore(): ListItem;
    addRuntimeChildrenCallback(callback: (parent: ListItem) => void): ListItem;
    onOpening(callback: (listItem: ListItem) => void): ListItem;
    onTrigger(callback: (listItem: ListItem) => void): ListItem;
    hasChildren(): boolean;
    collectChildren(): ListItem[];
    removeTransientChildren(): void;
}
declare class Controller {
    private readonly mouseDownHandler;
    private root;
    private layer;
    private onClose;
    constructor();
    open(listItem: ListItem, x: number, y: number, docked: boolean): Promise<void>;
    close(): void;
    onDispose(pullDown: any): void;
    shutdown(): void;
    iterateAll(callback: any): void;
    reduceAll(callback: any): number;
}
export declare class Menu {
    private listItem;
    static Controller: Controller;
    static Renderer: Map<any, (element: HTMLElement, data: any) => void>;
    childMenu: Menu;
    private element;
    private readonly container;
    private readonly scrollUp;
    private readonly scrollDown;
    private selectedDiv;
    private x;
    private y;
    constructor(listItem: ListItem, docked?: boolean);
    moveTo(x: any, y: any): void;
    attach(parentNode: Element, parentMenu?: Menu): void;
    dispose(): void;
    domElement(): HTMLElement;
    isChild(target: Node): boolean;
    private makeScrollable;
}
export declare class MenuBar {
    static install(): MenuBar;
    private offsetX;
    private offsetY;
    private openListItem;
    private constructor();
    offset(x: number, y: number): MenuBar;
    addButton(button: HTMLElement, listItem: ListItem): MenuBar;
    open(button: HTMLElement, listItem: ListItem): Promise<void>;
}
export {};
