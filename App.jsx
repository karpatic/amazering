import { SVGMazeGenerator } from "./mazeGenerator.js?v=standard-model";
import { ThreeDMazeGenerator } from "./threeDGenerator.js?v=standard-model";
import {
    generateAldousBroderMaze,
    toggleMazeEdge,
} from "./mazeModel.js?v=standard-model";
import {
    STANDARD_DESIGN_ID,
    PRINT_BASELINE,
    US_RING_SIZE_CHART,
    getPrintDesign,
    getUsRingSizeMatch,
    validatePrintDesign,
} from "./printDesign.js?v=standard-model";

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
    onBoreDiameterChange,
}) => {
    const validation = validatePrintDesign(design, maze);
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
        <section className="design-panel" aria-labelledby="print-design-title">
            <div className="design-select-wrap">
                <div>
                    <span className="eyebrow">Print design</span>
                    <h2 id="print-design-title">{design.name}</h2>
                </div>
            </div>
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
                                {selectedRingSize === "custom" && (
                                    <option value="custom" disabled>
                                        Current fit · ≈ US {ringSizeMatch.usSize?.toFixed(1)}
                                    </option>
                                )}
                                {US_RING_SIZE_CHART.map((entry) => (
                                    <option key={entry.usSize} value={entry.usSize}>
                                        US {formatUsSize(entry.usSize)} · {entry.boreDiameterMm.toFixed(1)} mm
                                    </option>
                                ))}
                            </select>
                        </label>

                    </div>
                    <p id="ring-size-note">
                        {ringSizeNote} Blue Nile chart diameters are rounded to 0.1 mm;
                        modeled fit compensation remains {formatMm(PRINT_BASELINE.fitCompensationMm)}.
                    </p>
                </div>
            <div className="design-summary">
                <div className="design-description">
                    <strong>{design.summary}</strong>
                    <span className="design-note">
                        {design.qualification}
                    </span>
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
    const [boreDiameterInput, setBoreDiameterInput] = useState("18");
    const design = useMemo(() => {
        const preset = getPrintDesign(STANDARD_DESIGN_ID);
        const boreDiameterMm = boreDiameterInput.trim() === ""
            ? Number.NaN
            : Number(boreDiameterInput);
        return { ...preset, boreDiameterMm };
    }, [boreDiameterInput]);

    const generateMaze = () => setMaze(generateAldousBroderMaze());
    const toggleEdge = (edge) => {
        setMaze((currentMaze) => toggleMazeEdge(currentMaze, edge));
    };

    return (
        <main aria-label="Maze editor and 3D preview">
            <DesignControl
                design={design}
                maze={maze}
                onBoreDiameterChange={setBoreDiameterInput}
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
                                <p>Your maze, ready for bed-up STL export.</p>
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
