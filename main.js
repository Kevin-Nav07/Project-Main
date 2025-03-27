


const params = {
    planetRotationSpeed: 0.01,  // radians per frame
    satelliteBaseSpeed: 0.5,     // base orbit speed for satellites
    thrusterEnabled: true,       // toggle thruster trails on/off
    thrusterLifetime: 0.4,       // particle lifetime (seconds)
    pointSize: 5.0,              // thruster particle point size
    resetCamera: function () {
        console.log("Reset Camera triggered (implement if needed)");
    }
};

function initGUI() {
    const gui = new dat.GUI();
    gui.add(params, 'planetRotationSpeed', 0.0, 0.1).step(0.001).name('Planet Speed');
    gui.add(params, 'satelliteBaseSpeed', 0.0, 2.0).step(0.1).name('Satellite Speed');
    gui.add(params, 'thrusterEnabled').name('Thrusters On/Off');
    gui.add(params, 'thrusterLifetime', 0.1, 2.0).step(0.1).name('Thruster Lifetime');
    gui.add(params, 'pointSize', 1.0, 10.0).step(1.0).name('Thruster Size');
    gui.add(params, 'resetCamera').name('Reset Camera');
}

// ------------------
// Shader Loader
// ------------------
async function loadShaderFile(url) {
    const response = await fetch(url + '?cache=' + Date.now());
    if (!response.ok) {
        throw new Error("Error loading " + url + ": " + response.statusText);
    }
    return await response.text();
}

