export const STANDARD_DESIGN_ID = "standard";
export const CIRCUMFERENTIAL_WALL_CURVE_SEGMENTS = 8;

export const PRINT_BASELINE = Object.freeze({
    printer: "Bambu Lab P1S",
    multiMaterialCapable: true,
    material: "PLA",
    nozzleDiameterMm: 0.4,
    layerHeightMm: 0.2,
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
        id: STANDARD_DESIGN_ID,
        name: "A-Maze-Ring",
        summary: "Curved tooth, tactile locator, and full-height maze passages.",
        qualification: "Accepted standard model.",
        geometryStyle: "comfort",
        exportMode: "bed-up-z",
        boreDiameterMm: 18,
        axialWidthMm: 21.2,
        nozzleDiameterMm: PRINT_BASELINE.nozzleDiameterMm,
        tubeWallThicknessMm: 0.6,
        tubeEdgeChamferMm: 0.2,
        wallProjectionMm: 1.0,
        wallAttachmentOverlapMm: 0.3,
        circumferentialWallAttachedThicknessMm: 0.6,
        circumferentialWallExposedThicknessMm: 0.4,
        axialWallPhysicalThicknessMm: 0.6,
        axialWallRadialRecessMarginMm: 0.025,
        axialWallAttachedEndSetbackMm: 0,
        axialWallExposedEndSetbackMm: 0.275,
        wallProfileCornerRadiusMm: 0.15,
        keySleeveClearanceMm: 0.18,
        keyToothClearanceMm: 0.18,
        keyAxialClearanceMm: 0.25,
        keySleeveRadialThicknessMm: 0.8,
        keySleeveAxialWidthMm: 15,
        keyToothAxialCenterFromBedMm: 7.5,
        keySleeveEdgeChamferMm: 0.2,
        keyToothBaseDiameterMm: 3.2,
        keyToothTipDiameterMm: 3.2,
        keyToothSleeveOverlapMm: 0.2,
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
    const keySleeveInnerRadiusMm =
        mazeOuterRadiusMm + design.keySleeveClearanceMm;
    const keySleeveOuterRadiusMm =
        keySleeveInnerRadiusMm + design.keySleeveRadialThicknessMm;
    const keyToothInnerRadiusMm =
        tubeOuterRadiusMm + design.keyToothClearanceMm;
    const keyToothOuterRadiusMm = design.geometryStyle === "reference"
        ? keySleeveOuterRadiusMm + design.keyToothOuterOffsetFromSleeveMm
        : keySleeveInnerRadiusMm + design.keyToothSleeveOverlapMm;

    // An axial wall is a tangent chord across its finite thickness. Recess its
    // planar face by the worse of the ideal-circle sagitta and the first real
    // sweep facet at a one-arm joined cap, then retain a small cover margin.
    const cellAngleRadians = Math.PI * 2 / maze.columns;
    const axialWallHalfThicknessMm = design.axialWallPhysicalThicknessMm / 2;
    const curvatureInsetMm = design.geometryStyle === "reference"
        ? 0
        : mazeOuterRadiusMm - Math.sqrt(
            Math.max(
                0,
                mazeOuterRadiusMm ** 2 - axialWallHalfThicknessMm ** 2,
            ),
        );
    const sweepStepRadians =
        cellAngleRadians / CIRCUMFERENTIAL_WALL_CURVE_SEGMENTS;
    const nextSweepTangentMm = mazeOuterRadiusMm * Math.sin(sweepStepRadians);
    const nextSweepInsetMm =
        mazeOuterRadiusMm * (1 - Math.cos(sweepStepRadians));
    const fullThicknessFacetInsetMm = design.geometryStyle === "reference"
        ? 0
        : nextSweepInsetMm * Math.min(
            1,
            design.axialWallPhysicalThicknessMm
                / (axialWallHalfThicknessMm + nextSweepTangentMm),
        );
    const axialWallRadialRecessMm = design.geometryStyle === "reference"
        ? 0
        : Math.max(curvatureInsetMm, fullThicknessFacetInsetMm)
            + design.axialWallRadialRecessMarginMm;

    // Reserve bed-ramp space outside the maze rather than compressing its last row.
    const bottomRampAllowanceMm = design.geometryStyle === "reference" ? 0
        : design.wallProjectionMm + design.circumferentialWallExposedThicknessMm / 2;
    const cellAxialLengthMm = (design.axialWidthMm - bottomRampAllowanceMm) / maze.rows;
    const axialWallAttachedLengthMm = design.geometryStyle === "reference"
        ? design.axialWallAttachedLengthMm
        : cellAxialLengthMm - 2 * design.axialWallAttachedEndSetbackMm;
    const axialWallExposedLengthMm = design.geometryStyle === "reference"
        ? design.axialWallExposedLengthMm
        : cellAxialLengthMm - 2 * design.axialWallExposedEndSetbackMm;
    const keyToothBaseDiameterMm = design.geometryStyle === "reference"
        ? design.keyToothTangentialWidthMm
        : design.keyToothBaseDiameterMm;
    const keyToothTipDiameterMm = design.geometryStyle === "reference"
        ? keyToothBaseDiameterMm
        : design.keyToothTipDiameterMm;
    const keyToothAxialCenterFromBedMm = design.geometryStyle === "reference"
        ? cellAxialLengthMm / 2
        : design.keyToothAxialCenterFromBedMm;
    const keyToothAxialWidthMm = design.geometryStyle === "reference"
        ? design.keySleeveAxialWidthMm + design.keyToothAxialExtraMm
        : keyToothBaseDiameterMm;

    return {
        modeledBoreDiameterMm,
        innerRadiusMm,
        tubeOuterRadiusMm,
        mazeOuterRadiusMm,
        axialWallRadialRecessMm,
        axialWallCurvatureInsetMm: curvatureInsetMm,
        axialWallFacetInsetMm: fullThicknessFacetInsetMm,
        wallRadialDepthMm:
            design.wallProjectionMm + design.wallAttachmentOverlapMm,
        keySleeveInnerRadiusMm,
        keySleeveOuterRadiusMm,
        keyToothInnerRadiusMm,
        keyToothOuterRadiusMm,
        keyToothBaseDiameterMm,
        keyToothTipDiameterMm,
        keyToothAxialCenterFromBedMm,
        keyToothAxialWidthMm,
        axialWallAttachedLengthMm,
        axialWallExposedLengthMm,
        cellAngleRadians,
        cellAxialLengthMm,
        bottomRampAllowanceMm,
    };
};

import {
    getMazeBoundaryHeightMm,
    getKeyStartPlacement as resolveKeyStartPlacement,
    getKeyToothProfile as resolveKeyToothProfile,
} from "./keyPlacement.js?v=standard-model";

export { getMazeBoundaryHeightMm };
export const getKeyStartPlacement = resolveKeyStartPlacement;
export const getKeyToothProfile = resolveKeyToothProfile;

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
        "keySleeveClearanceMm",
        "keyToothClearanceMm",
        "keySleeveRadialThicknessMm",
        "keySleeveAxialWidthMm",
    ];
    if (design.geometryStyle === "reference") {
        positiveFields.push(
            "axialWallAttachedLengthMm",
            "axialWallExposedLengthMm",
            "keyToothTangentialWidthMm",
        );
    } else {
        positiveFields.push(
            "keyToothBaseDiameterMm",
            "keyToothTipDiameterMm",
            "keyToothAxialCenterFromBedMm",
            "keyToothSleeveOverlapMm",
        );
    }
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
        "keyAxialClearanceMm",
        "axialWallRadialRecessMarginMm",
    ].forEach((field) => {
        if (!Number.isFinite(design[field]) || design[field] < 0) {
            errors.push(`${field} must be a finite value of zero or greater.`);
        }
    });
    const branchNonNegativeFields = design.geometryStyle === "reference"
        ? ["keyToothAxialExtraMm", "keyToothCornerRadiusMm"]
        : ["axialWallAttachedEndSetbackMm", "axialWallExposedEndSetbackMm"];
    branchNonNegativeFields.forEach((field) => {
        if (!Number.isFinite(design[field]) || design[field] < 0) {
            errors.push(`${field} must be a finite value of zero or greater.`);
        }
    });
    if (design.geometryStyle === "reference"
        && !Number.isFinite(design.keyToothOuterOffsetFromSleeveMm)) {
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
    if (derived.axialWallRadialRecessMm >= design.wallProjectionMm) {
        errors.push("The axial-wall radial recess consumes its external projection.");
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
    if (!isPositiveNumber(derived.axialWallAttachedLengthMm)
        || derived.axialWallAttachedLengthMm > maximumRunLength) {
        errors.push("Axial wall attachment overlaps more than one neighboring boundary.");
    }
    if (!isPositiveNumber(derived.axialWallExposedLengthMm)
        || derived.axialWallExposedLengthMm > derived.axialWallAttachedLengthMm) {
        errors.push("The exposed axial wall must not be longer than its attachment.");
    }
    if (design.geometryStyle === "reference"
        && design.keySleeveAxialWidthMm > derived.cellAxialLengthMm) {
        errors.push("The key sleeve is wider than its exit row.");
    }
    if (design.geometryStyle === "reference"
        && derived.keyToothAxialWidthMm > derived.cellAxialLengthMm) {
        errors.push("The key tooth is taller than its exit row.");
    }
    if (design.geometryStyle === "reference") {
        const toothTopFromExitEnd = derived.cellAxialLengthMm / 2
            + derived.keyToothAxialWidthMm / 2;
        const nextBoundaryStart = derived.cellAxialLengthMm
            - design.circumferentialWallAttachedThicknessMm / 2;
        if (toothTopFromExitEnd + design.keyAxialClearanceMm > nextBoundaryStart) {
            errors.push("The resting key tooth collides with the next row boundary.");
        }
    } else {
        const toothBottomFromBedMm = derived.keyToothAxialCenterFromBedMm
            - derived.keyToothBaseDiameterMm / 2;
        if (toothBottomFromBedMm <= 0) {
            errors.push("The comfort tooth must remain raised above the bed plane.");
        }
        const sleeveBridgeTopMm = derived.bottomRampAllowanceMm + derived.cellAxialLengthMm
            + design.circumferentialWallExposedThicknessMm / 2;
        if (design.keySleeveAxialWidthMm < sleeveBridgeTopMm) {
            errors.push("The comfort sleeve does not bridge the first wall band.");
        }
        if (derived.keyToothTipDiameterMm !== derived.keyToothBaseDiameterMm) {
            errors.push("The swept comfort tooth requires matching nominal width/height fields.");
        }
        if (getKeyToothProfile(design, derived).tipBottomMm
            >= getKeyToothProfile(design, derived).topMm - 0.24) {
            errors.push("The tooth ramp consumes its working face height.");
        }
        if (design.keyToothSleeveOverlapMm
            >= design.keySleeveRadialThicknessMm) {
            errors.push("The comfort tooth overlap consumes the sleeve radial thickness.");
        }
        const placement = getKeyStartPlacement(design, maze, derived);
        if (!placement.safe) {
            warnings.push(`Preview review: no verified resting placement (${placement.reason}); displaying column ${placement.column + 1} for inspection only. Tooth/support or clearance may meet actual walls. Do not print without review.`);
        }
    }
    if (derived.keyToothInnerRadiusMm >= derived.mazeOuterRadiusMm) {
        errors.push("The key tooth does not reach the maze-wall envelope.");
    }
    if (derived.keyToothOuterRadiusMm <= derived.keySleeveInnerRadiusMm) {
        errors.push("The key tooth does not overlap the sleeve.");
    }
    if (design.geometryStyle === "reference") {
        const toothHalfChannelMm = derived.keyToothInnerRadiusMm
            * Math.sin(derived.cellAngleRadians / 2);
        if (design.keyToothTangentialWidthMm / 2
            + design.axialWallPhysicalThicknessMm / 2 >= toothHalfChannelMm) {
            errors.push(
                "At this bore diameter, the resting key tooth collides with an axial maze wall.",
            );
        }
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
