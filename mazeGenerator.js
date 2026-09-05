const CELL_SIZE = 40;
const PADDING = 10;

const edgeKey = (edge) => {
    if (edge.axis === "horizontal") {
        return `horizontal-${edge.boundaryRow}-${edge.column}`;
    }

    return `vertical-${edge.row}-${edge.drawColumn}`;
};

const edgeLabel = (edge, maze) => {
    if (edge.axis === "horizontal" && edge.boundaryRow === 0) {
        return `Set entrance at column ${edge.column + 1}`;
    }

    if (edge.axis === "horizontal" && edge.boundaryRow === maze.rows) {
        return `Set exit at column ${edge.column + 1}`;
    }

    if (edge.axis === "horizontal") {
        return `Toggle horizontal wall at row ${edge.boundaryRow}, column ${edge.column + 1}`;
    }

    if (edge.column === 0) {
        return `Toggle cylindrical seam wall at row ${edge.row + 1}`;
    }

    return `Toggle vertical wall at row ${edge.row + 1}, column ${edge.column + 1}`;
};

const getEditorEdges = (maze) => {
    const edges = [];

    for (let boundaryRow = 0; boundaryRow <= maze.rows; boundaryRow += 1) {
        for (let column = 0; column < maze.columns; column += 1) {
            edges.push({
                axis: "horizontal",
                boundaryRow,
                column,
                isWall: maze.horizontalWalls[boundaryRow][column],
                x1: column * CELL_SIZE + PADDING,
                y1: boundaryRow * CELL_SIZE + PADDING,
                x2: (column + 1) * CELL_SIZE + PADDING,
                y2: boundaryRow * CELL_SIZE + PADDING,
            });
        }
    }

    for (let row = 0; row < maze.rows; row += 1) {
        // The seam appears at both ends of the unwrapped SVG. Both lines point
        // to verticalWalls[row][0], so either endpoint edits the same wall.
        for (let drawColumn = 0; drawColumn <= maze.columns; drawColumn += 1) {
            const column = drawColumn % maze.columns;
            edges.push({
                axis: "vertical",
                row,
                column,
                drawColumn,
                isWall: maze.verticalWalls[row][column],
                x1: drawColumn * CELL_SIZE + PADDING,
                y1: row * CELL_SIZE + PADDING,
                x2: drawColumn * CELL_SIZE + PADDING,
                y2: (row + 1) * CELL_SIZE + PADDING,
            });
        }
    }

    return edges;
};

const MazeEdge = ({ edge, maze, onToggle }) => {
    const handleKeyDown = (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        onToggle(edge);
    };

    return (
        <g>
            <line
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={edge.isWall ? "black" : "#dddddd"}
                strokeWidth="5"
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
            />
            <line
                className="maze-edge-hit"
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke="transparent"
                strokeWidth="16"
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex="0"
                aria-label={edgeLabel(edge, maze)}
                onClick={() => onToggle(edge)}
                onKeyDown={handleKeyDown}
            />
        </g>
    );
};

const SVGMazeGenerator = ({ maze, onGenerate, onEdgeToggle }) => {
    const width = maze.columns * CELL_SIZE + PADDING * 2;
    const height = maze.rows * CELL_SIZE + PADDING * 2;
    const edges = getEditorEdges(maze);

    return (
        <div id="svgContainer">
            <div className="panel-actions">
                <button onClick={onGenerate}>Generate new maze</button>
                <span className="action-hint">
                    Click edges to toggle walls. The 3D model updates live.
                </span>
            </div>
            <div className="svg-stage">
                <svg
                    width={width}
                    height={height}
                    viewBox={`0 0 ${width} ${height}`}
                    aria-label="Editable unwrapped maze"
                >
                    {edges.map((edge) => (
                        <MazeEdge
                            key={edgeKey(edge)}
                            edge={edge}
                            maze={maze}
                            onToggle={onEdgeToggle}
                        />
                    ))}
                    <rect
                        x={maze.entranceColumn * CELL_SIZE + PADDING}
                        y={PADDING}
                        width={CELL_SIZE}
                        height={CELL_SIZE / 2}
                        fill="green"
                        pointerEvents="none"
                    />
                    <rect
                        x={maze.exitColumn * CELL_SIZE + PADDING}
                        y={height - CELL_SIZE / 2 - PADDING}
                        width={CELL_SIZE}
                        height={CELL_SIZE / 2}
                        fill="red"
                        pointerEvents="none"
                    />
                </svg>
            </div>
            <div className="maze-legend" aria-label="Maze markers">
                <span className="legend-item legend-entry">
                    <span className="legend-swatch"></span>Entrance
                </span>
                <span className="legend-item legend-exit">
                    <span className="legend-swatch"></span>Exit
                </span>
            </div>
        </div>
    );
};

export { SVGMazeGenerator };
