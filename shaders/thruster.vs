#version 300 es
precision mediump float;

// Each particle is (x, y, z, life).
// life goes from 1.0 (fresh) down to 0.0 (expired).
layout(location = 0) in vec4 aParticle;

uniform mat4 uMVP;

out float v_life;

void main() {
    gl_Position = uMVP * vec4(aParticle.xyz, 1.0);
    // You can adjust point size to taste
    gl_PointSize = 5.0;
    // Pass life to fragment shader
    v_life = aParticle.w;
}
