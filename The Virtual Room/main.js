// ==========================================
// The Virtual Room - Three.js 3D Experience
// ==========================================

// Scene Setup
let scene, camera, renderer, controls;
let cube, cubeGlow;
let room = {};
let keysPressed = {};
let glowEnabled = true;

// Room dimensions
const ROOM_SIZE = {
    width: 20,
    height: 10,
    depth: 20
};

// Cube properties
const CUBE_SIZE = 2.0;
const CUBE_SPEED = 0.25;
const BOUNDARY_PADDING = CUBE_SIZE / 2 + 0.3;

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    // Removed fog for better visibility

    // Create camera
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(8, 6, 14);

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('scene'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Add OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.1;
    controls.minDistance = 5;
    controls.maxDistance = 25;
    controls.target.set(0, 2, 0);

    // Create the room and objects
    createLights();
    createRoom();
    createCube();
    createDecorations();

    // Event listeners
    setupEventListeners();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1500);

    // Start animation loop
    animate();
}

// Create lighting
function createLights() {
    // Ambient light - strong for visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    // Main ceiling light - brighter
    const mainLight = new THREE.PointLight(0xffffff, 1.5, 40);
    mainLight.position.set(0, ROOM_SIZE.height - 1, 0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    // Colored accent lights - increased intensity
    const purpleLight = new THREE.PointLight(0x8b5cf6, 1.2, 20);
    purpleLight.position.set(-ROOM_SIZE.width / 2 + 2, 3, -ROOM_SIZE.depth / 2 + 2);
    scene.add(purpleLight);

    const pinkLight = new THREE.PointLight(0xec4899, 1.2, 20);
    pinkLight.position.set(ROOM_SIZE.width / 2 - 2, 3, ROOM_SIZE.depth / 2 - 2);
    scene.add(pinkLight);

    const blueLight = new THREE.PointLight(0x3b82f6, 1.0, 20);
    blueLight.position.set(ROOM_SIZE.width / 2 - 2, 3, -ROOM_SIZE.depth / 2 + 2);
    scene.add(blueLight);

    // Spotlight on cube area
    const spotLight = new THREE.SpotLight(0xffffff, 0.5);
    spotLight.position.set(0, ROOM_SIZE.height - 0.5, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.5;
    spotLight.castShadow = true;
    scene.add(spotLight);
}

// Create the room environment
function createRoom() {
    const textureLoader = new THREE.TextureLoader();

    // Floor - lighter color for contrast
    const floorGeometry = new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.depth);
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a4e,
        roughness: 0.6,
        metalness: 0.1
    });
    room.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    room.floor.rotation.x = -Math.PI / 2;
    room.floor.receiveShadow = true;
    scene.add(room.floor);

    // Add floor grid pattern - brighter
    const gridHelper = new THREE.GridHelper(ROOM_SIZE.width, 20, 0xa855f7, 0x4a4a6e);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.depth);
    const ceilingMaterial = new THREE.MeshStandardMaterial({
        color: 0x0f0f1a,
        roughness: 0.9,
        metalness: 0.1
    });
    room.ceiling = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
    room.ceiling.rotation.x = Math.PI / 2;
    room.ceiling.position.y = ROOM_SIZE.height;
    scene.add(room.ceiling);

    // Walls - lighter for better visibility
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a4e,
        roughness: 0.6,
        metalness: 0.2,
        side: THREE.DoubleSide
    });

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(ROOM_SIZE.width, ROOM_SIZE.height);
    room.backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    room.backWall.position.set(0, ROOM_SIZE.height / 2, -ROOM_SIZE.depth / 2);
    scene.add(room.backWall);

    // Front wall
    room.frontWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    room.frontWall.position.set(0, ROOM_SIZE.height / 2, ROOM_SIZE.depth / 2);
    room.frontWall.rotation.y = Math.PI;
    scene.add(room.frontWall);

    // Left wall
    const sideWallGeometry = new THREE.PlaneGeometry(ROOM_SIZE.depth, ROOM_SIZE.height);
    room.leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    room.leftWall.position.set(-ROOM_SIZE.width / 2, ROOM_SIZE.height / 2, 0);
    room.leftWall.rotation.y = Math.PI / 2;
    scene.add(room.leftWall);

    // Right wall
    room.rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    room.rightWall.position.set(ROOM_SIZE.width / 2, ROOM_SIZE.height / 2, 0);
    room.rightWall.rotation.y = -Math.PI / 2;
    scene.add(room.rightWall);

    // Wall trim/accent lines
    createWallAccents();
}

