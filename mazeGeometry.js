export const RING_DIMENSIONS = Object.freeze({
    radius: 5,
    cylinderLength: 10,
    horizontalWallRadius: 5.5,
    ringHeight: 2,
});

const fullTurn = Math.PI * 2;

/** Pure SVG-grid to ring-coordinate mapping. */
export const getMazeGeometryPlan = (maze) => {
    const { cylinderLength } = RING_DIMENSIONS;
    const cellAngle = fullTurn / maze.columns;
    const cellLength = cylinderLength / maze.rows;
    const horizontalWalls = [];
    const verticalWalls = [];

    for (let boundaryRow = 0; boundaryRow <= maze.rows; boundaryRow += 1) {
        for (let column = 0; column < maze.columns; column += 1) {
            let material = "gold";
            const isEntrance = boundaryRow === 0 && column === maze.entranceColumn;
            const isExit = boundaryRow === maze.rows && column === maze.exitColumn;

            if (isEntrance) material = "entrance";
            if (isExit) material = "exit";
            if (!isEntrance && !isExit && !maze.horizontalWalls[boundaryRow][column]) {
                continue;
            }

            horizontalWalls.push({
                boundaryRow,
                column,
                material,
                startAngle: column * cellAngle,
                y: cylinderLength / 2 - boundaryRow * cellLength,
            });
        }
    }

    for (let row = 0; row < maze.rows; row += 1) {
        for (let column = 0; column < maze.columns; column += 1) {
            if (!maze.verticalWalls[row][column]) continue;

            verticalWalls.push({
                row,
                column,
                angle: column * cellAngle,
                y: cylinderLength / 2 - (row + 0.5) * cellLength,
            });
        }
    }

    return {
        cellAngle,
        cellLength,
        horizontalWalls,
        verticalWalls,
        keyPlacement: {
            y: -cylinderLength / 2 + cellLength / 2,
            rotationY: (maze.exitColumn + 0.5) * cellAngle - Math.PI / 2,
        },
    };
};

export const createMazeMaterials = () => {
    const goldTexture = new THREE.TextureLoader().load("./gold.jpg");

    return {
        materials: {
            ring: new THREE.MeshPhongMaterial({ color: 0x202020 }),
            gold: new THREE.MeshPhongMaterial({ map: goldTexture }),
            entrance: new THREE.MeshPhongMaterial({ color: 0x00ff00 }),
            exit: new THREE.MeshPhongMaterial({ color: 0xff0000 }),
        },
        textures: [goldTexture],
    };
};

const createTube = (group, material) => {
    const { radius, cylinderLength } = RING_DIMENSIONS;
    const outerRadius = radius + 0.1;
    const innerRadius = radius - 0.5;
    const ringShape = new THREE.Shape()
        .moveTo(outerRadius, 0)
        .absarc(0, 0, outerRadius, 0, fullTurn, false);

    ringShape.holes.push(
        new THREE.Path()
            .moveTo(innerRadius, 0)
            .absarc(0, 0, innerRadius, 0, fullTurn, true),
    );

    const geometry = new THREE.ExtrudeGeometry(ringShape, {
        steps: 1,
        depth: cylinderLength,
        bevelEnabled: false,
    });
    const tube = new THREE.Mesh(geometry, material);
    tube.position.y = cylinderLength / 2;
    tube.rotation.x = Math.PI / 2;
    group.add(tube);
};

const createKey = (group, placement, materials) => {
    const { radius, ringHeight } = RING_DIMENSIONS;
    const toothHeight = ringHeight * 1.05;
    const assembly = new THREE.Group();
    assembly.position.y = placement.y;
    assembly.rotation.y = placement.rotationY;
    group.add(assembly);

    const outerRadius = radius + 1.4;
    const innerRadius = radius + 0.8;
    const ringShape = new THREE.Shape()
        .moveTo(outerRadius, 0)
        .absarc(0, 0, outerRadius, 0, fullTurn, false);

    ringShape.holes.push(
        new THREE.Path()
            .moveTo(innerRadius, 0)
            .absarc(0, 0, innerRadius, 0, fullTurn, true),
    );

    const coverGeometry = new THREE.ExtrudeGeometry(ringShape, {
        steps: 1,
        depth: ringHeight,
        bevelEnabled: false,
    });
    const cover = new THREE.Mesh(coverGeometry, materials.ring);
    cover.position.y = ringHeight / 2;
    cover.rotation.x = Math.PI / 2;
    assembly.add(cover);

    const tooth = new THREE.Mesh(
        new THREE.BoxGeometry(1.2, toothHeight, ringHeight),
        materials.gold,
    );
    tooth.position.x = radius + 1;
    assembly.add(tooth);
};

const createHorizontalWall = (wall, cellAngle, material) => {
    const wallWidth = 0.4;
    const wallHeight = 0.5;
    const topWidth = 0.05;
    const curveSegments = 8;
    const shape = new THREE.Shape();

    shape.moveTo(-topWidth / 2, 0);
    shape.lineTo(-wallWidth / 2, wallHeight);
    shape.lineTo(wallWidth / 2, wallHeight);
    shape.lineTo(topWidth / 2, 0);
    shape.lineTo(-topWidth / 2, 0);

    const curvePoints = [];
    for (let segment = 0; segment <= curveSegments; segment += 1) {
        const angle = wall.startAngle + cellAngle * (segment / curveSegments);
        curvePoints.push(new THREE.Vector3(
            RING_DIMENSIONS.horizontalWallRadius * Math.sin(angle),
            0,
            RING_DIMENSIONS.horizontalWallRadius * Math.cos(angle),
        ));
    }

    const geometry = new THREE.ExtrudeGeometry(shape, {
        steps: curveSegments,
        bevelEnabled: false,
        extrudePath: new THREE.CatmullRomCurve3(curvePoints),
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = wall.y;
    return mesh;
};

const createVerticalWall = (wall, material) => {
    const wallWidth = 2.8;
    const wallHeight = 0.5;
    const wallLength = 2;
    const shape = new THREE.Shape();

    shape.moveTo(0, -wallLength / 2);
    shape.lineTo(wallHeight, -wallWidth / 2);
    shape.lineTo(wallHeight, wallWidth / 2);
    shape.lineTo(0, wallLength / 2);
    shape.lineTo(0, -wallLength / 2);

    const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: 0.1,
        steps: 1,
        bevelEnabled: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    const wallRadius = RING_DIMENSIONS.radius + 0.49;

    mesh.position.x = wallRadius * Math.sin(wall.angle);
    mesh.position.y = wall.y;
    mesh.position.z = wallRadius * Math.cos(wall.angle);
    mesh.rotation.y = wall.angle + Math.PI / 2;
    return mesh;
};

export const createMazeGroup = (maze, materials) => {
    const plan = getMazeGeometryPlan(maze);
    const group = new THREE.Group();

    createTube(group, materials.ring);
    createKey(group, plan.keyPlacement, materials);

    plan.horizontalWalls.forEach((wall) => {
        group.add(createHorizontalWall(wall, plan.cellAngle, materials[wall.material]));
    });

    plan.verticalWalls.forEach((wall) => {
        group.add(createVerticalWall(wall, materials.gold));
    });

    return group;
};

export const disposeMazeGroup = (group) => {
    const geometries = new Set();
    group.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
    });
    geometries.forEach((geometry) => geometry.dispose());
};
