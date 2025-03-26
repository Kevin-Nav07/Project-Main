async function loadShaderFile(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Error loading " + url + ": " + response.statusText);
    }
    return await response.text();
}

async function main() {
    const canvas = document.getElementById("glCanvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) {
        alert("WebGL2 is not available in your browser.");
        return;
    }
    setDefault();

    // Load planet shaders.
    let planetVsSource = await loadShaderFile("shaders/planet.vs");
    let planetFsSource = await loadShaderFile("shaders/planet.fs");
    const planetShader = initShaderProgram(gl, planetVsSource, planetFsSource);
    if (!planetShader) return;

    // Load starfield shaders.
    let starVsSource = await loadShaderFile("shaders/starfield.vs");
    let starFsSource = await loadShaderFile("shaders/starfield.fs");
    const starShader = initShaderProgram(gl, starVsSource, starFsSource);
    if (!starShader) return;

    // Use planet shader for planet and satellites.
    gl.useProgram(planetShader);
    gl.program = planetShader;

    // Set up the projection and view matrices (they remain constant).
    const projMatrix = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projMatrix, 45 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100);
    const viewMatrix = glMatrix.mat4.create();
    glMatrix.mat4.lookAt(viewMatrix, [0, 3, 8], [0, 0, 0], [0, 1, 0]);

    // Uniform location for uMVP in the planet shader.
    const uMVPLocPlanet = gl.getUniformLocation(planetShader, "uMVP");

    // Initialize Planet.
    const planet = new Planet(gl);
    planet.initBuffers();
    initPlanetTexture(gl, planetShader);

    // Initialize Starfield.
    gl.useProgram(starShader);
    gl.program = starShader;
    const uMVPLocStar = gl.getUniformLocation(starShader, "uMVP");
    // For simplicity, we'll use a static MVP for the starfield.
    let mvpStatic = glMatrix.mat4.create();
    glMatrix.mat4.multiply(mvpStatic, projMatrix, viewMatrix);
    gl.uniformMatrix4fv(uMVPLocStar, false, mvpStatic);
    const starfield = new Starfield(gl, 1000); // 1000 stars.
    starfield.initBuffers();

    // Reuse planet shader for satellites.
    gl.useProgram(planetShader);
    gl.program = planetShader;
    const numSatellites = 4;
    let satellites = [];
    for (let i = 0; i < numSatellites; i++) {
        let sat = new Satellite(gl);
        sat.initBuffers();
        sat.orbitRadius = 3.0 + i * 0.5;
        sat.orbitSpeed = 0.5 + i * 0.2;
        sat.orbitAngle = Math.random() * 2 * Math.PI;
        satellites.push(sat);
    }

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    let planetAngle = 0.0; // Rotation angle for the planet.

    function render() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Animate planet rotation.
        planetAngle += 0.01; // Adjust this value for rotation speed.
        let planetModel = glMatrix.mat4.create();
        glMatrix.mat4.fromYRotation(planetModel, planetAngle);
        let planetMVP = glMatrix.mat4.create();
        glMatrix.mat4.multiply(planetMVP, projMatrix, viewMatrix);
        glMatrix.mat4.multiply(planetMVP, planetMVP, planetModel);

        // Render planet.
        gl.useProgram(planetShader);
        gl.uniformMatrix4fv(uMVPLocPlanet, false, planetMVP);
        planet.draw();

        // Render satellites.
        const uMVPSatLoc = gl.getUniformLocation(planetShader, "uMVP");
        for (let i = 0; i < satellites.length; i++) {
            // Update orbit for each satellite.
            satellites[i].orbitAngle += satellites[i].orbitSpeed * 0.01;
            let x = Math.cos(satellites[i].orbitAngle) * satellites[i].orbitRadius;
            let z = Math.sin(satellites[i].orbitAngle) * satellites[i].orbitRadius;
            let modelMatrixSat = glMatrix.mat4.create();
            glMatrix.mat4.translate(modelMatrixSat, modelMatrixSat, [x, 1.0, z]);
            // Combine with the common projection and view matrices (satellites don't rotate with planet).
            let mvpSat = glMatrix.mat4.create();
            glMatrix.mat4.multiply(mvpSat, projMatrix, viewMatrix);
            glMatrix.mat4.multiply(mvpSat, mvpSat, modelMatrixSat);
            gl.uniformMatrix4fv(uMVPSatLoc, false, mvpSat);
            satellites[i].draw();
        }

        // Render starfield (using the static MVP).
        gl.useProgram(starShader);
        gl.uniformMatrix4fv(uMVPLocStar, false, mvpStatic);
        starfield.draw();

        requestAnimationFrame(render);
    }
    render();
}

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
        const uSampler = gl.getUniformLocation(program, "uPlanetTex");
        gl.uniform1i(uSampler, 0);
    };
    image.src = "images/planet_texture.jpg";
}

function setDefault() {

}

main();
