
function Starfield(gl, numStars) {
    this.gl = gl;
    this.numStars = numStars;
    this.vao = null;
    this.positions = new Float32Array(numStars * 3);
}

Starfield.prototype.initBuffers = function () {
    const gl = this.gl;
    for (let i = 0; i < this.numStars; i++) {
        // Random positions across a wide area; stars are placed far in the background.
        this.positions[i * 3 + 0] = (Math.random() - 0.5) * 200;
        this.positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
        this.positions[i * 3 + 2] = -Math.random() * 100 - 50;
    }
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

    const aStarPosLoc = gl.getAttribLocation(gl.program, "aStarPosition");
    gl.enableVertexAttribArray(aStarPosLoc);
    gl.vertexAttribPointer(aStarPosLoc, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
};

Starfield.prototype.draw = function () {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.numStars);
    gl.bindVertexArray(null);
};
