import { Events, HTMLRadioGroup, NumericStepper, ObservableValueImpl, Options, PrintMapping, TerminableVoid, Terminator } from "../../lib/common.js";
import { UIControllerLayout } from "../../lib/controls.js";
import { HTML } from "../../lib/dom.js";
import { TAU } from "../../lib/math.js";
import { ArcObstacle, CurveObstacle, LineObstacle } from "./obstacles.js";
import { Ray } from "./ray.js";
import { Renderer } from "./render.js";
import { snapAngle, snapLength } from "./utils.js";
export class Editor {
    constructor(element, pattern, position) {
        this.element = element;
        this.pattern = pattern;
        this.position = position;
        this.canvas = HTML.query('canvas', this.element);
        this.context = this.canvas.getContext('2d');
        this.angleResolution = new ObservableValueImpl(64);
        this.distanceResolution = new ObservableValueImpl(24);
        this.tool = Options.None;
        this.toolCursor = Options.None;
        this.waveform = Options.None;
        this.selection = [];
        this.update = () => {
            const position = this.position();
            const canvas = this.canvas;
            const context = this.context;
            const clientWidth = canvas.clientWidth;
            const clientHeight = canvas.clientHeight;
            canvas.width = clientWidth * devicePixelRatio;
            canvas.height = clientHeight * devicePixelRatio;
            context.save();
            context.scale(devicePixelRatio, devicePixelRatio);
            context.translate(clientWidth / 2, clientHeight / 2);
            this.waveform.ifPresent(bitmap => context.drawImage(bitmap, -Editor.Radius, -Editor.Radius, Editor.Size, Editor.Size));
            context.lineWidth = 0.0;
            Renderer.renderRadarInside(context, this.angleResolution.get(), this.distanceResolution.get());
            const origin = this.pattern.getOrigin();
            Renderer.renderRayOrigin(context, origin);
            const ray = Editor.Ray.reuse(position * TAU, origin.x, origin.y);
            Renderer.renderObstacles(context, this.pattern, this.selection);
            Renderer.renderRayTrail(context, this.pattern, ray);
            Renderer.renderWaveformPosition(context, ray.angle(), Editor.WaveformWidth);
            this.toolCursor.ifPresent(point => Renderer.renderCursor(context, point));
            context.restore();
            requestAnimationFrame(this.update);
        };
        const toolGroup = new HTMLRadioGroup(HTML.query('[data-component=tools]', this.element), 'tool');
        toolGroup.addObserver(tool => {
            this.tool.ifPresent(tool => tool.terminate());
            this.tool = Options.valueOf(this.switchTool(tool));
        }, true);
        {
            const layout = new UIControllerLayout(HTML.query('[data-component=pattern]', this.element));
            layout
                .createNumericStepper('Bpm', PrintMapping.INTEGER, NumericStepper.Integer)
                .with(pattern.getBpm());
            layout
                .createNumericStepper('Bar', PrintMapping.INTEGER, NumericStepper.Integer)
                .with(pattern.getBars());
        }
        {
            const layout = new UIControllerLayout(HTML.query('[data-component=snapping]', this.element));
            layout
                .createNumericStepper('Snap position', PrintMapping.INTEGER, NumericStepper.Integer)
                .with(this.angleResolution);
            layout
                .createNumericStepper('Snap distance', PrintMapping.INTEGER, NumericStepper.Integer)
                .with(this.distanceResolution);
        }
        requestAnimationFrame(this.update);
    }
    cancelUserAction() {
    }
    globalToLocal(x, y) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (x - rect.left - rect.width / 2) / Renderer.Radius,
            y: (y - rect.top - rect.height / 2) / Renderer.Radius
        };
    }
    snap(local, constrainToCircle = false) {
        const l = snapLength(Math.sqrt(local.x * local.x + local.y * local.y), this.distanceResolution.get());
        const d = constrainToCircle ? Math.min(1.0, l) : l;
        const a = snapAngle(Math.atan2(local.y, local.x), this.angleResolution.get());
        return {
            x: Math.cos(a) * d,
            y: Math.sin(a) * d
        };
    }
    showAudioBuffer(buffer) {
        this.waveform = buffer === null
            ? Options.None
            : Options.valueOf(Renderer.renderWaveform(buffer, Editor.Size * devicePixelRatio, Editor.WaveformWidth));
    }
    deleteSelection() {
        for (const obstacle of this.selection.splice(0, this.selection.length)) {
            this.pattern.removeObstacle(obstacle);
        }
    }
    installMoveTool() {
        return Events.bindEventListener(this.canvas, 'pointerdown', (event) => {
            const { x, y } = this.globalToLocal(event.clientX, event.clientY);
            const handler = this.closestDragHandler(x, y);
            if (handler !== null) {
                if (handler.obstacle !== null) {
                    this.selection.splice(0, this.selection.length, handler.obstacle);
                }
                this.startDragging(event, (event) => {
                    const local = this.snap(this.globalToLocal(event.clientX, event.clientY), handler.constrainToCircle());
                    handler.moveTo(local.x, local.y);
                });
            }
            else {
                const obstacle = this.closestObstacle(x, y);
                if (event.shiftKey) {
                    this.selection.push(obstacle);
                }
                else {
                    this.selection.splice(0, this.selection.length, obstacle);
                }
            }
        });
    }
    installCreateTool(factory, move) {
        const terminator = new Terminator();
        terminator.with(Events.bindEventListener(this.canvas, 'pointermove', (event) => {
            const local = this.snap(this.globalToLocal(event.clientX, event.clientY), true);
            if (this.toolCursor.isEmpty()) {
                this.toolCursor = Options.valueOf(local);
            }
            else {
                const cursor = this.toolCursor.get();
                cursor.x = local.x;
                cursor.y = local.y;
            }
        }));
        terminator.with({ terminate: () => this.toolCursor = Options.None });
        terminator.with(Events.bindEventListener(this.canvas, 'pointerdown', (event) => {
            const { x: x0, y: y0 } = this.snap(this.globalToLocal(event.clientX, event.clientY), false);
            if (x0 * x0 + y0 * y0 > 1.0) {
                return;
            }
            const obstacle = factory(this.pattern, x0, y0);
            this.pattern.addObstacle(obstacle);
            this.startDragging(event, (event) => {
                const local = this.snap(this.globalToLocal(event.clientX, event.clientY), true);
                move(obstacle, x0, y0, local.x, local.y);
            });
        }));
        return terminator;
    }
    switchTool(tool) {
        console.debug(`switchTool(${tool})`);
        switch (tool) {
            case 'move':
                return this.installMoveTool();
            case 'line':
                return this.installCreateTool((pattern, x0, y0) => new LineObstacle(pattern).set(x0, y0, x0, y0), (obstacle, x0, y0, x1, y1) => obstacle.set(x0, y0, x1, y1));
            case 'arc':
                return this.installCreateTool((pattern, x0, y0) => new ArcObstacle(pattern).set(x0, y0, x0, y0, 0.0), (obstacle, x0, y0, x1, y1) => obstacle.set(x0, y0, x1, y1, 0.0));
            case 'curve':
                return this.installCreateTool((pattern, x0, y0) => new CurveObstacle(pattern).set(x0, y0, x0, y0, x0, y0), (obstacle, x0, y0, x1, y1) => obstacle.set(x0, y0, (x0 + x1) / 2.0, (y0 + y1) / 2.0, x1, y1));
            default:
                return TerminableVoid;
        }
    }
    startDragging(event, move) {
        this.canvas.setPointerCapture(event.pointerId);
        this.canvas.addEventListener('pointermove', move);
        this.canvas.addEventListener('pointerup', () => this.canvas.removeEventListener('pointermove', move), { once: true });
    }
    closestObstacle(x, y) {
        return this.pattern
            .getObstacles()
            .reduce((prev, next) => {
            const distance = next.distance(x, y);
            return prev === null
                ? distance < Editor.CaptureRadius
                    ? next : null : distance < prev.distance(x, y)
                ? next : prev;
        }, null);
    }
    closestDragHandler(x, y) {
        return this.pattern
            .getObstacles()
            .flatMap(obstacle => obstacle.dragHandlers)
            .concat(this.pattern.dragHandlers)
            .reduce((prev, next) => {
            const distance = next.distance(x, y);
            return prev === null
                ? distance < Editor.CaptureRadius
                    ? next : null : distance < prev.distance(x, y)
                ? next : prev;
        }, null);
    }
}
Editor.Ray = new Ray();
Editor.WaveformWidth = 64;
Editor.Radius = Renderer.Radius + Editor.WaveformWidth;
Editor.Size = Editor.Radius << 1;
Editor.CaptureRadius = 8.0 / Renderer.Radius;
//# sourceMappingURL=editor.js.map