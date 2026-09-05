export const REFERENCE_DESIGN_ID = "existing-reference";
export const COMFORT_STUDY_ID = "bed-aligned-comfort-study";

export const PRINT_DESIGNS = Object.freeze([
    Object.freeze({
        id: REFERENCE_DESIGN_ID,
        name: "Existing design · reference",
        summary: "Preserved dimensions and legacy STL orientation.",
        qualification: "Reference only; not print-qualified.",
        geometryStyle: "reference",
        exportMode: "legacy",
        boreDiameterMm: 9,
        axialWidthMm: 10,
        nozzleDiameterMm: 0.4,
        tubeWallThicknessMm: 0.6,
        tubeEdgeChamferMm: 0,
        wallProjectionMm: 0.4,
        wallAttachmentOverlapMm: 0.1,
        circumferentialWallAttachedThicknessMm: 0.4,
        circumferentialWallExposedThicknessMm: 0.05,
        axialWallPhysicalThicknessMm: 0.1,
        axialWallAttachedLengthMm: 2.8,
        axialWallExposedLengthMm: 2,
        wallProfileCornerRadiusMm: 0,
        keyClearanceMm: 0.3,
        keyAxialClearanceMm: 0,
        keySleeveRadialThicknessMm: 0.6,
        keySleeveAxialWidthMm: 2,
        keySleeveEdgeChamferMm: 0,
        keyToothAxialExtraMm: 0.1,
        keyToothTangentialWidthMm: 2,
        keyToothOuterOffsetFromSleeveMm: 0.2,
        keyToothCornerRadiusMm: 0,
    }),
    Object.freeze({
        id: COMFORT_STUDY_ID,
        name: "Bed-aligned comfort study",
        summary: "Thicker tapered walls, eased contact profiles, and a grounded key.",
        qualification: "PROVISIONAL dimensions; requires slicer and physical review.",
        geometryStyle: "comfort-study",
        exportMode: "bed-up-z",
        boreDiameterMm: 18,
        axialWidthMm: 11,
        nozzleDiameterMm: 0.4,
        tubeWallThicknessMm: 1.2,
        tubeEdgeChamferMm: 0.3,
        wallProjectionMm: 0.8,
        wallAttachmentOverlapMm: 0.3,
        circumferentialWallAttachedThicknessMm: 0.6,
        circumferentialWallExposedThicknessMm: 0.4,
        axialWallPhysicalThicknessMm: 0.8,
        axialWallAttachedLengthMm: 2.75,
        axialWallExposedLengthMm: 1.95,
        wallProfileCornerRadiusMm: 0.15,
        keyClearanceMm: 0.4,
        keyAxialClearanceMm: 0.15,
        keySleeveRadialThicknessMm: 1.2,
        keySleeveAxialWidthMm: 2.2,
        keySleeveEdgeChamferMm: 0.2,
        keyToothAxialExtraMm: 0.1,
        keyToothTangentialWidthMm: 2.4,
        keyToothOuterOffsetFromSleeveMm: -0.6,
        keyToothCornerRadiusMm: 0.2,
    }),
]);

export const getPrintDesign = (designId) =>
    PRINT_DESIGNS.find((design) => design.id === designId) || PRINT_DESIGNS[0];

