// Author: Codex app agent — 2026-09-12
// All relief is solid geometry. Engravings share the original sleeve reference,
// so overlapping cuts take their union, never accumulating radial depths.
export const DECORATION_DEFAULTS = Object.freeze({
    markerDepthMm: 0.4,
    bandCount: 2,
    bandStyle: "straight",
    bandWidthMm: 0.6,
    bandDepthMm: 0.25,
    bandWaveCount: 6,
    bandWaveAmplitudeMm: 0.35,
    sleeveText: "AMAZE",
    textSizeMm: 2.5,
    textDepthMm: 0.25,
});
export const decorationValues = (d) => ({ ...DECORATION_DEFAULTS, ...d });
export const decorationBounds = (d) => {
    d = decorationValues(d);
    const rim = d.rimWaveCount > 0 ? d.rimWaveHeightMm : 0;
    const usable = d.keySleeveAxialWidthMm - 2 * (rim + 0.65);
    const amplitude = d.bandStyle === "wavy" ? d.bandWaveAmplitudeMm : 0;
    const bandEnvelope = d.bandWidthMm + 2 * amplitude;
    const arcLimit =
        Math.PI *
        (d.boreDiameterMm / 2 +
            d.tubeWallThicknessMm +
            d.wallProjectionMm +
            d.keySleeveClearanceMm +
            d.keySleeveRadialThicknessMm) *
        0.8;
    const unitWidth = textMetrics(d.sleeveText, 1).width;
    return {
        arcLimit,
        bandWidthMax: Math.min(1.2, usable / 4 - 2 * amplitude),
        amplitudeMax: Math.min(0.8, (usable / 4 - d.bandWidthMm) / 2),
        textSizeMax: Math.min(
            4,
            unitWidth ? arcLimit / unitWidth : 4,
            d.bandCount === 2 ? usable - 2 * bandEnvelope - 0.8 : usable,
        ),
        usable,
        bandEnvelope,
    };
};
export const textMetrics = (text, size) => {
    const font = globalThis.decorationFont;
    if (!font) return { width: 0 };
    const shapes = font.generateShapes(text, size);
    const points = shapes.flatMap((s) => s.getPoints(6));
    return {
        shapes,
        width: points.length
            ? Math.max(...points.map((p) => p.x)) -
              Math.min(...points.map((p) => p.x))
            : 0,
    };
};
export const validateDecorations = (input) => {
    const d = decorationValues(input),
        b = decorationBounds(d),
        errors = [];
    for (const [key, label, min, max] of [
        ["markerDepthMm", "Marker depth", -0.2, 0.6],
        ["bandDepthMm", "Band depth", -0.2, 0.6],
        ["textDepthMm", "Text depth", -0.2, 0.6],
        ["bandWidthMm", "Line width", 0.4, b.bandWidthMax],
        ["bandWaveAmplitudeMm", "Line wave amplitude", 0, b.amplitudeMax],
        ["textSizeMm", "Text font size", 2, b.textSizeMax],
    ]) {
        if (key.startsWith("band") && !d.bandCount) continue;
        if (key === "bandWaveAmplitudeMm" && d.bandStyle !== "wavy") continue;
        if (
            key.startsWith("text") &&
            (d.bandCount === 1 || !d.sleeveText.trim())
        )
            continue;
        if (key === "markerDepthMm" && d.markerShape === "none") continue;
        if (
            !Number.isFinite(d[key]) ||
            d[key] < min - 1e-8 ||
            d[key] > max + 1e-8
        )
            errors.push(
                `${label}: use ${min}–${Math.max(min, max).toFixed(2)} mm; decorations must fit between the rims.`,
            );
    }
    if (![0, 1, 2].includes(d.bandCount))
        errors.push("Choose 0, 1 or 2 decorative bands.");
    if (!["straight", "wavy"].includes(d.bandStyle))
        errors.push("Choose straight or wavy lines.");
    if (
        d.bandCount &&
        d.bandStyle === "wavy" &&
        (!Number.isInteger(d.bandWaveCount) ||
            d.bandWaveCount < 1 ||
            d.bandWaveCount > 16)
    )
        errors.push("Use 1–16 whole line waves.");
    if (d.bandCount !== 1 && d.sleeveText.trim()) {
        if (!/^[A-Za-z0-9 .,!?'&-]{1,24}$/.test(d.sleeveText))
            errors.push(
                "Text supports 1–24 Latin letters, digits, spaces and . , ! ? apostrophe & -",
            );
        const maxWidth =
            Math.PI *
            (d.boreDiameterMm / 2 +
                d.tubeWallThicknessMm +
                d.wallProjectionMm +
                d.keySleeveClearanceMm +
                d.keySleeveRadialThicknessMm) *
            0.8;
        if (textMetrics(d.sleeveText, d.textSizeMm).width > maxWidth)
            errors.push(
                `Text exceeds the ${maxWidth.toFixed(1)} mm arc limit. Shorten it or reduce font size.`,
            );
    }
    return errors;
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
    const indices = [],
        seen = new Map();
    for (let i = 0; i < mesh.vertProperties.length; i += mesh.numProp) {
        const xyz = Array.from(mesh.vertProperties.slice(i, i + 3)),
            key = xyz.map((v) => Math.round(v * 1e6)).join(",");
        if (!seen.has(key)) {
            seen.set(key, g.vertices.length);
            g.vertices.push(new THREE.Vector3(...xyz));
        }
        indices.push(seen.get(key));
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
        bounds = decorationBounds(d),
        ro = dimensions.keySleeveOuterRadiusMm;
    const center = baseY + d.keySleeveAxialWidthMm / 2;
    const anyRelief =
        (d.markerShape !== "none" && d.markerDepthMm) ||
        (d.bandCount && d.bandDepthMm) ||
        (d.bandCount !== 1 && d.sleeveText.trim() && d.textDepthMm);
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
            const centers =
                d.bandCount === 1
                    ? [0]
                    : [
                          -(bounds.usable - bounds.bandEnvelope) / 2,
                          (bounds.usable - bounds.bandEnvelope) / 2,
                      ];
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
                              Math.sin(d.bandWaveCount * theta)
                            : 0);
                    for (const [dr, dy] of [
                        [
                            d.bandDepthMm > 0 ? -0.15 : d.bandDepthMm,
                            -d.bandWidthMm / 2,
                        ],
                        [
                            d.bandDepthMm > 0 ? d.bandDepthMm : 0.16,
                            -d.bandWidthMm / 2,
                        ],
                        [
                            d.bandDepthMm > 0 ? d.bandDepthMm : 0.16,
                            d.bandWidthMm / 2,
                        ],
                        [
                            d.bandDepthMm > 0 ? -0.15 : d.bandDepthMm,
                            d.bandWidthMm / 2,
                        ],
                    ])
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
        if (d.bandCount !== 1 && d.sleeveText.trim() && d.textDepthMm) {
            const { shapes } = textMetrics(d.sleeveText, d.textSizeMm);
            const g = new THREE.ShapeGeometry(shapes);
            g.computeBoundingBox();
            const mid = g.boundingBox.getCenter(new THREE.Vector3());
            g.dispose();
            // Shift the font contours, including counters, before wrapping.
            const centered = shapes.map((s) => {
                const pts = s.extractPoints(8);
                const shape = polygonShape(
                    pts.shape.map((p) => [p.x - mid.x, p.y - mid.y]),
                );
                shape.holes = pts.holes.map(
                    (h) =>
                        new THREE.Path(
                            h.map(
                                (p) =>
                                    new THREE.Vector2(p.x - mid.x, p.y - mid.y),
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
