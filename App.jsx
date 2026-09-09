import { SVGMazeGenerator } from "./mazeGenerator.js?v=marker-large-gold";
import { ThreeDMazeGenerator } from "./threeDGenerator.js?v=marker-large-gold";
import {
    generateAldousBroderMaze,
    toggleMazeEdge,
    MAZE_LIMITS,
    areMazeDimensionsValid,
} from "./mazeModel.js?v=marker-large-gold";
import {
    STANDARD_DESIGN_ID,
    PRINT_BASELINE,
    US_RING_SIZE_CHART,
    getPrintDesign,
    getUsRingSizeMatch,
    validatePrintDesign,
    getMinimumHeightMm,
    MAX_HEIGHT_MM,
    withPhysicalHeight,
} from "./printDesign.js?v=marker-large-gold";

import { MARKER_SHAPES } from "./markerGeometry.js?v=marker-large-gold";

const { useMemo, useState } = React;

const formatMm = (value) => Number.isFinite(value)
    ? `${value.toFixed(2).replace(/\.00$/, "")} mm`
    : "—";
const formatUsSize = (value) => Number.isInteger(value)
    ? value.toFixed(0)
    : value.toFixed(1);
const parseInput = (value) => value.trim() === "" ? Number.NaN : Number(value);

const DesignDetails = ({ design, maze }) => {
    const validation = validatePrintDesign(design, maze);
    const ringSizeMatch = getUsRingSizeMatch(design.boreDiameterMm);
    let ringSizeNote = "Enter a finite bore diameter.";
    if (ringSizeMatch.kind === "listed") {
        ringSizeNote = `US ${formatUsSize(ringSizeMatch.usSize)} is an exact listed chart entry.`;
    } else if (ringSizeMatch.kind === "approximate") {
        ringSizeNote = `≈ US ${ringSizeMatch.usSize.toFixed(1)} by interpolation; this is not a listed chart size.`;
    } else if (ringSizeMatch.kind === "outside-chart") {
        ringSizeNote = "Outside the sourced 14.1–22.6 mm chart; no US equivalent is asserted.";
    }
    const parameters = [
        ["Nominal bore", formatMm(design.boreDiameterMm)],
        [
            "Axial width / row pitch",
            `${formatMm(design.axialWidthMm)} / ${formatMm(validation.derived?.cellAxialLengthMm)}`,
        ],
        ["Tube wall", formatMm(design.tubeWallThicknessMm)],
        ["Maze projection", formatMm(design.wallProjectionMm)],
        [
            "Key clearances",
            `${formatMm(design.keySleeveClearanceMm)} sleeve / ${formatMm(design.keyToothClearanceMm)} tooth / ${formatMm(design.keyAxialClearanceMm)} axial`,
        ],
        [
            "Circumferential taper",
            `${formatMm(design.circumferentialWallAttachedThicknessMm)} → ${formatMm(design.circumferentialWallExposedThicknessMm)}`,
        ],
        ["Axial wall thickness", formatMm(design.axialWallPhysicalThicknessMm)],
        ["Sleeve axial width", formatMm(design.keySleeveAxialWidthMm)],
        [
            "Curved tooth",
            `${formatMm(design.keyToothBaseDiameterMm)} height · center Z ${formatMm(design.keyToothAxialCenterFromBedMm)}`,
        ],
        [
            "Print settings",
            `P1S · PLA · ${formatMm(PRINT_BASELINE.nozzleDiameterMm)} / ${formatMm(PRINT_BASELINE.layerHeightMm)}`,
        ],
    ];

    return (
        <details className="design-panel">
            <summary>Size &amp; print details</summary>
            <div className="ring-size-panel">
                <p id="ring-size-note">
                    {ringSizeNote} Blue Nile chart diameters are rounded to 0.1 mm;
                    modeled fit compensation remains {formatMm(PRINT_BASELINE.fitCompensationMm)}.
                </p>
            </div>
            <div className="design-summary">
                <div className="design-description">
                    <strong>{design.summary}</strong>
                    <span className="design-note">{design.qualification}</span>
                    <small>
                        Bambu Lab P1S / PLA. Check slicing and fit when changing size or print settings.
                    </small>
                </div>
                <dl className="parameter-grid">
                    {parameters.map(([label, value]) => (
                        <div key={label}>
                            <dt>{label}</dt>
                            <dd>{value}</dd>
                        </div>
                    ))}
                </dl>
            </div>
            <div className="design-help">
                <p>The inner ring is the maze; the outer ring is the moving key.</p>
                <p>Generate a maze, then click its edges to toggle walls. The 3D model updates live.</p>
                <p>Rows and columns apply only when you Generate a new maze, replacing your edits.
                    Ring size and height keep your current maze unchanged.</p>
                <p>Height includes a 1.2 mm bottom allowance. Each row needs at least 5 mm:
                    for a shorter ring, generate fewer rows first, then reduce height.
                    Generating more rows raises height only if needed to fit them; fewer rows do not lower it automatically.</p>
                <p>Height ranges from 11.2 mm with two rows to 31.2 mm maximum.
                    The sleeve is three quarters of the maze grid height, with the tooth and tactile dot centered on it.
                    Columns are limited to 6–12 for tooth clearance across the listed ring sizes.
                    Changed dimensions and blocked starting placements still need slicing and fit review.</p>
                <p>Drag to orbit and scroll to zoom. Pause rotation for a closer look.</p>
                <p>Export the displayed maze as a bed-up STL: Z is up and both parts start at Z = 0.</p>
            </div>
        </details>
    );
};

