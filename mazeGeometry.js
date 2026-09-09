import {
    assertValidPrintDesign,
    CIRCUMFERENTIAL_WALL_CURVE_SEGMENTS,
    getDerivedPrintDimensions,
    getMazeBoundaryHeightMm,
    getKeyStartPlacement,
    getKeyToothProfile,
} from "./printDesign.js?v=marker-large-gold";

import { createMarkerGeometry } from "./markerGeometry.js?v=marker-large-gold";

const fullTurn = Math.PI * 2;
const wallProfileCurveSegments = 2;

const wrapColumn = (column, columnCount) =>
    (column + columnCount) % columnCount;

const mergeCircumferentialWallsAtThroughJunctions = (
    horizontalWalls,
    rowCount,
    columnCount,
) => {
    const runs = [];
    for (let boundaryRow = 0; boundaryRow <= rowCount; boundaryRow += 1) {
        const rowWalls = horizontalWalls
            .filter((wall) => wall.boundaryRow === boundaryRow)
            .sort((left, right) => left.column - right.column);
        const wallByColumn = new Map(
            rowWalls.map((wall) => [wall.column, wall]),
        );
        const visited = new Set();
        const starts = rowWalls.filter((wall) => !wall.startThrough);
        if (!starts.length && rowWalls.length) starts.push(rowWalls[0]);

        starts.forEach((start) => {
            if (visited.has(start.column)) return;
            const members = [];
            let current = start;
            while (current && !visited.has(current.column)) {
                members.push(current);
                visited.add(current.column);
                if (!current.endThrough) break;
                const next = wallByColumn.get(
                    wrapColumn(current.column + 1, columnCount),
                );
                if (!next
                        || !next.startThrough
                        || next.material !== start.material) {
                    break;
                }
                current = next;
            }

            const last = members[members.length - 1];
            const isFullThroughCycle = members.length === columnCount
                && start.startThrough
                && last.endThrough;
            runs.push({
                ...start,
                cellSpan: members.length,
                columns: members.map((wall) => wall.column),
                startThrough: isFullThroughCycle ? false : start.startThrough,
                endJoined: last.endJoined,
                endThrough: isFullThroughCycle ? false : last.endThrough,
            });
        });
    }
    return runs;
};

