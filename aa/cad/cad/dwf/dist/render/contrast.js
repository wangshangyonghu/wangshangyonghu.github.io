import { parseBrushColor } from './style.js';
const pageCache = new WeakMap();
function rgba(source) {
    const parsed = parseBrushColor(source);
    const match = parsed?.match(/^rgba?\(([^)]+)\)$/i);
    if (!match)
        return undefined;
    const values = match[1].split(',').map(Number);
    if (values.length < 3 || !values.every(Number.isFinite))
        return undefined;
    return [values[0], values[1], values[2], values[3] ?? 1];
}
function luminance(rgb) {
    return rgb.slice(0, 3).reduce((sum, channel, index) => {
        const value = Math.max(0, Math.min(255, channel)) / 255;
        const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
        return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
}
/** Adjusts only colors too close to the background, retaining alpha and hue. */
export function adaptiveContrastColor(source, options) {
    if (options.contrastMode !== 'adaptive')
        return source;
    const color = rgba(source);
    const background = rgba(options.background ?? '#ffffff');
    if (!color || !background || color[3] === 0)
        return source;
    const bg = luminance(background);
    const contrast = (rgb) => {
        const value = luminance(rgb);
        return (Math.max(value, bg) + 0.05) / (Math.min(value, bg) + 0.05);
    };
    const requested = options.minColorContrast ?? 2.4;
    const minimum = Number.isFinite(requested) ? Math.max(1, Math.min(21, requested)) : 2.4;
    if (contrast(color) >= minimum)
        return source;
    const target = (1.05 / (bg + 0.05)) >= ((bg + 0.05) / 0.05) ? 255 : 0;
    const mix = (ratio) => color.slice(0, 3).map(channel => Math.round(channel + (target - channel) * ratio));
    let low = 0, high = 1;
    for (let step = 0; step < 16; step++) {
        const middle = (low + high) / 2;
        if (contrast(mix(middle)) >= minimum)
            high = middle;
        else
            low = middle;
    }
    return `rgba(${mix(high).join(', ')}, ${color[3]})`;
}
export function contrastPolicyKey(options) {
    return JSON.stringify([options.contrastMode ?? 'preserve', options.background ?? '#ffffff', options.minColorContrast ?? 2.4]);
}
export function createContrastPage(page, options) {
    if (page.kind !== 'w2d-text' || options.contrastMode !== 'adaptive')
        return page;
    const key = contrastPolicyKey(options);
    let policies = pageCache.get(page);
    if (!policies)
        pageCache.set(page, policies = new Map());
    const cached = policies.get(key);
    if (cached)
        return cached;
    const transformed = {
        ...page,
        primitives: page.primitives.map((primitive) => {
            const next = { ...primitive };
            if (primitive.stroke !== undefined)
                next.stroke = adaptiveContrastColor(primitive.stroke, options);
            if (primitive.fill !== undefined)
                next.fill = adaptiveContrastColor(primitive.fill, options);
            if (primitive.type === 'polygon' && next.type === 'polygon' && primitive.vertexColors) {
                next.vertexColors = primitive.vertexColors.map(color => adaptiveContrastColor(color, options));
            }
            if (primitive.type === 'polyline' && primitive.stroke === undefined)
                next.stroke = adaptiveContrastColor('#000000', options);
            if (primitive.type === 'text' && primitive.fill === undefined && primitive.stroke === undefined)
                next.fill = adaptiveContrastColor('#000000', options);
            return next;
        })
    };
    // Background pickers can emit many colors; keep per-document cache bounded.
    if (policies.size >= 8)
        policies.delete(policies.keys().next().value);
    policies.set(key, transformed);
    return transformed;
}
export function applyXpsContrastXml(xml, options) {
    if (options.contrastMode !== 'adaptive')
        return xml;
    return xml.replace(/(\b(?:Fill|Stroke|Color)\s*=\s*)(["'])([^"']*)\2/gi, (match, prefix, quote, source) => {
        const color = adaptiveContrastColor(source, options);
        return color === source ? match : `${prefix}${quote}${color}${quote}`;
    });
}
