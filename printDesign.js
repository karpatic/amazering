export const REFERENCE_DESIGN_ID = "existing-reference";
export const COMFORT_STUDY_ID = "bed-aligned-comfort-study";

export const PRINT_BASELINE = Object.freeze({
    printer: "Bambu Lab P1S",
    multiMaterialCapable: true,
    material: "PLA",
    nozzleDiameterMm: 0.4,
    layerHeightMm: 0.2,
    movingRadialClearanceMm: 0.4,
    fitCompensationMm: 0,
});

export const US_RING_SIZE_SOURCE = Object.freeze({
    publisher: "Blue Nile",
    title: "How to Determine Your Ring Size",
    url: "https://bn-dam.services.r2net.com/assets/public/education/ring_sizer.pdf",
});

// Blue Nile publishes these US/Canada half sizes with inside diameters rounded
// to 0.1 mm. Values between entries are estimates, not additional chart sizes.
export const US_RING_SIZE_CHART = Object.freeze([
    [3, 14.1],
    [3.5, 14.5],
    [4, 14.9],
    [4.5, 15.3],
    [5, 15.7],
    [5.5, 16.1],
    [6, 16.5],
    [6.5, 16.9],
    [7, 17.3],
    [7.5, 17.7],
    [8, 18.1],
    [8.5, 18.5],
    [9, 19],
    [9.5, 19.4],
    [10, 19.8],
    [10.5, 20.2],
    [11, 20.6],
    [11.5, 21],
    [12, 21.4],
    [12.5, 21.8],
    [13, 22.2],
    [13.5, 22.6],
].map(([usSize, boreDiameterMm]) => Object.freeze({ usSize, boreDiameterMm })));

export const getUsRingSizeMatch = (boreDiameterMm) => {
    if (!Number.isFinite(boreDiameterMm)) {
        return { kind: "invalid", usSize: null };
    }

    const exact = US_RING_SIZE_CHART.find(
        (entry) => Math.abs(entry.boreDiameterMm - boreDiameterMm) < 0.000001,
    );
    if (exact) return { kind: "listed", usSize: exact.usSize };

    const first = US_RING_SIZE_CHART[0];
    const last = US_RING_SIZE_CHART[US_RING_SIZE_CHART.length - 1];
    if (boreDiameterMm < first.boreDiameterMm
        || boreDiameterMm > last.boreDiameterMm) {
        return { kind: "outside-chart", usSize: null };
    }

    const upperIndex = US_RING_SIZE_CHART.findIndex(
        (entry) => entry.boreDiameterMm > boreDiameterMm,
    );
    const lower = US_RING_SIZE_CHART[upperIndex - 1];
    const upper = US_RING_SIZE_CHART[upperIndex];
    const fraction = (boreDiameterMm - lower.boreDiameterMm)
        / (upper.boreDiameterMm - lower.boreDiameterMm);

    return {
        kind: "approximate",
        usSize: lower.usSize + fraction * (upper.usSize - lower.usSize),
    };
};

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
        nozzleDiameterMm: PRINT_BASELINE.nozzleDiameterMm,
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
        keyClearanceMm: PRINT_BASELINE.movingRadialClearanceMm,
        keyAxialClearanceMm: 0.15,
        keySleeveRadialThicknessMm: 1.2,
        keySleeveAxialWidthMm: 2.2,
        keySleeveEdgeChamferMm: 0.2,
        keyToothAxialExtraMm: 0.1,
        keyToothTangentialWidthMm: 2.4,
        keyToothOuterOffsetFromSleeveMm: -0.6,
        keyToothCornerRadiusMm: 0.2,
        fitCompensationMm: PRINT_BASELINE.fitCompensationMm,
    }),
]);

export const getPrintDesign = (designId) =>
    PRINT_DESIGNS.find((design) => design.id === designId) || PRINT_DESIGNS[0];

export const getDerivedPrintDimensions = (design, maze) => {
    const fitCompensationMm = design.fitCompensationMm ?? 0;
    const modeledBoreDiameterMm = design.boreDiameterMm + fitCompensationMm;
    const innerRadiusMm = modeledBoreDiameterMm / 2;
    const tubeOuterRadiusMm = innerRadiusMm + design.tubeWallThicknessMm;
    const mazeOuterRadiusMm = tubeOuterRadiusMm + design.wallProjectionMm;
    const keySleeveInnerRadiusMm = mazeOuterRadiusMm + design.keyClearanceMm;
    const keySleeveOuterRadiusMm =
        keySleeveInnerRadiusMm + design.keySleeveRadialThicknessMm;
    const keyToothInnerRadiusMm = tubeOuterRadiusMm + design.keyClearanceMm;
    const keyToothOuterRadiusMm =
        keySleeveOuterRadiusMm + design.keyToothOuterOffsetFromSleeveMm;

    return {
        modeledBoreDiameterMm,
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
    if (design.fitCompensationMm !== undefined
        && !Number.isFinite(design.fitCompensationMm)) {
        errors.push("fitCompensationMm must be finite when supplied.");
    }
    if (errors.length) return { errors, warnings, derived: null };

    const derived = getDerivedPrintDimensions(design, maze);
    const maximumRunLength = derived.cellAxialLengthMm
        + design.circumferentialWallAttachedThicknessMm;

    if (!isPositiveNumber(derived.modeledBoreDiameterMm)) {
        errors.push("Nominal bore plus fit compensation must be greater than zero.");
    }

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
        errors.push(
            "At this bore diameter, the resting key tooth collides with an axial maze wall.",
        );
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
