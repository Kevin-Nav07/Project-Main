const params = {
    planetRotationSpeed: 0.5,
    satelliteBaseSpeed: 0.5,
    thrusterEnabled: true,
    thrusterLifetime: 0.4,
    pointSize: 5.0,
    simulationSpeed: 1.0,          // Overall simulation speed
    lightingMode: "Full",          // "Full", "Ambient", "Sunlight Only"
    fogIntensity: 0.5,             // For planet shader if supported
    cameraMode: "Free",            // "Free", "Follow Satellite", "Follow Comet"
    paused: false,                 // Pause simulation
    showStarfield: true,           // Toggle starfield on/off
    showComets: true               // Toggle comets on/off
};

function initGUI() {
    const gui = new dat.GUI();
    gui.add(params, 'planetRotationSpeed', 0.0, 0.9).step(0.001).name('Planet Speed');
    gui.add(params, 'satelliteBaseSpeed', 0.0, 2.0).step(0.1).name('Satellite Speed');
    gui.add(params, 'thrusterEnabled').name('Thrusters On/Off');
    gui.add(params, 'simulationSpeed', 0.1, 5.0).name("Sim Speed");
    gui.add(params, 'lightingMode', ["Full", "Ambient", "Sunlight Only"]).name("Lighting Mode");
    gui.add(params, 'cameraMode', ["Free", "Follow Satellite", "Follow Comet"]).name("Camera Mode");
    gui.add(params, 'paused').name("Pause Simulation");
    gui.add(params, 'showStarfield').name("Show Starfield");
    gui.add(params, 'showComets').name("Show Comets");
}

//code for interactive camera
let cameraYaw = 0.0;
let cameraPitch = 0.0;
let cameraDistance = 8.0;
let isDragging = false;
let lastMouseX = 0;
let lastMouseY = 0;
let cameraHeight = 3.0;
let cameraSpeed = 0.1;

function initCameraControls(canvas) {
    canvas.addEventListener("mousedown", (e) => {
        isDragging = true;
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    canvas.addEventListener("mousemove", (e) => {
        if (!isDragging) return;
        let dx = e.clientX - lastMouseX;
        let dy = e.clientY - lastMouseY;
        cameraYaw += dx * 0.005;
        cameraPitch += dy * 0.005;
        cameraPitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, cameraPitch));
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
    });
    canvas.addEventListener("mouseup", () => { isDragging = false; });
    canvas.addEventListener("mouseleave", () => { isDragging = false; });
    canvas.addEventListener("wheel", (e) => {
        cameraDistance += e.deltaY * 0.01;
        cameraDistance = Math.max(2.0, cameraDistance);
    });
}

function setupKeyboardControls() {
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                cameraHeight += cameraSpeed;
                break;
            case 'ArrowDown':
                cameraHeight -= cameraSpeed;
                break;
            case '+':
            case '=':
                cameraDistance -= cameraSpeed;
                break;
            case '-':
            case '_':
                cameraDistance += cameraSpeed;
                break;
        }
        cameraDistance = Math.max(2.0, Math.min(20.0, cameraDistance));
        cameraHeight = Math.max(0.5, Math.min(10.0, cameraHeight));
    });
}

async function loadShaderFile(url) {
    const response = await fetch(url + '?cache=' + Date.now());
    if (!response.ok) {
        throw new Error("Error loading " + url + ": " + response.statusText);
    }
    return await response.text();
}

