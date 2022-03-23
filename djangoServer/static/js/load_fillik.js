const mainPanel = document.getElementById("mainPanel");
const renderer = new THREE.WebGLRenderer({ antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1.0, 0.1, 2000);
const solver = new FIK.Structure3D(scene);
const startLoc = new FIK.V3();

const targets = [];

const targetPositions = [
    new THREE.Vector3(0, 23, 0),
    new THREE.Vector3(-10, 2, 0),
    new THREE.Vector3(10, 2, 0),
    new THREE.Vector3(-8, -25, 0),
    new THREE.Vector3(8, -25, 0),
];

const fixTargetPositions = [
    new THREE.Vector3(0, 23, 0),
    new THREE.Vector3(-10, 2, 0),
    new THREE.Vector3(10, 2, 0),
    new THREE.Vector3(-8, -25, 0),
    new THREE.Vector3(8, -25, 0),
];

const options = {
    autoMoveToggle: false,
};

const currentSize = () => {
    const w = window.innerWidth - 20;
    const h = window.innerHeight - 180;
    return { w, h };
};

const initGui = () => {
    gui = new UIL.Gui({ css: "top: 180px; left: 10px", w: 200 });

    gui.add("title", {
        name: "FULLIK " + FIK.REVISION,
        h: 30,
        align: "center",
    });

    gui.add("fps", { h: 22, hplus: 70, res: 80 });

    gui.add("button", { name: "", value: ["Reset"] }).onChange(() => {
        options.autoMoveToggle = true;
        // autoMove(0, true);
        // autoMove(1, true);
        autoMove(2, true);
        // autoMove(3, true);
        // autoMove(4, true);
        options.autoMoveToggle = false;
    });

    gui.add(options, "autoMoveToggle", {
        type: "bool",
        h: 40,
    }).onChange(() => {
        // autoMove(0);
        // autoMove(1);
        autoMove(2);
        // autoMove(3);
        // autoMove(4);
    });

    // gui.add("bool", { name: "autoMove", value: false, p: 70 }).onChange(() => {
    //     autoMoveToggle[0] = !autoMoveToggle[0];
    // });
};

initGui();

const render = () => {
    requestAnimationFrame(render);
    TWEEN.update();
    renderer.render(scene, camera);
};

const addGround = () => {
    camera.position.set(0, 30, 100);
    lights[0].position.set(0, 200, 0);
    controller.update();

    ground = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(200, 200, 1, 1),
        new THREE.ShadowMaterial({ opacity: 0.5 })
    );
    ground.geometry.applyMatrix(
        new THREE.Matrix4().makeRotationX(-Math.PI * 0.5)
    );
    ground.castShadow = false;
    ground.receiveShadow = true;
    ground.position.y = -5;
    scene.add(ground);

    grid = new THREE.PolarGridHelper(100, 16, 8, 64, 0x0a0b0a, 0x070807);
    grid.position.y = -5.01;
    scene.add(grid);
};

const initScene = () => {
    const { w, h } = currentSize();

    // renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.setClearColor(0x222322, 1);

    mainPanel.appendChild(renderer.domElement);

    // camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
    controller = new THREE.OrbitControls(camera, renderer.domElement);
    controller.enableKeys = false;

    //ambientLight = new THREE.AmbientLight( 0x101010 );
    //scene.add( ambientLight );

    lights = [];
    lights[0] = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 2);
    lights[1] = new THREE.PointLight(0xff8822, 1, 0);
    lights[2] = new THREE.PointLight(0x2288ff, 1, 0);

    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set(-100, -200, -100);

    // scene = new THREE.Scene();
    scene.add(lights[0]);
    scene.add(lights[1]);
    scene.add(lights[2]);

    lights[0].castShadow = true;
    var d = 150;
    lights[0].shadow = new THREE.LightShadow(
        new THREE.OrthographicCamera(d, -d, d, -d, 100, 400)
    );
    lights[0].shadow.bias = 0.0001;
    lights[0].shadow.mapSize.width = 2048;
    lights[0].shadow.mapSize.height = 2048;

    const resize = () => {
        const { w, h } = currentSize();
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
    };

    window.addEventListener("resize", resize, false);
    resize();

    addGround();
    // initGui();

    // const solver = new FIK.Structure3D(scene);
    // defaultBoneDirection = FIK.Z_NEG;
    // defaultBoneLength = 10;
    // return solver;
};

