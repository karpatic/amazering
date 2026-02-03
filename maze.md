Properties in Detail
cells: A 2D array representing the maze grid with:

Dimensions defined by height × width (default 4×10)
Each cell contains:
visited: Boolean flag used during maze generation to track which cells have been processed
walls: Array of 4 booleans representing the presence (true) or absence (false) of walls:
walls[0]: Top wall
walls[1]: Right wall
walls[2]: Bottom wall
walls[3]: Left wall
startX: The x-coordinate of the entrance at the top of the maze

Randomly determined during maze generation
The top wall at this position is set to false to create the entrance
endX: The x-coordinate of the exit at the bottom of the maze

Randomly determined during maze generation
The bottom wall at this position is set to false to create the exit

maze = 
{
  cells: [
    // 2D array of cell objects
    [
      { visited: boolean, walls: [top, right, bottom, left] },
      { visited: boolean, walls: [top, right, bottom, left] },
      // ... more cells across width
    ],
    // ... more rows across height
  ],
  startX: number, // X-coordinate of the maze entrance (at the top)
  endX: number    // X-coordinate of the maze exit (at the bottom)
}

