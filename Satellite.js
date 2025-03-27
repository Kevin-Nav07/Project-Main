

function Satellite(gl) {
    this.gl = gl;
    this.vao = null;
    this.vertexData = []; // will hold (x, y, z, u, v, nx, ny, nz) per vertex
    this.indexData = [];
    this.createGeometry();
    // Orbit parameters.
    this.orbitRadius = 3.0;
    this.orbitSpeed = 0.5;
    this.orbitAngle = 0;
}

Satellite.prototype.createGeometry = function () {
    const vertices = [];
    const indices = [];

    // Helper function to push a face (quad composed of two triangles).
    // Each vertex: [x, y, z, u, v]
    function pushFace(p1, p2, p3, p4) {
        // Compute face normal via cross product.
        const v1 = [p2[0] - p1[0], p2[1] - p1[1], p2[2] - p1[2]];
        const v2 = [p3[0] - p1[0], p3[1] - p1[1], p3[2] - p1[2]];
        let nx = v1[1] * v2[2] - v1[2] * v2[1];
        let ny = v1[2] * v2[0] - v1[0] * v2[2];
        let nz = v1[0] * v2[1] - v1[1] * v2[0];
        const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
        nx /= len; ny /= len; nz /= len;
        const base = vertices.length / 8;
        // Push each vertex: position, texcoord, then normal.
        [p1, p2, p3, p4].forEach(p => {
            vertices.push(p[0], p[1], p[2], p[3], p[4], nx, ny, nz);
        });
        indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }

    // Main body.
    const bx = 0.05, by = 0.1, bz = 0.05;
    pushFace(
        [-bx, -by, bz, 0, 0],
        [bx, -by, bz, 1, 0],
        [bx, by, bz, 1, 1],
        [-bx, by, bz, 0, 1]
    );
    pushFace(
        [bx, -by, -bz, 0, 0],
        [-bx, -by, -bz, 1, 0],
        [-bx, by, -bz, 1, 1],
        [bx, by, -bz, 0, 1]
    );
    pushFace(
        [-bx, -by, -bz, 0, 0],
        [-bx, -by, bz, 1, 0],
        [-bx, by, bz, 1, 1],
        [-bx, by, -bz, 0, 1]
    );
    pushFace(
        [bx, -by, bz, 0, 0],
        [bx, -by, -bz, 1, 0],
        [bx, by, -bz, 1, 1],
        [bx, by, bz, 0, 1]
    );
    pushFace(
        [-bx, by, bz, 0, 0],
        [bx, by, bz, 1, 0],
        [bx, by, -bz, 1, 1],
        [-bx, by, -bz, 0, 1]
    );
    pushFace(
        [-bx, -by, -bz, 0, 0],
        [bx, -by, -bz, 1, 0],
        [bx, -by, bz, 1, 1],
        [-bx, -by, bz, 0, 1]
    );

    // Solar panels.
    const panelW = 0.3, panelH = 0.08, panelZ = 0.01;
    let pxL = -(bx + 0.05);
    pushFace(
        [pxL, -panelH, -panelZ, 0, 0],
        [pxL, -panelH, panelZ, 1, 0],
        [pxL - panelW, panelH, panelZ, 1, 1],
        [pxL - panelW, panelH, -panelZ, 0, 1]
    );
    let pxR = bx + 0.05;
    pushFace(
        [pxR, -panelH, panelZ, 0, 0],
        [pxR, -panelH, -panelZ, 1, 0],
        [pxR + panelW, panelH, -panelZ, 1, 1],
        [pxR + panelW, panelH, panelZ, 0, 1]
    );

    this.vertexData = new Float32Array(vertices);
    this.indexData = new Uint16Array(indices);
};

Satellite.prototype.initBuffers = function () {
    const gl = this.gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const stride = 8 * Float32Array.BYTES_PER_ELEMENT;
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(gl.program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);

    const texLoc = gl.getAttribLocation(gl.program, "a_tex_coord");
    gl.enableVertexAttribArray(texLoc);
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, 3 * 4);

    const normLoc = gl.getAttribLocation(gl.program, "aNormal");
    gl.enableVertexAttribArray(normLoc);
    gl.vertexAttribPointer(normLoc, 3, gl.FLOAT, false, stride, 5 * 4);

    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indexData, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
};

Satellite.prototype.draw = function () {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.indexData.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
};
