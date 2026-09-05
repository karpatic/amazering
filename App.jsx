import { SVGMazeGenerator } from "./mazeGenerator.js";
import { ThreeDMazeGenerator } from "./threeDGenerator.js";
import {
    generateAldousBroderMaze,
    toggleMazeEdge,
} from "./mazeModel.js";
import {
    PRINT_DESIGNS,
    REFERENCE_DESIGN_ID,
    getPrintDesign,
    validatePrintDesign,
} from "./printDesign.js";

const { useState } = React;

const formatMm = (value) => `${value.toFixed(2).replace(/\.00$/, "")} mm`;

const DesignControl = ({ design, maze, onChange }) => {
    const validation = validatePrintDesign(design, maze);
    const parameters = [
        ["Bore diameter", formatMm(design.boreDiameterMm)],
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
        ["Nozzle reference", formatMm(design.nozzleDiameterMm)],
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
                    <select value={design.id} onChange={(event) => onChange(event.target.value)}>
                        {PRINT_DESIGNS.map((option) => (
                            <option key={option.id} value={option.id}>{option.name}</option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="design-summary">
                <div className="design-description">
                    <strong>{design.summary}</strong>
                    <span className={design.id === REFERENCE_DESIGN_ID ? "reference-note" : "provisional-note"}>
                        {design.qualification}
                    </span>
                    <small>
                        Geometric clearance is nominal model space; it is not printer calibration.
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
        </section>
    );
};

const MazeGenerator = () => {
    const [maze, setMaze] = useState(() => generateAldousBroderMaze());
    const [designId, setDesignId] = useState(REFERENCE_DESIGN_ID);
    const design = getPrintDesign(designId);

    const generateMaze = () => setMaze(generateAldousBroderMaze());
    const toggleEdge = (edge) => {
        setMaze((currentMaze) => toggleMazeEdge(currentMaze, edge));
    };

    return (
        <main aria-label="Maze editor and 3D preview">
            <DesignControl design={design} maze={maze} onChange={setDesignId} />
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
