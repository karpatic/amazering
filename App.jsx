import { SVGMazeGenerator } from "./mazeGenerator.js";
import { ThreeDMazeGenerator } from "./threeDGenerator.js";

const { useCallback, useState } = React;

const MazeGenerator = () => {
    const [svgMaze, setSvgMaze] = useState(null);

    const onMazeGenerated = useCallback((newMaze) => {
        const cloned = JSON.parse(JSON.stringify(newMaze));

        setSvgMaze(cloned);
    }, []);

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
                <SVGMazeGenerator onMazeGenerated={onMazeGenerated} />
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
                <ThreeDMazeGenerator svgMaze={svgMaze} />
            </section>
        </main>
    );
};

ReactDOM.render(<MazeGenerator />, document.getElementById("app"));