// Create decorative wall accents
function createWallAccents() {
    const accentMaterial = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });

    // Horizontal accent lines on walls
    const lineGeometry = new THREE.BoxGeometry(ROOM_SIZE.width - 0.1, 0.05, 0.05);

    // Back wall accents
    const backAccent1 = new THREE.Mesh(lineGeometry, accentMaterial);
    backAccent1.position.set(0, ROOM_SIZE.height * 0.3, -ROOM_SIZE.depth / 2 + 0.1);
    scene.add(backAccent1);

    const backAccent2 = new THREE.Mesh(lineGeometry, accentMaterial);
    backAccent2.position.set(0, ROOM_SIZE.height * 0.7, -ROOM_SIZE.depth / 2 + 0.1);
    scene.add(backAccent2);

    // Corner accent lights (vertical strips)
    const cornerGeometry = new THREE.BoxGeometry(0.1, ROOM_SIZE.height, 0.1);
    const glowMaterial = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });

    const corners = [
        [-ROOM_SIZE.width / 2 + 0.1, ROOM_SIZE.height / 2, -ROOM_SIZE.depth / 2 + 0.1],
        [ROOM_SIZE.width / 2 - 0.1, ROOM_SIZE.height / 2, -ROOM_SIZE.depth / 2 + 0.1],
        [-ROOM_SIZE.width / 2 + 0.1, ROOM_SIZE.height / 2, ROOM_SIZE.depth / 2 - 0.1],
        [ROOM_SIZE.width / 2 - 0.1, ROOM_SIZE.height / 2, ROOM_SIZE.depth / 2 - 0.1]
    ];

    corners.forEach(pos => {
        const cornerStrip = new THREE.Mesh(cornerGeometry, glowMaterial);
        cornerStrip.position.set(...pos);
        scene.add(cornerStrip);
    });
}

// Create the interactive cube
function createCube() {
    // Main cube with better visibility
    const geometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

    // Use MeshBasicMaterial for self-illumination (always visible regardless of lighting)
    const material = new THREE.MeshBasicMaterial({
        color: 0xc084fc  // Bright purple
    });

    cube = new THREE.Mesh(geometry, material);
    cube.position.set(0, CUBE_SIZE / 2 + 0.1, 0);
    cube.castShadow = true;
    cube.receiveShadow = true;
    scene.add(cube);

    // Cube glow effect (larger transparent cube)
    const glowGeometry = new THREE.BoxGeometry(CUBE_SIZE * 1.5, CUBE_SIZE * 1.5, CUBE_SIZE * 1.5);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.25,
        side: THREE.BackSide
    });
    cubeGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    cube.add(cubeGlow);

    // Bright white edge highlights
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    const edgeLines = new THREE.LineSegments(edges, lineMaterial);
    cube.add(edgeLines);
}

// Create room decorations
function createDecorations() {
    // Floating particles
    createParticles();

    // Decorative spheres in corners
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sphereMaterial = new THREE.MeshPhongMaterial({
        color: 0xec4899,
        emissive: 0x7c2d55,
        emissiveIntensity: 0.5,
        shininess: 100
    });

    const spherePositions = [
        [-ROOM_SIZE.width / 2 + 2, 0.5, -ROOM_SIZE.depth / 2 + 2],
        [ROOM_SIZE.width / 2 - 2, 0.5, -ROOM_SIZE.depth / 2 + 2],
        [-ROOM_SIZE.width / 2 + 2, 0.5, ROOM_SIZE.depth / 2 - 2],
        [ROOM_SIZE.width / 2 - 2, 0.5, ROOM_SIZE.depth / 2 - 2]
    ];

    spherePositions.forEach(pos => {
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(...pos);
        sphere.castShadow = true;
        scene.add(sphere);
    });

    // Tall cylinder pillars
    const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 32);
    const pillarMaterial = new THREE.MeshPhongMaterial({
        color: 0x2a2a4a,
        emissive: 0x1a1a2e,
        shininess: 50
    });

    const pillarPositions = [
        [-ROOM_SIZE.width / 2 + 3, 2, -ROOM_SIZE.depth / 2 + 3],
        [ROOM_SIZE.width / 2 - 3, 2, -ROOM_SIZE.depth / 2 + 3]
    ];

    pillarPositions.forEach(pos => {
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        pillar.position.set(...pos);
        pillar.castShadow = true;
        pillar.receiveShadow = true;
        scene.add(pillar);

        // Top ring
        const ringGeometry = new THREE.TorusGeometry(0.5, 0.05, 16, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        ring.position.set(pos[0], 4.1, pos[2]);
        scene.add(ring);
    });
}

