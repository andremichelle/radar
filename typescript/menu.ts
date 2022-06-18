import {Editor} from "./audio/radar/editor.js"
import {Pattern, PatternFormat} from "./audio/radar/pattern.js"
import {HTML} from "./lib/dom.js"
import {ListItem, MenuBar} from "./lib/menu.js"

const pickerOpts: PickerOptions = {
    multiple: false,
    suggestedName: "radar",
    types: [{description: "Radar Format", accept: {"json/*": [".json"]}}]
}

export const installMenu = (editor: Editor, pattern: Pattern): void => {
    MenuBar.install()
        .addButton(HTML.query('[data-menu=file]'), ListItem.root()
            .addRuntimeChildrenCallback(item => {
                item
                    .addListItem(ListItem.default('Open', '⌘O')
                        .onTrigger(async () => {
                            let fileHandles: FileSystemFileHandle[] = null
                            try {
                                fileHandles = await window.showOpenFilePicker(pickerOpts)
                            } catch (e) {
                                return
                            }
                            if (null === fileHandles || 0 === fileHandles.length) {
                                return
                            }
                            try {
                                const fileStream = await fileHandles[0].getFile()
                                const text: string = await fileStream.text()
                                const format = await JSON.parse(text) as PatternFormat
                                pattern.deserialize(format)
                            } catch (e) {
                                console.warn(e)
                            }
                        }))
                    .addListItem(ListItem.default('Save', '⌘S')
                        .onTrigger(async () => {
                            try {
                                const fileSystemFileHandle = await window.showSaveFilePicker(pickerOpts)
                                const fileStream = await fileSystemFileHandle.createWritable()
                                await fileStream.write(new Blob([JSON.stringify(pattern.serialize())], {type: "application/json"}))
                                await fileStream.close()
                                console.debug('file saved.')
                            } catch (e) {
                                console.debug(e)
                            }
                        }))
                    .addListItem(ListItem.default('Clear')
                        .onTrigger(() => pattern.clearObstacles()))
                    .addListItem(ListItem.default('Reset Origin')
                        .onTrigger(() => pattern.resetOrigin()))
            }))
        .addButton(HTML.query('[data-menu=edit]'), ListItem.root()
            .addRuntimeChildrenCallback(item => {
                item
                    .addListItem(ListItem.default('Delete', 'del')
                        .onTrigger(async () => editor.deleteSelection()))
            }))
        .addButton(HTML.query('[data-menu=loops]'), ListItem.root()
            .addRuntimeChildrenCallback(item => {
                item
                    .addListItem(ListItem.default('Amen Break', '')
                        .onTrigger(async () => pattern.deserialize({
                            file: 'amen.wav',
                            origin: {x: 0.0, y: 0.0},
                            obstacles: [],
                            bars: 2.0,
                            bpm: 165.0
                        })))
                    .addListItem(ListItem.default('80 Bell Minor', '')
                        .onTrigger(async () => pattern.deserialize({
                            file: 'bell.wav',
                            origin: {x: 0.0, y: 0.0},
                            obstacles: [],
                            bars: 4.0,
                            bpm: 165.0
                        })))
                    .addListItem(ListItem.default("You Know You're Going to Feel it", '')
                        .onTrigger(async () => pattern.deserialize({
                            file: 'voice.wav',
                            origin: {x: 0.0, y: 0.0},
                            obstacles: [],
                            bars: 1.0,
                            bpm: 70.0
                        })))
                    .addListItem(ListItem.default("Riemann Dub Techno", '')
                        .onTrigger(async () => pattern.deserialize({
                            file: 'riemann.wav',
                            origin: {x: 0.0, y: 0.0},
                            obstacles: [],
                            bars: 4.0,
                            bpm: 125.0
                        })))
            }))

}

export const installShortcuts = (editor: Editor, pattern: Pattern): void => {
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            editor.cancelUserAction()
        }
    })
}