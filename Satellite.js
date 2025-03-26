

function Satellite(gl) {
    this.gl = gl;
    this.vao = null;



    const vertices = [];
    const indices = [];

    // Helper function
    function pushFace(p1, p2, p3, p4) {
        const baseIndex = vertices.length / 5;

        vertices.push(...p1, ...p2, ...p3, ...p4);
        indices.push(
            baseIndex, baseIndex + 1, baseIndex + 2,
            baseIndex, baseIndex + 2, baseIndex + 3
        );
    }

    // Main body size
    const bx = 0.05; // half-width
    const by = 0.1;  // half-height
    const bz = 0.05; // half-depth



    // FRONT face (z=+bz).
    pushFace(
        [-bx, -by, +bz, 0, 0],
        [+bx, -by, +bz, 1, 0],
        [+bx, +by, +bz, 1, 1],
        [-bx, +by, +bz, 0, 1]
    );


    pushFace(
        [+bx, -by, -bz, 0, 0],
        [-bx, -by, -bz, 1, 0],
        [-bx, +by, -bz, 1, 1],
        [+bx, +by, -bz, 0, 1]
    );


    pushFace(
        [-bx, -by, -bz, 0, 0],
        [-bx, -by, +bz, 1, 0],
        [-bx, +by, +bz, 1, 1],
        [-bx, +by, -bz, 0, 1]
    );


    pushFace(
        [+bx, -by, +bz, 0, 0],
        [+bx, -by, -bz, 1, 0],
        [+bx, +by, -bz, 1, 1],
        [+bx, +by, +bz, 0, 1]
    );


    pushFace(
        [-bx, +by, +bz, 0, 0],
        [+bx, +by, +bz, 1, 0],
        [+bx, +by, -bz, 1, 1],
        [-bx, +by, -bz, 0, 1]
    );


    pushFace(
        [-bx, -by, -bz, 0, 0],
        [+bx, -by, -bz, 1, 0],
        [+bx, -by, +bz, 1, 1],
        [-bx, -by, +bz, 0, 1]
    );


    const panelW = 0.3;
    const panelH = 0.08;
    const panelZ = 0.01; // half-thickness
    // We'll define them as single quads each.


    let pxL = -(bx + 0.05);
    pushFace(
        [pxL, -panelH, -panelZ, 0, 0],
        [pxL, -panelH, panelZ, 1, 0],
        [pxL - panelW, panelH, panelZ, 1, 1],
        [pxL - panelW, panelH, -panelZ, 0, 1]
    );


    let pxR = (bx + 0.05);
    pushFace(
        [pxR, -panelH, panelZ, 0, 0],
        [pxR, -panelH, -panelZ, 1, 0],
        [pxR + panelW, panelH, -panelZ, 1, 1],
        [pxR + panelW, panelH, panelZ, 0, 1]
    );

    this.vertexData = new Float32Array(vertices);
    this.indexData = new Uint16Array(indices);

    // Orbit parameters
    this.orbitRadius = 3.0;
    this.orbitSpeed = 0.5;
    this.orbitAngle = 0;
}

Satellite.prototype.initBuffers = function () {
    const gl = this.gl;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);


    const stride = 5 * Float32Array.BYTES_PER_ELEMENT;

    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, this.vertexData, gl.STATIC_DRAW);

    // aPosition = location 0
    const posLoc = gl.getAttribLocation(gl.program, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, stride, 0);

    // a_tex_coord = location 1
    const texLoc = gl.getAttribLocation(gl.program, "a_tex_coord");
    gl.enableVertexAttribArray(texLoc);
    // offset 3 floats for position
    const texOffset = 3 * Float32Array.BYTES_PER_ELEMENT;
    gl.vertexAttribPointer(texLoc, 2, gl.FLOAT, false, stride, texOffset);

    // Element buffer
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
