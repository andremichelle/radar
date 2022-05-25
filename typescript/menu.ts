import {Pattern, PatternFormat} from "./audio/radar/pattern.js"
import {HTML} from "./lib/dom.js"
import {ListItem, MenuBar} from "./lib/menu.js"

const pickerOpts: PickerOptions = {
    multiple: false,
    suggestedName: "radar",
    types: [{description: "Radar Format", accept: {"json/*": [".json"]}}]
}

export const installMenu = (pattern: Pattern): void => {
    MenuBar.install().addButton(HTML.query('[data-menu=file]'), ListItem.root()
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

}