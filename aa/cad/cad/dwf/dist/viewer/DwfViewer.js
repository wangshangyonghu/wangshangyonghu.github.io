import { DwfViewer as BaseDwfViewer } from './DwfViewerBase.js';
import { applyXpsContrastXml, contrastPolicyKey, createContrastPage } from '../render/contrast.js';
import { applyXpsMonochromeXml, createMonochromePage, normalizeMonochromeColor } from '../render/monochrome.js';
/**
 * Adds a non-destructive monochrome plot-style view on top of the native DWF
 * renderer. The parsed document remains source-colored for metadata consumers.
 */
export class DwfViewer extends BaseDwfViewer {
    constructor(container, options = {}) {
        super(container, options);
        this.monochromeColor = normalizeMonochromeColor(options.monochromeColor);
        this.contrastOptions = { contrastMode: options.contrastMode, minColorContrast: options.minColorContrast };
    }
    async load(input, options = {}) {
        if (Object.prototype.hasOwnProperty.call(options, 'monochromeColor')) {
            this.updateMonochromeColor(options.monochromeColor, false);
        }
        if (options.contrastMode !== undefined)
            this.contrastOptions.contrastMode = options.contrastMode;
        if (options.minColorContrast !== undefined)
            this.contrastOptions.minColorContrast = options.minColorContrast;
        await super.load(input, options);
    }
    /** Switches between source colors (undefined) and a fixed plot color. */
    setMonochromeColor(value) {
        this.updateMonochromeColor(value, true);
    }
    getMonochromeColor() {
        return this.monochromeColor;
    }
    setContrastOptions(options) {
        this.contrastOptions = { ...this.contrastOptions, ...options };
        this.requestRender();
    }
    async render() {
        const internals = this;
        // Let the base viewer coalesce a concurrent request. Mutating pageData while
        // an existing render is active would otherwise make cache invalidation race.
        if (internals.rendering)
            return super.render();
        const renderer = internals.renderer;
        const color = this.monochromeColor;
        const contrast = { ...this.contrastOptions, background: internals.background };
        const policy = color || contrastPolicyKey(contrast);
        if (renderer) {
            if (this.preparedRenderer === renderer && this.preparedColor !== policy) {
                renderer.dispose();
            }
            this.preparedRenderer = renderer;
            this.preparedColor = policy;
        }
        const doc = internals.doc;
        const pageIndex = internals.pageIndex;
        const sourcePage = doc?.pageData[pageIndex];
        if ((!color && contrast.contrastMode !== 'adaptive') || !doc || !sourcePage)
            return super.render();
        const renderedPage = color ? createMonochromePage(sourcePage, color) : createContrastPage(sourcePage, contrast);
        doc.pageData[pageIndex] = renderedPage;
        const opc = doc.opc;
        const sourceReadText = opc?.readText;
        if (opc && sourceReadText) {
            opc.readText = async (path) => {
                const xml = await sourceReadText.call(opc, path);
                return color ? applyXpsMonochromeXml(xml, color) : applyXpsContrastXml(xml, contrast);
            };
        }
        try {
            return await super.render();
        }
        finally {
            if (doc.pageData[pageIndex] === renderedPage)
                doc.pageData[pageIndex] = sourcePage;
            if (opc && sourceReadText)
                opc.readText = sourceReadText;
        }
    }
    dispose() {
        this.preparedRenderer = undefined;
        this.preparedColor = undefined;
        super.dispose();
    }
    updateMonochromeColor(value, requestRender) {
        const normalized = normalizeMonochromeColor(value);
        if (normalized === this.monochromeColor)
            return;
        this.monochromeColor = normalized;
        if (requestRender)
            this.requestRender();
    }
}
