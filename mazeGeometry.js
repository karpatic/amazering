import {
    assertValidPrintDesign,
    getDerivedPrintDimensions,
} from "./printDesign.js";

const fullTurn = Math.PI * 2;

/** Pure SVG-grid to ring-coordinate mapping. */
export const getMazeGeometryPlan = (maze, design) => {
    const cellAngle = fullTurn / maze.columns;
    const cellLength = design.axialWidthMm / maze.rows;
    const horizontalWalls = [];
    const verticalWalls = [];

    for (let boundaryRow = 0; boundaryRow <= maze.rows; boundaryRow += 1) {
        for (let column = 0; column < maze.columns; column += 1) {
            let material = "gold";
            const isEntrance = boundaryRow === 0 && column === maze.entranceColumn;
            const isExit = boundaryRow === maze.rows && column === maze.exitColumn;

            if ((isEntrance || isExit) && design.geometryStyle !== "reference") {
                continue;
            }
            if (isEntrance) material = "entrance";
            if (isExit) material = "exit";
            if (!isEntrance && !isExit && !maze.horizontalWalls[boundaryRow][column]) {
                continue;
            }

            horizontalWalls.push({
                boundaryRow,
                column,
                material,
                startAngle: column * cellAngle,
                y: design.axialWidthMm / 2 - boundaryRow * cellLength,
            });
        }
    }

    for (let row = 0; row < maze.rows; row += 1) {
        for (let column = 0; column < maze.columns; column += 1) {
            if (!maze.verticalWalls[row][column]) continue;

            verticalWalls.push({
                row,
                column,
                angle: column * cellAngle,
                y: design.axialWidthMm / 2 - (row + 0.5) * cellLength,
            });
        }
    }

    return {
        cellAngle,
        cellLength,
        horizontalWalls,
        verticalWalls,
        keyPlacement: {
            baseY: -design.axialWidthMm / 2,
            centerY: -design.axialWidthMm / 2 + cellLength / 2,
            rotationY: (maze.exitColumn + 0.5) * cellAngle - Math.PI / 2,
        },
    };
};

export const createMazeMaterials = () => {
    const goldTexture = new THREE.TextureLoader().load("./gold.jpg");

    return {
        materials: {
            ring: new THREE.MeshPhongMaterial({ color: 0x202020 }),
            gold: new THREE.MeshPhongMaterial({ map: goldTexture }),
            entrance: new THREE.MeshPhongMaterial({ color: 0x00ff00 }),
            exit: new THREE.MeshPhongMaterial({ color: 0xff0000 }),
        },
        textures: [goldTexture],
    };
};

const createAnnularLatheGeometry = (
    innerRadius,
    outerRadius,
    baseY,
    topY,
    chamfer,
) => {
    const points = [
        new THREE.Vector2(innerRadius + chamfer, baseY),
        new THREE.Vector2(outerRadius - chamfer, baseY),
        new THREE.Vector2(outerRadius, baseY + chamfer),
        new THREE.Vector2(outerRadius, topY - chamfer),
        new THREE.Vector2(outerRadius - chamfer, topY),
        new THREE.Vector2(innerRadius + chamfer, topY),
        new THREE.Vector2(innerRadius, topY - chamfer),
        new THREE.Vector2(innerRadius, baseY + chamfer),
        new THREE.Vector2(innerRadius + chamfer, baseY),
    ];
    return new THREE.LatheGeometry(points, 64);
};

const createTube = (group, design, dimensions, material) => {
    let geometry;
    if (design.geometryStyle === "reference") {
        const ringShape = new THREE.Shape()
            .moveTo(dimensions.tubeOuterRadiusMm, 0)
            .absarc(0, 0, dimensions.tubeOuterRadiusMm, 0, fullTurn, false);

        ringShape.holes.push(
            new THREE.Path()
                .moveTo(dimensions.innerRadiusMm, 0)
                .absarc(0, 0, dimensions.innerRadiusMm, 0, fullTurn, true),
        );

        geometry = new THREE.ExtrudeGeometry(ringShape, {
            steps: 1,
            depth: design.axialWidthMm,
            bevelEnabled: false,
        });
        const tube = new THREE.Mesh(geometry, material);
        tube.name = "inner-tube";
        tube.position.y = design.axialWidthMm / 2;
        tube.rotation.x = Math.PI / 2;
        group.add(tube);
        return;
    }

    geometry = createAnnularLatheGeometry(
        dimensions.innerRadiusMm,
        dimensions.tubeOuterRadiusMm,
        -design.axialWidthMm / 2,
        design.axialWidthMm / 2,
        design.tubeEdgeChamferMm,
    );
    const tube = new THREE.Mesh(geometry, material);
    tube.name = "inner-tube";
    group.add(tube);
};

