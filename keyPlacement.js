// This module stays independent of printDesign so browser module loading is acyclic.
// Shared unrounded envelope of the ONE swept tooth (no separate gusset).
export const getKeyToothProfile = (design, d) => {
    const innerMm = d.keyToothInnerRadiusMm;
    const outerMm = d.keyToothOuterRadiusMm;
    const bottomMm = d.keyToothAxialCenterFromBedMm - d.keyToothBaseDiameterMm / 2;
    const topMm = d.keyToothAxialCenterFromBedMm + d.keyToothBaseDiameterMm / 2;
    const angularHalf = d.keyToothBaseDiameterMm / (2 * outerMm);
    const sweepSegments = 32;
    // Circumscribe the curved face: facet interiors must not steal tube clearance.
    const facetScale = 1 / Math.cos(angularHalf / sweepSegments);
    return { innerMm, outerMm, bottomMm, topMm, angularHalf, sweepSegments,
        facetScale, tipBottomMm: bottomMm + outerMm - innerMm,
        cornerMm: 0.12, endReliefFraction: 0.08 };
};

export const getComfortWallOffsetsAtRadius = (design, dimensions, radiusMm) => {
    const growth = Math.max(0, Math.min(design.wallProjectionMm,
        radiusMm - dimensions.tubeOuterRadiusMm));
    const lower = -design.circumferentialWallExposedThicknessMm / 2 - design.wallProjectionMm;
    const upper = lower + design.circumferentialWallAttachedThicknessMm;
    return { lowerMm: lower + growth,
        upperMm: upper + (design.circumferentialWallExposedThicknessMm / 2 - upper)
            * growth / design.wallProjectionMm };
};

// Actual boundary heights shared by geometry and placement, in print coordinates.
export const getMazeBoundaryHeightMm = (design, maze, d, row) =>
    (maze.rows - row) * d.cellAxialLengthMm + d.bottomRampAllowanceMm
        - (design.geometryStyle !== "reference" && row === 0
            ? design.circumferentialWallExposedThicknessMm / 2 : 0);

// Conservative bounded strips cover the WHOLE swept tooth, rather than
// checking only their centers. Wall absence is authoritative; rounded walls are
// bounded by their unrounded profiles plus a sweep/junction allowance.
export const getKeyStartPlacement = (design, maze, dimensions) => {
    if (design.geometryStyle === "reference") {
        return { column: maze.exitColumn, safe: true, reason: "legacy-reference" };
    }
    const d = dimensions;
    const profile = getKeyToothProfile(design, d);
    const strips = [];
    const count = 64;
    for (let i = 0; i < count; i += 1) {
        const r0 = profile.innerMm + (profile.outerMm - profile.innerMm) * i / count;
        const r1 = profile.innerMm + (profile.outerMm - profile.innerMm) * (i + 1) / count;
        // Rounding and end relief shrink inside the convex unrounded profile.
        // Each swept facet stays between r0 and r1 * facetScale, including interiors.
        strips.push({ radiusMin: r0, radiusMax: r1 * profile.facetScale,
            low: profile.bottomMm + profile.outerMm - r1, high: profile.topMm });
    }
    const wrap = (angle) => Math.atan2(Math.sin(angle), Math.cos(angle));
    const allowance = 0.03; // Covers sweep facets and joined end-cap extension.
    const conflictsAt = (column) => {
        const conflicts = new Set();
        const center = (column + 0.5) * d.cellAngleRadians;
        for (const s of strips) {
            const { radiusMin, radiusMax } = s;
            if (radiusMin > d.mazeOuterRadiusMm + allowance) continue;
            const angularHalf = profile.angularHalf;
            for (let row = 0; row <= maze.rows; row += 1) {
                const height = getMazeBoundaryHeightMm(design, maze, d, row);
                const low = height + getComfortWallOffsetsAtRadius(design, d, radiusMin).lowerMm - allowance;
                const high = height + getComfortWallOffsetsAtRadius(design, d, radiusMax).upperMm + allowance;
                if (s.high + design.keyAxialClearanceMm < low
                    || s.low - design.keyAxialClearanceMm > high) continue;
                for (let c = 0; c < maze.columns; c += 1) {
                    if (!maze.horizontalWalls[row][c]) continue;
                    const delta = Math.abs(wrap((c + 0.5) * d.cellAngleRadians - center));
                    const capAngle = (design.axialWallPhysicalThicknessMm / 2 + allowance) / radiusMin;
                    if (delta <= d.cellAngleRadians / 2 + angularHalf + capAngle)
                        conflicts.add(`horizontal ${row}:${c}`);
                }
            }
            for (let row = 0; row < maze.rows; row += 1) {
                const low = row === maze.rows - 1 ? -allowance
                    : d.bottomRampAllowanceMm + (maze.rows - row - 1) * d.cellAxialLengthMm - allowance;
                const high = d.bottomRampAllowanceMm + (maze.rows - row) * d.cellAxialLengthMm
                    + design.circumferentialWallExposedThicknessMm / 2 + allowance;
                if (s.high + design.keyAxialClearanceMm < low
                    || s.low - design.keyAxialClearanceMm > high) continue;
                for (let c = 0; c < maze.columns; c += 1) {
                    if (!maze.verticalWalls[row][c]) continue;
                    const delta = Math.abs(wrap(c * d.cellAngleRadians - center));
                    if (delta <= angularHalf + (design.axialWallPhysicalThicknessMm / 2 + allowance) / radiusMin)
                        conflicts.add(`vertical ${row}:${c}`);
                }
            }
        }
        return [...conflicts];
    };
    const candidates = Array.from({ length: maze.columns }, (_, c) => c)
        .sort((a, b) => {
            const distance = (c) => Math.min((c - maze.exitColumn + maze.columns) % maze.columns,
                (maze.exitColumn - c + maze.columns) % maze.columns);
            return distance(a) - distance(b) || a - b;
        });
    // The centered tooth can start above the bottom row. Check actual wall
    // envelopes there rather than requiring an unrelated bottom-row opening.
    const inBottomRow = d.keyToothAxialCenterFromBedMm < d.bottomRampAllowanceMm + d.cellAxialLengthMm;
    const openings = !inBottomRow ? candidates
        : maze.rows > 1 ? candidates.filter((c) => maze.horizontalWalls[maze.rows - 1][c] === false) : [];
    const assessments = openings.map((column) => ({ column, conflicts: conflictsAt(column) }));
    const selected = assessments.find((candidate) => !candidate.conflicts.length);
    const profileValid = profile.bottomMm > 0 && profile.tipBottomMm < profile.topMm
        && d.keyToothTipDiameterMm === d.keyToothBaseDiameterMm;
    if (selected && profileValid) return { ...selected, safe: true, reason: inBottomRow ? "open-upward-passage" : "clear-centered-placement", profile, assessments };
    return { column: selected?.column ?? openings[0] ?? maze.exitColumn, safe: false,
        reason: !profileValid ? "invalid-ramped-tooth-dimensions"
            : maze.rows < 2 ? "no-upward-row"
                : !openings.length ? "no-bottom-row-upward-passage" : "all-upward-passages-envelope-blocked",
        profile, assessments };
};
