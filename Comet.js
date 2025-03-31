
// Defines a comet with a head and tail then defines a system of comets
// the comet spawns on the opposite side of the sun and moves towards the sun 

function Comet(gl) {
    this.gl = gl;
    // spawn the head on the left side.
    this.headPosition = [
        -50.0,
        (Math.random() - 0.5) * 10.0,
        (Math.random() - 0.5) * 10.0
    ];
    // setting velocity to move rightwards (positive X) with some variation
    this.velocity = [
        5 + Math.random() * 200,         // positive x
        (Math.random() - 0.5) * 2.0,
        (Math.random() - 0.5) * 2.0
    ];
    this.headSize = 4.0;      // Head point sprite size.
    this.tailLength = 20.0;    // Maximum tail length.
    this.numTailPoints = 20;   // Number of tail sample points.
    // We store recent head positions to create a continuous tail.
    this.tailPositions = [];
}



Comet.prototype.update = function (deltaTime) {
    // Update head position.
    this.headPosition[0] += this.velocity[0] * deltaTime;
    this.headPosition[1] += this.velocity[1] * deltaTime;
    this.headPosition[2] += this.velocity[2] * deltaTime;
    // Add current head position to tail history.
    this.tailPositions.push(this.headPosition.slice());
    if (this.tailPositions.length > this.numTailPoints) {
        this.tailPositions.shift();
    }
};

Comet.prototype.generateTailGeometry = function (sunPos) {
    // We want the tail to extend from the head backward (opposite the comet’s travel)
    // Compute the tail direction as headPosition - sunPos
    let tailDir = [
        this.headPosition[0] - sunPos[0],
        this.headPosition[1] - sunPos[1],
        this.headPosition[2] - sunPos[2]
    ];
    let len = Math.sqrt(tailDir[0] ** 2 + tailDir[1] ** 2 + tailDir[2] ** 2);
    if (len > 0.0001) {
        tailDir = [tailDir[0] / len, tailDir[1] / len, tailDir[2] / len];
    } else {
        tailDir = [1, 0, 0];
    }
    // Use the stored tail positions to generate vertices
    // For each stored position, compute a parameter t ; 0 at head, 1 at oldest
    let vertices = [];
    let n = this.tailPositions.length;
    if (n === 0) {
        vertices.push(this.headPosition[0], this.headPosition[1], this.headPosition[2], 0.0);
        return vertices;
    }
    for (let i = 0; i < n; i++) {
        let t = i / (n - 1);
        let pos = this.tailPositions[i];
        vertices.push(pos[0], pos[1], pos[2], t);
    }
    return vertices;
};

Comet.prototype.drawGlow = function (mvpMatrix, glowShader, uMVP, uPointSize, uGlowIntensity) {
    const gl = this.gl;
    gl.useProgram(glowShader);
    gl.uniformMatrix4fv(uMVP, false, mvpMatrix);
    // For glow, we want a larger point size, which is 1.8x larger than the head
    gl.uniform1f(uPointSize, this.headSize * 1.8);
    gl.uniform1f(uGlowIntensity, 2.5); //for a brighter/dimmer glow
    // here we reuse the head VAO (it has the comet head position)
    if (!this.headVAO) this.initHeadBuffers();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.headBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.headPosition));
    gl.bindVertexArray(this.headVAO);
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.bindVertexArray(null);
};


Comet.prototype.initHeadBuffers = function () {
    const gl = this.gl;
    this.headVAO = gl.createVertexArray();
    gl.bindVertexArray(this.headVAO);
    this.headBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.headBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, 3 * Float32Array.BYTES_PER_ELEMENT, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
};

Comet.prototype.drawHead = function (mvpMatrix, headShader, uMVP, uPointSize, uEmissiveIntensity) {
    const gl = this.gl;
    gl.useProgram(headShader);
    gl.uniformMatrix4fv(uMVP, false, mvpMatrix);
    gl.uniform1f(uPointSize, this.headSize);
    gl.uniform1f(uEmissiveIntensity, 3.0); // this is where we control brightness as needed
    if (!this.headVAO) this.initHeadBuffers();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.headBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.headPosition));
    gl.bindVertexArray(this.headVAO);
    gl.drawArrays(gl.POINTS, 0, 1);
    gl.bindVertexArray(null);
};

Comet.prototype.initTailBuffers = function (vertices) {
    const gl = this.gl;
    this.tailVAO = gl.createVertexArray();
    gl.bindVertexArray(this.tailVAO);
    this.tailBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.tailBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.bindVertexArray(null);
};
Comet.prototype.drawTail = function (mvpMatrix, tailShader, uMVP, uPointSize, sunPos) {
    const gl = this.gl;
    let vertices = this.generateTailGeometry(sunPos);
    if (!this.tailVAO) {
        this.initTailBuffers(vertices);
    } else {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tailBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    }
    gl.useProgram(tailShader);
    gl.uniformMatrix4fv(uMVP, false, mvpMatrix);
    gl.uniform1f(uPointSize, 20.0); // tail thickness control
    // get and set uGlowIntensity here while tailShader is active.
    let uGlowIntensity = gl.getUniformLocation(tailShader, "uGlowIntensity");
    gl.uniform1f(uGlowIntensity, 2.0); // adjust glow strength as needed.

    gl.bindVertexArray(this.tailVAO);
    gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 4);
    gl.bindVertexArray(null);
};



//CometSystem: Manages multiple comets

function CometSystem(gl) {
    this.gl = gl;
    this.comets = [];
}

CometSystem.prototype.update = function (deltaTime) {
    for (let comet of this.comets) {
        comet.update(deltaTime);
    }
    // remove comets that have moved off-screen
    this.comets = this.comets.filter(c => c.headPosition[0] < 100);
    // spawning comets
    if (Math.random() < deltaTime * 1.8) {
        this.comets.push(new Comet(this.gl));
    }
};

CometSystem.prototype.draw = function (mvpMatrix,
    headShader, uMVPHead, uPointSizeHead, uEmissiveIntensity,
    tailShader, uMVPTail, uPointSizeTail, sunPos) {
    for (let comet of this.comets) {
        comet.drawHead(mvpMatrix, headShader, uMVPHead, uPointSizeHead, uEmissiveIntensity);
        comet.drawTail(mvpMatrix, tailShader, uMVPTail, uPointSizeTail, sunPos);
    }
};
