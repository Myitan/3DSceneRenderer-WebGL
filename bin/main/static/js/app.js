let camera, scene, renderer, house;
let texture1, texture2, roofTexture;
let currentProjection = 'perspective';
let cameraZ = 20;
let controls = {
    rotationSpeed: 3,
    transformSpeed: 2,
    ambientIntensity: 0.4,
    lightIntensity: 1.0,
    showHelpers: false
};
let lightHelper, pointLightHelper;
let gui;
let directionalLight, ambientLight, houseLights;

init();
animate();

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    setupRenderer();
    setupLighting();
    loadTextures();
    createHause();  // Create house FIRST
    setupCamera();  // Then setup camera
    createFloor();
    setupUI();
    setupEventListeners();
}

function setupCamera() {
    updateCamera();
    camera.position.set(0, 5, 20);
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);
}


function setupLighting() {
    // Ambient light
    ambientLight = new THREE.AmbientLight(0xffffff, controls.ambientIntensity);
    scene.add(ambientLight);

    // Main directional light
    directionalLight = new THREE.DirectionalLight(0xffffff, controls.lightIntensity);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // House interior lights
    houseLights = new THREE.PointLight(0xffeedd, 1, 10);
    houseLights.position.set(0, 0, 0);
    scene.add(houseLights);
}

function loadTextures() {
    const textureLoader = new THREE.TextureLoader();
    texture1 = textureLoader.load('textures/texture1.jpg', undefined, undefined, 
        (err) => console.error('Texture1 error:', err));
    texture2 = textureLoader.load('textures/texture2.jpg');
    roofTexture = textureLoader.load('textures/roof_tiles.jpg');
    
    texture1.wrapS = texture1.wrapT = THREE.RepeatWrapping;
    texture1.repeat.set(2, 1);
}

function createHause() {
    const houseGeometry = new THREE.BoxGeometry(4, 3, 3);
    const houseMaterial = new THREE.MeshStandardMaterial({ 
        map: texture1,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 0.8,
        metalness: 0.2
    });

    house = new THREE.Mesh(houseGeometry, houseMaterial);
    house.castShadow = true;
    house.receiveShadow = true;

    const roofGeometry = new THREE.CylinderGeometry(2.5, 3, 2, 4);
    const roofMaterial = new THREE.MeshStandardMaterial({ 
        map: roofTexture,
        roughness: 0.7
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.rotation.y = Math.PI/4;
    roof.position.y = 2.2;
    roof.castShadow = true;
    house.add(roof);

    addWindow(1.5, 0.5, 1.51);
    addWindow(-1.5, 0.5, 1.51);
    addDoor();

    const chimneyGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const chimneyMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(1.2, 2.5, 0);
    house.add(chimney);

    scene.add(house);
}

function createFloor() {
    const geometry = new THREE.PlaneGeometry(40, 40, 100, 100);
    const material = new THREE.MeshStandardMaterial({
        map: texture2,
        roughness: 0.9,
        metalness: 0.1
    });
    
    const displacementMap = new THREE.TextureLoader().load('textures/floor_displacement.jpg');
    material.displacementMap = displacementMap;
    material.displacementScale = 0.1;

    const floor = new THREE.Mesh(geometry, material);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = -1.5;
    floor.receiveShadow = true;
    scene.add(floor);
}

function addWindow(x, y, z) {
    const windowGeometry = new THREE.BoxGeometry(1, 0.8, 0.1);
    const windowMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1a64c8,
        transparent: true,
        opacity: 0.7
    });
    const window = new THREE.Mesh(windowGeometry, windowMaterial);
    window.position.set(x, y, z);
    house.add(window);
}

function addDoor() {
    const doorGeometry = new THREE.BoxGeometry(1, 2, 0.1);
    const doorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x3d2b1f,
        roughness: 0.8
    });
    const door = new THREE.Mesh(doorGeometry, doorMaterial);
    door.position.set(0, -0.5, 1.51);
    house.add(door);
}

function setupUI() {
    gui = new dat.GUI();
    gui.add(controls, 'rotationSpeed', 1, 10).name('Rotation Speed');
    gui.add(controls, 'transformSpeed', 1, 5).name('Move Speed');
    gui.add(controls, 'ambientIntensity', 0, 1).onChange(val => ambientLight.intensity = val);
    gui.add(controls, 'lightIntensity', 0, 2).onChange(val => directionalLight.intensity = val);
    gui.add(controls, 'showHelpers').name('Show Helpers').onChange(toggleHelpers);
}

function updateCamera() {
    if (currentProjection === 'perspective') {
        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    } else {
        const aspect = window.innerWidth/window.innerHeight;
        const viewSize = 15;
        camera = new THREE.OrthographicCamera(
            -viewSize * aspect, viewSize * aspect,
            viewSize, -viewSize,
            1, 1000
        );
    }
    camera.position.z = cameraZ;
    if (house) {
        camera.lookAt(house.position);
    } else {
        camera.lookAt(0, 0, 0);
    }
}

function toggleProjection() {
    currentProjection = currentProjection === 'perspective' ? 'orthographic' : 'perspective';
    updateCamera();
    requestAnimationFrame(() => {
        camera.updateProjectionMatrix();
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch(event.key.toLowerCase()) {
        case 'a': controls.qq1 += 6; break;
        case 'd': controls.qq1 -= 6; break;
        case 'w': controls.qq2 += 6; break;
        case 's': controls.qq2 -= 6; break;
        case 'q': controls.qq3 += 10; break;
        case 'e': controls.qq3 -= 10; break;
        case 'z': controls.z += 2; break;
        case 'x': controls.z -= 2; break;
        case 'o': controls.x += 2; break;
        case 'p': controls.x -= 2; break;
        case 'i': controls.y += 2; break;
        case 'u': controls.y -= 2; break;
        case 'k': cameraZ += 1; break;
        case 'l': cameraZ -= 1; break;
    }
    
    document.getElementById('cameraZValue').textContent = cameraZ;
    camera.position.z = cameraZ;
    updateHouseTransform();
}

function updateHouseTransform() {
    house.rotation.set(
        THREE.MathUtils.degToRad(controls.qq1),
        THREE.MathUtils.degToRad(controls.qq2),
        THREE.MathUtils.degToRad(controls.qq3)
    );
    house.position.set(controls.x, controls.y, controls.z);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function toggleHelpers(show) {
    if (show) {
        lightHelper = new THREE.DirectionalLightHelper(directionalLight);
        pointLightHelper = new THREE.PointLightHelper(houseLights);
        scene.add(lightHelper);
        scene.add(pointLightHelper);
    } else {
        if (lightHelper) scene.remove(lightHelper);
        if (pointLightHelper) scene.remove(pointLightHelper);
    }
}

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);
}

function toggleLights() {
    directionalLight.visible = !directionalLight.visible;
    houseLights.visible = !houseLights.visible;
}

function updateCameraZ(value) {
    cameraZ = parseInt(value);
    document.getElementById('cameraZValue').textContent = value;
    camera.position.z = cameraZ;
}