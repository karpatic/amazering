import { SVGMazeGenerator } from "./mazeGenerator.js";
import { ThreeDMazeGenerator } from "./threeDGenerator.js";
import {
    generateAldousBroderMaze,
    toggleMazeEdge,
} from "./mazeModel.js";
import {
    COMFORT_STUDY_ID,
    PRINT_BASELINE,
    PRINT_DESIGNS,
    REFERENCE_DESIGN_ID,
    US_RING_SIZE_CHART,
    getPrintDesign,
    getUsRingSizeMatch,
    validatePrintDesign,
} from "./printDesign.js";

const { useMemo, useState } = React;

const formatMm = (value) => Number.isFinite(value)
    ? `${value.toFixed(2).replace(/\.00$/, "")} mm`
    : "—";
const formatUsSize = (value) => Number.isInteger(value)
    ? value.toFixed(0)
    : value.toFixed(1);

const DesignControl = ({
    design,
    maze,
    boreDiameterInput,
    onPresetChange,
    onBoreDiameterChange,
}) => {
    const validation = validatePrintDesign(design, maze);
    const usesRingSizing = design.id === COMFORT_STUDY_ID;
    const ringSizeMatch = getUsRingSizeMatch(design.boreDiameterMm);
    const selectedRingSize = ringSizeMatch.kind === "listed"
        ? String(ringSizeMatch.usSize)
        : "custom";
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
        ["Axial width", formatMm(design.axialWidthMm)],
        ["Tube wall", formatMm(design.tubeWallThicknessMm)],
        ["Maze projection", formatMm(design.wallProjectionMm)],
        [
            "Key clearance",
            `${formatMm(design.keyClearanceMm)} radial / ${formatMm(design.keyAxialClearanceMm)} axial`,
        ],
        [
            "Circumferential taper",
            `${formatMm(design.circumferentialWallAttachedThicknessMm)} → ${formatMm(design.circumferentialWallExposedThicknessMm)}`,
        ],
        ["Axial wall thickness", formatMm(design.axialWallPhysicalThicknessMm)],
        [
            usesRingSizing ? "Print baseline" : "Nozzle reference",
            usesRingSizing
                ? `P1S · PLA · ${formatMm(PRINT_BASELINE.nozzleDiameterMm)} / ${formatMm(PRINT_BASELINE.layerHeightMm)}`
                : formatMm(design.nozzleDiameterMm),
        ],
    ];

    return (
        <section className="design-panel" aria-labelledby="print-design-title">
            <div className="design-select-wrap">
                <div>
                    <span className="eyebrow">Print design</span>
                    <h2 id="print-design-title">Choose a model treatment</h2>
                </div>
                <label className="design-select">
                    <span>Design preset</span>
                    <select
                        value={design.id}
                        onChange={(event) => onPresetChange(event.target.value)}
                    >
                        {PRINT_DESIGNS.map((option) => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                    </select>
                </label>
            </div>
            {usesRingSizing && (
                <div className="ring-size-panel">
                    <div className="ring-size-controls">
                        <label>
                            <span>US ring size</span>
                            <select
                                value={selectedRingSize}
                                onChange={(event) => {
                                    const selected = US_RING_SIZE_CHART.find(
                                        (entry) => String(entry.usSize) === event.target.value,
                                    );
                                    if (selected) {
                                        onBoreDiameterChange(String(selected.boreDiameterMm));
                                    }
                                }}
                            >
                                <option value="custom">Custom diameter</option>
                                {US_RING_SIZE_CHART.map((entry) => (
                                    <option key={entry.usSize} value={entry.usSize}>
                                        US {formatUsSize(entry.usSize)} · {entry.boreDiameterMm.toFixed(1)} mm
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            <span>Nominal bore diameter (mm)</span>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                inputMode="decimal"
                                value={boreDiameterInput}
                                aria-describedby="ring-size-note"
                                onChange={(event) => onBoreDiameterChange(event.target.value)}
                            />
                        </label>
                    </div>
                    <p id="ring-size-note">
                        {ringSizeNote} Blue Nile chart diameters are rounded to 0.1 mm;
                        modeled fit compensation remains {formatMm(PRINT_BASELINE.fitCompensationMm)}.
                    </p>
                </div>
            )}
            <div className="design-summary">
                <div className="design-description">
                    <strong>{design.summary}</strong>
                    <span className={design.id === REFERENCE_DESIGN_ID ? "reference-note" : "provisional-note"}>
                        {design.qualification}
                    </span>
                    <small>
                        {usesRingSizing
                            ? "Bambu Lab P1S / PLA study baseline; physical fit and print reliability are unverified."
                            : "Geometric clearance is nominal model space; it is not printer calibration."}
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
            {validation.warnings.length > 0 && (
                <p className="design-warning">{validation.warnings.join(" ")}</p>
            )}
            {validation.errors.length > 0 && (
                <p className="design-error" role="alert">
                    {validation.errors.join(" ")} Preview and export remain paused until corrected.
                </p>
            )}
        </section>
    );
};

const MazeGenerator = () => {
    const [maze, setMaze] = useState(() => generateAldousBroderMaze());
    const [designId, setDesignId] = useState(REFERENCE_DESIGN_ID);
    const [studyBoreDiameterInput, setStudyBoreDiameterInput] = useState("18");
    const design = useMemo(() => {
        const preset = getPrintDesign(designId);
        if (preset.id !== COMFORT_STUDY_ID) return preset;
        const boreDiameterMm = studyBoreDiameterInput.trim() === ""
            ? Number.NaN
            : Number(studyBoreDiameterInput);
        return { ...preset, boreDiameterMm };
    }, [designId, studyBoreDiameterInput]);

    const generateMaze = () => setMaze(generateAldousBroderMaze());
    const toggleEdge = (edge) => {
        setMaze((currentMaze) => toggleMazeEdge(currentMaze, edge));
    };

    return (
        <main aria-label="Maze editor and 3D preview">
            <DesignControl
                design={design}
                maze={maze}
                boreDiameterInput={studyBoreDiameterInput}
                onPresetChange={setDesignId}
                onBoreDiameterChange={setStudyBoreDiameterInput}
            />
            <div className="workspace">
                <section className="panel svg-panel" aria-labelledby="svg-panel-title">
                    <header className="panel-heading">
                        <div className="panel-title">
                            <span className="panel-number" aria-hidden="true">1</span>
                            <div>
                                <h2 id="svg-panel-title">SVG maze editor</h2>
                                <p>Shape the printable route wall by wall.</p>
                            </div>
                        </div>
                        <span className="live-status">Editable</span>
                    </header>
                    <SVGMazeGenerator
                        maze={maze}
                        onGenerate={generateMaze}
                        onEdgeToggle={toggleEdge}
                    />
                </section>

                <section className="panel preview-panel" aria-labelledby="preview-panel-title">
                    <header className="panel-heading">
                        <div className="panel-title">
                            <span className="panel-number" aria-hidden="true">2</span>
                            <div>
                                <h2 id="preview-panel-title">3D asset preview</h2>
                                <p>Prototype geometry; verify slicing, motion, and physical fit.</p>
                            </div>
                        </div>
                        <span className="live-status">Live</span>
                    </header>
                    <ThreeDMazeGenerator maze={maze} design={design} />
                </section>
            </div>
        </main>
    );
};

ReactDOM.render(<MazeGenerator />, document.getElementById("app"));
