
// A simple particle system for a short thruster trail with fade-out

function Thruster(gl, maxParticles) {
    this.gl = gl;
    this.maxParticles = maxParticles;
    this.particles = []; // each: { position: [x,y,z], life: number }

    // Create a VAO with a dynamic vertex buffer.
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    // Each particle has 4 floats: x, y, z, life
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        maxParticles * 4 * Float32Array.BYTES_PER_ELEMENT,
        gl.DYNAMIC_DRAW
    );

    // aParticle = location 0 in thruster.vs
    gl.enableVertexAttribArray(0);
    // Stride = 4 floats, offset to life = 3 floats
    gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);

    gl.bindVertexArray(null);
}

Thruster.prototype.emit = function (basePos) {
    // Short lifetime so the overall trail is short
    const lifetime = 0.4;

    // Add a small random offset to create a slight plume shape
    const spread = 0.02;
    const rx = (Math.random() - 0.5) * spread;
    const ry = (Math.random() - 0.5) * spread;
    const rz = (Math.random() - 0.5) * spread;

    // New particle at basePos + random offset
    const pos = [
        basePos[0] + rx,
        basePos[1] + ry,
        basePos[2] + rz
    ];

    this.particles.push({ position: pos, life: lifetime });

    // If we exceed maxParticles, remove oldest
    if (this.particles.length > this.maxParticles) {
        this.particles.shift();
    }
};

Thruster.prototype.update = function (deltaTime) {
    // Decrease life; remove expired
    for (let i = 0; i < this.particles.length; i++) {
        this.particles[i].life -= deltaTime;
    }
    this.particles = this.particles.filter(p => p.life > 0);
};

Thruster.prototype.draw = function () {
    const gl = this.gl;
    // Create Float32Array for current particle data
    // (x, y, z, life) for each particle
    const data = new Float32Array(this.maxParticles * 4);

    for (let i = 0; i < this.particles.length; i++) {
        const idx = i * 4;
        data[idx + 0] = this.particles[i].position[0];
        data[idx + 1] = this.particles[i].position[1];
        data[idx + 2] = this.particles[i].position[2];
        data[idx + 3] = this.particles[i].life; // store life
    }

    // Update buffer with current particle data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);

    // draw
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.particles.length);
    gl.bindVertexArray(null);
};
