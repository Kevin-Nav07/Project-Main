// Starfield.js
// Defines a starfield as a random point cloud in a large sphere.

function Starfield(gl, numStars) {
    this.gl = gl;
    this.numStars = numStars;
    this.vao = null;
    this.positions = new Float32Array(numStars * 3);
}

Starfield.prototype.initBuffers = function () {
    const gl = this.gl;
    const maxRadius = 200.0;

    for (let i = 0; i < this.numStars; i++) {
        // Pick a random direction in 3D by normalizing a random vector
        let x = Math.random() * 2.0 - 1.0;
        let y = Math.random() * 2.0 - 1.0;
        let z = Math.random() * 2.0 - 1.0;
        let len = Math.sqrt(x * x + y * y + z * z);
        // If length is near zero, pick again
        if (len < 0.00001) {
            i--;
            continue;
        }
        x /= len;
        y /= len;
        z /= len;

        // Pick a random radius up to maxRadius
        let r = Math.random() * maxRadius;
        x *= r;
        y *= r;
        z *= r;

        this.positions[i * 3 + 0] = x;
        this.positions[i * 3 + 1] = y;
        this.positions[i * 3 + 2] = z;
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
