import { createExportGroup } from "./mazeGeometry.js?v=marker-large-gold";

const xml = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
}[c]));
const declaration = '<?xml version="1.0" encoding="UTF-8"?>';

// Small, uncompressed ZIP/OPC writer: no network, dependencies or ZIP64 needed.
const crcTable = Uint32Array.from({ length: 256 }, (_, n) => {
    for (let i = 0; i < 8; i++) n = (n >>> 1) ^ ((n & 1) ? 0xedb88320 : 0);
    return n >>> 0;
});
const zip = (files) => {
    const encoder = new TextEncoder();
    const locals = [], directory = [];
    let offset = 0, directorySize = 0;
    for (const [path, text] of files) {
        const name = encoder.encode(path), data = encoder.encode(text);
        let crc = 0xffffffff;
        for (const byte of data) crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 255];
        crc = (crc ^ 0xffffffff) >>> 0;
        const local = new Uint8Array(30 + name.length), lv = new DataView(local.buffer);
        lv.setUint32(0, 0x04034b50, true);
        lv.setUint16(4, 20, true);
        lv.setUint16(6, 0x800, true); // UTF-8; STORE compression method is zero.
        lv.setUint16(12, 33, true); // 1980-01-01, deterministic valid DOS date.
        lv.setUint32(14, crc, true);
        lv.setUint32(18, data.length, true);
        lv.setUint32(22, data.length, true);
        lv.setUint16(26, name.length, true);
        local.set(name, 30);
        const central = new Uint8Array(46 + name.length), cv = new DataView(central.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true);
        central.set(local.subarray(4, 30), 6);
        cv.setUint32(42, offset, true);
        central.set(name, 46);
        locals.push(local, data);
        directory.push(central);
        offset += local.length + data.length;
        directorySize += central.length;
    }
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, files.length, true);
    ev.setUint16(10, files.length, true);
    ev.setUint32(12, directorySize, true);
    ev.setUint32(16, offset, true);
    const result = new Uint8Array(offset + directorySize + end.length);
    let cursor = 0;
    for (const chunk of [...locals, ...directory, end]) {
        result.set(chunk, cursor);
        cursor += chunk.length;
    }
    return result;
};

export const exportMaze3MF = (mazeGroup, design) => {
    // Same clone and bed transform as STL, independent of the preview's rotation.
    // Clone geometry is shared: read only, never dispose or modify it here.
    const group = createExportGroup(mazeGroup, design);
    const names = ["Maze walls", "Tooth", "Outer ring", "Inner ring", "Tooth marker"];
    const parts = names.map((name) => ({ name, vertices: [], triangles: [], indices: new Map() }));
    const partForMesh = {
        "circumferential-wall": 0, "axial-wall": 0,
        "functional-key-tooth": 1,
        "key-sleeve": 2, "key-tooth-tactile-locator": 4,
        "inner-tube": 3,
    };
    group.traverse((mesh) => {
        if (!mesh.isMesh) return;
        const part = parts[partForMesh[mesh.name]];
        if (!part) throw new Error(`Unknown printable mesh: ${mesh.name}`);
        const geometry = mesh.geometry;
        const position = geometry.attributes && geometry.attributes.position;
        const count = geometry.vertices ? geometry.vertices.length : position.count;
        const indices = [];
        for (let i = 0; i < count; i++) {
            const point = geometry.vertices ? geometry.vertices[i].clone()
                : new THREE.Vector3().fromBufferAttribute(position, i);
            point.applyMatrix4(mesh.matrixWorld);
            if (![point.x, point.y, point.z].every(Number.isFinite)) {
                throw new Error("Cannot export non-finite geometry.");
            }
            const key = `${point.x},${point.y},${point.z}`;
            if (!part.indices.has(key)) {
                part.indices.set(key, part.vertices.length);
                part.vertices.push(`<vertex x="${point.x}" y="${point.y}" z="${point.z}"/>`);
            }
            indices.push(part.indices.get(key));
        }
        const triangle = (a, b, c) => part.triangles.push(
            `<triangle v1="${indices[a]}" v2="${indices[b]}" v3="${indices[c]}"/>`,
        );
        if (geometry.faces) geometry.faces.forEach((f) => triangle(f.a, f.b, f.c));
        else {
            const index = geometry.index;
            for (let i = 0; i < (index ? index.count : count); i += 3) {
                triangle(index ? index.getX(i) : i, index ? index.getX(i + 1) : i + 1,
                    index ? index.getX(i + 2) : i + 2);
            }
        }
    });
    if (parts.some((part) => !part.triangles.length)) throw new Error("Missing printable 3MF part.");
    const resources = parts.map((part, i) => `<object id="${i + 1}" type="model" name="${xml(part.name)}"><mesh><vertices>${part.vertices.join("")}</vertices><triangles>${part.triangles.join("")}</triangles></mesh></object>`).join("");
    const assemblyId = parts.length + 1;
    const model = `${declaration}<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02"><resources>${resources}<object id="${assemblyId}" type="model" name="A-Maze-Ring"><components>${parts.map((_, i) => `<component objectid="${i + 1}"/>`).join("")}</components></object></resources><build><item objectid="${assemblyId}"/></build></model>`;
    // Bambu's bbs_3mf.cpp uses part-id metadata for volume names; core names alone
    // can fall back to the assembly name. No filament/printer/project settings.
    const settings = `${declaration}<config><object id="${assemblyId}"><metadata key="name" value="A-Maze-Ring"/>${parts.map((part, i) => `<part id="${i + 1}" subtype="normal_part"><metadata key="name" value="${xml(part.name)}"/></part>`).join("")}</object></config>`;
    return zip([
        ["[Content_Types].xml", `${declaration}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/><Default Extension="config" ContentType="application/xml"/></Types>`],
        ["_rels/.rels", `${declaration}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel" Target="/3D/3dmodel.model"/></Relationships>`],
        ["3D/3dmodel.model", model],
        ["Metadata/model_settings.config", settings],
    ]);
};
