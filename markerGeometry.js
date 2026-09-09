export const MARKER_SHAPES = Object.freeze([
    { id: "dot", name: "Rounded dot" },
    { id: "pill", name: "Pill" },
    { id: "rounded-square", name: "Rounded square" },
    { id: "heart", name: "Heart" },
    { id: "cross", name: "Cross" },
    { id: "x", name: "X" },
    { id: "cat-head", name: "Cat head" },
    { id: "flower", name: "Flower" },
    { id: "star", name: "Rounded star" },
]);

const createSymbolGeometry = (symbol) => {
    const outline = new THREE.Shape();
    if (symbol === "heart") {
        // Round both the bottom tip and the notch; neither is an offset cusp.
        outline.moveTo(0, -0.95);
        outline.bezierCurveTo(-0.18, -0.95, -1, -0.05, -1, 0.45);
        outline.bezierCurveTo(-1, 1, -0.45, 1.05, -0.15, 0.65);
        outline.bezierCurveTo(-0.05, 0.52, 0.05, 0.52, 0.15, 0.65);
        outline.bezierCurveTo(0.45, 1.05, 1, 1, 1, 0.45);
        outline.bezierCurveTo(1, -0.05, 0.18, -0.95, 0, -0.95);
    } else if (symbol === "flower") {
        // A single broad five-petal contour, without a detached center.
        const count = 100;
        for (let i = 0; i < count; i++) {
            const angle = Math.PI / 2 + i * 2 * Math.PI / count;
            const radius = 0.82 + 0.18 * Math.cos(5 * (angle - Math.PI / 2));
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            if (i) outline.lineTo(x, y);
            else outline.moveTo(x, y);
        }
    } else {
        let points;
        let rounding = 0.12;
        if (symbol === "cat-head") {
            // Broad cheeks and softly rounded ears; no fragile eyes or whiskers.
            points = [[0, -0.85], [0.65, -0.75], [1, -0.25], [0.85, 0.3],
                [0.8, 1], [0.35, 0.65], [-0.35, 0.65], [-0.8, 1],
                [-0.85, 0.3], [-1, -0.25], [-0.65, -0.75]];
            rounding = 0.18;
        } else if (symbol === "star") {
            points = Array.from({ length: 10 }, (_, i) => {
                const angle = Math.PI / 2 + i * Math.PI / 5;
                const radius = i % 2 ? 0.53 : 1;
                return [radius * Math.cos(angle), radius * Math.sin(angle)];
            });
            rounding = 0.16;
        } else if (symbol === "x") {
            // Rotate an equal-arm Greek cross, not the asymmetric Latin cross.
            points = [[-0.28, -1], [0.28, -1], [0.28, -0.28], [1, -0.28],
                [1, 0.28], [0.28, 0.28], [0.28, 1], [-0.28, 1],
                [-0.28, 0.28], [-1, 0.28], [-1, -0.28], [-0.28, -0.28]]
                .map(([x, y]) => [(x - y) / Math.SQRT2, (x + y) / Math.SQRT2]);
        } else {
            points = [[-0.25, -1], [0.25, -1], [0.25, 0.2], [0.85, 0.2],
                [0.85, 0.65], [0.25, 0.65], [0.25, 1], [-0.25, 1],
                [-0.25, 0.65], [-0.85, 0.65], [-0.85, 0.2], [-0.25, 0.2]];
        }
        points.forEach(([x, y], index) => {
            const previous = points[(index + points.length - 1) % points.length];
            const next = points[(index + 1) % points.length];
            // Limit both cuts together so short edges cannot reverse or overlap.
            const cut = Math.min(rounding,
                0.4 * Math.hypot(previous[0] - x, previous[1] - y),
                0.4 * Math.hypot(next[0] - x, next[1] - y));
            const toward = ([a, b]) => {
                const scale = cut / Math.hypot(a - x, b - y);
                return [x + (a - x) * scale, y + (b - y) * scale];
            };
            const start = toward(previous);
            if (index) outline.lineTo(...start);
            else outline.moveTo(...start);
            outline.quadraticCurveTo(x, y, ...toward(next));
        });
    }
    outline.closePath();
    const geometry = new THREE.ExtrudeGeometry(outline, {
        depth: 1.6, steps: 1, curveSegments: 12,
        // Keep the contour offset below the rounded concave-corner radius.
        bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.025, bevelSegments: 3,
    });
    geometry.computeBoundingBox();
    const center = geometry.boundingBox.getCenter(new THREE.Vector3());
    const half = geometry.boundingBox.getSize(new THREE.Vector3()).multiplyScalar(0.5);
    geometry.vertices.forEach((vertex) => {
        const tangent = (vertex.x - center.x) / half.x;
        const height = (vertex.y - center.y) / half.y;
        const depth = (vertex.z - center.z) / half.z;
        vertex.set(depth, height, tangent);
    });
    // Swapping extrusion X/Z reflects the mesh (negative determinant).
    // Reverse winding and its UV order before recomputing outward normals.
    geometry.faces.forEach((face) => { [face.b, face.c] = [face.c, face.b]; });
    geometry.faceVertexUvs.forEach((layer) => layer.forEach((uv) => {
        [uv[1], uv[2]] = [uv[2], uv[1]];
    }));
    geometry.mergeVertices();
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    return geometry;
};

// Unit geometry: the sleeve applies the existing radial scale and placement.
export const createMarkerGeometry = (shape = "dot") => {
    if (!MARKER_SHAPES.some((option) => option.id === shape)) {
        throw new RangeError("Choose a supported tooth marker shape.");
    }
    if (shape !== "dot" && shape !== "pill" && shape !== "rounded-square") {
        return createSymbolGeometry(shape);
    }
    const geometry = new THREE.SphereGeometry(1, 32, 24);
    if (shape === "dot") return geometry;

    geometry.vertices.forEach((vertex) => {
        if (shape === "pill") {
            vertex.y *= 1.25;
            vertex.z *= 0.7;
        } else {
            const radius = Math.hypot(vertex.y, vertex.z);
            if (!radius) return;
            const y = vertex.y / radius;
            const z = vertex.z / radius;
            const scale = 1 / Math.pow(y ** 4 + z ** 4, 0.25);
            vertex.y *= scale;
            vertex.z *= scale;
        }
    });
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    return geometry;
};
