import { DECORATION_DEFAULTS, decorationBounds, textMetrics } from './decorationGeometry.js?v=decorations';
import { SVGMazeGenerator } from "./mazeGenerator.js?v=decorations";
import { ThreeDMazeGenerator } from "./threeDGenerator.js?v=decorations";
import {
    generateAldousBroderMaze,
    toggleMazeEdge,
    MAZE_LIMITS,
    areMazeDimensionsValid,
} from "./mazeModel.js?v=decorations";
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
} from "./printDesign.js?v=decorations";

import { MARKER_SHAPES } from "./markerGeometry.js?v=decorations";

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
    const [waveCountInput, setWaveCountInput] = useState("0");
    const [waveHeightInput, setWaveHeightInput] = useState("0");
    const [rimWaveCountInput, setRimWaveCountInput] = useState("0");
    const [rimWaveHeightInput, setRimWaveHeightInput] = useState("0");
    const [decorationDraft, setDecorationDraft] = useState(() => Object.fromEntries(Object.entries(DECORATION_DEFAULTS).map(([k,v])=>[k,String(v)])));
    const decoration = Object.fromEntries(Object.entries(decorationDraft).map(([k,v])=>[k,['bandStyle','sleeveText'].includes(k)?v:parseInput(v)]));
    const setDecoration = (key,value) => setDecorationDraft(current=>({...current,[key]:value}));
    const design = useMemo(() => withPhysicalHeight({
        ...getPrintDesign(STANDARD_DESIGN_ID),
        boreDiameterMm: parseInput(boreDiameterInput),
        markerShape,
        ...decoration,
        outerWaveCount: parseInput(waveCountInput),
        outerWaveHeightMm: parseInput(waveHeightInput),
        rimWaveCount: parseInput(rimWaveCountInput),
        rimWaveHeightMm: parseInput(rimWaveHeightInput),
    }, parseInput(heightInput)), [decorationDraft, boreDiameterInput, heightInput, markerShape, waveCountInput, waveHeightInput, rimWaveCountInput, rimWaveHeightInput]);
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
    const bounds = decorationBounds(design);
    const numericDecoration = (key,label,min,max,step,disabled=false) => <label>
        <span>{label}</span><input type="number" min={min} max={Math.max(min,Math.floor(max*100)/100)} step={step}
            value={decorationDraft[key]} disabled={disabled}
            aria-invalid={!disabled && (!Number.isFinite(design[key]) || design[key]<min || design[key]>max)}
            onChange={event=>setDecoration(key,event.target.value)} /></label>;
    const sizeControls = (
        <div className="decoration-controls">
        <details open><summary>Shape</summary><div className="control-grid">
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
                <span>Radial exterior wave count (0 = none)</span>
                <input type="number" min="0" max="32" step="1"
                    value={waveCountInput}
                    aria-invalid={!Number.isInteger(design.outerWaveCount) || design.outerWaveCount < 0 || design.outerWaveCount > 32}
                    onChange={(event) => setWaveCountInput(event.target.value)} />
            </label>
            <label>
                <span>Radial wave height (mm, outward)</span>
                <input type="number" min="0" max="3" step="0.1"
                    value={waveHeightInput}
                    aria-invalid={!Number.isFinite(design.outerWaveHeightMm) || design.outerWaveHeightMm < 0 || design.outerWaveHeightMm > 3}
                    onChange={(event) => setWaveHeightInput(event.target.value)} />
            </label>
            <label>
                <span>Rim/edge wave count (0 = none)</span>
                <input type="number" min="0" max="32" step="1"
                    value={rimWaveCountInput}
                    aria-invalid={!Number.isInteger(design.rimWaveCount) || design.rimWaveCount < 0 || design.rimWaveCount > 32}
                    onChange={(event) => setRimWaveCountInput(event.target.value)} />
            </label>
            <label>
                <span>Axial rim wave height (mm)</span>
                <input type="number" min="0" max="1" step="0.1"
                    value={rimWaveHeightInput} aria-describedby="rim-wave-note"
                    aria-invalid={!Number.isFinite(design.rimWaveHeightMm) || design.rimWaveHeightMm < 0 || design.rimWaveHeightMm > 1}
                    onChange={(event) => setRimWaveHeightInput(event.target.value)} />
            </label>
            <small id="rim-wave-note">Each rim moves inward by 0–height mm (trough to crest),
                symmetrically about the band middle. Either rim value at 0 disables rim waves;
                radial waves are independent.</small>
        </div></details>
        <details open><summary>Marker</summary><div className="control-grid">
            <label>
                <span>Marker shape</span>
                <select value={markerShape} onChange={(event) => setMarkerShape(event.target.value)}>
                    {MARKER_SHAPES.map((shape) => (
                        <option key={shape.id} value={shape.id}>{shape.name}</option>
                    ))}
                </select>
            </label>
            {numericDecoration('markerDepthMm','Marker depth (mm)',-.2,.6,.05,markerShape==='none')}
            <small>Locator behind the working tooth. None hides only the locator. Positive raises; negative engraves; zero has no relief.</small>
        </div></details>
        <details open><summary>Decorative bands</summary><div className="control-grid">
            <label><span>Quantity</span><select value={decorationDraft.bandCount} onChange={e=>setDecoration('bandCount',e.target.value)}>
                <option value="0">0 · None</option><option value="1">1 · Center</option><option value="2">2 · Near edges</option></select></label>
            <label><span>Line style</span><select disabled={!design.bandCount} value={decorationDraft.bandStyle} onChange={e=>setDecoration('bandStyle',e.target.value)}>
                <option value="straight">Straight</option><option value="wavy">Wavy</option></select></label>
            {numericDecoration('bandWidthMm','Line width (mm)',.4,bounds.bandWidthMax,.05,!design.bandCount)}
            {numericDecoration('bandDepthMm','Band depth (mm)',-.2,.6,.05,!design.bandCount)}
            {design.bandStyle==='wavy' && <>
                {numericDecoration('bandWaveCount','Line waves per turn',1,16,1,!design.bandCount)}
                {numericDecoration('bandWaveAmplitudeMm','Line wave amplitude (±mm)',0,bounds.amplitudeMax,.05,!design.bandCount)}
            </>}
            <small>Horizontal lines on the sleeve. Two leave the middle free. Width is axial; wave amplitude is ± centerline travel. Positive depth raises; negative engraves; zero has no relief.</small>
        </div></details>
        <details open><summary>Text</summary><div className="control-grid">
            <label className="full-control"><span>Sleeve text</span><input type="text" maxLength="24" value={decorationDraft.sleeveText}
                disabled={design.bandCount===1} onChange={e=>setDecoration('sleeveText',e.target.value)} /></label>
            {numericDecoration('textSizeMm','Font size (mm)',2,bounds.textSizeMax,.1,design.bandCount===1)}
            {numericDecoration('textDepthMm','Text depth (mm)',-.2,.6,.05,design.bandCount===1)}
            <small>{design.bandCount===1 ? 'One center band hides text. Your draft is retained; choose 0 or 2 bands to restore it.' :
                `Bold curved lettering, centered opposite the tooth even with Marker None. Up to 24 Latin letters, digits or simple punctuation; arc width ${textMetrics(design.sleeveText,design.textSizeMm).width.toFixed(1)} / ${bounds.arcLimit.toFixed(1)} mm. Positive raises; negative engraves.`}</small>
        </div></details>
        <details className="visual-guide"><summary>Visual guide</summary>
            <figure><div className="guide-views"><img src="./docs/decoration-guide-marker.svg" alt="Actual model: heart marker behind the tooth and two wavy decorative bands near the edges." /><img src="./docs/decoration-guide-text.svg" alt="Opposite side of the same actual model: curved AMAZE lettering between the bands." /></div>
            <figcaption>Example model · two wavy bands and raised lettering. Shape controls change the sleeve; Appearance changes only the preview.</figcaption></figure>
        </details>
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