export const getDerivedPrintDimensions = (design, maze) => {
    const innerRadiusMm = design.boreDiameterMm / 2;
    const tubeOuterRadiusMm = innerRadiusMm + design.tubeWallThicknessMm;
    const mazeOuterRadiusMm = tubeOuterRadiusMm + design.wallProjectionMm;
    const keySleeveInnerRadiusMm = mazeOuterRadiusMm + design.keyClearanceMm;
    const keySleeveOuterRadiusMm =
        keySleeveInnerRadiusMm + design.keySleeveRadialThicknessMm;
    const keyToothInnerRadiusMm = tubeOuterRadiusMm + design.keyClearanceMm;
    const keyToothOuterRadiusMm =
        keySleeveOuterRadiusMm + design.keyToothOuterOffsetFromSleeveMm;

    return {
        innerRadiusMm,
        tubeOuterRadiusMm,
        mazeOuterRadiusMm,
        wallRadialDepthMm:
            design.wallProjectionMm + design.wallAttachmentOverlapMm,
        keySleeveInnerRadiusMm,
        keySleeveOuterRadiusMm,
        keyToothInnerRadiusMm,
        keyToothOuterRadiusMm,
        keyToothAxialWidthMm:
            design.keySleeveAxialWidthMm + design.keyToothAxialExtraMm,
        cellAngleRadians: Math.PI * 2 / maze.columns,
        cellAxialLengthMm: design.axialWidthMm / maze.rows,
    };
};

const isPositiveNumber = (value) => Number.isFinite(value) && value > 0;