const updateSolver = () => {
    solver.update();
};

const addTarget = (position) => {
    const n = {
        mesh: new THREE.Mesh(
            new THREE.SphereBufferGeometry(0.1, 6, 4),
            new THREE.MeshStandardMaterial({ color: 0xffff00, wireframe: true })
        ),
        control: new THREE.TransformControls(camera, renderer.domElement),
    };

    n.mesh.castShadow = true;
    n.mesh.receiveShadow = false;

    scene.add(n.mesh);
    n.mesh.position.copy(position);
    n.control.addEventListener("change", updateSolver);
    n.control.attach(n.mesh);
    n.control.setSize(0.75 * 0.4);
    //n.control.setMode('rotate')
    // n.control.setMode("scale");
    scene.add(n.control);

    n.position = n.mesh.position;

    targets.push(n);
};

const addSpine = () => {
    let angleLimit = 30,
        spineLength = 5,
        spineDirection = FIK.Y_AXE,
        color = 0xffff00,
        targetPosition = targets[0].position;

    const chain = new FIK.Chain3D(color);
    // const basebone = new FIK.Bone3D(startLoc, new FIK.V3(0, 2, 0));
    const basebone = new FIK.Bone3D(startLoc, undefined, FIK.X_AXE, 2);

    // Set basebone as waist
    chain.addBone(basebone);

    // Set spines
    chain.addConsecutiveRotorConstrainedBone(
        spineDirection,
        spineLength,
        angleLimit
    );
    chain.addConsecutiveRotorConstrainedBone(
        spineDirection,
        spineLength,
        angleLimit
    );
    chain.addConsecutiveRotorConstrainedBone(
        spineDirection,
        spineLength,
        angleLimit
    );
    chain.addConsecutiveRotorConstrainedBone(
        spineDirection,
        spineLength,
        angleLimit
    );

    chain.setRotorBaseboneConstraint("global", spineDirection, angleLimit);

    // Link the chain to target
    solver.add(
        chain,
        targetPosition, // Where it ends
        true // Draw the spine
    );

    console.log(
        "Added Spine with",
        angleLimit,
        spineLength,
        spineDirection,
        color,
        targetPosition
    );
};

const addArm = (color, armDirection, targetPosition) => {
    // Arm is the 3-rods chain
    // shoulder -> upperArm -> lowerArm -> [hand]
    let smallAngleLimit = 10,
        largeAngleLimit = 90,
        shoulderLength = 5,
        upperArmLength = 10,
        lowerArmLength = 10;

    // Init args if not defined
    // Use the left arm for default
    color = color || 0x44ff44;
    armDirection = armDirection || FIK.X_NEG;
    targetPosition = targetPosition || targets[1].position;

    const chain = new FIK.Chain3D();
    const basebone = new FIK.Bone3D(
        new FIK.V3(0, 20, 0),
        undefined, // We do not define the basebone with start - end nodes
        armDirection, // We use start - direction x length
        shoulderLength
    );

    // Shoulder with small (10 deg) rotation freedom
    chain.addBone(basebone);
    chain.setRotorBaseboneConstraint("global", armDirection, smallAngleLimit);

    // Arms with large (90 deg) rotation freedom
    chain.addConsecutiveRotorConstrainedBone(
        armDirection,
        upperArmLength,
        largeAngleLimit
    );
    chain.addConsecutiveRotorConstrainedBone(
        armDirection,
        lowerArmLength,
        largeAngleLimit
    );

    solver.connectChain(
        chain,
        0, // Link the first node in the chain
        3, // Link to the 4th bone, so make sure the spines are defined in prior
        "end", // The end of the 3th bone is linked
        targetPosition,
        true, //Draw the mesh of the arm
        color
    );

    console.log(
        "Add arm with",
        smallAngleLimit,
        largeAngleLimit,
        shoulderLength,
        upperArmLength,
        lowerArmLength,
        color,
        armDirection,
        targetPosition
    );
};

