
// Defines a textured sphere representing the planet.

function Planet(gl) {
    this.gl = gl;
    this.vao = null;
    this.vertex = null;
    this.texCoord = null;
    this.index = null;
    this.generateSphere(1.0, 30, 30);
}

Planet.prototype.generateSphere = function (radius, latBands, longBands) {
    let positions = [];
    let texCoords = [];
    let indices = [];

    for (let lat = 0; lat <= latBands; lat++) {
        let theta = lat * Math.PI / latBands;
        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        for (let long = 0; long <= longBands; long++) {
            let phi = long * 2 * Math.PI / longBands;
            let sinPhi = Math.sin(phi);
            let cosPhi = Math.cos(phi);

            let x = cosPhi * sinTheta;
            let y = cosTheta;
            let z = sinPhi * sinTheta;
            positions.push(radius * x, radius * y, radius * z);
            texCoords.push(1 - (long / longBands), 1 - (lat / latBands));
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let long = 0; long < longBands; long++) {
            let first = (lat * (longBands + 1)) + long;
            let second = first + longBands + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    this.vertex = new Float32Array(positions);
    this.texCoord = new Float32Array(texCoords);
    this.index = new Uint16Array(indices);
};

Planet.prototype.initBuffers = function () {
    const gl = this.gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertex, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(gl.program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.texCoord, gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(gl.program, "a_tex_coord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.index, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
};

Planet.prototype.draw = function () {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.index.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
};