/** Pure SVG-grid to ring-coordinate mapping. */
export const getMazeGeometryPlan = (maze, design) => {
    const cellAngle = fullTurn / maze.columns;
    const dimensions = getDerivedPrintDimensions(design, maze);
    const cellLength = dimensions.cellAxialLengthMm;
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
                y: -design.axialWidthMm / 2
                    + getMazeBoundaryHeightMm(design, maze, dimensions, boundaryRow),
            });
        }
    }

    const horizontalWallKeys = new Set(horizontalWalls.map((wall) =>
        `${wall.boundaryRow}:${wall.column}`));
    const hasHorizontalWallAtVertex = (boundaryRow, column) =>
        horizontalWallKeys.has(
            `${boundaryRow}:${wrapColumn(column - 1, maze.columns)}`,
        ) || horizontalWallKeys.has(
            `${boundaryRow}:${wrapColumn(column, maze.columns)}`,
        );
    const hasHorizontalWallThroughVertex = (boundaryRow, column) =>
        horizontalWallKeys.has(
            `${boundaryRow}:${wrapColumn(column - 1, maze.columns)}`,
        ) && horizontalWallKeys.has(
            `${boundaryRow}:${wrapColumn(column, maze.columns)}`,
        );
    const hasAxialWallAtVertex = (boundaryRow, column) => {
        const wrappedColumn = wrapColumn(column, maze.columns);
        return (boundaryRow > 0
                && maze.verticalWalls[boundaryRow - 1][wrappedColumn])
            || (boundaryRow < maze.rows
                && maze.verticalWalls[boundaryRow][wrappedColumn]);
    };

    if (design.geometryStyle !== "reference") {
        horizontalWalls.forEach((wall) => {
            wall.startJoined = hasAxialWallAtVertex(
                wall.boundaryRow,
                wall.column,
            );
            wall.endJoined = hasAxialWallAtVertex(
                wall.boundaryRow,
                wall.column + 1,
            );
            wall.startThrough = wall.startJoined
                && hasHorizontalWallThroughVertex(
                    wall.boundaryRow,
                    wall.column,
                );
            wall.endThrough = wall.endJoined
                && hasHorizontalWallThroughVertex(
                    wall.boundaryRow,
                    wall.column + 1,
                );
        });
    }
    const circumferentialWalls = design.geometryStyle === "reference"
        ? horizontalWalls
        : mergeCircumferentialWallsAtThroughJunctions(
            horizontalWalls,
            maze.rows,
            maze.columns,
        );

    // Join touching axial segments, keeping the taper only at a run's ends.
    // Do not bridge missing walls or profiles whose attached ends do not meet.
    const joinAxialWalls = design.geometryStyle !== "reference"
        && dimensions.axialWallAttachedLengthMm >= cellLength - 0.000001;
    for (let column = 0; column < maze.columns; column += 1) {
        for (let row = 0; row < maze.rows; row += 1) {
            if (!maze.verticalWalls[row][column]) continue;

            const firstRow = row;
            if (joinAxialWalls) {
                while (row + 1 < maze.rows && maze.verticalWalls[row + 1][column]) {
                    row += 1;
                }
            }
            verticalWalls.push({
                row: firstRow,
                lastRow: row,
                column,
                extensionMm: (row - firstRow) * cellLength,
                angle: column * cellAngle,
                y: design.axialWidthMm / 2
                    - (firstRow + row + 1) * cellLength / 2,
                upperJoined: design.geometryStyle !== "reference"
                    && hasHorizontalWallAtVertex(firstRow, column),
                lowerJoined: design.geometryStyle !== "reference"
                    && hasHorizontalWallAtVertex(row + 1, column),
            });
        }
    }

    const keyStart = getKeyStartPlacement(design, maze, dimensions);
    return {
        cellAngle,
        cellLength,
        horizontalWalls,
        circumferentialWalls,
        verticalWalls,
        keyPlacement: {
            ...keyStart,
            baseY: -design.axialWidthMm / 2,
            centerY: -design.axialWidthMm / 2 + cellLength / 2,
            rotationY: (keyStart.column + 0.5) * cellAngle - Math.PI / 2,
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

    const profile = getKeyToothProfile(design, dimensions);
    const centerMm = dimensions.keyToothAxialCenterFromBedMm;
    const shape = roundedPolygonShape([
        new THREE.Vector2(profile.innerMm, profile.tipBottomMm - centerMm),
        // Embedded sleeve junctions stay full height; exposed profile edges soften.
        setCornerRadius(new THREE.Vector2(profile.outerMm, profile.bottomMm - centerMm), 0),
        setCornerRadius(new THREE.Vector2(profile.outerMm, profile.topMm - centerMm), 0),
        new THREE.Vector2(profile.innerMm, profile.topMm - centerMm),
    ], profile.cornerMm);
    const widthMm = dimensions.keyToothBaseDiameterMm;
    const toothGeometry = new THREE.ExtrudeGeometry(shape, {
        depth: widthMm, steps: profile.sweepSegments, bevelEnabled: false,
        curveSegments: 4,
    });
    // Sweep a single closed ramped section around the tube axis. Relieve the
    // two angular ends inside the same solid, rather than adding support shells.
    toothGeometry.vertices.forEach((vertex) => {
        const fraction = vertex.z / widthMm;
        const angle = (2 * fraction - 1) * profile.angularHalf;
        const endWeight = Math.max(0, 1 - Math.min(fraction, 1 - fraction)
            * profile.sweepSegments);
        const scale = 1 - profile.endReliefFraction * endWeight;
        const radialCenter = (profile.innerMm + profile.outerMm) / 2;
        const radius = (radialCenter + (vertex.x - radialCenter) * scale)
            * profile.facetScale;
        vertex.set(radius * Math.cos(angle), vertex.y * scale, radius * Math.sin(angle));
    });
    toothGeometry.mergeVertices();
    toothGeometry.computeFaceNormals();
    toothGeometry.computeVertexNormals();
    const tooth = new THREE.Mesh(toothGeometry, materials.gold);
    tooth.position.y = placement.baseY + centerMm;
    tooth.name = "functional-key-tooth";
    assembly.add(tooth);

    // A low rounded locator on the outside, directly behind the working tooth.
    // Embed the ellipsoid in the sleeve without entering its running clearance.
    const locator = new THREE.Mesh(createMarkerGeometry(design.markerShape), materials.gold);
    locator.name = "key-tooth-tactile-locator";
    locator.scale.set(0.45, 1.8, 1.8);
    locator.position.set(
        dimensions.keySleeveOuterRadiusMm - 0.05,
        tooth.position.y,
        0,
    );
    assembly.add(locator);

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
        const cornerRadius = point.cornerRadiusMm ?? radius;
        const offset = Math.min(
            cornerRadius,
            previousDistance / 3,
            nextDistance / 3,
        );
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

const setCornerRadius = (point, cornerRadiusMm) => {
    point.cornerRadiusMm = cornerRadiusMm;
    return point;
};

const getComfortCircumferentialProfile = (design, dimensions) => {
    const exposedHalf = design.circumferentialWallExposedThicknessMm / 2;
    const lowerAttached = -exposedHalf - design.wallProjectionMm;
    const upperAttached = lowerAttached
        + design.circumferentialWallAttachedThicknessMm;
    const tubeLower = new THREE.Vector2(
        -lowerAttached,
        design.wallProjectionMm,
    );
    tubeLower.cornerRadiusMm = 0;
    return {
        lowerOffset: lowerAttached,
        upperOffset: exposedHalf,
        points: [
            new THREE.Vector2(-exposedHalf, 0),
            new THREE.Vector2(
                -upperAttached,
                design.wallProjectionMm,
            ),
            new THREE.Vector2(
                -upperAttached,
                dimensions.wallRadialDepthMm,
            ),
            new THREE.Vector2(
                -lowerAttached,
                dimensions.wallRadialDepthMm,
            ),
            tubeLower,
            new THREE.Vector2(exposedHalf, 0),
        ],
    };
};

const getProfileOffsetAtDepth = (points, radius, radialDepth, lower = false) => {
    const outline = roundedPolygonShape(points, radius)
        .extractPoints(wallProfileCurveSegments).shape;
    const crossings = [];
    outline.forEach((point, index) => {
        const next = outline[(index + 1) % outline.length];
        if (Math.abs(next.y - point.y) < 0.0000001) {
            if (Math.abs(radialDepth - point.y) < 0.0000001) {
                crossings.push(point.x, next.x);
            }
            return;
        }
        const fraction = (radialDepth - point.y) / (next.y - point.y);
        if (fraction < -0.0000001 || fraction > 1.0000001) return;
        crossings.push(point.x + fraction * (next.x - point.x));
    });
    if (!crossings.length) return null;
    // ExtrudePath maps profile X opposite the ring's axial direction.
    return lower ? -Math.max(...crossings) : -Math.min(...crossings);
};

const finishCircumferentialJunctions = (
    geometry,
    wall,
    curve,
    cellAngle,
    design,
) => {
    if (!wall.startJoined && !wall.endJoined) return;

    const wallAngle = cellAngle * (wall.cellSpan || 1);

    // ExtrudePath's end frames are slightly chord-oriented. Select the original
    // cap plane with those frames, then move each cap point along the exact
    // grid-line tangent to the axial slab's far face for overlap. Two-arm
    // crossings were merged into continuous runs above, so only actual run ends
    // retain this cap treatment.
    const endpointData = [
        {
            point: curve.getPointAt(0),
            tangent: curve.getTangentAt(0),
            joined: wall.startJoined,
            angle: wall.startAngle,
            farFaceMm: -design.axialWallPhysicalThicknessMm / 2,
        },
        {
            point: curve.getPointAt(1),
            tangent: curve.getTangentAt(1),
            joined: wall.endJoined,
            angle: wall.startAngle + wallAngle,
            farFaceMm: design.axialWallPhysicalThicknessMm / 2,
        },
    ];

    geometry.vertices.forEach((vertex) => {
        endpointData.forEach(({ point, tangent, joined, angle, farFaceMm }) => {
            if (!joined) return;
            const distanceFromCap = vertex.clone().sub(point).dot(tangent);
            if (Math.abs(distanceFromCap) > 0.00001) return;

            const axialTangent = new THREE.Vector3(
                Math.cos(angle),
                0,
                -Math.sin(angle),
            );
            vertex.addScaledVector(
                axialTangent,
                farFaceMm - vertex.dot(axialTangent),
            );
        });
    });
    geometry.verticesNeedUpdate = true;
    geometry.computeFaceNormals();
    geometry.computeVertexNormals();
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
};

const createCircumferentialWall = (wall, cellAngle, design, dimensions, material, maze) => {
    const attachedHalf = design.circumferentialWallAttachedThicknessMm / 2;
    const exposedHalf = design.circumferentialWallExposedThicknessMm / 2;
    let profilePoints;
    if (design.geometryStyle === "reference") {
        profilePoints = [
            new THREE.Vector2(-exposedHalf, 0),
            new THREE.Vector2(-attachedHalf, dimensions.wallRadialDepthMm),
            new THREE.Vector2(attachedHalf, dimensions.wallRadialDepthMm),
            new THREE.Vector2(exposedHalf, 0),
        ];
    } else {
        // ExtrudePath maps shape X opposite exported Z here. Keep the support
        // onset square at the tube surface, after the embedded plateau.
        const profile = getComfortCircumferentialProfile(design, dimensions);
        profilePoints = profile.points;
    }
    const shape = roundedPolygonShape(
        profilePoints,
        design.wallProfileCornerRadiusMm,
    );

    const curvePoints = [];
    const cellSpan = wall.cellSpan || 1;
    const curveSegments = CIRCUMFERENTIAL_WALL_CURVE_SEGMENTS * cellSpan;
    for (let segment = 0; segment <= curveSegments; segment += 1) {
        const angle = wall.startAngle
            + cellAngle * cellSpan * (segment / curveSegments);
        curvePoints.push(new THREE.Vector3(
            dimensions.mazeOuterRadiusMm * Math.sin(angle),
            0,
            dimensions.mazeOuterRadiusMm * Math.cos(angle),
        ));
    }

    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const geometry = new THREE.ExtrudeGeometry(shape, {
        steps: curveSegments,
        bevelEnabled: false,
        extrudePath: curve,
        curveSegments: wallProfileCurveSegments,
    });
    finishCircumferentialJunctions(
        geometry,
        wall,
        curve,
        cellAngle,
        design,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = "circumferential-wall";
    mesh.position.y = wall.y;

    return mesh;
};

const createAxialWall = (wall, design, dimensions, material, maze) => {
    const exposedLength = dimensions.axialWallExposedLengthMm + wall.extensionMm;
    const attachedLength = dimensions.axialWallAttachedLengthMm + wall.extensionMm;
    const runLength = dimensions.cellAxialLengthMm + wall.extensionMm;
    let profilePoints;
    if (design.geometryStyle === "reference") {
        profilePoints = [
            new THREE.Vector2(0, -exposedLength / 2),
            new THREE.Vector2(
                dimensions.wallRadialDepthMm,
                -attachedLength / 2,
            ),
            new THREE.Vector2(
                dimensions.wallRadialDepthMm,
                attachedLength / 2,
            ),
            new THREE.Vector2(0, exposedLength / 2),
        ];
    } else {
        // Recess only the exposed planar chord. Its embedded tube attachment
        // stays fixed while the outer corners sit beneath the neighboring
        // circumferential wall's actual faceted sweep.
        const outerDepth = dimensions.axialWallRadialRecessMm;
        // Give every real run the same supported upper height, independent of
        // its lower-end treatment. The exposed upper edge then slopes to that
        // height across the external projection instead of carrying a hard top
        // inward through a boundary wall. Interior joined tips still reach the
        // centerline; the ring's upper end instead follows its adjoining wall.
        const isUpperBoundaryJunction = wall.upperJoined && wall.row === 0;
        const junctionClearanceMm = isUpperBoundaryJunction
            ? design.axialWallRadialRecessMarginMm
            : 0;
        const adjoiningProfile = isUpperBoundaryJunction
            ? getComfortCircumferentialProfile(design, dimensions)
            : null;
        const boundaryShiftY = isUpperBoundaryJunction
            ? -adjoiningProfile.upperOffset
            : 0;
        const adjoiningUpperAtOuterY = isUpperBoundaryJunction
            ? runLength / 2
                + getProfileOffsetAtDepth(
                    adjoiningProfile.points,
                    design.wallProfileCornerRadiusMm,
                    outerDepth,
                )
                + boundaryShiftY
                - junctionClearanceMm
            : null;
        const exposedUpperY = wall.upperJoined
            ? (isUpperBoundaryJunction
                ? adjoiningUpperAtOuterY
                : runLength / 2)
            : exposedLength / 2;
        const supportedUpperY = attachedLength
            - exposedLength / 2
            - design.wallProjectionMm;
        // Boundary row 0 moves its circumferential wall down by exposedHalf
        // to keep the ring's axial end exact. At that one boundary, derive the
        // connected axial slope from the adjoining wall's real tessellated
        // attachment plateau and the same shift. Interior junctions keep their
        // existing supported profile; exposed ends are not involved.
        const adjoiningAttachedUpperY = isUpperBoundaryJunction
            ? runLength / 2
                + getProfileOffsetAtDepth(
                    adjoiningProfile.points,
                    design.wallProfileCornerRadiusMm,
                    (design.wallProjectionMm
                        + dimensions.wallRadialDepthMm) / 2,
                )
                + boundaryShiftY
                - junctionClearanceMm
            : null;
        const attachedUpperY = isUpperBoundaryJunction
            ? Math.min(supportedUpperY, adjoiningAttachedUpperY)
            : supportedUpperY;
        const tubeUpper = new THREE.Vector2(
            design.wallProjectionMm,
            attachedUpperY,
        );
        tubeUpper.cornerRadiusMm = 0;

        if (wall.lastRow === maze.rows - 1) {
            // The base boundary is shifted upward to keep its ramp on the bed.
            // A joined axial end must follow that lower envelope, not extend a
            // flat slab through the ramp. Unjoined ends keep their bed start.
            const lowerY = -attachedLength / 2 - dimensions.bottomRampAllowanceMm;
            const lowerProfile = wall.lowerJoined
                ? getComfortCircumferentialProfile(design, dimensions)
                : null;
            const lowerPoints = lowerProfile
                ? [outerDepth, design.wallProjectionMm, dimensions.wallRadialDepthMm]
                    .map((depth) => setCornerRadius(new THREE.Vector2(
                        depth,
                        -runLength / 2
                            + getProfileOffsetAtDepth(
                                lowerProfile.points,
                                design.wallProfileCornerRadiusMm,
                                depth,
                                true,
                            )
                            - lowerProfile.lowerOffset - dimensions.bottomRampAllowanceMm
                            + design.axialWallRadialRecessMarginMm,
                    ), 0))
                : [
                    new THREE.Vector2(outerDepth, lowerY),
                    new THREE.Vector2(dimensions.wallRadialDepthMm, lowerY),
                ];
            profilePoints = [
                ...lowerPoints,
                new THREE.Vector2(
                    dimensions.wallRadialDepthMm,
                    attachedUpperY,
                ),
                tubeUpper,
                setCornerRadius(
                    new THREE.Vector2(outerDepth, exposedUpperY),
                    wall.upperJoined ? 0 : design.wallProfileCornerRadiusMm,
                ),
            ];
        } else {
            // Keep the established lower support ramp between the recessed
            // outer face and the unchanged tube-side attachment plateau.
            const tubeLower = new THREE.Vector2(
                design.wallProjectionMm,
                -exposedLength / 2 - design.wallProjectionMm,
            );
            tubeLower.cornerRadiusMm = 0;
            const attachedLower = tubeLower.y;
            const exposedLower = wall.lowerJoined
                ? -runLength / 2
                : -exposedLength / 2;
            profilePoints = [
                setCornerRadius(
                    new THREE.Vector2(outerDepth, exposedLower),
                    wall.lowerJoined ? 0 : design.wallProfileCornerRadiusMm,
                ),
                tubeLower,
                new THREE.Vector2(
                    dimensions.wallRadialDepthMm,
                    attachedLower,
                ),
                new THREE.Vector2(
                    dimensions.wallRadialDepthMm,
                    attachedUpperY,
                ),
                tubeUpper,
                setCornerRadius(
                    new THREE.Vector2(outerDepth, exposedUpperY),
                    wall.upperJoined ? 0 : design.wallProfileCornerRadiusMm,
                ),
            ];
        }
    }
    const shape = roundedPolygonShape(
        profilePoints,
        design.wallProfileCornerRadiusMm,
    );

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: design.axialWallPhysicalThicknessMm,
        steps: 1,
        bevelEnabled: false,
        curveSegments: wallProfileCurveSegments,
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
    plan.circumferentialWalls.forEach((wall) => {
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
        innerRing.add(createAxialWall(
            wall,
            design,
            dimensions,
            materials.gold,
            maze,
        ));
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
