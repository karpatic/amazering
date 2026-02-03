console.log('mazeutils.js loaded');

// Three.js Maze Utilities
const MazeUtils = { 
  // Scene creation and handling
  setupScene: function(container, width, height) {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    
    renderer.setSize(width, height);
    container.innerHTML = "";
    container.appendChild(renderer.domElement);
    
    // Setup camera
    camera.position.set(0, 15, 15);
    camera.lookAt(scene.position);
    
    return { scene, camera, renderer };
  },
  
  setupLights: function(scene) {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    // Add directional lights
    const createDirectionalLight = (x, y, z, intensity) => {
      const light = new THREE.DirectionalLight(0xffffff, intensity);
      light.position.set(x, y, z);
      scene.add(light);
      return light;
    };
    
    const lights = [
      createDirectionalLight(1, 1, 1, 0.8),
      createDirectionalLight(-1, 1, 1, 0.4),
      createDirectionalLight(0, -1, 0, 0.3)
    ];
    
    // Add hemisphere light
    const skyColor = 0xddeeff;
    const groundColor = 0x202020;
    const hemisphereLight = new THREE.HemisphereLight(skyColor, groundColor, 0.5);
    scene.add(hemisphereLight);
    
    return { ambientLight, directionalLights: lights, hemisphereLight };
  },
  
  setupControls: function(camera, renderer, startCallback, endCallback) {
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    
    // Add event listeners for user interaction if callbacks are provided
    if (startCallback) {
      controls.addEventListener('start', startCallback);
    }
    
    if (endCallback) {
      controls.addEventListener('end', endCallback);
    }
    
    return controls;
  },
  
  setBackground: function(scene, texturePath) {
    const textureLoader = new THREE.TextureLoader();
    const backgroundTexture = textureLoader.load(texturePath);
    scene.background = backgroundTexture;
    return backgroundTexture;
  },
   
};

// Make MazeUtils available globally
console.log('MazeUtils:', MazeUtils);
window.MazeUtils = MazeUtils;