const createRoundedRectangleShape = (left, right, bottom, top, radius) => {
    const corner = Math.min(radius, (right - left) / 2, (top - bottom) / 2);
    const shape = new THREE.Shape();
    shape.moveTo(left + corner, bottom);
    shape.lineTo(right - corner, bottom);
    shape.quadraticCurveTo(right, bottom, right, bottom + corner);
    shape.lineTo(right, top - corner);
    shape.quadraticCurveTo(right, top, right - corner, top);
    shape.lineTo(left + corner, top);
    shape.quadraticCurveTo(left, top, left, top - corner);
    shape.lineTo(left, bottom + corner);
    shape.quadraticCurveTo(left, bottom, left + corner, bottom);
    return shape;
};

const createKey = (group, placement, design, dimensions, materials) => {
    const assembly = new THREE.Group();
    assembly.name = "outer-key";
    assembly.rotation.y = placement.rotationY;
    group.add(assembly);

    if (design.geometryStyle === "reference") {
        assembly.position.y = placement.centerY;
        const ringShape = new THREE.Shape()
            .moveTo(dimensions.keySleeveOuterRadiusMm, 0)
            .absarc(0, 0, dimensions.keySleeveOuterRadiusMm, 0, fullTurn, false);

        ringShape.holes.push(
            new THREE.Path()
                .moveTo(dimensions.keySleeveInnerRadiusMm, 0)
                .absarc(0, 0, dimensions.keySleeveInnerRadiusMm, 0, fullTurn, true),
        );

        const coverGeometry = new THREE.ExtrudeGeometry(ringShape, {
            steps: 1,
            depth: design.keySleeveAxialWidthMm,
            bevelEnabled: false,
        });
        const cover = new THREE.Mesh(coverGeometry, materials.ring);
        cover.name = "key-sleeve";
        cover.position.y = design.keySleeveAxialWidthMm / 2;
        cover.rotation.x = Math.PI / 2;
        assembly.add(cover);

        const tooth = new THREE.Mesh(
            new THREE.BoxGeometry(
                dimensions.keyToothOuterRadiusMm - dimensions.keyToothInnerRadiusMm,
                dimensions.keyToothAxialWidthMm,
                design.keyToothTangentialWidthMm,
            ),
            materials.gold,
        );
        tooth.name = "functional-key-tooth";
        tooth.position.x =
            (dimensions.keyToothInnerRadiusMm + dimensions.keyToothOuterRadiusMm) / 2;
        assembly.add(tooth);
        return;
    }

    const bandGeometry = createAnnularLatheGeometry(
        dimensions.keySleeveInnerRadiusMm,
        dimensions.keySleeveOuterRadiusMm,
        placement.baseY,
        placement.baseY + design.keySleeveAxialWidthMm,
        design.keySleeveEdgeChamferMm,
    );
    const band = new THREE.Mesh(bandGeometry, materials.ring);
    band.name = "key-sleeve";
    assembly.add(band);

    const toothShape = createRoundedRectangleShape(
        dimensions.keyToothInnerRadiusMm,
        dimensions.keyToothOuterRadiusMm,
        -design.keyToothTangentialWidthMm / 2,
        design.keyToothTangentialWidthMm / 2,
        design.keyToothCornerRadiusMm,
    );
    const toothGeometry = new THREE.ExtrudeGeometry(toothShape, {
        steps: 1,
        depth: dimensions.keyToothAxialWidthMm,
        bevelEnabled: false,
        curveSegments: 4,
    });
    toothGeometry.rotateX(Math.PI / 2);
    const tooth = new THREE.Mesh(toothGeometry, materials.gold);
    tooth.name = "functional-key-tooth";
    tooth.position.y = placement.baseY + dimensions.keyToothAxialWidthMm;
    assembly.add(tooth);
};

const roundedPolygonShape = (points, radius) => {
    const shape = new THREE.Shape();
    if (!radius) {
        shape.moveTo(points[0].x, points[0].y);
        points.slice(1).forEach((point) => shape.lineTo(point.x, point.y));
        shape.lineTo(points[0].x, points[0].y);
        return shape;
    }

    const corners = points.map((point, index) => {
        const previous = points[(index + points.length - 1) % points.length];
        const next = points[(index + 1) % points.length];
        const previousDistance = point.distanceTo(previous);
        const nextDistance = point.distanceTo(next);
        const offset = Math.min(radius, previousDistance / 3, nextDistance / 3);
        return {
            point,
            before: point.clone().add(
                previous.clone().sub(point).normalize().multiplyScalar(offset),
            ),
            after: point.clone().add(
                next.clone().sub(point).normalize().multiplyScalar(offset),
            ),
        };
    });

    shape.moveTo(corners[0].before.x, corners[0].before.y);
    corners.forEach((corner, index) => {
        if (index) shape.lineTo(corner.before.x, corner.before.y);
        shape.quadraticCurveTo(
            corner.point.x,
            corner.point.y,
            corner.after.x,
            corner.after.y,
        );
    });
    shape.lineTo(corners[0].before.x, corners[0].before.y);
    return shape;
};