async function main() {
    const canvas = document.getElementById("glCanvas");
    initCameraControls(canvas);
    setupKeyboardControls();
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL2 not available.");
        return;
    }
    initGUI();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    let planetVsSource = await loadShaderFile("shaders/planet_lit.vs");
    let planetFsSource = await loadShaderFile("shaders/planet_lit.fs");
    const planetShader = initShaderProgram(gl, planetVsSource, planetFsSource);
    if (!planetShader) return;

    let starVsSource = await loadShaderFile("shaders/starfield.vs");
    let starFsSource = await loadShaderFile("shaders/starfield.fs");
    const starShader = initShaderProgram(gl, starVsSource, starFsSource);
    if (!starShader) return;
    const uMVPLocStar = gl.getUniformLocation(starShader, "uMVP");

    let satelliteVsSource = await loadShaderFile("shaders/satellite_lit.vs");
    let satelliteFsSource = await loadShaderFile("shaders/satellite_lit.fs");
    const satelliteShader = initShaderProgram(gl, satelliteVsSource, satelliteFsSource);
    if (!satelliteShader) return;

    let thrusterVsSource = await loadShaderFile("shaders/thruster.vs");
    let thrusterFsSource = await loadShaderFile("shaders/thruster.fs");
    const thrusterShader = initShaderProgram(gl, thrusterVsSource, thrusterFsSource);
    if (!thrusterShader) return;

    let sunVsSource = await loadShaderFile("shaders/sun_sphere.vs");
    let sunFsSource = await loadShaderFile("shaders/sun_sphere.fs");
    const sunShader = initShaderProgram(gl, sunVsSource, sunFsSource);
    if (!sunShader) return;

    let cometHeadVsSource = await loadShaderFile("shaders/cometHead.vs");
    let cometHeadFsSource = await loadShaderFile("shaders/cometHead.fs");
    const cometHeadShader = initShaderProgram(gl, cometHeadVsSource, cometHeadFsSource);
    if (!cometHeadShader) return;

    let cometTailVsSource = await loadShaderFile("shaders/cometTail.vs");
    let cometTailFsSource = await loadShaderFile("shaders/cometTail.fs");
    const cometTailShader = initShaderProgram(gl, cometTailVsSource, cometTailFsSource);
    if (!cometTailShader) return;

    let cometGlowVsSource = await loadShaderFile("shaders/cometGlow.vs");
    let cometGlowFsSource = await loadShaderFile("shaders/cometGlow.fs");
    const cometGlowShader = initShaderProgram(gl, cometGlowVsSource, cometGlowFsSource);
    if (!cometGlowShader) return;

    const projMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projMatrix, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100);
    let viewMatrix = glMatrix.mat4.create();

    gl.useProgram(planetShader);
    gl.program = planetShader;
    const planet = new Planet(gl);
    planet.initBuffers();
    initPlanetTexture(gl, planetShader);

    gl.useProgram(starShader);
    gl.program = starShader;
    const starfield = new Starfield(gl, 1000);
    starfield.initBuffers();

    gl.useProgram(satelliteShader);
    gl.program = satelliteShader;
    initSatelliteTexture(gl, satelliteShader);
    const numSatellites = 4;
    let satellites = [];
    let thrusters = [];
    for (let i = 0; i < numSatellites; i++) {
        let sat = new Satellite(gl);
        sat.initBuffers();
        sat.orbitSpeed = params.satelliteBaseSpeed + i * 0.2;
        sat.orbitRadius = 3.0 + i * 0.5;
        sat.orbitAngle = Math.random() * 2.0 * Math.PI;
        satellites.push(sat);
        thrusters.push(new Thruster(gl, 20));
    }

    gl.useProgram(sunShader);
    gl.program = sunShader;
    const sun = new Sun(gl);
    sun.initBuffers();
    const sunBasePosition = [50.0, 1.0, 1.0];

    gl.useProgram(sunShader);

    let cometSystem = new CometSystem(gl);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0, 0, 0, 1);

    let lightDir = glMatrix.vec3.create();
    glMatrix.vec3.copy(lightDir, sunBasePosition);
    glMatrix.vec3.normalize(lightDir, lightDir);

    let planetAngle = 0.0;
    let lastTime = performance.now();

    function render() {
        let currentTime = performance.now();
        let deltaTime = (currentTime - lastTime) / 1000.0;
        lastTime = currentTime;
        let effectiveDelta = params.paused ? 0.0 : (deltaTime * params.simulationSpeed);

        let cameraPos;
        if (params.cameraMode === "Follow Satellite" && satellites.length > 0) {
            let sat = satellites[0];
            let satX = Math.cos(sat.orbitAngle) * sat.orbitRadius;
            let satZ = Math.sin(sat.orbitAngle) * sat.orbitRadius;
            let satY = 1.0;
            cameraPos = [satX, satY + 0.5, satZ];
            let forward = [-Math.sin(sat.orbitAngle), 0, Math.cos(sat.orbitAngle)];
            let target = [
                cameraPos[0] + forward[0],
                cameraPos[1] + forward[1],
                cameraPos[2] + forward[2]
            ];
            glMatrix.mat4.lookAt(viewMatrix, cameraPos, target, [0, 1, 0]);
        } else if (params.cameraMode === "Follow Comet" && cometSystem.comets.length > 0) {
            let comet = cometSystem.comets[0];
            let target = comet.headPosition;
            cameraPos = [target[0] - 5.0, target[1] + 3.0, target[2] - 5.0];
            glMatrix.mat4.lookAt(viewMatrix, cameraPos, target, [0, 1, 0]);
        } else {
            let camX = cameraDistance * Math.cos(cameraYaw);
            let camZ = cameraDistance * Math.sin(cameraYaw);
            cameraPos = [camX, cameraHeight, camZ];
            glMatrix.mat4.lookAt(viewMatrix, cameraPos, [0, 0, 0], [0, 1, 0]);
        }

        let mvpStatic = glMatrix.mat4.create();
        glMatrix.mat4.multiply(mvpStatic, projMatrix, viewMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(starShader);
        let starProj = glMatrix.mat4.create();
        glMatrix.mat4.perspective(starProj, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 1000);
        let viewNoTrans = glMatrix.mat4.clone(viewMatrix);
        viewNoTrans[12] = 0; viewNoTrans[13] = 0; viewNoTrans[14] = 0;
        let starMVP = glMatrix.mat4.create();
        glMatrix.mat4.multiply(starMVP, starProj, viewNoTrans);
        gl.uniformMatrix4fv(uMVPLocStar, false, starMVP);
        let uTimeStar = gl.getUniformLocation(starShader, "uTime");
        gl.uniform1f(uTimeStar, performance.now() / 1000.0);
        if (params.showStarfield) {
            gl.disable(gl.DEPTH_TEST);
            gl.depthMask(false);
            starfield.draw();
            gl.enable(gl.DEPTH_TEST);
            gl.depthMask(true);
        }

        let sunModel = glMatrix.mat4.create();
        glMatrix.mat4.translate(sunModel, sunModel, sunBasePosition);
        glMatrix.mat4.scale(sunModel, sunModel, [20.0, 20.0, 20.0]);
        let sunMVP = glMatrix.mat4.create();
        glMatrix.mat4.multiply(sunMVP, projMatrix, viewMatrix);
        glMatrix.mat4.multiply(sunMVP, sunMVP, sunModel);
        gl.useProgram(sunShader);
        let uMVPSun = gl.getUniformLocation(sunShader, "uMVP");
        gl.uniformMatrix4fv(uMVPSun, false, sunMVP);
        let uTimeLoc = gl.getUniformLocation(sunShader, "uTime");
        gl.uniform1f(uTimeLoc, performance.now() / 1000.0);
        let uGlowFactorLoc = gl.getUniformLocation(sunShader, "uGlowFactor");
        gl.uniform1f(uGlowFactorLoc, 1.5);
        gl.disable(gl.DEPTH_TEST);
        sun.draw();
        gl.enable(gl.DEPTH_TEST);

        gl.useProgram(planetShader);
        let uLightDirLoc = gl.getUniformLocation(planetShader, "uLightDir");
        gl.uniform3fv(uLightDirLoc, lightDir);
        let uLightColorLoc = gl.getUniformLocation(planetShader, "uLightColor");
        let uAmbientColorLoc = gl.getUniformLocation(planetShader, "uAmbientColor");
        if (params.lightingMode === "Full") {
            gl.uniform3f(uLightColorLoc, 3.0, 3.0, 3.0);
            gl.uniform3f(uAmbientColorLoc, 0.3, 0.3, 0.3);
        } else if (params.lightingMode === "Ambient") {
            gl.uniform3f(uLightColorLoc, 0.0, 0.0, 0.0);
            gl.uniform3f(uAmbientColorLoc, 0.8, 0.8, 0.8);
        } else if (params.lightingMode === "Sunlight Only") {
            gl.uniform3f(uLightColorLoc, 3.0, 3.0, 3.0);
            gl.uniform3f(uAmbientColorLoc, 0.0, 0.0, 0.0);
        }
        let uCameraPosLoc = gl.getUniformLocation(planetShader, "uCameraPos");
        gl.uniform3fv(uCameraPosLoc, cameraPos);
        let uFogIntensityLoc = gl.getUniformLocation(planetShader, "uFogIntensity");
        if (uFogIntensityLoc) {
            gl.uniform1f(uFogIntensityLoc, params.fogIntensity);
        }
        planetAngle += params.planetRotationSpeed * effectiveDelta;
        let planetModel = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(planetModel, planetAngle);
        let planetMVP = glMatrix.mat4.create();
        glMatrix.mat4.multiply(planetMVP, projMatrix, viewMatrix);
        glMatrix.mat4.multiply(planetMVP, planetMVP, planetModel);
        let uMVPPlanet = gl.getUniformLocation(planetShader, "uMVP");
        gl.uniformMatrix4fv(uMVPPlanet, false, planetMVP);
        let uModelPlanet = gl.getUniformLocation(planetShader, "uModel");
        gl.uniformMatrix4fv(uModelPlanet, false, planetModel);
        planet.draw();

        gl.useProgram(satelliteShader);
        let uLightDirSat = gl.getUniformLocation(satelliteShader, "uLightDir");
        gl.uniform3fv(uLightDirSat, lightDir);
        let uLightColorSat = gl.getUniformLocation(satelliteShader, "uLightColor");
        gl.uniform3f(uLightColorSat, 3.0, 3.0, 3.0);
        let uAmbientSat = gl.getUniformLocation(satelliteShader, "uAmbientColor");
        gl.uniform3f(uAmbientSat, 0.2, 0.2, 0.2);
        let uPlanetCenterSat = gl.getUniformLocation(satelliteShader, "uPlanetCenter");
        gl.uniform3fv(uPlanetCenterSat, [0, 0, 0]);
        let uModelSat = gl.getUniformLocation(satelliteShader, "uModel");
        for (let i = 0; i < satellites.length; i++) {
            satellites[i].orbitSpeed = params.satelliteBaseSpeed + i * 0.2;
            satellites[i].orbitAngle += satellites[i].orbitSpeed * effectiveDelta;
            let x = Math.cos(satellites[i].orbitAngle) * satellites[i].orbitRadius;
            let z = Math.sin(satellites[i].orbitAngle) * satellites[i].orbitRadius;
            let modelMatrixSat = glMatrix.mat4.create();
            glMatrix.mat4.translate(modelMatrixSat, modelMatrixSat, [x, 1.0, z]);
            gl.uniformMatrix4fv(uModelSat, false, modelMatrixSat);
            let mvpSat = glMatrix.mat4.create();
            glMatrix.mat4.multiply(mvpSat, projMatrix, viewMatrix);
            glMatrix.mat4.multiply(mvpSat, mvpSat, modelMatrixSat);
            let uMVPSat = gl.getUniformLocation(satelliteShader, "uMVP");
            gl.uniformMatrix4fv(uMVPSat, false, mvpSat);
            satellites[i].draw();
            let thrusterPos = [x, 1.0 - 0.12, z];
            thrusters[i].lastPos = thrusterPos;
            if (params.thrusterEnabled) {
                thrusters[i].emit(thrusterPos, params.thrusterLifetime);
            }
        }

        gl.useProgram(thrusterShader);
        let uMVPThruster = gl.getUniformLocation(thrusterShader, "uMVP");
        gl.uniformMatrix4fv(uMVPThruster, false, mvpStatic);
        let uPointSizeThruster = gl.getUniformLocation(thrusterShader, "uPointSize");
        gl.uniform1f(uPointSizeThruster, params.pointSize);
        for (let i = 0; i < thrusters.length; i++) {
            thrusters[i].update(effectiveDelta);
            thrusters[i].draw();
        }

        if (params.showComets) {
            cometSystem.update(effectiveDelta);
            gl.useProgram(cometGlowShader);
            let uMVPGlow = gl.getUniformLocation(cometGlowShader, "uMVP");
            let uPointSizeGlow = gl.getUniformLocation(cometGlowShader, "uPointSize");
            let uGlowIntensityGlow = gl.getUniformLocation(cometGlowShader, "uGlowIntensity");
            gl.uniformMatrix4fv(uMVPGlow, false, mvpStatic);
            gl.uniform1f(uGlowIntensityGlow, 2.5);
            for (let comet of cometSystem.comets) {
                comet.drawGlow(mvpStatic, cometGlowShader, uMVPGlow, uPointSizeGlow, uGlowIntensityGlow);
            }
            gl.useProgram(cometHeadShader);
            let uMVPHead = gl.getUniformLocation(cometHeadShader, "uMVP");
            let uPointSizeHead = gl.getUniformLocation(cometHeadShader, "uPointSize");
            let uEmissiveIntensityHead = gl.getUniformLocation(cometHeadShader, "uEmissiveIntensity");
            gl.uniformMatrix4fv(uMVPHead, false, mvpStatic);
            gl.uniform1f(uEmissiveIntensityHead, 3.0);
            gl.useProgram(cometTailShader);
            let uMVPTail = gl.getUniformLocation(cometTailShader, "uMVP");
            let uPointSizeTail = gl.getUniformLocation(cometTailShader, "uPointSize");
            gl.uniformMatrix4fv(uMVPTail, false, mvpStatic);
            cometSystem.draw(mvpStatic,
                cometHeadShader, uMVPHead, uPointSizeHead, uEmissiveIntensityHead,
                cometTailShader, uMVPTail, uPointSizeTail, sunBasePosition);
        }

        requestAnimationFrame(render);
    }
    render();
}

function initShaderProgram(gl, vsSource, fsSource) {
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        alert("Shader program error: " + gl.getProgramInfoLog(prog));
        return null;
    }
    return prog;
}

function compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader compile error: " + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function initPlanetTexture(gl, program) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const image = new Image();
    image.onload = function () {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.useProgram(program);
        const uSampler = gl.getUniformLocation(program, "uPlanetTex");
        gl.uniform1i(uSampler, 0);
    };
    image.src = "images/planet_texture2.jpg";
}

function initSatelliteTexture(gl, program) {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    const image = new Image();
    image.onload = function () {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
        gl.useProgram(program);
        const uSampler = gl.getUniformLocation(program, "uSatTex");
        gl.uniform1i(uSampler, 1);
    };
    image.src = "images/satellite_texture.jpg";
}

main();