// Create floating particles
function createParticles() {
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * ROOM_SIZE.width * 0.8;
        positions[i * 3 + 1] = Math.random() * ROOM_SIZE.height;
        positions[i * 3 + 2] = (Math.random() - 0.5) * ROOM_SIZE.depth * 0.8;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x8b5cf6,
        size: 0.08,
        transparent: true,
        opacity: 0.6
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
}

// Setup event listeners
function setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', (e) => {
        keysPressed[e.key.toLowerCase()] = true;

        // Toggle help
        if (e.key.toLowerCase() === 'h') {
            const instructions = document.getElementById('instructions');
            instructions.classList.toggle('hidden');
        }

        // Toggle glow
        if (e.key === ' ') {
            e.preventDefault();
            glowEnabled = !glowEnabled;
            cubeGlow.visible = glowEnabled;
            cube.material.emissiveIntensity = glowEnabled ? 0.3 : 0.1;
        }
    });

    window.addEventListener('keyup', (e) => {
        keysPressed[e.key.toLowerCase()] = false;
    });

    // Close instructions button
    document.getElementById('close-instructions').addEventListener('click', () => {
        document.getElementById('instructions').classList.add('hidden');
    });

    // Window resize
    window.addEventListener('resize', onWindowResize);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update cube position based on input
function updateCubePosition() {
    const moveVector = new THREE.Vector3();

    // WASD / Arrow keys
    if (keysPressed['w'] || keysPressed['arrowup']) moveVector.z -= CUBE_SPEED;
    if (keysPressed['s'] || keysPressed['arrowdown']) moveVector.z += CUBE_SPEED;
    if (keysPressed['a'] || keysPressed['arrowleft']) moveVector.x -= CUBE_SPEED;
    if (keysPressed['d'] || keysPressed['arrowright']) moveVector.x += CUBE_SPEED;

    // Apply movement with boundary check
    const newX = cube.position.x + moveVector.x;
    const newZ = cube.position.z + moveVector.z;

    const halfWidth = ROOM_SIZE.width / 2 - BOUNDARY_PADDING;
    const halfDepth = ROOM_SIZE.depth / 2 - BOUNDARY_PADDING;

    // Clamp position within room bounds
    cube.position.x = Math.max(-halfWidth, Math.min(halfWidth, newX));
    cube.position.z = Math.max(-halfDepth, Math.min(halfDepth, newZ));

    // Update camera target to follow cube smoothly
    controls.target.lerp(
        new THREE.Vector3(cube.position.x, 2, cube.position.z),
        0.05
    );
}

// Animation variables
let time = 0;

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    time += 0.01;

    // Update cube position
    updateCubePosition();

    // Animate cube (gentle rotation and hover)
    cube.rotation.y += 0.005;
    cube.position.y = CUBE_SIZE / 2 + 0.1 + Math.sin(time * 2) * 0.1;

    // Animate glow pulsing
    if (glowEnabled && cubeGlow) {
        cubeGlow.material.opacity = 0.1 + Math.sin(time * 3) * 0.05;
        cubeGlow.scale.setScalar(1 + Math.sin(time * 2) * 0.05);
    }

    // Update controls
    controls.update();

    // Render
    renderer.render(scene, camera);
}

// Start the application
init();
