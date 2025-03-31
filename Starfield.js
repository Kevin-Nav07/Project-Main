
// A starfield class
// Each star stores: position (vec3), size (float), brightness phase (float), and color (vec3).
function Starfield(gl, numStars) {
    this.gl = gl;
    this.numStars = numStars;
    // Each star: 3 (pos) + 1 (size) + 1 (phase) + 3 (color) = 8 floats per star
    this.starData = new Float32Array(numStars * 8);
}

Starfield.prototype.initBuffers = function () {
    const gl = this.gl;
    const maxRadius = 200.0;

    for (let i = 0; i < this.numStars; i++) {
        let offset = i * 8;
        // position
        // generate a random direction in spherical coordinates
        let theta = Math.random() * 2.0 * Math.PI;
        let phi = Math.acos(2.0 * Math.random() - 1.0);
        let r = Math.random() * maxRadius;
        let x = r * Math.sin(phi) * Math.cos(theta);
        let y = r * Math.sin(phi) * Math.sin(theta);
        let z = r * Math.cos(phi);
        this.starData[offset + 0] = x;
        this.starData[offset + 1] = y;
        this.starData[offset + 2] = z;

        // size
        // Give each star a random size between 1.0 and 3.0
        this.starData[offset + 3] = 1.0 + Math.random() * 2.0;

        // brightness
        this.starData[offset + 4] = Math.random() * 6.2831; // scale is from 0 to 2pi

        // Color 
        // Slight variation around a warm white base (you can tweak these values)
        this.starData[offset + 5] = 0.9 + Math.random() * 0.2; // red
        this.starData[offset + 6] = 0.9 + Math.random() * 0.1; // green
        this.starData[offset + 7] = 1.0;                       // blue
    }

    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const starBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.starData, gl.STATIC_DRAW);

    // Each star has 8 floats.
    const stride = 8 * Float32Array.BYTES_PER_ELEMENT;

    // Attribute 0 - position (vec3)
    const posLoc = gl.getAttribLocation(gl.program, "aStarPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);

    // Attribute 1 - size (float)
    const sizeLoc = gl.getAttribLocation(gl.program, "aStarSize");
    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);

    // Attribute 2 - brightness phase (float)
    const phaseLoc = gl.getAttribLocation(gl.program, "aBrightnessPhase");
    gl.enableVertexAttribArray(phaseLoc);
    gl.vertexAttribPointer(phaseLoc, 1, gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);

    // Attribute 3 -color (vec3)
    const colorLoc = gl.getAttribLocation(gl.program, "aColor");
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, stride, 5 * Float32Array.BYTES_PER_ELEMENT);

    gl.bindVertexArray(null);
};

Starfield.prototype.draw = function () {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.numStars);
    gl.bindVertexArray(null);
};
