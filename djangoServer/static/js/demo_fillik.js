var demos = {
    "2D": 10,
    "3D": 13,
};

var current = "3D";

var extraUpdate = function () {};

var debug = document.getElementById("debug");

var link = document.getElementById("link");
link.addEventListener(
    "click",
    function () {
        window.location.assign("https://github.com/lo-th/fullik");
    },
    false
);

var fileName = "";

var targetTween = null;

var gui,
    demoGroup,
    scene,
    camera,
    renderer,
    controller,
    ambientLight,
    lights,
    mesh,
    bones,
    skeletonHelper,
    control,
    ground,
    grid;

var target, effector;

var boxTarget, boxEffector;

var box = [];

var targets = [];

var goal = { x: 0, y: 30, z: 0 };

var setting = {
    fixed: true,
    auto: false,
};

var solver;
var defaultBoneDirection, defaultBoneLength;

function initScene() {
    // set the mode
    current = location.hash.substr(1, 2) || "3D";

    var w = window.innerWidth - 20;
    var h = window.innerHeight - 180;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(w, h);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.soft = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.setClearColor(0x222322, 1);
    document.body.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2000);
    controller = new THREE.OrbitControls(camera, renderer.domElement);
    controller.enableKeys = false;

    //

    //ambientLight = new THREE.AmbientLight( 0x101010 );
    //scene.add( ambientLight );

    lights = [];
    lights[0] = new THREE.SpotLight(0xffffff, 1, 0, Math.PI / 2);
    lights[1] = new THREE.PointLight(0xff8822, 1, 0);
    lights[2] = new THREE.PointLight(0x2288ff, 1, 0);

    lights[0].position.set(0, 200, 0);
    lights[1].position.set(100, 200, 100);
    lights[2].position.set(-100, -200, -100);

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

    window.addEventListener("resize", resize, false);

    addGround();
    initGui();

    // FIK

    defaultBoneDirection = FIK.Z_NEG;
    defaultBoneLength = 10;

    solver =
        current === "3D"
            ? new FIK.Structure3D(scene)
            : new FIK.Structure2D(scene);

    var s = location.hash.substr(4);
    load(s || "demo_0");
}

function resize() {
    var w = window.innerWidth - 20;
    var h = window.innerHeight - 180;

    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

function addGround() {
    if (current === "3D") {
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
    } else {
        camera.position.set(0, 0, 200);
        lights[0].position.set(40, 100, 200);
        controller.update();

        ground = new THREE.Mesh(
            new THREE.PlaneBufferGeometry(200, 200, 1, 1),
            new THREE.ShadowMaterial({ opacity: 0.5 })
        );
        //ground.geometry.applyMatrix( new THREE.Matrix4().makeRotationX(-Math.PI*0.5) );
        ground.castShadow = false;
        ground.receiveShadow = true;
        ground.position.z = -5.01;
        scene.add(ground);

        grid = new THREE.GridHelper(200, 16, 0x0a0b0a, 0x070807);
        grid.position.z = -5;
        grid.rotation.x = -Math.PI * 0.5;
        scene.add(grid);
    }
}

function removeGround() {
    scene.remove(ground);
    scene.remove(grid);
}

function updateTarget(v, id) {
    id = id !== undefined ? id : 0;

    if (!targets[id]) return;

    var n = targets[id];

    n.mesh.position.copy(v);
    n.control.position.copy(v);
    n.position = n.mesh.position;
}

function addTarget(position) {
    var n = {
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
    n.control.setSize(0.75);
    //n.control.setMode('rotate')
    //n.control.setMode('scale')
    scene.add(n.control);

    n.position = n.mesh.position;

    targets.push(n);
}

function clearAllTargets() {
    var n;
    for (var i = 0; i < targets.length; i++) {
        n = targets[i];
        n.control.detach(n.mesh);
        scene.remove(n.mesh);

        n.control.removeEventListener("change", updateSolver);
        scene.remove(n.control);
    }

    targets = [];
}

function mode(str) {
    if (str === current) return;

    current = str;
    fileName = "";

    resetDemo();
    removeGround();

    if (current === "2D") {
        solver = new FIK.Structure2D(scene);
    } else {
        solver = new FIK.Structure3D(scene);
    }

    addDemos(demos[current]);
    addGround();

    load("demo_0");
}

function initGui() {
    gui = new UIL.Gui({ w: 200 });

    gui.add("title", { name: "FULLIK", prefix: FIK.REVISION, h: 30, r: 10 });

    gui.add("button", { name: "", p: 0, value: ["2D", "3D"] }).onChange(mode);

    gui.add("bool", { name: "fixed", value: true, p: 70 }).onChange(function (
        v
    ) {
        solver.setFixedBaseMode(v);
        solver.update();
    });
    gui.add("bool", { name: "autoMove", value: false, p: 70 }).onChange(
        function (v) {
            setting.auto = v;
            autoMove();
        }
    );

    demoGroup = gui.add("group", { name: "DEMO", fontColor: "#D4B87B" });

    addDemos(demos[current]);
}

function addDemos(n) {
    demoGroup.clearGroup();

    for (var i = 0; i <= n; i++) {
        demoGroup.add("button", { name: "demo_" + i, p: 0 }).onChange(load);
    }

    demoGroup.open();
}

function tell(s) {
    debug.innerHTML = s;
}

function updateSolver() {
    extraUpdate();
    solver.update();
}

function autoMove() {
    if (!setting.auto) return;

    console.log(targets);

    targetTween = new TWEEN.Tween(goal)
        .to(
            {
                x: FIK._Math.randInt(-50, 50),
                y: FIK._Math.randInt(0, 50),
                z: current === "3D" ? FIK._Math.randInt(-50, 50) : 0,
            },
            2000
        )
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(function () {
            updateTarget(goal);
            updateSolver();
        })
        .onComplete(function () {
            autoMove();
        })
        .start();
}

function render() {
    requestAnimationFrame(render);
    TWEEN.update();
    renderer.render(scene, camera);
}

function load(name) {
    if (name === fileName) return;

    fileName = name;
    var url = "/static/src/demos/" + current.toLowerCase() + "/" + name + ".js";
    console.log(url);

    var xhr = new XMLHttpRequest();
    xhr.overrideMimeType("text/plain; charset=x-user-defined");
    xhr.open("GET", url, true);
    xhr.onload = function () {
        startDemo(xhr.responseText);
    };
    xhr.send();
}

function resetDemo() {
    extraUpdate = function () {};
    clearAllTargets();
    solver.clear();

    // add basic target
    addTarget(new THREE.Vector3(0, 30, 0));
    target = targets[0].position;
}

function startDemo(code) {
    resetDemo();

    location.hash = current + "_" + fileName;

    var oScript = document.createElement("script");
    oScript.language = "javascript";
    oScript.type = "text/javascript";
    oScript.text = code;
    document.getElementsByTagName("BODY").item(0).appendChild(oScript);

    solver.update();
}

function goLink() {
    window.location.assign("https://github.com/lo-th/fullik");
}

initScene();
render();
