import { SVGMazeGenerator } from "./mazeGenerator.js";
import { ThreeDMazeGenerator } from "./threeDGenerator.js";
import {
    generateAldousBroderMaze,
    toggleMazeEdge,
} from "./mazeModel.js";

const { useState } = React;

const MazeGenerator = () => {
    const [maze, setMaze] = useState(() => generateAldousBroderMaze());

    const generateMaze = () => setMaze(generateAldousBroderMaze());
    const toggleEdge = (edge) => {
        setMaze((currentMaze) => toggleMazeEdge(currentMaze, edge));
    };

    return (
        <main className="workspace" aria-label="Maze editor and 3D preview">
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
                            <p>Print in place (turn on supports).</p>
                        </div>
                    </div>
                    <span className="live-status">Live</span>
                </header>
                <ThreeDMazeGenerator maze={maze} />
            </section>
        </main>
    );
};

ReactDOM.render(<MazeGenerator />, document.getElementById("app"));
