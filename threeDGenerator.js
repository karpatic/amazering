const { useState, useEffect, useCallback, useRef } = React;

const ThreeDMazeGenerator = ({ svgMaze }) => {
  const [threeDMaze, setThreeDMaze] = useState(null); // Used when exporting
  const threeContainerRef = useRef(null);
  const threeRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    mazeGroup: null,
  });
  console.log("ThreeDMazeGenerator", svgMaze);

  const createScene = useCallback(() => { 
    if (!threeContainerRef.current) return; 
    const width = threeContainerRef.current.clientWidth;
    const height = threeContainerRef.current.clientHeight;
    const { scene, camera, renderer } = MazeUtils.setupScene(
      threeContainerRef.current,      width,      height
    );
    MazeUtils.setBackground(scene, 'sand.jpg');
    const controls = MazeUtils.setupControls(camera, renderer);
    MazeUtils.setupLights(scene);
    const mazeGroup = new THREE.Group();
    scene.add(mazeGroup);
    threeRef.current = { scene, camera, renderer, controls, mazeGroup };
    animate();
  }, []);

  const initThreeJS = useCallback((maze) => {
    console.log("initThreeJS");
    if (!maze || !threeContainerRef.current) return null; 
    const { scene, mazeGroup, renderer, controls, camera } = threeRef.current; 
    // rm all items in mazeGroup
    while (mazeGroup.children.length) { mazeGroup.remove(mazeGroup.children[0]); }
    
    // Define materials
    const materials = createMaterials();
    
    // Create 3D objects
    const radius = window.height + 1;
    const cylinderHeight = window.width;
    
    createTube(mazeGroup, radius, cylinderHeight, materials.ringMaterial);
    createRingCover(mazeGroup, radius, cylinderHeight, materials.ringMaterial);
    createCube(mazeGroup, radius, cylinderHeight, materials.toothMaterial);
    createMazeWalls(maze, mazeGroup, radius, cylinderHeight, materials);

    return { scene, camera, renderer, controls, mazeGroup };
  }, []);
  
  // Helper functions for the 3D objects creation
  const createMaterials = () => {
    const black = new THREE.MeshPhongMaterial({ color: 0x202020 });
    const textureLoader = new THREE.TextureLoader();
    const wallMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load('./gold.jpg') });
    const floorMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load('./gold.jpg') });
    const ringMaterial = black;
    const toothMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load('./gold.jpg') });
    const tubeMaterial = new THREE.MeshPhongMaterial({ color: 0x777777, side: THREE.DoubleSide });
    const enteranceMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const exitMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    
    return { black, wallMaterial, floorMaterial, ringMaterial, toothMaterial, tubeMaterial, enteranceMaterial, exitMaterial };
  };
  
  const createTube = (mazeGroup, radius, cylinderHeight, material) => {
    // Create a hollow cylinder
    const tubeOuterRadius = radius + 0.1;
    const tubeInnerRadius = radius - 0.5;
    const ringShape = new THREE.Shape()
      .moveTo(tubeOuterRadius, 0)
      .absarc(0, 0, tubeOuterRadius, 0, Math.PI * 2, false);
    ringShape.holes.push(
      new THREE.Path()
        .moveTo(tubeInnerRadius, 0)
        .absarc(0, 0, tubeInnerRadius, 0, Math.PI * 2, true)
    );
    const extrudeSettings = {
      steps: 1,
      depth: cylinderHeight,
      bevelEnabled: false,
    };
    const tubeGeometry = new THREE.ExtrudeGeometry(ringShape, extrudeSettings);
    const tube = new THREE.Mesh(tubeGeometry, material);
    mazeGroup.add(tube);
    tube.position.y = cylinderHeight / 2;
    tube.rotation.x = Math.PI / 2;
  };
  
  const createRingCover = (mazeGroup, radius, cylinderHeight, material) => {
    // Create Ring around Cylinder with the 'gem' facing inwards
    let ringHeight = window.width / (window.height + 1);
    const coverOuterRadius = radius + 1.3 + 0.1;
    const coverInnerRadius = radius + 1.3 - 0.5;
    const ringShape2 = new THREE.Shape()
      .moveTo(coverOuterRadius, 0)
      .absarc(0, 0, coverOuterRadius, 0, Math.PI * 2, false);
    ringShape2.holes.push(
      new THREE.Path()
        .moveTo(coverInnerRadius, 0)
        .absarc(0, 0, coverInnerRadius, 0, Math.PI * 2, true)
    );
    const extrudeSettings2 = {
      steps: 1,
      depth: ringHeight,
      bevelEnabled: false,
    };
    const coverGeometry = new THREE.ExtrudeGeometry(
      ringShape2,
      extrudeSettings2
    ); 
    const cover = new THREE.Mesh(coverGeometry, material);
    mazeGroup.add(cover);
    cover.position.y = -cylinderHeight / 2 + 2.2;
    cover.position.x = 2 * radius + 4;
    cover.rotation.x = Math.PI / 2;
  };
  
  const createCube = (mazeGroup, radius, cylinderHeight, material) => {
    let ringHeight = window.width / (window.height + 1);
    const cubeGeometry = new THREE.BoxGeometry(1.2, ringHeight, ringHeight); 
    const cube = new THREE.Mesh(cubeGeometry, material);
    mazeGroup.add(cube);

    // Position cube on the inner edge of the ring cover
    const angle = Math.PI / 4; // Adjust this angle to change the cube's position around the ring
    cube.position.x = radius + 1; // + 3.4
    cube.position.x = cube.position.x + 2 * radius + 4;
    cube.position.y = -cylinderHeight / 2 + 1.2;
  };
  
  const createMazeWalls = (maze, mazeGroup, radius, cylinderHeight, materials) => {
    const mazeWidth = maze.cells[0].length;
    const mazeHeight = maze.cells.length;
    const cellAngle = (Math.PI * 2) / mazeWidth;

    console.log({maze}) 
    maze.cells.reverse();
    maze.cells.forEach((row, y) => {
      if (y == 0) {
        console.log(`Row ${y}`);
      }else{
        console.groupCollapsed(`Row ${y}`);
      } 
      row.forEach((cell, x) => {
        console.log(`Cell (${x}, ${y})`, cell.walls);
        // swap top and bottom
        const cellWalls = cell.walls;
        cell.walls[0] = cellWalls[2];
        cell.walls[2] = cellWalls[0];
        
        const angle = (x / mazeWidth) * Math.PI * 2;
        const yPos = (y / mazeHeight) * cylinderHeight - cylinderHeight / 2;

        // Top wall (including entrance)
        if (y === 0 && x === maze.endX) {
          createHorizontalWall(mazeGroup, x, y, angle, yPos, 'top',  materials.exitMaterial, cellAngle, radius, cylinderHeight, mazeHeight);
        } else if (cell.walls[0]) {
          createHorizontalWall(mazeGroup, x, y, angle, yPos, "top", materials.floorMaterial, cellAngle, radius, cylinderHeight, mazeHeight);
        }

        // Right wall
        if (cell.walls[1]) {
          createVerticalWall(mazeGroup, x, y, angle, yPos, materials.wallMaterial, cellAngle, radius, cylinderHeight, mazeHeight);
        }

        // Bottom wall (including exit)
        if (y === mazeHeight - 1) {
          if (x === maze.startX) {
            createHorizontalWall(mazeGroup, x, y, angle, yPos, 'bottom', materials.enteranceMaterial, cellAngle, radius, cylinderHeight, mazeHeight);
          } else { //if (cell.walls[2]) {
            createHorizontalWall(mazeGroup, x, y, angle, yPos, "bottom", materials.floorMaterial, cellAngle, radius, cylinderHeight, mazeHeight);
          }
        }

        // Left wall (only for first column)
        if (x === 0 && cell.walls[3]) {
          createVerticalWall(mazeGroup, x - 1, y, angle - cellAngle, yPos, materials.wallMaterial, cellAngle, radius, cylinderHeight, mazeHeight);
        }
      });
      console.groupEnd();
    });
  };

  function createVerticalWall(mazeGroup, x, y, angle, yPos, material, cellAngle, radius, cylinderHeight, mazeHeight) {
    const trapezoidShape = new THREE.Shape();
    const wallWidth = 2.8;
    const wallHeight = 0.5;
    const wallLength = 2;

    trapezoidShape.moveTo(0, -wallLength / 2);
    trapezoidShape.lineTo(wallHeight, -wallWidth / 2);
    trapezoidShape.lineTo(wallHeight, wallWidth / 2);
    trapezoidShape.lineTo(0, wallLength / 2);
    trapezoidShape.lineTo(0, -wallLength / 2);

    // Set up linear extrusion settings
    const extrudeSettings = {
      depth: 0.1, // Extrude in the Z direction by curveLength
      steps: 1, // No additional segments are necessary
      bevelEnabled: false, // No bevel for the extruded wall
    };

    // Extrude the geometry in a straight line
    const wallGeometry = new THREE.ExtrudeGeometry(
      trapezoidShape,
      extrudeSettings
    );
    const wall = new THREE.Mesh(wallGeometry, material);

    // Position the wall
    wall.position.x = (radius + 0.49) * Math.sin(angle + cellAngle); // X position based on radius
    wall.position.y = yPos + cylinderHeight / (2 * mazeHeight); // Adjust Y position
    wall.position.z = (radius + 0.49) * Math.cos(angle + cellAngle); // Z position based on radius

    // Set rotation of the wall
    wall.rotation.y = angle + cellAngle + Math.PI / 2;

    // Add the wall to the maze group
    mazeGroup.add(wall);
  }

  function createHorizontalWall(mazeGroup, x, y, angle, yPos, position, material, cellAngle, radius, cylinderHeight, mazeHeight) {
    const wallWidth = 0.4; // 0.05;  // Width at the base
    const wallHeight = 0.5; // Height of the trapezoid
    const topWidth = 0.05; // Width at the top (slightly narrower)

    const trapezoidShape = new THREE.Shape();
    trapezoidShape.moveTo(-topWidth / 2, 0);
    trapezoidShape.lineTo(-wallWidth / 2, wallHeight);
    trapezoidShape.lineTo(wallWidth / 2, wallHeight);
    trapezoidShape.lineTo(topWidth / 2, 0);
    trapezoidShape.lineTo(-topWidth / 2, 0);

    // Create points for a curved path along the cylinder's surface
    // Use the fixed radius from the original working version
    const curveRadius = 5.5; // Fixed radius to match the original working version
    const curveSegments = 8;
    const curvePoints = [];

    for (let i = 0; i <= curveSegments; i++) {
      const t = i / curveSegments;
      const segmentAngle = angle + cellAngle * t;
      const x = curveRadius * Math.sin(segmentAngle);
      const z = curveRadius * Math.cos(segmentAngle);
      curvePoints.push(new THREE.Vector3(x, 0, z));
    }

    // Create a smooth curve from the points
    const curvePath = new THREE.CatmullRomCurve3(curvePoints);

    // Extrude settings
    const extrudeSettings = {
      steps: curveSegments,
      bevelEnabled: false,
      extrudePath: curvePath,
    };

    // Create the extruded geometry
    const wallGeometry = new THREE.ExtrudeGeometry(
      trapezoidShape,
      extrudeSettings
    );
    const wall = new THREE.Mesh(wallGeometry, material);

    // Position the wall
    const yOffset = position === "top" ? 0 : cylinderHeight / mazeHeight;
    wall.position.y = yPos + yOffset;

    // Add the wall to the maze group
    mazeGroup.add(wall);
  }

  function animate() {
    requestAnimationFrame(animate); 
    if (threeRef.current.mazeGroup) {
      threeRef.current.mazeGroup.rotation.y += 0.001; 
    } 
    threeRef.current.controls.update();
    threeRef.current.renderer.render(threeRef.current.scene, threeRef.current.camera);
  }
  
  useEffect(() => {
    createScene(); // Initialize the scene on the first render 
  }, []);
  
  useEffect(() => { 
    const threeDMazeData = initThreeJS(svgMaze);
    setThreeDMaze(threeDMazeData);
  }, [svgMaze]);

  // Function to export the maze as STL
  const exportSTL = () => {
    if (!threeDMaze || !threeDMaze.scene) {
      alert("Please generate the 3D maze first.");
      return;
    }

    const mazeScene = threeDMaze.scene;

    // Find the Group that contains all the Mesh objects (maze walls)
    const mazeGroup = mazeScene.children.find(
      (child) =>
        child instanceof THREE.Group &&
        child.children.some((grandchild) => grandchild instanceof THREE.Mesh)
    );

    if (!mazeGroup) {
      alert(
        "Maze geometry not found. Please ensure the maze is generated correctly."
      );
      return;
    }

    // Create a new exporter instance
    const exporter = new THREE.STLExporter();

    // Parse the mazeGroup
    const stlString = exporter.parse(mazeGroup);

    // Create a Blob and trigger the download
    const blob = new Blob([stlString], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.style.display = "none";
    document.body.appendChild(link);

    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = "maze.stl";
    link.click();

    // Cleanup
    URL.revokeObjectURL(url);
    document.body.removeChild(link);
  };

  return (
    <div>
      <button id='exportbtn' onClick={exportSTL} disabled={!threeDMaze}>
        Export as STL
      </button>
      <div id="threejs-container" ref={threeContainerRef}></div>
    </div>
  );
};
