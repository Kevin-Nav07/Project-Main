
// defines a textured sphere representing the planet with normals for lighting.
function Planet(gl) {
    this.gl = gl;
    this.vao = null;
    this.vertex = null;
    this.texCoord = null;
    this.normal = null;
    this.index = null;
    this.generateSphere(1.0, 30, 30);
}

Planet.prototype.generateSphere = function (radius, latBands, longBands) {
    let positions = [];
    let texCoords = [];
    let normals = [];
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
            normals.push(x, y, z); // For a sphere centered at origin
            texCoords.push(1 - (lon / longBands), 1 - (lat / latBands));
        }
    }

    for (let lat = 0; lat < latBands; lat++) {
        for (let lon = 0; lon < longBands; lon++) {
            let first = (lat * (longBands + 1)) + lon;
            let second = first + longBands + 1;
            indices.push(first, second, first + 1);
            indices.push(second, second + 1, first + 1);
        }
    }

    this.vertex = new Float32Array(positions);
    this.texCoord = new Float32Array(texCoords);
    this.normal = new Float32Array(normals);
    this.index = new Uint16Array(indices);
};

Planet.prototype.initBuffers = function () {
    const gl = this.gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // Position buffer
    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertex, gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(gl.program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);

    // Texture coordinate buffer
    const texBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.texCoord, gl.STATIC_DRAW);
    const texLoc = gl.getAttribLocation(gl.program, "a_tex_coord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, 0, 0);

    // Normal buffer
    const normBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.normal, gl.STATIC_DRAW);
    const normLoc = gl.getAttribLocation(gl.program, "aNormal");
    gl.enableVertexAttribArray(normLoc);
    gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, 0, 0);

    // Index buffer
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
