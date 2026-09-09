export const MAZE_COLUMNS = 10;
export const MAZE_ROWS = 4;
export const MAZE_LIMITS = Object.freeze({ minRows: 2, maxRows: 6, minColumns: 6, maxColumns: 12 });
export const areMazeDimensionsValid = (columns, rows) =>
    Number.isInteger(columns) && columns >= MAZE_LIMITS.minColumns && columns <= MAZE_LIMITS.maxColumns
    && Number.isInteger(rows) && rows >= MAZE_LIMITS.minRows && rows <= MAZE_LIMITS.maxRows;

const makeGrid = (rowCount, columnCount, value) =>
    Array.from({ length: rowCount }, () => Array(columnCount).fill(value));

const wrapColumn = (column, columnCount) =>
    (column + columnCount) % columnCount;

/**
 * The maze stores each physical boundary exactly once:
 *
 * horizontalWalls[boundaryRow][column]
 *   boundaryRow 0 is the entrance end; boundaryRow rows is the exit end.
 *
 * verticalWalls[row][column]
 *   the wall on the left of column; column 0 is the cylindrical seam.
 */
export const generateAldousBroderMaze = (
    columns = MAZE_COLUMNS,
    rows = MAZE_ROWS,
    random = Math.random,
) => {
    if (!areMazeDimensionsValid(columns, rows)) {
        throw new RangeError("Use 2–6 whole rows and 6–12 whole columns.");
    }
    const sample = () => {
        const value = random();
        if (!Number.isFinite(value) || value < 0 || value >= 1) {
            throw new RangeError("Maze randomness must be finite and in [0, 1).");
        }
        return value;
    };
    const horizontalWalls = makeGrid(rows + 1, columns, true);
    const verticalWalls = makeGrid(rows, columns, true);
    const visited = makeGrid(rows, columns, false);
    const directions = [
        [0, -1],
        [1, 0],
        [0, 1],
        [-1, 0],
    ];

    let column = Math.floor(sample() * columns);
    let row = Math.floor(sample() * rows);
    let visitedCount = 1;
    visited[row][column] = true;

    // A pathological/scripted RNG must not lock the editor indefinitely.
    let steps = 0;
    while (visitedCount < columns * rows) {
        if (++steps > 100000) throw new Error("Maze generation timed out. Try Generate again.");
        const [columnStep, rowStep] = directions[
            Math.floor(sample() * directions.length)
        ];
        const nextColumn = wrapColumn(column + columnStep, columns);
        const nextRow = row + rowStep;

        if (nextRow < 0 || nextRow >= rows) continue;

        if (!visited[nextRow][nextColumn]) {
            if (rowStep === -1) horizontalWalls[row][column] = false;
            if (rowStep === 1) horizontalWalls[row + 1][column] = false;
            if (columnStep === -1) verticalWalls[row][column] = false;
            if (columnStep === 1) verticalWalls[row][nextColumn] = false;

            visited[nextRow][nextColumn] = true;
            visitedCount += 1;
        }

        column = nextColumn;
        row = nextRow;
    }

    const entranceColumn = Math.floor(sample() * columns);
    const exitColumn = Math.floor(sample() * columns);
    horizontalWalls[0][entranceColumn] = false;
    horizontalWalls[rows][exitColumn] = false;

    return {
        columns,
        rows,
        horizontalWalls,
        verticalWalls,
        entranceColumn,
        exitColumn,
    };
};

const replaceGridValue = (grid, row, column, value) => {
    const nextGrid = grid.slice();
    nextGrid[row] = grid[row].slice();
    nextGrid[row][column] = value;
    return nextGrid;
};

const moveOpening = (maze, boundaryRow, previousColumn, nextColumn, property) => {
    const nextBoundary = maze.horizontalWalls[boundaryRow].slice();
    nextBoundary[previousColumn] = true;
    nextBoundary[nextColumn] = false;

    const horizontalWalls = maze.horizontalWalls.slice();
    horizontalWalls[boundaryRow] = nextBoundary;

    return {
        ...maze,
        horizontalWalls,
        [property]: nextColumn,
    };
};

export const toggleMazeEdge = (maze, edge) => {
    if (edge.axis === "horizontal") {
        if (edge.boundaryRow === 0) {
            return moveOpening(
                maze,
                0,
                maze.entranceColumn,
                edge.column,
                "entranceColumn",
            );
        }

        if (edge.boundaryRow === maze.rows) {
            return moveOpening(
                maze,
                maze.rows,
                maze.exitColumn,
                edge.column,
                "exitColumn",
            );
        }

        return {
            ...maze,
            horizontalWalls: replaceGridValue(
                maze.horizontalWalls,
                edge.boundaryRow,
                edge.column,
                !maze.horizontalWalls[edge.boundaryRow][edge.column],
            ),
        };
    }

    const column = wrapColumn(edge.column, maze.columns);
    return {
        ...maze,
        verticalWalls: replaceGridValue(
            maze.verticalWalls,
            edge.row,
            column,
            !maze.verticalWalls[edge.row][column],
        ),
    };
};
