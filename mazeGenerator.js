window.width = 10;
window.height = 4;
const { useState, useCallback } = React;

// Aldous Broder Algorithm
const generateAldousBroderMaze = (width = window.width, height = window.height) => {
    const cells = Array(height).fill().map(() => Array(width).fill().map(() => ({ visited: false, walls: [true, true, true, true] })));

    const randomMember = (arr) => arr[Math.floor(Math.random() * arr.length)];
    let currentX = Math.floor(Math.random() * width);
    let currentY = Math.floor(Math.random() * height);
    cells[currentY][currentX].visited = true;

    let visitedCount = 1;
    const totalCells = width * height;

    while (visitedCount < totalCells) {
        const directions = [
            [0, -1], // up
            [1, 0],  // right
            [0, 1],  // down
            [-1, 0], // left
        ];
        const [dx, dy] = randomMember(directions);
        const newX = (currentX + dx + width) % width;
        const newY = currentY + dy;

        // Ensure newY is within bounds
        if (newY >= 0 && newY < height) {
            if (!cells[newY][newX].visited) {
                if (dx === -1) {
                    cells[currentY][currentX].walls[3] = false;
                    cells[newY][newX].walls[1] = false;
                } else if (dx === 1) {
                    cells[currentY][currentX].walls[1] = false;
                    cells[newY][newX].walls[3] = false;
                } else if (dy === -1) {
                    cells[currentY][currentX].walls[0] = false;
                    cells[newY][newX].walls[2] = false;
                } else if (dy === 1) {
                    cells[currentY][currentX].walls[2] = false;
                    cells[newY][newX].walls[0] = false;
                }

                cells[newY][newX].visited = true;
                visitedCount++;
            }

            currentX = newX;
            currentY = newY;
        }
    }

    const startX = Math.floor(Math.random() * width);
    const endX = Math.floor(Math.random() * width);
    cells[0][startX].walls[0] = false;
    cells[height - 1][endX].walls[2] = false;

    return { cells, startX, endX };
};

const generateMazeRandomDepthFirst = (width = 20, height = 10) => {
    const cells = Array(height).fill().map(() => Array(width).fill().map(() => ({ visited: false, walls: [true, true, true, true] })));
    
    const visit = (x, y) => {
        cells[y][x].visited = true;
        const directions = [[0, -1], [1, 0], [0, 1], [-1, 0]].sort(() => Math.random() - 0.5);
        
        for (const [dx, dy] of directions) {
            let newX = (x + dx + width) % width;
            const newY = y + dy;
            
            if (newY >= 0 && newY < height && !cells[newY][newX].visited) {
                if (dx === -1) {
                    cells[y][x].walls[3] = false;
                    cells[newY][newX].walls[1] = false;
                } else if (dx === 1) {
                    cells[y][x].walls[1] = false;
                    cells[newY][newX].walls[3] = false;
                } else if (dy === -1) {
                    cells[y][x].walls[0] = false;
                    cells[newY][newX].walls[2] = false;
                } else if (dy === 1) {
                    cells[y][x].walls[2] = false;
                    cells[newY][newX].walls[0] = false;
                }
                visit(newX, newY);
            }
        }
    };
    
    const startX = Math.floor(Math.random() * width);
    visit(startX, 0);
    
    cells[0][startX].walls[0] = false;
    const endX = Math.floor(Math.random() * width);
    cells[height - 1][endX].walls[2] = false;
    
    return { cells, startX, endX };
};

