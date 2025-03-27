// Sun.js
// Defines a simple emissive sphere representing the sun.

function Sun(gl) {
    this.gl = gl;
    this.vao = null;
    this.vertex = null;
    this.index = null;
    this.generateSphere(0.5, 20, 20);  // A small sphere for the sun
}

Sun.prototype.generateSphere = function (radius, latBands, longBands) {
    let positions = [];
    let indices = [];
    for (let lat = 0; lat <= latBands; lat++) {
        let theta = lat * Math.PI / latBands;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);
        for (let lon = 0; lon <= longBands; lon++) {
            let phi = lon * 2 * Math.PI / longBands;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);
            let x = cosPhi * sinTheta;
            let y = cosTheta;
            let z = sinPhi * sinTheta;
            positions.push(radius * x, radius * y, radius * z);
        }
    }
    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < longBands; lon++) {
            let first = lat * (longBands + 1) + lon;
            let second = first + longBands + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }
    this.vertex = new Float32Array(positions);
    this.index = new Uint16Array(indices);
};

Sun.prototype.initBuffers = function () {
    const gl = this.gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertex, gl.STATIC_DRAW);

    // Use attribute location 0 for position.
    const posLoc = gl.getAttribLocation(gl.program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
};

Sun.prototype.draw = function () {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.index.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
};
