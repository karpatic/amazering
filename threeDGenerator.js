import {
    createMazeGroup,
    createMazeMaterials,
    disposeMazeGroup,
} from "./mazeGeometry.js";

const { useEffect, useRef, useState } = React;

const addLights = (scene) => {
    scene.add(new THREE.AmbientLight(0x404040));

    [
        [1, 1, 1, 0.8],
        [-1, 1, 1, 0.4],
        [0, -1, 0, 0.3],
    ].forEach(([x, y, z, intensity]) => {
        const light = new THREE.DirectionalLight(0xffffff, intensity);
        light.position.set(x, y, z);
        scene.add(light);
    });

    scene.add(new THREE.HemisphereLight(0xddeeff, 0x202020, 0.5));
};

const ThreeDMazeGenerator = ({ maze }) => {
    const containerRef = useRef(null);
    const engineRef = useRef(null);
    const rotationEnabledRef = useRef(true);
    const [isRotating, setIsRotating] = useState(true);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        const materialResources = createMazeMaterials();
        const backgroundTexture = new THREE.TextureLoader().load("./sand.jpg");
        let animationFrame;
        let resizeObserver;

        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.appendChild(renderer.domElement);
        scene.background = backgroundTexture;
        camera.position.set(0, 15, 15);
        camera.lookAt(scene.position);
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.screenSpacePanning = false;
        addLights(scene);

        const resize = () => {
            const width = Math.max(container.clientWidth, 1);
            const height = Math.max(container.clientHeight, 1);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height, false);
        };

        resize();
        if (window.ResizeObserver) {
            resizeObserver = new ResizeObserver(resize);
            resizeObserver.observe(container);
        } else {
            window.addEventListener("resize", resize);
        }

        const engine = {
            scene,
            camera,
            renderer,
            controls,
            materials: materialResources.materials,
            textures: materialResources.textures,
            mazeGroup: null,
        };
        engineRef.current = engine;

        const renderFrame = () => {
            animationFrame = requestAnimationFrame(renderFrame);
            if (engine.mazeGroup && rotationEnabledRef.current) {
                engine.mazeGroup.rotation.y += 0.001;
            }
            controls.update();
            renderer.render(scene, camera);
        };
        renderFrame();

        return () => {
            cancelAnimationFrame(animationFrame);
            if (resizeObserver) resizeObserver.disconnect();
            else window.removeEventListener("resize", resize);

            if (engine.mazeGroup) {
                scene.remove(engine.mazeGroup);
                disposeMazeGroup(engine.mazeGroup);
            }

            controls.dispose();
            backgroundTexture.dispose();
            engine.textures.forEach((texture) => texture.dispose());
            new Set(Object.values(engine.materials)).forEach((material) => material.dispose());
            renderer.dispose();
            if (renderer.forceContextLoss) renderer.forceContextLoss();
            if (renderer.domElement.parentNode === container) {
                container.removeChild(renderer.domElement);
            }
            engineRef.current = null;
        };
    }, []);

    useEffect(() => {
        const engine = engineRef.current;
        if (!engine || !maze) return;

        const nextGroup = createMazeGroup(maze, engine.materials);
        if (engine.mazeGroup) nextGroup.rotation.copy(engine.mazeGroup.rotation);
        engine.scene.add(nextGroup);

        if (engine.mazeGroup) {
            engine.scene.remove(engine.mazeGroup);
            disposeMazeGroup(engine.mazeGroup);
        }

        engine.mazeGroup = nextGroup;
    }, [maze]);

    const toggleRotation = () => {
        setIsRotating((wasRotating) => {
            rotationEnabledRef.current = !wasRotating;
            return !wasRotating;
        });
    };

    const exportSTL = () => {
        const mazeGroup = engineRef.current && engineRef.current.mazeGroup;
        if (!mazeGroup) {
            alert("Please generate the 3D maze first.");
            return;
        }

        const exportGroup = mazeGroup.clone(true);
        exportGroup.rotation.set(0, 0, 0);
        exportGroup.updateMatrixWorld(true);

        const stl = new THREE.STLExporter().parse(exportGroup);
        const url = URL.createObjectURL(
            new Blob([stl], { type: "application/octet-stream" }),
        );
        const link = document.createElement("a");
        link.hidden = true;
        link.href = url;
        link.download = "maze.stl";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 0);
    };

    return (
        <div className="preview-content">
            <div className="panel-actions">
                <div className="button-group">
                    <button id="exportbtn" onClick={exportSTL} disabled={!maze}>
                        Export as STL
                    </button>
                    <button
                        className="secondary-button"
                        onClick={toggleRotation}
                        aria-pressed={!isRotating}
                    >
                        {isRotating ? "Pause rotation" : "Resume rotation"}
                    </button>
                </div>
                <span className="action-hint">Drag to orbit · scroll to zoom</span>
            </div>
            <div className="preview-stage">
                {!maze && (
                    <div className="preview-empty">
                        Generate a maze to build the 3D ring.
                    </div>
                )}
                <div id="threejs-container" ref={containerRef}></div>
            </div>
        </div>
    );
};

export { ThreeDMazeGenerator };