const MazeGenerator = () => {
    const [maze, setMaze] = useState(() => generateAldousBroderMaze());
    const [boreDiameterInput, setBoreDiameterInput] = useState("18");
    const [heightInput, setHeightInput] = useState("21.2");
    const [rowsInput, setRowsInput] = useState("4");
    const [columnsInput, setColumnsInput] = useState("10");
    const [generationError, setGenerationError] = useState("");
    const [markerShape, setMarkerShape] = useState("dot");
    const design = useMemo(() => withPhysicalHeight({
        ...getPrintDesign(STANDARD_DESIGN_ID),
        boreDiameterMm: parseInput(boreDiameterInput),
        markerShape,
    }, parseInput(heightInput)), [boreDiameterInput, heightInput, markerShape]);
    const rows = parseInput(rowsInput);
    const columns = parseInput(columnsInput);
    const dimensionsValid = areMazeDimensionsValid(columns, rows);
    const dimensionsPending = rows !== maze.rows || columns !== maze.columns;
    const heightValid = Number.isFinite(design.axialWidthMm)
        && design.axialWidthMm >= getMinimumHeightMm(maze.rows)
        && design.axialWidthMm <= MAX_HEIGHT_MM;
    // A shorter draft may be invalid for the current maze but fit the next one.
    const generationHeightValid = heightValid || (dimensionsValid
        && Number.isFinite(design.axialWidthMm)
        && design.axialWidthMm >= getMinimumHeightMm(rows)
        && design.axialWidthMm <= MAX_HEIGHT_MM);
    const validation = validatePrintDesign(design, maze);
    const ringSizeMatch = getUsRingSizeMatch(design.boreDiameterMm);
    const selectedRingSize = ringSizeMatch.kind === "listed" ? String(ringSizeMatch.usSize) : "custom";

    const generateMaze = () => {
        // Recheck drafts here too: DOM min/max/disabled are not a validation boundary.
        if (!dimensionsValid || !generationHeightValid) return;
        try {
            const nextMaze = generateAldousBroderMaze(columns, rows);
            setMaze(nextMaze);
            setHeightInput(String(Math.max(design.axialWidthMm, getMinimumHeightMm(rows))));
            setGenerationError("");
        } catch (error) {
            setGenerationError(error.message);
        }
    };
    const toggleEdge = (edge) => {
        setMaze((currentMaze) => toggleMazeEdge(currentMaze, edge));
    };
    const mazeControls = (
        <>
            <div className="ring-size-controls dimension-controls">
                <label>
                    <span>Maze rows</span>
                    <input type="number" min={MAZE_LIMITS.minRows} max={MAZE_LIMITS.maxRows} step="1"
                        value={rowsInput} aria-invalid={!dimensionsValid}
                        onChange={(event) => setRowsInput(event.target.value)} />
                </label>
                <label>
                    <span>Maze columns</span>
                    <input type="number" min={MAZE_LIMITS.minColumns} max={MAZE_LIMITS.maxColumns} step="1"
                        value={columnsInput} aria-invalid={!dimensionsValid}
                        onChange={(event) => setColumnsInput(event.target.value)} />
                </label>
            </div>
            <button onClick={generateMaze} disabled={!dimensionsValid || !generationHeightValid}>
                {dimensionsPending && dimensionsValid ? `Generate ${rows} × ${columns} maze` : "Generate new maze"}
            </button>
            {!dimensionsValid && <p className="design-error" role="alert">Use 2–6 whole rows and 6–12 whole columns.</p>}
            {generationError && <p className="design-error" role="alert">{generationError}</p>}
        </>
    );
    const sizeControls = (
        <div className="ring-size-controls dimension-controls">
            <label>
                <span>US ring size</span>
                <select value={selectedRingSize} onChange={(event) => {
                    const selected = US_RING_SIZE_CHART.find((entry) => String(entry.usSize) === event.target.value);
                    if (selected) setBoreDiameterInput(String(selected.boreDiameterMm));
                }}>
                    {selectedRingSize === "custom" && <option value="custom" disabled>
                        {ringSizeMatch.kind === "approximate" ? `Current fit · ≈ US ${ringSizeMatch.usSize.toFixed(1)}` : "Custom bore"}
                    </option>}
                    {US_RING_SIZE_CHART.map((entry) => (
                        <option key={entry.usSize} value={entry.usSize}>
                            US {formatUsSize(entry.usSize)} · {entry.boreDiameterMm.toFixed(1)} mm
                        </option>
                    ))}
                </select>
            </label>
            <label>
                <span>Ring height (mm)</span>
                <input type="number" min={getMinimumHeightMm(maze.rows)} max={MAX_HEIGHT_MM} step="0.1"
                    value={heightInput} aria-invalid={!heightValid}
                    onChange={(event) => setHeightInput(event.target.value)} />
            </label>
            <label>
                <span>Tooth marker</span>
                <select value={markerShape} onChange={(event) => setMarkerShape(event.target.value)}>
                    {MARKER_SHAPES.map((shape) => (
                        <option key={shape.id} value={shape.id}>{shape.name}</option>
                    ))}
                </select>
            </label>
        </div>
    );

    return (
        <main aria-label="Maze editor and 3D preview">
            <div className="workspace">
                <section className="panel svg-panel" aria-labelledby="svg-panel-title">
                    <header className="panel-heading">
                        <div className="panel-title">
                            <span className="panel-number" aria-hidden="true">1</span>
                            <div><h2 id="svg-panel-title">SVG maze editor</h2></div>
                        </div>
                        <span className="live-status">Editable</span>
                    </header>
                    <SVGMazeGenerator maze={maze} controls={mazeControls} onEdgeToggle={toggleEdge} />
                </section>
                <section className="panel preview-panel" aria-labelledby="preview-panel-title">
                    <header className="panel-heading">
                        <div className="panel-title">
                            <span className="panel-number" aria-hidden="true">2</span>
                            <div><h2 id="preview-panel-title">3D asset preview</h2></div>
                        </div>
                        <span className="live-status">Live</span>
                    </header>
                    <ThreeDMazeGenerator maze={maze} design={design} controls={sizeControls} />
                    {validation.warnings.length > 0 && (
                        <p className="design-warning">{validation.warnings.join(" ")}</p>
                    )}
                    {validation.errors.length > 0 && (
                        <p className="design-error" role="alert">
                            {validation.errors.join(" ")} Preview and export remain paused until corrected.
                        </p>
                    )}
                </section>
            </div>
            <DesignDetails design={design} maze={maze} />
        </main>
    );
};

ReactDOM.render(<MazeGenerator />, document.getElementById("app"));