// ------------------
// Main Function
// ------------------
async function main() {
    const canvas = document.getElementById("glCanvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL2 is not available in your browser.");
        return;
    }
    setDefault();

    // Load planet shaders (use lighting-enabled shaders with normals).
    let planetVsSource = await loadShaderFile("shaders/planet_lit.vs");
    let planetFsSource = await loadShaderFile("shaders/planet_lit.fs");
    const planetShader = initShaderProgram(gl, planetVsSource, planetFsSource);
    if (!planetShader) return;

    // Load starfield shaders.
    let starVsSource = await loadShaderFile("shaders/starfield.vs");
    let starFsSource = await loadShaderFile("shaders/starfield.fs");
    const starShader = initShaderProgram(gl, starVsSource, starFsSource);
    if (!starShader) return;

    // Load satellite shaders.
    let satelliteVsSource = await loadShaderFile("shaders/satellite_lit.vs");
    let satelliteFsSource = await loadShaderFile("shaders/satellite_lit.fs");
    const satelliteShader = initShaderProgram(gl, satelliteVsSource, satelliteFsSource);
    if (!satelliteShader) return;

    // Load thruster shaders.
    let thrusterVsSource = await loadShaderFile("shaders/thruster.vs");
    let thrusterFsSource = await loadShaderFile("shaders/thruster.fs");
    const thrusterShader = initShaderProgram(gl, thrusterVsSource, thrusterFsSource);
    if (!thrusterShader) return;

    // --- Load Sun shaders.
    let sunVsSource = await loadShaderFile("shaders/sun_sphere.vs");
    let sunFsSource = await loadShaderFile("shaders/sun_sphere.fs");
    const sunShader = initShaderProgram(gl, sunVsSource, sunFsSource);
    if (!sunShader) return;

    const projMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projMatrix, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100);

    // Create a view matrix (updated each frame).
    let viewMatrix = glMatrix.mat4.create();

    // -------------------------
    // Initialize and Render Planet.
    // -------------------------
    gl.useProgram(planetShader);
    gl.program = planetShader;
    const uMVPLocPlanet = gl.getUniformLocation(planetShader, "uMVP");
    const planet = new Planet(gl);
    planet.initBuffers();
    initPlanetTexture(gl, planetShader);

    // -------------------------
    // Initialize Starfield.
    // -------------------------
    gl.useProgram(starShader);
    gl.program = starShader;
    const uMVPLocStar = gl.getUniformLocation(starShader, "uMVP");
    const starfield = new Starfield(gl, 1000);
    starfield.initBuffers();

    // -------------------------
    // Initialize Satellites and Thrusters.
    // -------------------------
    gl.useProgram(satelliteShader);
    gl.program = satelliteShader;
    initSatelliteTexture(gl, satelliteShader);
    const uMVPLocSatellite = gl.getUniformLocation(satelliteShader, "uMVP");
    const numSatellites = 4;
    let satellites = [];
    let thrusters = [];
    for (let i = 0; i < numSatellites; i++) {
        let sat = new Satellite(gl);
        sat.initBuffers();
        sat.orbitSpeed = params.satelliteBaseSpeed + i * 0.2;
        sat.orbitRadius = 3.0 + i * 0.5;
        sat.orbitAngle = Math.random() * 2 * Math.PI;
        satellites.push(sat);
        thrusters.push(new Thruster(gl, 20)); // 20 particles per thruster
    }

    // --- Initialize Sun.
    gl.useProgram(sunShader);
    gl.program = sunShader;
    const sun = new Sun(gl);
    sun.initBuffers();

    const sunBasePosition = [20.0, 1.0, 1.0];

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // -------------------------
    // Animation Variables.
    // -------------------------
    let cameraAngle = 0.0;
    let planetAngle = 0.0;
    let lastTime = performance.now();

    // -------------------------
    // Render Loop.
    // -------------------------
    function render() {
        let currentTime = performance.now();
        let deltaTime = (currentTime - lastTime) / 1000.0;
        lastTime = currentTime;

        // Update camera: orbit around the scene.
        cameraAngle += 0.005;
        const cameraDistance = 8.0;
        let camX = Math.cos(cameraAngle) * cameraDistance;
        let camZ = Math.sin(cameraAngle) * cameraDistance;
        let cameraPos = [camX, 3, camZ];
        glMatrix.mat4.lookAt(viewMatrix, cameraPos, [0, 0, 0], [0, 1, 0]);

        // Compute combined MVP for dynamic objects.
        let mvpStatic = glMatrix.mat4.create();
        glMatrix.mat4.multiply(mvpStatic, projMatrix, viewMatrix);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //  Render Starfield 
        gl.useProgram(starShader);
        let starProj = glMatrix.mat4.create();
        glMatrix.mat4.perspective(starProj, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 1000);
        let viewNoTrans = glMatrix.mat4.clone(viewMatrix);
        viewNoTrans[12] = 0;
        viewNoTrans[13] = 0;
        viewNoTrans[14] = 0;
        let starMVP = glMatrix.mat4.create();
        glMatrix.mat4.multiply(starMVP, starProj, viewNoTrans);
        gl.uniformMatrix4fv(uMVPLocStar, false, starMVP);
        gl.disable(gl.DEPTH_TEST);
        gl.depthMask(false);
        starfield.draw();
        gl.enable(gl.DEPTH_TEST);
        gl.depthMask(true);

        //  Render the Sun Sphere 
        // We want the sun to appear in the background.
        let sunModel = glMatrix.mat4.create();
        // Translate to the sun base position.
        glMatrix.mat4.translate(sunModel, sunModel, sunBasePosition);
        // Scale up the sun to push it back and make it large.
        glMatrix.mat4.scale(sunModel, sunModel, [20.0, 20.0, 20.0]);
        let sunMVP = glMatrix.mat4.create();
        glMatrix.mat4.multiply(sunMVP, projMatrix, viewMatrix);
        glMatrix.mat4.multiply(sunMVP, sunMVP, sunModel);
        gl.useProgram(sunShader);
        const uMVPLocSun = gl.getUniformLocation(sunShader, "uMVP");
        gl.uniformMatrix4fv(uMVPLocSun, false, sunMVP);
        // Disable depth test so the sun is drawn on top.
        gl.disable(gl.DEPTH_TEST);
        sun.draw();
        gl.enable(gl.DEPTH_TEST);

        // --- 3) Update Directional Lighting Using the Sun's Position ---
        // Compute the light direction based on the sun's world position.
        // For a directional light, we assume the light comes from the Sun toward the origin.
        // Therefore, we compute: lightDir = -normalize(sunBasePosition)
        let lightDir = glMatrix.vec3.create();
        glMatrix.vec3.scale(lightDir, sunBasePosition, 1.0);
        glMatrix.vec3.normalize(lightDir, lightDir);
        gl.useProgram(planetShader);
        let uLightDirLoc = gl.getUniformLocation(planetShader, "uLightDir");
        gl.uniform3fv(uLightDirLoc, lightDir);
        // Set the light color (very bright) and ambient light.
        let uLightColorLoc = gl.getUniformLocation(planetShader, "uLightColor");
        gl.uniform3f(uLightColorLoc, 3.0, 3.0, 3.0);
        let uAmbientColorLoc = gl.getUniformLocation(planetShader, "uAmbientColor");
        gl.uniform3f(uAmbientColorLoc, 0.3, 0.3, 0.3);

        // --- 4) Render the Planet ---
        planetAngle += params.planetRotationSpeed;
        let planetModel = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(planetModel, planetAngle);
        let planetMVP = glMatrix.mat4.create();
        glMatrix.mat4.multiply(planetMVP, projMatrix, viewMatrix);
        glMatrix.mat4.multiply(planetMVP, planetMVP, planetModel);
        gl.useProgram(planetShader);
        gl.uniformMatrix4fv(uMVPLocPlanet, false, planetMVP);
        // Pass the model matrix for transforming normals.
        let uModelLoc = gl.getUniformLocation(planetShader, "uModel");
        gl.uniformMatrix4fv(uModelLoc, false, planetModel);
        planet.draw();

        // --- 5) Render Satellites and Emit Thruster Particles ---
        gl.useProgram(satelliteShader);
        let uLightDirSat = gl.getUniformLocation(satelliteShader, "uLightDir");
        gl.uniform3fv(uLightDirSat, lightDir);
        let uLightColorSat = gl.getUniformLocation(satelliteShader, "uLightColor");
        gl.uniform3f(uLightColorSat, 3.0, 3.0, 3.0);
        let uAmbientColorSat = gl.getUniformLocation(satelliteShader, "uAmbientColor");
        gl.uniform3f(uAmbientColorSat, 0.2, 0.2, 0.2);

        // Pass the planet center for occlusion calculations.
        let uPlanetCenterSat = gl.getUniformLocation(satelliteShader, "uPlanetCenter");
        gl.uniform3fv(uPlanetCenterSat, [0.0, 0.0, 0.0]);

        // Get the uModel uniform location.
        let uModelLocSat = gl.getUniformLocation(satelliteShader, "uModel");

        for (let i = 0; i < satellites.length; i++) {
            satellites[i].orbitSpeed = params.satelliteBaseSpeed + i * 0.2;
            satellites[i].orbitAngle += satellites[i].orbitSpeed * 0.01;
            let x = Math.cos(satellites[i].orbitAngle) * satellites[i].orbitRadius;
            let z = Math.sin(satellites[i].orbitAngle) * satellites[i].orbitRadius;
            let modelMatrixSat = glMatrix.mat4.create();
            glMatrix.mat4.translate(modelMatrixSat, modelMatrixSat, [x, 1.0, z]);
            // Pass the model matrix to the shader for normal transformation.
            gl.uniformMatrix4fv(uModelLocSat, false, modelMatrixSat);

            let mvpSat = glMatrix.mat4.create();
            glMatrix.mat4.multiply(mvpSat, projMatrix, viewMatrix);
            glMatrix.mat4.multiply(mvpSat, mvpSat, modelMatrixSat);
            gl.uniformMatrix4fv(uMVPLocSatellite, false, mvpSat);
            satellites[i].draw();

            let thrusterPos = [x, 1.0 - 0.12, z];
            if (params.thrusterEnabled) {
                thrusters[i].emit(thrusterPos, params.thrusterLifetime);
            }
        }



        // --- 6) Render Thrusters ---
        gl.useProgram(thrusterShader);
        const uMVPThruster = gl.getUniformLocation(thrusterShader, "uMVP");
        gl.uniformMatrix4fv(uMVPThruster, false, mvpStatic);
        const uPointSizeLoc = gl.getUniformLocation(thrusterShader, "uPointSize");
        gl.uniform1f(uPointSizeLoc, params.pointSize);
        for (let i = 0; i < thrusters.length; i++) {
            thrusters[i].update(deltaTime);
            thrusters[i].draw();
        }

        requestAnimationFrame(render);
    }
    render();
}

// ------------------
// Shader Helper Functions
// ------------------
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert("Shader program error: " + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
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

// ------------------
// Texture Initialization Functions
// ------------------
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

// ------------------
// Default Settings
// ------------------
function setDefault() {

}

initGUI();
main();
