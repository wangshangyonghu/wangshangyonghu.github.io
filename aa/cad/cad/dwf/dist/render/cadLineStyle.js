export function estimateMatrixScale(m) {
    const sx = Math.hypot(m.a, m.b);
    const sy = Math.hypot(m.c, m.d);
    return Math.max(1e-12, (sx + sy) * 0.5);
}
export function canvasDpr(canvas) {
    const rect = canvas.getBoundingClientRect?.();
    const cssW = rect && rect.width > 0 ? rect.width : Number(canvas.style.width?.replace('px', '')) || canvas.width;
    return Math.max(1, canvas.width / Math.max(1, cssW));
}
export function adaptiveStrokeUserWidth(sourceWidth, matrix, opts = {}, runtime) {
    const scale = estimateMatrixScale(matrix);
    const physicalDevicePx = Math.max(0, Math.abs(sourceWidth || 0) * scale);
    const mode = opts.lineWeightMode ?? 'adaptive';
    if (mode === 'physical')
        return Math.max(1e-6, Math.abs(sourceWidth || 1));
    const dpr = Math.max(1, runtime.dpr || 1);
    const minDevicePx = Math.max(0.25, (opts.minStrokeCssPx ?? 0.55) * dpr);
    if (mode === 'hairline')
        return minDevicePx / scale;
    const zoom = Math.max(0.05, runtime.zoom ?? 1);
    const overviewMaxCss = opts.maxOverviewStrokeCssPx ?? 1.15;
    // CAD drawing viewers typically keep overview lines as screen-space hairlines,
    // then allow line weights to grow as the user zooms in.  The cap grows with
    // zoom, but sub-line details never exceed a readable overview width.
    const adaptiveMaxCss = zoom <= 1
        ? overviewMaxCss
        : Math.min(24, overviewMaxCss * (1 + Math.log2(zoom) * 1.6));
    const maxDevicePx = Math.max(minDevicePx, adaptiveMaxCss * dpr);
    const targetDevicePx = Math.max(minDevicePx, Math.min(physicalDevicePx, maxDevicePx));
    return targetDevicePx / scale;
}
export function shouldDrawTextByPixelSize(fontSizeSourceUnits, matrix, opts = {}, runtime) {
    if ((opts.lineWeightMode ?? 'adaptive') === 'physical')
        return true;
    const dpr = Math.max(1, runtime.dpr || 1);
    const minCss = opts.minTextCssPx ?? 3.5;
    const devicePx = Math.abs(fontSizeSourceUnits * estimateMatrixScale(matrix));
    return devicePx >= minCss * dpr;
}
export function shouldDrawFilledBounds(bounds, matrix, opts = {}, runtime) {
    if (!bounds || (opts.lineWeightMode ?? 'adaptive') === 'physical')
        return true;
    const dpr = Math.max(1, runtime.dpr || 1);
    const minArea = Math.max(0, opts.minFilledAreaCssPx ?? 0.12) * dpr * dpr;
    if (minArea <= 0)
        return true;
    const p1 = transform(matrix, bounds.minX, bounds.minY);
    const p2 = transform(matrix, bounds.maxX, bounds.minY);
    const p3 = transform(matrix, bounds.maxX, bounds.maxY);
    const p4 = transform(matrix, bounds.minX, bounds.maxY);
    const xs = [p1[0], p2[0], p3[0], p4[0]];
    const ys = [p1[1], p2[1], p3[1], p4[1]];
    const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
    return area >= minArea;
}
function transform(m, x, y) {
    return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
}
