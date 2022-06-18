var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { HTML } from "./lib/dom.js";
import { ListItem, MenuBar } from "./lib/menu.js";
const pickerOpts = {
    multiple: false,
    suggestedName: "radar",
    types: [{ description: "Radar Format", accept: { "json/*": [".json"] } }]
};
export const installMenu = (editor, pattern) => {
    MenuBar.install()
        .addButton(HTML.query('[data-menu=file]'), ListItem.root()
        .addRuntimeChildrenCallback(item => {
        item
            .addListItem(ListItem.default('Open', '⌘O')
            .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
            let fileHandles = null;
            try {
                fileHandles = yield window.showOpenFilePicker(pickerOpts);
            }
            catch (e) {
                return;
            }
            if (null === fileHandles || 0 === fileHandles.length) {
                return;
            }
            try {
                const fileStream = yield fileHandles[0].getFile();
                const text = yield fileStream.text();
                const format = yield JSON.parse(text);
                pattern.deserialize(format);
            }
            catch (e) {
                console.warn(e);
            }
        })))
            .addListItem(ListItem.default('Save', '⌘S')
            .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const fileSystemFileHandle = yield window.showSaveFilePicker(pickerOpts);
                const fileStream = yield fileSystemFileHandle.createWritable();
                yield fileStream.write(new Blob([JSON.stringify(pattern.serialize())], { type: "application/json" }));
                yield fileStream.close();
                console.debug('file saved.');
            }
            catch (e) {
                console.debug(e);
            }
        })))
            .addListItem(ListItem.default('Clear')
            .onTrigger(() => pattern.clearObstacles()))
            .addListItem(ListItem.default('Reset Origin')
            .onTrigger(() => pattern.resetOrigin()));
    }))
        .addButton(HTML.query('[data-menu=edit]'), ListItem.root()
        .addRuntimeChildrenCallback(item => {
        item
            .addListItem(ListItem.default('Delete', 'del')
            .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () { return editor.deleteSelection(); })));
    }))
        .addButton(HTML.query('[data-menu=loops]'), ListItem.root()
        .addRuntimeChildrenCallback(item => {
        item
            .addListItem(ListItem.default('Amen Break', '')
            .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
            return pattern.deserialize({
                file: 'amen.wav',
                origin: { x: 0.0, y: 0.0 },
                obstacles: [],
                bars: 2.0,
                bpm: 165.0
            });
        })))
            .addListItem(ListItem.default('80 Bell Minor', '')
            .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
            return pattern.deserialize({
                file: 'bell.wav',
                origin: { x: 0.0, y: 0.0 },
                obstacles: [],
                bars: 4.0,
                bpm: 165.0
            });
        })))
            .addListItem(ListItem.default("You Know You're Going to Feel it", '')
            .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
            return pattern.deserialize({
                file: 'voice.wav',
                origin: { x: 0.0, y: 0.0 },
                obstacles: [],
                bars: 1.0,
                bpm: 70.0
            });
        })))
            .addListItem(ListItem.default("Riemann Dub Techno", '')
            .onTrigger(() => __awaiter(void 0, void 0, void 0, function* () {
            return pattern.deserialize({
                file: 'riemann.wav',
                origin: { x: 0.0, y: 0.0 },
                obstacles: [],
                bars: 4.0,
                bpm: 125.0
            });
        })));
    }));
};
export const installShortcuts = (editor, pattern) => {
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            editor.cancelUserAction();
        }
    });
};
//# sourceMappingURL=menu.js.map