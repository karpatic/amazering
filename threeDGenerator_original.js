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

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);
    threeContainerRef.current.innerHTML = "";
    threeContainerRef.current.appendChild(renderer.domElement);

    // Set the background color to a gradient
    const bg = new THREE.Color(0x000000);
    const textureLoader = new THREE.TextureLoader();
    const backgroundTexture = textureLoader.load('sand.jpg');
    scene.background = backgroundTexture;

    camera.position.set(0, 15, 15);
    camera.lookAt(scene.position);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(ambientLight);
    const createDirectionalLight = (x, y, z, intensity) => {
      const light = new THREE.DirectionalLight(0xffffff, intensity); // white light
      light.position.set(x, y, z);
      scene.add(light);
    };
    createDirectionalLight(1, 1, 1, 0.8);
    createDirectionalLight(-1, 1, 1, 0.4);
    createDirectionalLight(0, -1, 0, 0.3);

    // Hemisphere light for subtle color variation
    const skyColor = 0xddeeff; // light blue
    const groundColor = 0x202020; // dark gray
    const hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, 0.5);
    scene.add(hemisphereLight);

    const mazeGroup = new THREE.Group();
    scene.add(mazeGroup);

    threeRef.current = { scene, camera, renderer, controls, mazeGroup };

    animate()

  }, []);

  const initThreeJS = useCallback((maze) => {
    console.log("initThreeJS");
    if (!maze || !threeContainerRef.current) return null; 

    const { scene, mazeGroup, renderer, controls, camera } = threeRef.current; 

    // rm all items in mazeGroup
    while (mazeGroup.children.length) {
      mazeGroup.remove(mazeGroup.children[0]);
    }
    
    // Define materials
    const black = new THREE.MeshPhongMaterial({ color: 0x202020 });
    const textureLoader = new THREE.TextureLoader();
    const wallMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load('./gold.jpg') })
    const floorMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load('./gold.jpg') }) 
    const ringMaterial = black;// new THREE.MeshPhongMaterial({ map: textureLoader.load('./gold.jpg') });
    const toothMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load('./gold.jpg') });
    const tubeMaterial = new THREE.MeshPhongMaterial({
      color: 0x777777,
      side: THREE.DoubleSide,
    });

    // Create cylinder
    const radius = window.height + 1;
    const cylinderHeight = window.width;
    // Create hollow cylinder

    // Create a Cylinder shape
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
    const tube = new THREE.Mesh(tubeGeometry, ringMaterial);
    mazeGroup.add(tube);
    tube.position.y = cylinderHeight / 2;
    tube.rotation.x = Math.PI / 2;

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
    const cover = new THREE.Mesh(coverGeometry, ringMaterial);
    mazeGroup.add(cover);
    cover.position.y = -cylinderHeight / 2 + 2.2;
    cover.position.x = 2 * radius + 4;
    cover.rotation.x = Math.PI / 2;

    // // Create cube
    const cubeGeometry = new THREE.BoxGeometry(1.2, ringHeight, ringHeight); 
    const cube = new THREE.Mesh(cubeGeometry, toothMaterial);
    mazeGroup.add(cube);

    // Position cube on the inner edge of the ring cover
    const angle = Math.PI / 4; // Adjust this angle to change the cube's position around the ring
    cube.position.x = radius + 1; // + 3.4
    cube.position.x = cube.position.x + 2 * radius + 4;
    cube.position.y = -cylinderHeight / 2 + 1.2;

    // Create walls
    const mazeWidth = maze.cells[0].length;
    const mazeHeight = maze.cells.length;
    const cellAngle = (Math.PI * 2) / mazeWidth;

    console.log({maze})
    maze.cells.forEach((row, y) => {
      if (y == 0) {
        console.log(`Row ${y}`);
      }else{
        console.groupCollapsed(`Row ${y}`);
      }
      row.forEach((cell, x) => {
        console.log(`Cell (${x}, ${y})`, cell.walls);
        const angle = (x / mazeWidth) * Math.PI * 2;
        const yPos = (y / mazeHeight) * cylinderHeight - cylinderHeight / 2;

        // Top wall (including entrance)
        if (y === 0 && x === maze.startX) {
          // createHorizontalWall(x, y, angle, yPos, 'top', entranceMaterial);
        } else if (cell.walls[0]) {
          createHorizontalWall(x, y, angle, yPos, "top", floorMaterial);
        }

        // Right wall
        if (cell.walls[1]) {
          createVerticalWall(x, y, angle, yPos, wallMaterial);
        }

        // Bottom wall (including exit)
        if (y === mazeHeight - 1) {
          if (x === maze.endX) {
            // createHorizontalWall(x, y, angle, yPos, 'bottom', exitMaterial);
          } else if (cell.walls[2]) {
            createHorizontalWall(x, y, angle, yPos, "bottom", floorMaterial);
          }
        }

        // Left wall (only for first column)
        if (x === 0 && cell.walls[3]) {
          createVerticalWall(x - 1, y, angle - cellAngle, yPos, wallMaterial);
        }
      });
      console.groupEnd();
    });

    function createVerticalWall(x, y, angle, yPos, material) {
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
    //   console.log("wall.rotation.x", wall.rotation.x);

      // Add the wall to the maze group
      mazeGroup.add(wall);
    }

    function createHorizontalWall(x, y, angle, yPos, position, material) {
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
      const radius = 5.5; // Make sure this matches the cylinder's radius
      const curveSegments = 8;
      const curvePoints = [];

      for (let i = 0; i <= curveSegments; i++) {
        const t = i / curveSegments;
        const segmentAngle = angle + cellAngle * t;
        const x = radius * Math.sin(segmentAngle);
        const z = radius * Math.cos(segmentAngle);
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

    return { scene, camera, renderer, controls, mazeGroup };
  }, []);

  function animate() {
    requestAnimationFrame(animate); 
    if (threeRef.current.mazeGroup) {
      threeRef.current.mazeGroup.rotation.y += 0.004; 
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