const addLeg = (color, legDirection, targetPosition) => {
    // Leg is the 3-rods chain
    // hip -> upperLeg -> lowerLeg -> [foot]
    let smallAngleLimit = 10,
        largeAngleLimit = 90,
        hipLength = 5,
        upperLegLength = 15,
        lowerLegLength = 15;

    // Init args if not defined
    // Use the left leg for default
    color = color || 0x44ff44;
    legDirection = legDirection || FIK.X_NEG;
    targetPosition = targetPosition || targets[3].position;

    const chain = new FIK.Chain3D();
    const basebone = new FIK.Bone3D(
        new FIK.V3(0, 20, 0),
        undefined, // We do not define the basebone with start - end nodes
        legDirection, // We use start - direction x length
        hipLength
    );

    // Shoulder with small (10 deg) rotation freedom
    chain.addBone(basebone);
    chain.setRotorBaseboneConstraint("global", legDirection, smallAngleLimit);

    // UpperLeg with large (90 deg) rotation freedom
    chain.addConsecutiveRotorConstrainedBone(
        legDirection,
        upperLegLength,
        largeAngleLimit
    );

    // chain.addConsecutiveRotorConstrainedBone(
    //     legDirection,
    //     lowerLegLength,
    //     largeAngleLimit
    // );

    chain.addConsecutiveHingedBone(
        legDirection,
        lowerLegLength,
        "local",
        FIK.X_AXE,
        10,
        90,
        FIK.Z_AXE
    );

    solver.connectChain(
        chain,
        0, // Link the first node in the chain
        0, // Link to the first bone, so make sure the spines are defined in prior
        "start", // The start of the 3th bone is linked
        targetPosition,
        true, //Draw the mesh of the arm
        color
    );

    console.log(
        "Add leg with",
        smallAngleLimit,
        largeAngleLimit,
        hipLength,
        upperLegLength,
        lowerLegLength,
        color,
        legDirection,
        targetPosition
    );
};

const updateTarget = (v, id) => {
    id = id !== undefined ? id : 0;

    if (!targets[id]) return;

    targets[id].mesh.position.copy(v);
    targets[id].control.position.copy(v);
    targets[id].position = targets[id].mesh.position;
};

const autoMove = (i, reset = false) => {
    if (!options.autoMoveToggle) return;

    const scale = reset ? 0 : 1.0;

    let x = FIK._Math.randInt(-5, 15) * scale + fixTargetPositions[i].x,
        y = FIK._Math.randInt(-5, 15) * scale + fixTargetPositions[i].y,
        z = FIK._Math.randInt(-5, 15) * scale + fixTargetPositions[i].z;

    new TWEEN.Tween(targetPositions[i])
        .to({ x: x, y: y, z: z }, 2000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function () {
            updateTarget(targetPositions[i], i);
            updateSolver();
        })
        .onComplete(function () {
            if (!reset) {
                autoMove(i);
            }
        })
        .start();
};

// --------------------------------------------------------------------------------
solver.clear();

initScene();

for (let i = 0; i < targetPositions.length; i++) {
    addTarget(targetPositions[i]);
}

addSpine();
addArm();
addArm(0x4444ff, FIK.X_AXE, targets[2].position);
addLeg();
addLeg(0x4444ff, FIK.X_AXE, targets[4].position);

updateSolver();
render();