const SVGMazeGenerator = ({ onMazeGenerated }) => {
    const [svgMaze, setSvgMaze] = useState(null); 
    const [startX, setStartX] = useState(null);
    const [endX, setEndX] = useState(null);
    const cellSize = 40; // Increased from 20 to 40 for better visibility
    const padding = 10; // Adding padding to prevent edge cutoff

    const getEdges = newMaze => {
        // Initialize edges data structure
        const newEdges = [];
        for (let y = 0; y < newMaze.cells.length; y++) {
            for (let x = 0; x < newMaze.cells[0].length; x++) {
                // Horizontal edges
                newEdges.push({
                    x1: x * cellSize + padding,
                    y1: y * cellSize + padding,
                    x2: (x + 1) * cellSize + padding,
                    y2: y * cellSize + padding,
                    isWall: newMaze.cells[y][x].walls[0],
                    type: 'horizontal',
                    cellX: x,
                    cellY: y,
                    wall: 0
                });
                if (y === newMaze.cells.length - 1) {
                    newEdges.push({
                        x1: x * cellSize + padding,
                        y1: (y + 1) * cellSize + padding,
                        x2: (x + 1) * cellSize + padding,
                        y2: (y + 1) * cellSize + padding,
                        isWall: newMaze.cells[y][x].walls[2],
                        type: 'horizontal',
                        cellX: x,
                        cellY: y,
                        wall: 2
                    });
                }
                
                // Vertical edges
                newEdges.push({
                    x1: x * cellSize + padding,
                    y1: y * cellSize + padding,
                    x2: x * cellSize + padding,
                    y2: (y + 1) * cellSize + padding,
                    isWall: newMaze.cells[y][x].walls[3],
                    type: 'vertical',
                    cellX: x,
                    cellY: y,
                    wall: 3
                });
                if (x === newMaze.cells[0].length - 1) {
                    newEdges.push({
                        x1: (x + 1) * cellSize + padding,
                        y1: y * cellSize + padding,
                        x2: (x + 1) * cellSize + padding,
                        y2: (y + 1) * cellSize + padding,
                        isWall: newMaze.cells[y][x].walls[1],
                        type: 'vertical',
                        cellX: x,
                        cellY: y,
                        wall: 1
                    });
                }
            }
        }
        return newEdges;
    }

    const createSVGMaze = useCallback(() => {
        const newMaze = generateAldousBroderMaze();
        setSvgMaze(newMaze); 
        setStartX(newMaze.startX);
        setEndX(newMaze.endX);
        onMazeGenerated(newMaze);
    }, [onMazeGenerated]);
 

    // Updating the SVG requires toggling adjacent cells:
    // { cells: [ 
    //      [ { visited, walls: [top, right, bottom, left]} , ...{x10}], [x4]
    //  ], startX: 3, endX: 6
    //}
       

    const handleEdgeClick = (edge) => {  
        // const newMaze = { ...svgMaze }; 
        const newMaze = JSON.parse(JSON.stringify(svgMaze));  
        const isTopEdge = edge.type === 'horizontal' && edge.cellY === 0; 
        const isBottomEdge = edge.type === 'horizontal' && edge.y1 === (newMaze.cells.length * cellSize);

        console.table(edge); 
        if (isTopEdge) { 
            // If there is an existing startX, close its opening
            if (startX !== null) { newMaze.cells[0][startX].walls[0] = true; }
            newMaze.cells[0][edge.cellX].walls[0] = false;
            newMaze.startX = edge.cellX;
            setStartX(edge.cellX);
        } else if (isBottomEdge) { 
            // If there is an existing endX, close its opening
            if (endX !== null) { newMaze.cells[newMaze.cells.length - 1][endX].walls[2] = true; }
            newMaze.cells[newMaze.cells.length - 1][edge.cellX].walls[2] = false; 
            newMaze.endX = edge.cellX;
            setEndX(edge.cellX);
        }
        if(!isTopEdge && !isBottomEdge){ 
            if (edge.type === 'vertical') {
                // Handle vertical walls (left and right)
                const { cellX, cellY, wall } = edge;
                newMaze.cells[cellY][cellX].walls[wall] = !newMaze.cells[cellY][cellX].walls[wall];
                
                // Determine the adjacent cell based on the wall
                let adjacentX = cellX;
                let adjacentY = cellY;
                let adjacentWall;
        
                if (wall === 1) { // Right wall
                    adjacentX = cellX + 1;
                    adjacentWall = 3; // Left wall of the adjacent cell
                } else if (wall === 3) { // Left wall
                    adjacentX = cellX - 1;
                    adjacentWall = 1; // Right wall of the adjacent cell
                }
        
                // Update the adjacent cell's wall if it's within bounds
                if (adjacentX >= 0 && adjacentX < newMaze.cells[0].length) {
                    newMaze.cells[adjacentY][adjacentX].walls[adjacentWall] = newMaze.cells[cellY][cellX].walls[wall];
                }
            } else {
                // Because of top/bottom edge handling 
                newMaze.cells[edge.cellY][edge.cellX].walls[edge.wall] = !newMaze.cells[edge.cellY][edge.cellX].walls[edge.wall];
            }
        }
           setSvgMaze(newMaze);   
            onMazeGenerated(newMaze);
    };


    const renderSVGMaze = useCallback(() => {
        if (!svgMaze) return null;
        const width = svgMaze.cells[0].length * cellSize + (padding * 2);
        const height = svgMaze.cells.length * cellSize + (padding * 2);
        
        return (
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {svgMaze && getEdges(svgMaze).map((edge, index) => (
                    <line
                        key={`edge-${index}`}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        stroke={edge.isWall ? "black" : "#dddddd"}
                        strokeWidth="5" // Increased from 3 to 5 for easier clicking
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleEdgeClick(edge)}
                    />
                ))}
                {/* Make entrance and exit areas larger and easier to click */}
                <rect 
                    x={startX * cellSize + padding} 
                    y={padding} 
                    width={cellSize} 
                    height={cellSize/2} 
                    fill="green" 
                />
                <rect 
                    x={endX * cellSize + padding} 
                    y={height - cellSize/2 - padding} 
                    width={cellSize} 
                    height={cellSize/2} 
                    fill="red" 
                />
            </svg>
        );
    }, [svgMaze, startX, endX, handleEdgeClick]);

    return (
        <div id='svgContainer'>
            <button onClick={createSVGMaze}>Generate New Maze</button>
            <br/>
            {renderSVGMaze()}
        </div>
    );
};