export const validatePrintDesign = (design, maze) => {
    const errors = [];
    const warnings = [];
    const positiveFields = [
        "boreDiameterMm",
        "axialWidthMm",
        "nozzleDiameterMm",
        "tubeWallThicknessMm",
        "wallProjectionMm",
        "wallAttachmentOverlapMm",
        "circumferentialWallAttachedThicknessMm",
        "circumferentialWallExposedThicknessMm",
        "axialWallPhysicalThicknessMm",
        "axialWallAttachedLengthMm",
        "axialWallExposedLengthMm",
        "keyClearanceMm",
        "keySleeveRadialThicknessMm",
        "keySleeveAxialWidthMm",
        "keyToothTangentialWidthMm",
    ];

    if (!maze || !Number.isInteger(maze.columns) || maze.columns < 3) {
        errors.push("The maze needs at least three columns.");
    }
    if (!maze || !Number.isInteger(maze.rows) || maze.rows < 1) {
        errors.push("The maze needs at least one row.");
    }
    if (maze && (!Array.isArray(maze.horizontalWalls)
        || maze.horizontalWalls.length !== maze.rows + 1
        || maze.horizontalWalls.some((row) => !Array.isArray(row)
            || row.length !== maze.columns))) {
        errors.push("The circumferential-wall grid does not match the maze dimensions.");
    }
    if (maze && (!Array.isArray(maze.verticalWalls)
        || maze.verticalWalls.length !== maze.rows
        || maze.verticalWalls.some((row) => !Array.isArray(row)
            || row.length !== maze.columns))) {
        errors.push("The axial-wall grid does not match the maze dimensions.");
    }
    if (maze && (!Number.isInteger(maze.entranceColumn)
        || maze.entranceColumn < 0
        || maze.entranceColumn >= maze.columns
        || !Number.isInteger(maze.exitColumn)
        || maze.exitColumn < 0
        || maze.exitColumn >= maze.columns)) {
        errors.push("Entrance and exit columns must be inside the maze.");
    }
    if (maze && Array.isArray(maze.horizontalWalls)
        && Number.isInteger(maze.entranceColumn)
        && Number.isInteger(maze.exitColumn)
        && (maze.horizontalWalls[0]?.[maze.entranceColumn] !== false
            || maze.horizontalWalls[maze.rows]?.[maze.exitColumn] !== false)) {
        errors.push("Entrance and exit must be open in the maze model.");
    }
    if (errors.length) return { errors, warnings, derived: null };

    positiveFields.forEach((field) => {
        if (!isPositiveNumber(design[field])) {
            errors.push(`${field} must be a finite value greater than zero.`);
        }
    });
    [
        "tubeEdgeChamferMm",
        "wallProfileCornerRadiusMm",
        "keySleeveEdgeChamferMm",
        "keyToothAxialExtraMm",
        "keyToothCornerRadiusMm",
        "keyAxialClearanceMm",
    ].forEach((field) => {
        if (!Number.isFinite(design[field]) || design[field] < 0) {
            errors.push(`${field} must be a finite value of zero or greater.`);
        }
    });
    if (!Number.isFinite(design.keyToothOuterOffsetFromSleeveMm)) {
        errors.push("keyToothOuterOffsetFromSleeveMm must be finite.");
    }
    if (errors.length) return { errors, warnings, derived: null };

    const derived = getDerivedPrintDimensions(design, maze);
    const maximumRunLength = derived.cellAxialLengthMm
        + design.circumferentialWallAttachedThicknessMm;

    if (design.wallAttachmentOverlapMm >= design.tubeWallThicknessMm) {
        errors.push("Wall attachment overlap must remain inside the tube wall.");
    }
    if (design.circumferentialWallAttachedThicknessMm > derived.cellAxialLengthMm) {
        errors.push("Circumferential wall attachment is wider than a maze row.");
    }
    if (design.circumferentialWallExposedThicknessMm
        > design.circumferentialWallAttachedThicknessMm) {
        errors.push("The exposed circumferential wall must not be wider than its attachment.");
    }
    if (design.axialWallAttachedLengthMm > maximumRunLength) {
        errors.push("Axial wall attachment overlaps more than one neighboring boundary.");
    }
    if (design.axialWallExposedLengthMm > design.axialWallAttachedLengthMm) {
        errors.push("The exposed axial wall must not be longer than its attachment.");
    }
    if (design.keySleeveAxialWidthMm > derived.cellAxialLengthMm) {
        errors.push("The key sleeve is wider than its exit row.");
    }
    if (derived.keyToothAxialWidthMm > derived.cellAxialLengthMm) {
        errors.push("The key tooth is taller than its exit row.");
    }
    const toothTopFromExitEnd = design.geometryStyle === "reference"
        ? derived.cellAxialLengthMm / 2 + derived.keyToothAxialWidthMm / 2
        : derived.keyToothAxialWidthMm;
    const nextBoundaryStart = derived.cellAxialLengthMm
        - design.circumferentialWallAttachedThicknessMm / 2;
    if (toothTopFromExitEnd + design.keyAxialClearanceMm > nextBoundaryStart) {
        errors.push("The resting key tooth collides with the next row boundary.");
    }
    if (derived.keyToothInnerRadiusMm >= derived.mazeOuterRadiusMm) {
        errors.push("The key tooth does not reach the maze-wall envelope.");
    }
    if (derived.keyToothOuterRadiusMm <= derived.keySleeveInnerRadiusMm) {
        errors.push("The key tooth does not overlap the sleeve.");
    }
    const toothHalfChannelMm = derived.keyToothInnerRadiusMm
        * Math.sin(derived.cellAngleRadians / 2);
    if (design.keyToothTangentialWidthMm / 2
        + design.axialWallPhysicalThicknessMm / 2 >= toothHalfChannelMm) {
        errors.push("The resting key tooth collides with an axial maze wall.");
    }
    if (design.tubeEdgeChamferMm * 2 >= design.tubeWallThicknessMm) {
        errors.push("Tube chamfers consume the tube's entire radial wall.");
    }
    if (design.keySleeveEdgeChamferMm * 2
        >= Math.min(design.keySleeveRadialThicknessMm, design.keySleeveAxialWidthMm)) {
        errors.push("Key sleeve chamfers consume its flat base or axial face.");
    }

    [
        ["Circumferential exposed tip", design.circumferentialWallExposedThicknessMm],
        ["Axial wall", design.axialWallPhysicalThicknessMm],
    ].forEach(([label, thickness]) => {
        if (thickness < design.nozzleDiameterMm) {
            warnings.push(
                `${label} is ${thickness.toFixed(2)} mm, below the ${design.nozzleDiameterMm.toFixed(2)} mm nozzle reference.`,
            );
        }
    });

    return { errors, warnings, derived };
};

export const assertValidPrintDesign = (design, maze) => {
    const result = validatePrintDesign(design, maze);
    if (result.errors.length) {
        throw new Error(`Invalid print design: ${result.errors.join(" ")}`);
    }
    return result.derived;
};
