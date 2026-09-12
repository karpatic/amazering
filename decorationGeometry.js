// Author: Codex app agent — 2026-09-12
// All relief is solid geometry. Engravings share the original sleeve reference,
// so overlapping cuts take their union, never accumulating radial depths.
export const DECORATION_DEFAULTS = Object.freeze({
    markerDepthMm: 1,
    bandCount: 4,
    bandStyle: "wavy",
    bandWidthMm: 0.6,
    bandDepthMm: 0.15,
    bandWaveCount: 6,
    bandWaveAlignmentDeg: 0,
    bandWaveAmplitudeMm: 1,
    bandPairSpacingMm: 1.4,
    // null follows H/4 as the physical height changes; explicit values are mm.
    bandDistanceMm: null,
    sleeveText: "A - MAZE - RING",
    sleeveTextSecond: "",
    textSizeMm: 2.5,
    textDepthMm: -0.2,
});
export const decorationValues = (d) => ({ ...DECORATION_DEFAULTS, ...d });
export const hasCenterBand = (d) => [1, 3, 5].includes(d.bandCount);
export const bandCenters = (input) => {
    const d = decorationValues(input), h = d.keySleeveAxialWidthMm;
    const distance = d.bandDistanceMm ?? h / 4, halfPair = d.bandPairSpacingMm / 2;
    switch (d.bandCount) {
        case 0: return [];
        case 1: return [0];
        case 2: return [-distance, distance];
        case 3: return [-h / 3, 0, h / 3];
        case 4: return [-distance-halfPair, -distance+halfPair, distance-halfPair, distance+halfPair];
        case 5: return [-distance-halfPair, -distance+halfPair, 0, distance-halfPair, distance+halfPair];
        default: return [];
    }
};
export const textLines = (input) => {
    const d = decorationValues(input);
    if (!hasCenterBand(d)) return [{text:d.sleeveText, offset:0}];
    const neighbors = bandCenters(d).filter(v => v > 0);
    const offset = neighbors.length ? Math.min(...neighbors) / 2 : d.keySleeveAxialWidthMm / 4;
    return [{text:d.sleeveText, offset}, {text:d.sleeveTextSecond, offset:-offset}];
};
export const textMetrics = (text, size) => {
    const font = globalThis.decorationFont;
    if (!font) return { width: 0, height: 0 };
    const shapes = font.generateShapes(text, size);
    const points = shapes.flatMap((s) => s.getPoints(6));
    return { shapes,
        width: points.length ? Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)) : 0,
        height: points.length ? Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)) : 0,
    };
};
export const decorationBounds = (input) => {
    const d = decorationValues(input);
    const rim = d.rimWaveCount > 0 ? d.rimWaveHeightMm : 0;
    return {
        arcLimit: 2 * Math.PI * (d.boreDiameterMm/2 + d.tubeWallThicknessMm + d.wallProjectionMm + d.keySleeveClearanceMm + d.keySleeveRadialThicknessMm),
        usable: d.keySleeveAxialWidthMm - 2*(rim + .65),
        bandEnvelope: d.bandWidthMm + 2*(d.bandStyle === 'wavy' ? d.bandWaveAmplitudeMm : 0),
    };
};
export const validateDecorations = (input) => {
    const d = decorationValues(input), errors = [];
    for (const [key, label, min, max] of [
        ['markerDepthMm','Marker depth',-.2,1], ['bandDepthMm','Band depth',-.2,1],
        ['textDepthMm','Text depth',-.2,1], ['bandWidthMm','Line width',.4,3],
        ['bandWaveAmplitudeMm','Line waviness',0,3], ['textSizeMm','Font size',.5,10],
        ['bandPairSpacingMm','Pair spacing',.1,20], ['bandDistanceMm','Distance from center',0,20],
    ]) {
        if (key.startsWith('band') && !d.bandCount) continue;
        if (key==='bandPairSpacingMm' && ![4,5].includes(d.bandCount)) continue;
        if (key==='bandDistanceMm' && (![2,4,5].includes(d.bandCount) || d[key]===null)) continue;
        if (key==='bandWaveAmplitudeMm' && d.bandStyle!=='wavy') continue;
        if (key==='markerDepthMm' && d.markerShape==='none') continue;
        if (!Number.isFinite(d[key]) || d[key]<min || d[key]>max) errors.push(`${label}: use ${min}–${max} mm.`);
    }
    if (![0,1,2,3,4,5].includes(d.bandCount)) errors.push('Choose 0–5 whole decorative bands.');
    if (!['straight','wavy'].includes(d.bandStyle)) errors.push('Choose straight or wavy lines.');
    if (d.bandCount && d.bandStyle==='wavy' && (!Number.isInteger(d.bandWaveCount) || d.bandWaveCount<1 || d.bandWaveCount>16)) errors.push('Use 1–16 whole line waves.');
    if (d.bandCount && d.bandStyle==='wavy' && (!Number.isFinite(d.bandWaveAlignmentDeg) || d.bandWaveAlignmentDeg<0 || d.bandWaveAlignmentDeg>360)) errors.push('Wave alignment: use 0–360 degrees of one wave cycle.');
    for (const {text} of textLines(d)) {
        if (typeof text!=='string' || !/^[A-Za-z0-9 .,!?'&-]{0,96}$/.test(text)) errors.push('Each text line supports up to 96 Latin letters, digits, spaces and . , ! ? apostrophe & -');
    }
    return errors;
};
// Nominal layout recommendations never change requested geometry or block export.
export const decorationWarnings = (input) => {
    const d=decorationValues(input), b=decorationBounds(d), warnings=[];
    if (validateDecorations(d).length) return warnings;
    const centers=bandCenters(d).sort((a,b)=>a-b);
    if (d.bandDepthMm && centers.some(c=>Math.abs(c)+b.bandEnvelope/2>b.usable/2)) warnings.push('Decorative bands approach or extend past the rim margin. Inspect their attachment and overhangs; requested dimensions are retained.');
    if (d.bandDepthMm && centers.some((c,i)=>i && c-centers[i-1]<d.bandWidthMm+.2)) warnings.push('Decorative bands overlap or leave less than 0.2 mm between lines. Increase center-to-center spacing for distinct printed bands.');
    for (const [i,line] of textLines(d).entries()) {
        if (!line.text.trim() || !d.textDepthMm) continue;
        const m=textMetrics(line.text,d.textSizeMm), label=hasCenterBand(d)?`Text line ${i+1}`:'Text';
        if (m.width>b.arcLimit*.9) warnings.push(`${label} spans ${m.width.toFixed(1)} mm around a ${b.arcLimit.toFixed(1)} mm circumference; it may meet itself or the marker. Requested font size is retained.`);
        if (Math.abs(line.offset)+m.height/2>b.usable/2 || (d.bandDepthMm && centers.some(c=>Math.abs(c-line.offset)<(b.bandEnvelope+m.height)/2+.2))) warnings.push(`${label} approaches the bands or rim margin at ${d.textSizeMm} mm font size. Inspect the overlap; font size is unchanged.`);
        if (d.textSizeMm<3) warnings.push(`${label}: fine bold strokes and counters may be lost with a 0.4 mm nozzle. Review sliced lettering.`);
    }
    return warnings;
};
export const solidFromGeometry = (geometry) => {
    const { Manifold, Mesh } = globalThis.decorationKernel;
    const g = geometry.clone();
    g.mergeVertices();
    const result = new Manifold(
        new Mesh({
            numProp: 3,
            vertProperties: Float32Array.from(
                g.vertices.flatMap((v) => [v.x, v.y, v.z]),
            ),
            triVerts: Uint32Array.from(g.faces.flatMap((f) => [f.a, f.b, f.c])),
        }),
    );
    g.dispose();
    if (result.status() !== "NoError") {
        result.delete();
        throw Error("Decoration source is not a closed solid.");
    }
    return result;
};
const geometryFromSolid = (solid) => {
    if (solid.status() !== "NoError" || solid.isEmpty())
        throw Error("Decoration Boolean failed; export is paused.");
    const mesh = solid.getMesh(),
        g = new THREE.Geometry();
    // Float32 output can collapse distinct Boolean intersections to exactly
    // identical points or sub-micron edges. Weld at 0.000001 mm and omit
    // only collapsed faces; then verify the resulting closed, oriented mesh.
    const indices = [], cells = new Map(), weldMm = 1e-6;
    for (let i = 0; i < mesh.vertProperties.length; i += mesh.numProp) {
        const xyz = Array.from(mesh.vertProperties.slice(i, i + 3));
        const cell = xyz.map(v => Math.floor(v / weldMm));
        let index;
        // Search adjacent cells: rounding alone misses almost identical points
        // on opposite sides of a cell boundary after Float32 conversion.
        for (let dx = -1; dx <= 1; dx++)
            for (let dy = -1; dy <= 1; dy++)
                for (let dz = -1; dz <= 1; dz++) {
                    const nearby = cells.get([cell[0]+dx, cell[1]+dy, cell[2]+dz].join(',')) || [];
                    for (const candidate of nearby) {
                        const v = g.vertices[candidate];
                        if (Math.hypot(v.x-xyz[0], v.y-xyz[1], v.z-xyz[2]) <= weldMm &&
                            (index === undefined || candidate < index)) index = candidate;
                    }
                }
        if (index === undefined) {
            index = g.vertices.length;
            g.vertices.push(new THREE.Vector3(...xyz));
            const key = cell.join(','), bucket = cells.get(key) || [];
            bucket.push(index);
            cells.set(key, bucket);
        }
        indices.push(index);
    }
    for (let i = 0; i < mesh.triVerts.length; i += 3) {
        const [a, b, c] = Array.from(
            mesh.triVerts.slice(i, i + 3),
            (v) => indices[v],
        );
        if (a !== b && b !== c && c !== a)
            g.faces.push(new THREE.Face3(a, b, c));
    }
    const edges = new Map();
    for (const f of g.faces) {
        const [a, b, c] = [f.a, f.b, f.c].map((i) => g.vertices[i]);
        if (
            ![a, b, c].every((v) => [v.x, v.y, v.z].every(Number.isFinite)) ||
            b.clone().sub(a).cross(c.clone().sub(a)).lengthSq() < 4e-24
        )
            throw Error(
                "Decoration has a collapsed triangle; adjust its dimensions.",
            );
        for (const [u, v] of [
            [f.a, f.b],
            [f.b, f.c],
            [f.c, f.a],
        ]) {
            const key = u < v ? `${u},${v}` : `${v},${u}`,
                e = edges.get(key) || [0, 0];
            e[0]++;
            e[1] += u < v ? 1 : -1;
            edges.set(key, e);
        }
    }
    if ([...edges.values()].some((e) => e[0] !== 2 || e[1] !== 0))
        throw Error("Decoration mesh is not closed; adjust its dimensions.");
    g.computeFaceNormals();
    g.computeVertexNormals();
    return g;
};
const polygonShape = (points) => {
    const s = new THREE.Shape(points.map((p) => new THREE.Vector2(...p)));
    s.closePath();
    return s;
};
// Silhouettes use the existing marker's actual outline, including rounded curves.
import { createMarkerGeometry } from "./markerGeometry.js?v=decorations";
const markerContours = new Map();
const markerShape = (name) => {
    if (markerContours.has(name))
        return markerContours.get(name).map((p) => polygonShape(p));
    const g = createMarkerGeometry(name);
    // Projected triangles are unioned in 2D, preserving concave silhouettes.
    const { CrossSection } = globalThis.decorationKernel;
    const triangles = g.faces.map((f) =>
        [f.a, f.b, f.c].map((i) => [
            g.vertices[i].z * 1.8,
            g.vertices[i].y * 1.8,
        ]),
    );
    const sections = triangles
        .filter(
            (t) =>
                Math.abs(
                    (t[1][0] - t[0][0]) * (t[2][1] - t[0][1]) -
                        (t[2][0] - t[0][0]) * (t[1][1] - t[0][1]),
                ) > 1e-8,
        )
        .map((t) => new CrossSection([t], "EvenOdd"));
    const union = CrossSection.union(sections);
    const polygons = union.toPolygons();
    sections.forEach((s) => s.delete());
    union.delete();
    g.dispose();
    markerContours.set(name, polygons);
    return polygons.map((p) => polygonShape(p));
};
export const decorateSleeve = (
    band,
    assembly,
    input,
    dimensions,
    baseY,
    materials,
) => {
    const d = decorationValues(input),
        ro = dimensions.keySleeveOuterRadiusMm;
    const center = baseY + d.keySleeveAxialWidthMm / 2;
    const anyRelief =
        (d.markerShape !== "none" && d.markerDepthMm) ||
        (d.bandCount && d.bandDepthMm) ||
        (textLines(d).some(line => line.text.trim()) && d.textDepthMm);
    if (!anyRelief) return;
    const resources = [];
    const keep = (s) => {
        resources.push(s);
        return s;
    };
    const { Manifold } = globalThis.decorationKernel;
    try {
        let sleeve = keep(solidFromGeometry(band.geometry));
        const raised = [],
            cuts = [];
        const radialActive = d.outerWaveCount > 0 && d.outerWaveHeightMm > 0;
        const step = radialActive
            ? Math.min(0.22, (ro * 2 * Math.PI) / (d.outerWaveCount * 48))
            : 0.22;
        const relief = (shapes, depth, angle, name) => {
            if (!depth || !shapes.length) return;
            const g = new THREE.ExtrudeGeometry(shapes, {
                depth: Math.abs(depth) + (depth > 0 ? 0.15 : 0.16),
                bevelEnabled: false,
                curveSegments: 8,
                steps: 1,
            });
            const raw = keep(solidFromGeometry(g));
            g.dispose();
            const refined = keep(raw.refineToLength(step));
            const solid = keep(
                refined.warp((v) => {
                    const theta = angle - v[0] / ro;
                    const a =
                        (((Math.PI / 2 - theta) % (2 * Math.PI)) +
                            2 * Math.PI) %
                        (2 * Math.PI);
                    const scale =
                        Math.cos(Math.PI / 64) /
                        Math.cos((a % ((2 * Math.PI) / 64)) - Math.PI / 64);
                    const surface = radialActive
                        ? ro +
                          (d.outerWaveHeightMm *
                              (1 - Math.cos(d.outerWaveCount * theta))) /
                              2
                        : ro * scale;
                    const radius = surface + (depth > 0 ? -0.15 : depth) + v[2];
                    v[0] = radius * Math.cos(theta);
                    v[1] += center;
                    v[2] = radius * Math.sin(theta);
                }),
            );
            if (depth < 0) cuts.push(solid);
            else raised.push({ solid, name });
        };
        if (d.markerShape !== "none" && d.markerDepthMm)
            relief(
                markerShape(d.markerShape),
                d.markerDepthMm,
                0,
                "key-tooth-tactile-locator",
            );
        if (d.bandCount && d.bandDepthMm) {
            // Use a closed radial sweep, avoiding a warped full-circle seam.
            const segments = Math.max(
                256,
                d.outerWaveCount * 48,
                d.bandWaveCount * 32,
            );
            const centers = bandCenters(d);
            for (const offset of centers) {
                const g = new THREE.Geometry();
                for (let i = 0; i < segments; i++) {
                    const theta = (i * 2 * Math.PI) / segments;
                    const a =
                        (((Math.PI / 2 - theta) % (2 * Math.PI)) +
                            2 * Math.PI) %
                        (2 * Math.PI);
                    const scale =
                        Math.cos(Math.PI / 64) /
                        Math.cos((a % ((2 * Math.PI) / 64)) - Math.PI / 64);
                    const surface = radialActive
                        ? ro +
                          (d.outerWaveHeightMm *
                              (1 - Math.cos(d.outerWaveCount * theta))) /
                              2
                        : ro * scale;
                    const y =
                        center +
                        offset +
                        (d.bandStyle === "wavy"
                            ? d.bandWaveAmplitudeMm *
                              Math.sin(d.bandWaveCount * theta + (d.bandWaveAlignmentDeg % 360) * Math.PI / 180)
                            : 0);
                    // Extend the taper through the embedded root so the width at
                    // the sleeve surface is exactly the requested line width.
                    // Both axial sides taper: export maps model Y to bed-up Z.
                    // Negative depth retains the original rectangular cutter.
                    const half = d.bandWidthMm / 2;
                    const tipHalf = Math.min(0.05, half / 3);
                    const embed = Math.min(0.15, Math.abs(d.bandDepthMm));
                    const rootHalf = half + embed * (half - tipHalf) / d.bandDepthMm;
                    const section = d.bandDepthMm > 0
                        ? [[-embed, -rootHalf], [d.bandDepthMm, -tipHalf],
                           [d.bandDepthMm, tipHalf], [-embed, rootHalf]]
                        : [[d.bandDepthMm, -half], [0.16, -half],
                           [0.16, half], [d.bandDepthMm, half]];
                    for (const [dr, dy] of section)
                        g.vertices.push(
                            new THREE.Vector3(
                                (surface + dr) * Math.cos(theta),
                                y + dy,
                                (surface + dr) * Math.sin(theta),
                            ),
                        );
                }
                for (let i = 0; i < segments; i++)
                    for (let j = 0; j < 4; j++) {
                        const a = i * 4 + j,
                            b = ((i + 1) % segments) * 4 + j,
                            c = ((i + 1) % segments) * 4 + ((j + 1) % 4),
                            e = i * 4 + ((j + 1) % 4);
                        g.faces.push(
                            new THREE.Face3(a, c, b),
                            new THREE.Face3(a, e, c),
                        );
                    }
                const solid = keep(solidFromGeometry(g));
                g.dispose();
                if (d.bandDepthMm < 0) cuts.push(solid);
                else raised.push({ solid, name: "decorative-bands" });
            }
        }
        for (const line of textLines(d)) {
            if (!line.text.trim() || !d.textDepthMm) continue;
            const { shapes } = textMetrics(line.text, d.textSizeMm);
            const g = new THREE.ShapeGeometry(shapes);
            g.computeBoundingBox();
            const mid = g.boundingBox.getCenter(new THREE.Vector3());
            g.dispose();
            // Shift the font contours, including counters, before wrapping.
            const centered = shapes.map((s) => {
                const pts = s.extractPoints(8);
                const shape = polygonShape(
                    pts.shape.map((p) => [p.x - mid.x, p.y - mid.y + line.offset]),
                );
                shape.holes = pts.holes.map(
                    (h) =>
                        new THREE.Path(
                            h.map(
                                (p) =>
                                    new THREE.Vector2(p.x - mid.x, p.y - mid.y + line.offset),
                            ),
                        ),
                );
                return shape;
            });
            relief(centered, d.textDepthMm, Math.PI, "sleeve-lettering");
        }
        if (cuts.length) {
            const union = keep(Manifold.union(cuts));
            // Nominal 0.55 mm floor (>0.54 mm including cylinder faceting).
            const protect = keep(
                Manifold.cylinder(
                    d.keySleeveAxialWidthMm + 2,
                    dimensions.keySleeveInnerRadiusMm + 0.55,
                    dimensions.keySleeveInnerRadiusMm + 0.55,
                    256,
                )
                    .rotate([90, 0, 0])
                    .translate([0, baseY + d.keySleeveAxialWidthMm + 1, 0]),
            );
            const bounded = keep(union.subtract(protect));
            sleeve = keep(sleeve.subtract(bounded));
        }
        // Preserve a real embedded attachment, as with the existing tooth.
        // Multipart filament ownership of these overlaps is reviewed in the slicer.
        for (const { solid, name } of raised) {
            const attached = keep(solid.intersect(sleeve));
            if (attached.isEmpty() || attached.volume() < 0.005)
                throw Error(
                    "A raised decoration has insufficient sleeve attachment.",
                );
            const mesh = new THREE.Mesh(
                geometryFromSolid(solid),
                materials.gold,
            );
            mesh.name = name;
            assembly.add(mesh);
        }
        band.geometry.dispose();
        band.geometry = geometryFromSolid(keep(sleeve.simplify(0.0001)));
    } finally {
        resources.reverse().forEach((s) => s.delete());
    }
};
