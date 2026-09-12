import { DECORATION_DEFAULTS, hasCenterBand } from './decorationGeometry.js?v=decorations';
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
    const [markerShape, setMarkerShape] = useState("heart");
    const [waveCountInput, setWaveCountInput] = useState("6");
    const [waveHeightInput, setWaveHeightInput] = useState("1");
    const [rimWaveCountInput, setRimWaveCountInput] = useState("6");
    const [rimWaveHeightInput, setRimWaveHeightInput] = useState("1");
    const [decorationDraft, setDecorationDraft] = useState(() => Object.fromEntries(Object.entries(DECORATION_DEFAULTS).map(([k,v])=>[k,v===null?"":String(v)])));
    const decoration = Object.fromEntries(Object.entries(decorationDraft).map(([k,v])=>[k,['bandStyle','sleeveText','sleeveTextSecond'].includes(k)?v:k==='bandDistanceMm' && v===''?null:parseInput(v)]));
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
    const numericDecoration = (key,label,min,max,step,disabled=false,note=null) => <label>
        <span id={`${key}-label`}>{label}</span><input type="number" aria-labelledby={`${key}-label`} min={min} max={Math.max(min,Math.floor(max*100)/100)} step={step}
            value={decorationDraft[key]} disabled={disabled}
            aria-invalid={!disabled && (!Number.isFinite(design[key]) || design[key]<min || design[key]>max)}
            aria-describedby={note ? `${key}-note` : undefined}
            onChange={event=>setDecoration(key,event.target.value)} />{note && <small id={`${key}-note`}>{note}</small>}</label>;
    const sizeControls = (
        <div className="decoration-controls">
        <details className="visual-guide"><summary>Visual guide</summary>
            <figure><div className="guide-views"><img src="./docs/decoration-guide-marker.svg" alt="Actual model: heart marker behind the tooth and two wavy decorative bands near the edges." /><img src="./docs/decoration-guide-text.svg" alt="Opposite side of the same actual model: curved AMAZE lettering between the bands." /></div>
            <figcaption>Earlier example · two wavy bands and raised lettering. Guide images await approval of the new default aesthetic.</figcaption></figure>
        </details>
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
                <span>Side bulges around ring (count)</span>
                <input type="number" min="0" max="32" step="1"
                    value={waveCountInput}
                    aria-invalid={!Number.isInteger(design.outerWaveCount) || design.outerWaveCount < 0 || design.outerWaveCount > 32}
                    onChange={(event) => setWaveCountInput(event.target.value)} />
            </label>
            <label>
                <span>Outward bulge (mm added to sleeve sides)</span>
                <input type="number" min="0" max="3" step="0.1"
                    value={waveHeightInput}
                    aria-invalid={!Number.isFinite(design.outerWaveHeightMm) || design.outerWaveHeightMm < 0 || design.outerWaveHeightMm > 3}
                    onChange={(event) => setWaveHeightInput(event.target.value)} />
            </label>
            <label>
                <span>Waves around top &amp; bottom edges</span>
                <input type="number" min="0" max="32" step="1"
                    value={rimWaveCountInput}
                    aria-invalid={!Number.isInteger(design.rimWaveCount) || design.rimWaveCount < 0 || design.rimWaveCount > 32}
                    onChange={(event) => setRimWaveCountInput(event.target.value)} />
            </label>
            <label>
                <span>Edge wave depth (mm inward dip of each rim)</span>
                <input type="number" min="0" max="1" step="0.1"
                    value={rimWaveHeightInput} aria-describedby="rim-wave-note"
                    aria-invalid={!Number.isFinite(design.rimWaveHeightMm) || design.rimWaveHeightMm < 0 || design.rimWaveHeightMm > 1}
                    onChange={(event) => setRimWaveHeightInput(event.target.value)} />
            </label>
            <small id="rim-wave-note">Side bulges add thickness outward, from zero at each valley to the chosen maximum. Edge waves lift the bottom edge and lower the top edge by up to the chosen depth; the ring is narrower there. A zero count or depth disables that wave effect.</small>
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
            {numericDecoration('markerDepthMm','Marker depth (mm)',-.2,1,.05,markerShape==='none')}
            <small>Locator behind the working tooth. None hides only the locator. Positive raises outward; negative cuts inward; zero has no relief.</small>
        </div></details>
        <details open><summary>Decorative bands</summary><div className="control-grid">
            <label><span>Quantity</span><select value={decorationDraft.bandCount} onChange={e=>setDecoration('bandCount',e.target.value)}>
                <option value="0">0 · None</option><option value="1">1 · Center</option><option value="2">2 · Quarter positions</option><option value="3">3 · Even thirds</option><option value="4">4 · Two pairs</option><option value="5">5 · Two pairs + center</option></select></label>
            <label><span>Line style</span><select disabled={!design.bandCount} value={decorationDraft.bandStyle} onChange={e=>setDecoration('bandStyle',e.target.value)}>
                <option value="straight">Straight</option><option value="wavy">Wavy</option></select></label>
            {numericDecoration('bandWidthMm','Line width (mm)',.4,3,.05,!design.bandCount)}
            {numericDecoration('bandDepthMm','Band depth (mm)',-.2,1,.05,!design.bandCount,'Negative engraves / Positive raises / 0 none. Range: −0.2 to +1 mm.')}
            {design.bandStyle==='wavy' && <>
                {numericDecoration('bandWaveAlignmentDeg','Wave alignment (°)',0,360,1,!design.bandCount,'0–360° of one wave cycle relative to the fixed marker. All decorative lines shift together; 180° swaps crests/troughs; 360° = 0°.')}
                {numericDecoration('bandWaveCount','Line waves per turn',1,16,1,!design.bandCount)}
                {numericDecoration('bandWaveAmplitudeMm','Line waviness (mm up/down from centerline)',0,3,.05,!design.bandCount)}
            </>}
            {[2,4,5].includes(design.bandCount) && <label><span>Distance from center (mm)</span><input type="number" min="0" max="20" step="0.05" placeholder={String(design.keySleeveAxialWidthMm/4)} aria-invalid={design.bandDistanceMm!==null && (!Number.isFinite(design.bandDistanceMm) || design.bandDistanceMm<0 || design.bandDistanceMm>20)} value={decorationDraft.bandDistanceMm} onChange={e=>setDecoration('bandDistanceMm',e.target.value)} /></label>}
            {[4,5].includes(design.bandCount) && numericDecoration('bandPairSpacingMm','Pair spacing (mm center-to-center)',.1,20,.05)}
            <small>Width runs up/down the sleeve. Waviness moves each line that far above and below its centerline; all lines wave together. Distance measures from the sleeve middle to each single line or pair midpoint (blank follows one quarter of sleeve height). Pair spacing measures between the two line centers.</small>
        </div></details>
        <details open><summary>Text</summary><div className="control-grid">
            <label className="full-control"><span>{hasCenterBand(design)?'Sleeve text · above center band':'Sleeve text'}</span><input type="text" maxLength="96" value={decorationDraft.sleeveText} onChange={e=>setDecoration('sleeveText',e.target.value)} /></label>
            {hasCenterBand(design) && <label className="full-control"><span>Sleeve text · below center band</span><input type="text" maxLength="96" value={decorationDraft.sleeveTextSecond} onChange={e=>setDecoration('sleeveTextSecond',e.target.value)} /></label>}
            {numericDecoration('textSizeMm','Font size (mm)',.5,10,.1)}
            {numericDecoration('textDepthMm','Text depth (mm)',-.2,1,.05)}
            <small>Curved bold lettering opposite the tooth. Counts 1, 3 and 5 place two independent lines above/below the center band, between neighboring bands where present. Both drafts survive count changes. Up to 96 characters per line; blank omits a line. Positive depth raises outward; negative cuts inward. Fit warnings keep your requested font size.</small>
        </div></details>

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