const createCircumferentialWall = (wall, cellAngle, design, dimensions, material, maze) => {
    const attachedHalf = design.circumferentialWallAttachedThicknessMm / 2;
    const exposedHalf = design.circumferentialWallExposedThicknessMm / 2;
    const shape = roundedPolygonShape([
        new THREE.Vector2(-exposedHalf, 0),
        new THREE.Vector2(-attachedHalf, dimensions.wallRadialDepthMm),
        new THREE.Vector2(attachedHalf, dimensions.wallRadialDepthMm),
        new THREE.Vector2(exposedHalf, 0),
    ], design.wallProfileCornerRadiusMm);

    const curvePoints = [];
    const curveSegments = 8;
    for (let segment = 0; segment <= curveSegments; segment += 1) {
        const angle = wall.startAngle + cellAngle * (segment / curveSegments);
        curvePoints.push(new THREE.Vector3(
            dimensions.mazeOuterRadiusMm * Math.sin(angle),
            0,
            dimensions.mazeOuterRadiusMm * Math.cos(angle),
        ));
    }

    const geometry = new THREE.ExtrudeGeometry(shape, {
        steps: curveSegments,
        bevelEnabled: false,
        extrudePath: new THREE.CatmullRomCurve3(curvePoints),
        curveSegments: 2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "circumferential-wall";
    mesh.position.y = wall.y;

    if (design.geometryStyle !== "reference") {
        if (wall.boundaryRow === 0) mesh.position.y -= attachedHalf;
        if (wall.boundaryRow === maze.rows) mesh.position.y += attachedHalf;
    }
    return mesh;
};

const createAxialWall = (wall, design, dimensions, material) => {
    const shape = roundedPolygonShape([
        new THREE.Vector2(0, -design.axialWallExposedLengthMm / 2),
        new THREE.Vector2(
            dimensions.wallRadialDepthMm,
            -design.axialWallAttachedLengthMm / 2,
        ),
        new THREE.Vector2(
            dimensions.wallRadialDepthMm,
            design.axialWallAttachedLengthMm / 2,
        ),
        new THREE.Vector2(0, design.axialWallExposedLengthMm / 2),
    ], design.wallProfileCornerRadiusMm);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: design.axialWallPhysicalThicknessMm,
        steps: 1,
        bevelEnabled: false,
        curveSegments: 2,
    });
    if (design.geometryStyle !== "reference") {
        geometry.translate(0, 0, -design.axialWallPhysicalThicknessMm / 2);
    }
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "axial-wall";
    const referenceInset = design.geometryStyle === "reference" ? 0.01 : 0;
    const wallRadius = dimensions.mazeOuterRadiusMm - referenceInset;

    mesh.position.x = wallRadius * Math.sin(wall.angle);
    mesh.position.y = wall.y;
    mesh.position.z = wallRadius * Math.cos(wall.angle);
    mesh.rotation.y = wall.angle + Math.PI / 2;
    return mesh;
};

export const createMazeGroup = (maze, design, materials) => {
    const dimensions = assertValidPrintDesign(design, maze);
    const plan = getMazeGeometryPlan(maze, design);
    const group = new THREE.Group();
    const innerRing = new THREE.Group();
    innerRing.name = "inner-maze-ring";
    group.add(innerRing);

    createTube(innerRing, design, dimensions, materials.ring);
    plan.horizontalWalls.forEach((wall) => {
        innerRing.add(createCircumferentialWall(
            wall,
            plan.cellAngle,
            design,
            dimensions,
            materials[wall.material],
            maze,
        ));
    });
    plan.verticalWalls.forEach((wall) => {
        innerRing.add(createAxialWall(wall, design, dimensions, materials.gold));
    });
    createKey(group, plan.keyPlacement, design, dimensions, materials);

    group.userData.designId = design.id;
    return group;
};

export const createExportGroup = (mazeGroup, design) => {
    const exportGroup = mazeGroup.clone(true);
    exportGroup.position.set(0, 0, 0);
    exportGroup.rotation.set(0, 0, 0);
    exportGroup.updateMatrixWorld(true);

    if (design.exportMode === "bed-up-z") {
        exportGroup.rotation.x = Math.PI / 2;
        exportGroup.updateMatrixWorld(true);
        const bounds = new THREE.Box3().setFromObject(exportGroup);
        exportGroup.position.z -= bounds.min.z;
        exportGroup.updateMatrixWorld(true);
    }

    return exportGroup;
};

export const getPrintDimensions = (design, maze) =>
    getDerivedPrintDimensions(design, maze);

export const disposeMazeGroup = (group) => {
    const geometries = new Set();
    group.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
    });
    geometries.forEach((geometry) => geometry.dispose());
};
